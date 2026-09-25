"""Local preview server that behaves like Cloudflare Pages.

`python -m http.server` serves files literally, so every clean URL on this site
(/contact, /services, /case-studies/profitability-analysis) returns 404 locally
even though it resolves in production. That makes local click-through testing
useless and looks exactly like broken links.

This adds the two behaviours Cloudflare Pages provides:

  1. Extensionless resolution: /contact serves contact.html.
  2. The _redirects file: the same 301s that will run in production.

It changes nothing about the site itself. Run it instead of http.server for
local review, and what you click locally is what visitors will get.
"""
from __future__ import annotations

import os
import re
import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5501


def load_redirects(root: str) -> list[tuple[str, str, int]]:
    """Parse _redirects the way Cloudflare Pages does, ignoring comments."""
    path = os.path.join(root, '_redirects')
    rules: list[tuple[str, str, int]] = []
    if not os.path.exists(path):
        return rules
    with open(path, encoding='utf-8') as handle:
        for line in handle:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            parts = re.split(r'\s+', line)
            if len(parts) >= 2:
                status = int(parts[2]) if len(parts) > 2 and parts[2].isdigit() else 301
                rules.append((parts[0], parts[1], status))
    return rules


REDIRECTS = load_redirects(ROOT)


class PagesHandler(SimpleHTTPRequestHandler):
    def do_GET(self):  # noqa: N802  (stdlib naming)
        if self._redirect() or self._rewrite():
            return
        super().do_GET()

    def do_HEAD(self):  # noqa: N802
        if self._redirect() or self._rewrite():
            return
        super().do_HEAD()

    def _redirect(self) -> bool:
        clean = self.path.split('?')[0].rstrip('/') or '/'
        for src, dst, status in REDIRECTS:
            if clean == src.rstrip('/'):
                self.send_response(status)
                self.send_header('Location', dst)
                self.end_headers()
                return True
        return False

    def _rewrite(self) -> bool:
        """Serve /foo from foo.html, the way Pages does. Returns False to let
        the normal handler deal with anything that already exists."""
        path, _, query = self.path.partition('?')
        if path.endswith('/') or '.' in os.path.basename(path):
            return False
        candidate = os.path.join(ROOT, path.lstrip('/').replace('/', os.sep) + '.html')
        if os.path.isfile(candidate):
            self.path = path + '.html' + (('?' + query) if query else '')
        return False

    def send_error(self, code, message=None, explain=None):
        """Serve 404.html for unknown paths, the way the Worker does with
        not_found_handling = "404-page". Other errors keep the stdlib page."""
        page = os.path.join(ROOT, '404.html')
        if code != 404 or not os.path.isfile(page):
            return super().send_error(code, message, explain)
        with open(page, 'rb') as handle:
            body = handle.read()
        self.send_response(404)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        if self.command != 'HEAD':
            self.wfile.write(body)

    def log_message(self, fmt, *args):
        sys.stderr.write('%s %s\n' % (self.address_string(), fmt % args))


if __name__ == '__main__':
    handler = partial(PagesHandler, directory=ROOT)
    print('Basirah preview on http://localhost:%d' % PORT)
    print('Clean URLs and %d redirect rules active, matching production.' % len(REDIRECTS))
    ThreadingHTTPServer(('127.0.0.1', PORT), handler).serve_forever()
