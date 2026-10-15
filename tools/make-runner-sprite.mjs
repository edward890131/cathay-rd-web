// 產生載入畫面的跑步小人連續動作圖：開本機伺服器上的 tools/runner-sprite.html，拍好後存成 assets/loader-runner.png
// 用法：先 python3 serve.py（port 5181），再 node tools/make-runner-sprite.mjs [playwright-core 路徑]
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = require(process.argv[2] || 'playwright-core');
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage();
await page.goto('http://localhost:5181/tools/runner-sprite.html');
await page.waitForFunction(() => window.spriteDataURL, null, { timeout: 30000 });
const { url, info } = await page.evaluate(() => ({ url: window.spriteDataURL, info: window.spriteInfo }));
writeFileSync(new URL('../assets/loader-runner.png', import.meta.url), Buffer.from(url.split(',')[1], 'base64'));
console.log('已存 assets/loader-runner.png', info);
await browser.close();
