// تشغيل الإنتاج: تطبيق المخطط على قاعدة البيانات (دون حذف بيانات)، وبيانات العرض عند الطلب، ثم Next.
import { spawnSync, spawn } from 'node:child_process';

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  return r.status === 0;
}

if (!process.env.DATABASE_URL) {
  console.error('[start] DATABASE_URL غير مضبوط. أضف رابط قاعدة البيانات في متغيرات البيئة.');
  process.exit(1);
}

// db push يرفض أي تغيير يسبب فقدان بيانات (لا نمرر --accept-data-loss)
if (!run('npx', ['prisma', 'db', 'push', '--skip-generate'])) {
  console.error('[start] تعذّر تطبيق مخطط قاعدة البيانات.');
  process.exit(1);
}

// بيانات العرض التجريبية: تُضاف مرة واحدة فقط عند SEED_DEMO=1 (الملف يتحقق بنفسه من وجودها)
if (process.env.SEED_DEMO === '1') {
  if (!run('npx', ['tsx', 'prisma/seed.ts'])) console.error('[start] تعذّر إضافة بيانات العرض؛ يستمر التشغيل.');
}

const port = process.env.PORT || '10000';
const child = spawn('npx', ['next', 'start', '-p', port, '-H', '0.0.0.0'], { stdio: 'inherit' });
child.on('exit', (code) => process.exit(code ?? 0));
for (const sig of ['SIGTERM', 'SIGINT']) process.on(sig, () => child.kill(sig));
