"""打包腳本：把 hero-map.html 和所有 shared/、scenes/ 程式檔合成「一個」HTML 檔，雙擊就能打開互動版

為什麼需要打包：瀏覽器用「雙擊本機檔案」打開網頁時，基於安全規定不允許網頁再去讀其他 .js 檔，
所以把每個程式檔轉成內嵌資料（data URL），透過 importmap 對應起來，全部塞進同一個檔案。

用法：python3 build.py
產出：dist/國泰產研_首頁主視覺_內部預覽_YYYYMMDD-HHMM.html
注意：three.js 與字型仍從網路 CDN 載入，打開時需要連網。
"""
import base64
import json
import re
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

ROOT = Path(__file__).parent
SRC = ROOT / "hero-map.html"
OUT_DIR = ROOT / "dist"
PREFIX = "@app/"  # 內部模組的代號，例如 @app/shared/kit.js

now = datetime.now(ZoneInfo("Asia/Taipei"))  # 一律用台北時間


def to_data_url(text: str, mime: str) -> str:
    return f"data:{mime};base64," + base64.b64encode(text.encode("utf-8")).decode("ascii")


def rewrite_imports(code: str, file_dir: Path) -> str:
    """把相對路徑的 import（./、../）改成 @app/ 代號，內嵌後才找得到彼此"""
    def repl(m):
        quote, spec = m.group(1), m.group(2)
        if not spec.startswith("."):
            return m.group(0)  # three、three/addons/... 交給 importmap 的 CDN
        target = (file_dir / spec).resolve().relative_to(ROOT.resolve()).as_posix()
        return f"{m.group(0)[:m.start(1) - m.start(0)]}{quote}{PREFIX}{target}{quote}"
    return re.sub(r"""(?:from\s*|import\s*\(\s*)(['"])(\.{1,2}/[^'"]+)\1""", repl, code)


# 1. 收集並改寫所有模組
modules = {}
for path in sorted([*ROOT.glob("shared/*.js"), *ROOT.glob("scenes/*.js")]):
    code = rewrite_imports(path.read_text(encoding="utf-8"), path.parent)
    modules[PREFIX + path.relative_to(ROOT).as_posix()] = to_data_url(code, "text/javascript")

html = SRC.read_text(encoding="utf-8")

# 2. 主程式裡的 import 也改成 @app/ 代號；動態載入場景的 `./scenes/${id}.js` 一併改寫
html = re.sub(r"""from\s*(['"])\./(shared/[^'"]+)\1""", lambda m: f"from {m.group(1)}{PREFIX}{m.group(2)}{m.group(1)}", html)
html = html.replace("import(`./scenes/${", f"import(`{PREFIX}scenes/${{")

# 3. 把模組加進 importmap
m = re.search(r'<script type="importmap">\s*(\{.*?\})\s*</script>', html, re.S)
importmap = json.loads(m.group(1))
importmap["imports"].update(modules)
html = html[:m.start(1)] + json.dumps(importmap, ensure_ascii=False, indent=1) + html[m.end(1):]

# 4. 圖示內嵌
for svg in ROOT.glob("assets/*.svg"):
    rel = svg.relative_to(ROOT).as_posix()
    html = html.replace(f'src="{rel}"', f'src="{to_data_url(svg.read_text(encoding="utf-8"), "image/svg+xml")}"')

# 5. 內部預覽標記（畫面下方中間的小標籤，避開右上工具列）
stamp = now.strftime("%Y-%m-%d %H:%M")
badge = (
    f'<div style="position:fixed;z-index:6;left:50%;bottom:20px;transform:translateX(-50%);'
    f'padding:4px 12px;border-radius:99px;background:rgba(31,35,40,.82);color:#fff;font-size:12px;'
    f'pointer-events:none;white-space:nowrap">內部預覽，請勿外傳 · {stamp} 打包</div>'
)
html = html.replace("<body data-layout=\"a\">", "<body data-layout=\"a\">\n" + badge, 1)
html = html.replace("<title>國泰產研 Hero 構圖</title>", "<title>國泰產研 Hero 構圖（內部預覽）</title>", 1)

# 6. 輸出
OUT_DIR.mkdir(exist_ok=True)
out = OUT_DIR / f"國泰產研_首頁主視覺_內部預覽_{now.strftime('%Y%m%d-%H%M')}.html"
out.write_text(html, encoding="utf-8")
print(f"已輸出：{out.relative_to(ROOT)}（{out.stat().st_size / 1024:.0f} KB，內含 {len(modules)} 個模組）")
