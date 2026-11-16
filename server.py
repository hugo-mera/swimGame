#!/usr/bin/env python3
"""
Simple local HTTP server to play the Swimming Game locally.
Usage: python3 server.py [PORT]
"""
import http.server
import socketserver
import sys
import webbrowser

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    Handler = NoCacheHTTPRequestHandler
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        url = f"http://localhost:{PORT}"
        print("=" * 65)
        print(f"🏊‍♂️ Liga Galega de Clubs de Natación - Servidor Local Iniciado!")
        print(f"👉 Abre no teu navegador: {url}")
        print("=" * 65)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor pechado.")

if __name__ == '__main__':
    main()
