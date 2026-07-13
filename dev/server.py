"""Servidor estático de desarrollo sin caché (evita JS viejo al iterar).
Uso: python dev/server.py [puerto]"""
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer


class NoCache(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Expires', '0')
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # silencioso


if __name__ == '__main__':
    puerto = int(sys.argv[1]) if len(sys.argv) > 1 else 8123
    print(f'MNO dev server en http://127.0.0.1:{puerto}')
    ThreadingHTTPServer(('127.0.0.1', puerto), NoCache).serve_forever()
