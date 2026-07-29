#!/usr/bin/env python3
"""寫作素材資料庫的本機伺服器。

用法：
    python3 server.py [port]

預設埠號 8899。啟動後在瀏覽器打開 http://127.0.0.1:8899/ 即可使用，
資料會存在同目錄下的 writing_material_data.json，關閉伺服器、重開機都不會遺失。
"""
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

DIR = Path(__file__).resolve().parent
DATA_FILE = DIR / "writing_material_data.json"
HTML_FILE = DIR / "寫作素材資料庫.html"
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
        elif self.path in ("/", "/index.html"):
            if not HTML_FILE.exists():
                self._send(404, b"HTML file not found", "text/plain; charset=utf-8")
                return
            self._send(200, HTML_FILE.read_bytes(), "text/html; charset=utf-8")
        else:
            self._send(404, b"Not found", "text/plain; charset=utf-8")

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
