"""Local preview with caching off. Run: python serve.py"""
import http.server, os
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'public'))
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, *a):
        pass
class S(http.server.ThreadingHTTPServer):
    request_queue_size = 128
    daemon_threads = True
S(('127.0.0.1', 4178), H).serve_forever()
