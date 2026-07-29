#!/usr/bin/env python3
"""寫作素材資料庫的本機伺服器。

用法：
    npm run build           # 先建置前端（產生 dist/）
    python3 server.py [port]

預設埠號 8899。啟動後在瀏覽器打開 http://127.0.0.1:8899/ 即可使用，
資料會存在同目錄下的 writing_material_data.json，關閉伺服器、重開機都不會遺失。

開發時若想要 Vite 的熱更新，另開一個終端機執行 `npm run dev`（會在 5173
埠啟動，並將 /api 轉發到這支伺服器），兩支伺服器同時跑即可。
"""
import json
import mimetypes
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DIR = Path(__file__).resolve().parent
DATA_FILE = DIR / "writing_material_data.json"
DIST_DIR = (DIR / "dist").resolve()
DEFAULT_PORT = 8899


def load_data():
    if DATA_FILE.exists():
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return {"quotes": []}


def save_data(data):
    tmp = DATA_FILE.with_suffix(".tmp")
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    tmp.replace(DATA_FILE)


def resolve_static_path(url_path):
    """Maps a URL path to a file under dist/, or None if it's missing or
    would escape dist/ (path traversal)."""
    if url_path == "/":
        url_path = "/index.html"
    candidate = (DIST_DIR / url_path.lstrip("/")).resolve()
    if candidate != DIST_DIR and DIST_DIR not in candidate.parents:
        return None
    if not candidate.is_file():
        return None
    return candidate


class Handler(BaseHTTPRequestHandler):
    def _cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send(self, status, body_bytes, content_type="application/json"):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Cache-Control", "no-store")
        self._cors_headers()
        self.end_headers()
        if body_bytes:
            self.wfile.write(body_bytes)

    def do_OPTIONS(self):
        self._send(204, b"")

    def do_GET(self):
        if self.path == "/api/data":
            data = load_data()
            self._send(200, json.dumps(data, ensure_ascii=False).encode("utf-8"))
            return

        if not DIST_DIR.is_dir():
            self._send(
                404,
                "找不到 dist/，請先執行 npm run build 建置前端。".encode("utf-8"),
                "text/plain; charset=utf-8",
            )
            return

        file_path = resolve_static_path(self.path.split("?", 1)[0])
        if file_path is None:
            self._send(404, b"Not found", "text/plain; charset=utf-8")
            return

        content_type, _ = mimetypes.guess_type(str(file_path))
        content_type = content_type or "application/octet-stream"
        if content_type.startswith("text/") or content_type in ("application/javascript", "application/json"):
            content_type += "; charset=utf-8"
        self._send(200, file_path.read_bytes(), content_type)

    def do_POST(self):
        if self.path != "/api/data":
            self._send(404, b"Not found", "text/plain; charset=utf-8")
            return
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length)
        try:
            data = json.loads(body)
        except json.JSONDecodeError:
            self._send(400, b'{"error":"invalid json"}')
            return
        if not isinstance(data, dict) or "quotes" not in data:
            self._send(400, b'{"error":"invalid format"}')
            return
        save_data(data)
        self._send(200, b'{"ok":true}')

    def log_message(self, format, *args):
        pass


def main():
    port = DEFAULT_PORT
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
        except ValueError:
            print(f"埠號格式錯誤：{sys.argv[1]}")
            sys.exit(1)

    with ThreadingHTTPServer(("127.0.0.1", port), Handler) as httpd:
        print(f"寫作素材資料庫伺服器已啟動：http://127.0.0.1:{port}/")
        print(f"資料檔案：{DATA_FILE}")
        print("按 Ctrl+C 可停止伺服器")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n伺服器已停止")


if __name__ == "__main__":
    main()
