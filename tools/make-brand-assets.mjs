// 產生網站圖示與分享封面圖（存到 assets/）
//   favicon-512.png：3D 人物頭像（透明底）→ 之後用 sips 縮出 32、180 尺寸
//   og-cover.png：白天的城市概覽（1200×630，用 2 倍解析度拍再縮）
// 用法：先 python3 serve.py（port 5181），再 node tools/make-brand-assets.mjs [playwright-core 路徑] [--icon-only]
// 拍完用 macOS 內建的 sips 縮尺寸：favicon-32.png、apple-touch-icon.png（180）、og-cover.jpg（1200×630）
import { writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pw = require(process.argv[2] || 'playwright-core');
const out = f => new URL(`../assets/${f}`, import.meta.url);
const browser = await pw.chromium.launch({ args: ['--use-gl=angle', '--enable-unsafe-swiftshader'] });

// 1. 頭像
const p1 = await browser.newPage();
await p1.goto('http://localhost:5181/tools/favicon.html');
await p1.waitForFunction(() => window.iconDataURL, null, { timeout: 30000 });
if (!process.argv.includes('--cover-only')) writeFileSync(out('favicon-512.png'), Buffer.from((await p1.evaluate(() => window.iconDataURL)).split(',')[1], 'base64'));
await p1.waitForFunction(() => window.iconBgDataURL);
writeFileSync(out('apple-touch-icon-512.png'), Buffer.from((await p1.evaluate(() => window.iconBgDataURL)).split(',')[1], 'base64'));
if (process.argv.includes('--icon-only')) { await browser.close(); process.exit(0); }

// 2. 封面：白天、只看地圖（?focus 模式），藏掉 Header、工具列、Cookie 等介面
const p2 = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 2 });
await p2.addInitScript(() => { try { localStorage.setItem('cnrd-cookie-ok', '1'); } catch {} });
await p2.goto('http://localhost:5181/hero-map.html?night=0&focus=0,0,1,2.1');
await p2.addStyleTag({ content: '.site-header,.dock,.sec-nav,.cookie,.continue,.label,.drag-tip,.free-panel,#helpBtn{display:none!important}' });
await p2.waitForFunction(() => !document.getElementById('loader'), null, { timeout: 90000 });
await p2.waitForTimeout(9000);                                   // 等進場掉落動畫播完
await p2.screenshot({ path: new URL(out('og-cover@2x.png')).pathname });
console.log('ok');
await browser.close();
