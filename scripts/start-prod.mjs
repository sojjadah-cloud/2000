// تشغيل الإنتاج بأقل عمل ممكن عند كل إقلاع:
//  1) تطبيق المخطط فقط إذا تغيّرت بصمته منذ آخر تطبيق (db push دون فقدان بيانات)
//  2) بيانات العرض فقط عند SEED_DEMO=1 وعدم وجودها
//  3) تشغيل Next مباشرة دون npx
import { spawnSync, spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { PrismaClient } from '@prisma/client';

const t0 = Date.now();
const log = (m) => console.log(`[start +${((Date.now() - t0) / 1000).toFixed(1)}s] ${m}`);

if (!process.env.DATABASE_URL) {
  console.error('[start] DATABASE_URL غير مضبوط. أضف رابط قاعدة البيانات في متغيرات البيئة.');
  process.exit(1);
}

// تشغيل أدوات الأوامر عبر node مباشرة: يعمل على Linux وWindows ودون كلفة npx
const CLI = { prisma: 'node_modules/prisma/build/index.js', tsx: 'node_modules/tsx/dist/cli.mjs' };
const run = (tool, args) => spawnSync(process.execPath, [CLI[tool], ...args], { stdio: 'inherit' }).status === 0;
const schemaHash = createHash('sha256').update(readFileSync('prisma/schema.prisma')).digest('hex');

const db = new PrismaClient();
let applied = null;
try {
  applied = (await db.appMeta.findUnique({ where: { key: 'schema_hash' } }))?.value ?? null;
} catch {
  applied = null; // الجدول غير موجود بعد (أول تشغيل بعد التحديث)
}

if (applied !== schemaHash) {
  log('المخطط تغيّر؛ تطبيقه على قاعدة البيانات…');
  if (!run('prisma', ['db', 'push', '--skip-generate'])) {
    console.error('[start] تعذّر تطبيق مخطط قاعدة البيانات.');
    process.exit(1);
  }
  await db.appMeta.upsert({ where: { key: 'schema_hash' }, create: { key: 'schema_hash', value: schemaHash }, update: { value: schemaHash } });
} else {
  log('المخطط محدّث؛ لا حاجة لتطبيقه.');
}

// تحديثات نصوص المحتوى لمرة واحدة (prisma/patch-copy.ts) — تُطبَّق إن لم تُسجَّل بعد
const COPY_PATCH_ID = 'copy-cleanup-1';
const copyPatch = (await db.appMeta.findUnique({ where: { key: 'copy_patch' } }).catch(() => null))?.value;
if (copyPatch !== COPY_PATCH_ID) {
  log('تحديث نصوص المحتوى…');
  if (!run('tsx', ['prisma/patch-copy.ts'])) console.error('[start] تعذّر تحديث النصوص؛ يستمر التشغيل.');
}

if (process.env.SEED_DEMO === '1') {
  const seeded = await db.issue.count({ where: { isDemo: true } }).catch(() => 0);
  if (!seeded) {
    log('إضافة بيانات العرض التجريبية…');
    if (!run('tsx', ['prisma/seed.ts'])) console.error('[start] تعذّر إضافة بيانات العرض؛ يستمر التشغيل.');
  }
}
await db.$disconnect();

const port = process.env.PORT || '10000';
log(`تشغيل Next على المنفذ ${port}`);
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '-p', port, '-H', '0.0.0.0'], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => child.kill(sig));
