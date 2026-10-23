// PostgreSQL مدمج للتطوير المحلي (EMBEDDED_PG=1) عبر حزمة embedded-postgres.
// يعمل كعملية تابعة لـ npm run dev ويتوقف بتوقفه. البيانات في .data/postgres-<port>.
// ملاحظة Windows: التشغيل عبر pg_ctl يستخدم رمزًا مقيدًا تنهار معه العمليات الخلفية
// في بعض البيئات (0xC0000142)، لذلك نشغّل postgres مباشرة من Node.
import EmbeddedPostgres from 'embedded-postgres';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import net from 'node:net';
import pg from 'pg';

export function embeddedConfig() {
  const url = new URL(process.env.DATABASE_URL);
  const port = Number(url.port || 5432);
  return {
    port,
    user: decodeURIComponent(url.username),
    password: process.env.EMBEDDED_PG_PASSWORD || decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    // مجلد بيانات لكل منفذ حتى لا تتعارض نسخة عالقة مع نسخة جديدة
    dataDir: resolve(`.data/postgres-${port}`),
  };
}

export async function canQuery(cfg = embeddedConfig()) {
  const client = new pg.Client({ host: '127.0.0.1', port: cfg.port, user: cfg.user, password: cfg.password, database: 'postgres', connectionTimeoutMillis: 4000 });
  try {
    await client.connect();
    await client.query('select 1');
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

function portOpen(port) {
  return new Promise((done) => {
    const s = net.connect({ port, host: '127.0.0.1' }, () => { s.end(); done(true); });
    s.on('error', () => done(false));
  });
}

/** يعيد مثيل الخادم إن شغّلناه، أو null إن كان يعمل مسبقًا. */
export async function startEmbeddedPostgres() {
  const cfg = embeddedConfig();
  if (await canQuery(cfg)) return null;
  if (await portOpen(cfg.port)) {
    throw new Error(`[db] المنفذ ${cfg.port} مشغول بعملية لا تستجيب. غيّر المنفذ في DATABASE_URL.`);
  }
  const fresh = !existsSync(resolve(cfg.dataDir, 'PG_VERSION'));
  mkdirSync(resolve('.data'), { recursive: true });
  if (fresh && existsSync(cfg.dataDir)) rmSync(cfg.dataDir, { recursive: true, force: true });
  const server = new EmbeddedPostgres({
    databaseDir: cfg.dataDir,
    user: cfg.user,
    password: cfg.password,
    port: cfg.port,
    persistent: true,
    initdbFlags: ['--encoding=UTF8', '--locale=C'],
    postgresFlags: ['-c', 'listen_addresses=127.0.0.1'],
    onLog: () => {},
  });
  if (fresh) await server.initialise();
  const pidFile = resolve(cfg.dataDir, 'postmaster.pid');
  if (existsSync(pidFile)) rmSync(pidFile, { force: true });
  await server.start();
  if (fresh) await server.createDatabase(cfg.database);
  console.log(`[db] PostgreSQL المدمج يعمل على المنفذ ${cfg.port}`);
  return server;
}
