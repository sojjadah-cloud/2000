// يشغّل أمرًا (prisma / seed) مع قاعدة البيانات المدمجة.
// إن كان npm run dev يعمل يستخدم قاعدته؛ وإلا يشغّلها مؤقتًا ويوقفها بعد الأمر.
// مثال: node scripts/with-db.mjs npx prisma db push
import { spawn } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { startEmbeddedPostgres } from './embedded-pg.mjs';

if (existsSync('.env')) loadEnvFile('.env');

const [cmd, ...args] = process.argv.slice(2);
const server = process.env.EMBEDDED_PG === '1' ? await startEmbeddedPostgres() : null;

const finish = async (code) => {
  if (server) await server.stop().catch(() => {});
  process.exit(code ?? 0);
};
if (!cmd) await finish(0);
const child = spawn(cmd, args, { stdio: 'inherit', shell: true });
child.on('exit', (code) => finish(code));
