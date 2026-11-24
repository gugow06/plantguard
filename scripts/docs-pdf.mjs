// Gera docs/fase7/PlantGuard-documentacao-livre.pdf a partir do HTML, com o Chrome
// headless (via playwright-core, usando o Google Chrome instalado na máquina).
// Uso: npm run docs:pdf
import { chromium } from 'playwright-core';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = resolve(root, 'docs/fase7/documentacao-livre.html');
const pdf = resolve(root, 'docs/fase7/PlantGuard-documentacao-livre.pdf');

const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage();
await page.goto(pathToFileURL(html).href, { waitUntil: 'networkidle' });
await page.waitForSelector('body[data-ready="true"]', { timeout: 30_000 }); // diagramas Mermaid
await page.evaluate(() => document.fonts.ready);
await page.pdf({ path: pdf, format: 'A4', printBackground: true, preferCSSPageSize: true });
await browser.close();
console.log(`PDF gerado: ${pdf}`);
