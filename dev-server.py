#!/usr/bin/env python3
"""
Quick Local Test Server for Optimization Validation
Inicia servidor y ejecuta pruebas básicas
"""

import http.server
import socketserver
import subprocess
import time
import sys
from pathlib import Path
import webbrowser
from threading import Thread

class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, format, *args):
        # Solo log de errores
        if "error" in format.lower() or args and "error" in str(args):
            print(f"[{self.log_date_time_string()}] {format % args}")

def run_server(port=5000, host='127.0.0.1'):
    """Inicia el servidor HTTP"""
    Path('.').resolve()  # Get project root
    
    with socketserver.TCPServer((host, port), QuietHTTPRequestHandler) as httpd:
        print(f"🚀 Acetabular Wear Analysis - Local Test Server")
        print(f"{'='*50}")
        print(f"Server running at: http://{host}:{port}/")
        print(f"{'='*50}")
        print(f"\n📋 Test Instructions:")
        print(f"1. Open DevTools (F12) → Console")
        print(f"2. Run: runOptimizationTests()")
        print(f"3. Run: checkBrowserCapabilities()")
        print(f"4. Upload small STL file to validate workflow")
        print(f"\n⚠️  Press Ctrl+C to stop server\n")
        
        try:
            # Open browser automatically
            time.sleep(0.5)
            webbrowser.open(f'http://{host}:{port}/')
            
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✅ Server stopped.")
            sys.exit(0)

if __name__ == '__main__':
    run_server()
