#!/usr/bin/env python3
"""
Simple HTTP server for the Acetabular Wear Analysis System.
Serves static files with proper cache control headers to prevent caching issues.
"""
import http.server
import socketserver
import os
from pathlib import Path


class ReuseAddressTCPServer(socketserver.TCPServer):
    """TCPServer with SO_REUSEADDR enabled."""
    allow_reuse_address = True


class NoCacheHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """HTTP request handler with disabled caching for development."""
    
    def end_headers(self):
        """Add cache control headers to prevent browser caching."""
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
    
    def log_message(self, format, *args):
        """Custom log format for cleaner output."""
        print(f"[{self.log_date_time_string()}] {format % args}")


def run_server(port=5000, host='0.0.0.0'):
    """Start the HTTP server."""
    os.chdir(Path(__file__).parent)
    
    with ReuseAddressTCPServer((host, port), NoCacheHTTPRequestHandler) as httpd:
        print(f"========================================")
        print(f"Acetabular Wear Analysis System Server")
        print(f"========================================")
        print(f"Serving at http://{host}:{port}/")
        print(f"Press Ctrl+C to stop the server")
        print(f"========================================\n")
        
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")


if __name__ == '__main__':
    run_server()
