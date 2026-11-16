#!/usr/bin/env python3
"""
Simple local HTTP server to play the Swimming Game locally.
Usage: python3 server.py [PORT]
"""
import http.server
import socketserver
import sys

DEFAULT_PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080

class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

class ReusableTCPServer(socketserver.TCPServer):
    allow_reuse_address = True

def main():
    Handler = NoCacheHTTPRequestHandler
    port = DEFAULT_PORT
    max_retries = 5
    httpd = None

    for _ in range(max_retries):
        try:
            httpd = ReusableTCPServer(("", port), Handler)
            break
        except OSError as e:
            if e.errno == 98:  # Address already in use
                print(f"⚠️ O porto {port} xa está en uso. Probando no porto {port + 1}...")
                port += 1
            else:
                raise e

    if not httpd:
        print(f"❌ Non foi posible iniciar o servidor nos portos {DEFAULT_PORT}-{DEFAULT_PORT + max_retries - 1}.")
        sys.exit(1)

    with httpd:
        url = f"http://localhost:{port}"
        print("=" * 65)
        print(f"🏊‍♂️ Liga Galega de Clubs de Natación - Servidor Local Iniciado!")
        print(f"👉 Abre no teu navegador: {url}")
        print("=" * 65)
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServidor pechado correctamente.")

if __name__ == '__main__':
    main()
