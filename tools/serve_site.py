#!/usr/bin/env python3

from __future__ import annotations

import argparse
import functools
import http.server
import os
import socket
import socketserver
import threading


class SiteRequestHandler(http.server.SimpleHTTPRequestHandler):
    protocol_version = "HTTP/1.0"

    def end_headers(self) -> None:
        # Keep local development predictable when files change often.
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


class ThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


class ThreadingHTTPServerV6(ThreadingHTTPServer):
    address_family = socket.AF_INET6


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the site locally.")
    parser.add_argument("--host", default="localhost")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--directory", default=os.getcwd())
    args = parser.parse_args()

    handler = functools.partial(SiteRequestHandler, directory=args.directory)
    print(f"Serving {args.directory}")
    print(f"Open: http://localhost:{args.port}/index.html")
    print(f"Also: http://127.0.0.1:{args.port}/index.html")
    print("Press Ctrl+C to stop.")

    if args.host == "localhost":
        servers = []
        try:
            server_v4 = ThreadingHTTPServer(("127.0.0.1", args.port), handler)
            servers.append(server_v4)
        except OSError:
            server_v4 = None

        try:
            server_v6 = ThreadingHTTPServerV6(("::1", args.port), handler)
            servers.append(server_v6)
        except OSError:
            server_v6 = None

        if not servers:
            raise OSError("could not bind localhost on either 127.0.0.1 or ::1")

        threads = []
        for server in servers:
            thread = threading.Thread(target=server.serve_forever, daemon=True)
            thread.start()
            threads.append(thread)

        try:
            threads[0].join()
        except KeyboardInterrupt:
            for server in servers:
                server.shutdown()
                server.server_close()
    else:
        server = ThreadingHTTPServer((args.host, args.port), handler)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            server.shutdown()
            server.server_close()


if __name__ == "__main__":
    main()
