// 產生 CNRD 立體字用的 Logo 外框：開本機伺服器上的 tools/logo-shape.html，描好後存成 assets/cnrd-logo.json
// 用法：先 python3 serve.py（port 5181），再 node tools/make-logo-shape.mjs [playwright-core 路徑]
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = require(process.argv[2] || 'playwright-core');
const browser = await pw.chromium.launch();
const page = await browser.newPage();
await page.goto('http://localhost:5181/tools/logo-shape.html');
await page.waitForFunction(() => window.logoShape, null, { timeout: 30000 });
const shape = await page.evaluate(() => window.logoShape);
writeFileSync(new URL('../assets/cnrd-logo.json', import.meta.url), JSON.stringify(shape));
console.log('已存 assets/cnrd-logo.json', shape.loops.length, 'loops', shape.loops.reduce((n, l) => n + l.length, 0), 'points', 'width', shape.width);
await browser.close();
