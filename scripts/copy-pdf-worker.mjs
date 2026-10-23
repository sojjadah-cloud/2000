// ينسخ عامل pdf.js إلى public ليُحمَّل من نفس النطاق.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const src = 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs';
if (existsSync(src)) {
  mkdirSync('public/vendor', { recursive: true });
  copyFileSync(src, 'public/vendor/pdf.worker.min.mjs');
}
