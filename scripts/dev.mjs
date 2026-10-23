// npm run dev: يشغّل قاعدة البيانات المدمجة (عند تفعيلها) ثم خادم Next، ويوقفهما معًا.
import { spawn } from 'node:child_process';
import { loadEnvFile } from 'node:process';
import { existsSync } from 'node:fs';
import { startEmbeddedPostgres } from './embedded-pg.mjs';

if (existsSync('.env')) loadEnvFile('.env');
const server = process.env.EMBEDDED_PG === '1' ? await startEmbeddedPostgres() : null;

const child = spawn('npx', ['next', 'dev', ...process.argv.slice(2)], { stdio: 'inherit', shell: true });
const stop = async (code) => {
  if (server) await server.stop().catch(() => {});
  process.exit(code ?? 0);
};
child.on('exit', (code) => stop(code));
process.on('SIGINT', () => child.kill('SIGINT'));
process.on('SIGTERM', () => child.kill('SIGTERM'));
