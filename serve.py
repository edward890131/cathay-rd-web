"""本機預覽伺服器：跟 python -m http.server 一樣，但每次都要求瀏覽器重新讀檔（不快取）
這樣改了 materials.js 或場景檔之後，自己和同事只要一般重新整理就看得到最新版本。

用法：python3 serve.py            → 只有這台電腦能開（127.0.0.1）
     python3 serve.py --lan      → 同一個網路的同事也能開
"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

PORT = 5181


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        # 告訴瀏覽器：不要存快取，每次都跟伺服器要最新的檔案
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()


if __name__ == "__main__":
    host = "0.0.0.0" if "--lan" in sys.argv else "127.0.0.1"
    print(f"Serving on http://{host}:{PORT}  (no-cache)")
    ThreadingHTTPServer((host, PORT), NoCacheHandler).serve_forever()
