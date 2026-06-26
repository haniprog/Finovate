#!/usr/bin/env python3
"""
Finovate Development Server
Handles both static files and PHP API routing through Python
"""

import os
import sys
import json
import subprocess
import http.server
import socketserver
from urllib.parse import urlparse, parse_qs
from pathlib import Path

PORT = 8080
HANDLER_CLASS = None

class FinovateRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler that supports POST and routes to PHP"""
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length)
        
        # Parse the path
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Route API requests to PHP
        if path.startswith('/php/api/'):
            self.route_to_php(path, body, 'POST')
        else:
            self.send_error(404, 'Not Found')
    
    def do_GET(self):
        """Handle GET requests - default behavior with PHP support"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        # Route PHP files and API requests to PHP
        if path.startswith('/php/'):
            self.route_to_php(path, b'', 'GET')
        else:
            super().do_GET()
    
    def route_to_php(self, path, body, method):
        """Route request to PHP-CLI for execution"""
        try:
            # Build the file path
            file_path = path.lstrip('/')
            full_path = os.path.join(os.getcwd(), file_path)
            
            # Security: prevent directory traversal
            if not os.path.abspath(full_path).startswith(os.path.abspath(os.getcwd())):
                self.send_error(403, 'Forbidden')
                return
            
            # Check if file exists
            if not os.path.isfile(full_path):
                self.send_error(404, 'File not found')
                return
            
            # Prepare environment for PHP
            env = os.environ.copy()
            env['REQUEST_METHOD'] = method
            env['REQUEST_URI'] = path
            env['SCRIPT_FILENAME'] = full_path
            env['DOCUMENT_ROOT'] = os.getcwd()
            env['SERVER_ADDR'] = 'localhost'
            env['SERVER_PORT'] = str(PORT)
            env['SERVER_NAME'] = 'localhost'
            
            # Add query string if present
            parsed = urlparse(self.path)
            if parsed.query:
                env['QUERY_STRING'] = parsed.query
            
            # Content type for input
            if 'Content-Type' in self.headers:
                env['CONTENT_TYPE'] = self.headers['Content-Type']
            
            # Content length for input
            if body:
                env['CONTENT_LENGTH'] = str(len(body))
            
            # Execute PHP
            process = subprocess.Popen(
                ['php', full_path],
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env=env,
                cwd=os.path.dirname(full_path)
            )
            
            stdout, stderr = process.communicate(input=body, timeout=30)
            
            if process.returncode != 0:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                error_response = json.dumps({
                    'success': False,
                    'message': 'PHP error',
                    'error': stderr.decode('utf-8', errors='ignore')
                })
                self.wfile.write(error_response.encode())
                return
            
            # Send successful response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()
            self.wfile.write(stdout)
            
        except subprocess.TimeoutExpired:
            self.send_error(504, 'Gateway Timeout')
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            error_response = json.dumps({
                'success': False,
                'message': 'Server error',
                'error': str(e)
            })
            self.wfile.write(error_response.encode())
    
    def end_headers(self):
        """Add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def log_message(self, format, *args):
        """Custom logging"""
        print(f"[{self.log_date_time_string()}] {format % args}")


def check_php():
    """Check if PHP is available"""
    try:
        result = subprocess.run(['php', '--version'], capture_output=True, timeout=5)
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def start_server():
    """Start the development server"""
    print("=" * 60)
    print("Finovate Development Server")
    print("=" * 60)
    
    # Check PHP
    if not check_php():
        print("\n⚠️  PHP is not installed or not in PATH!")
        print("   PHP API endpoints will not work.")
        print("   Install PHP and add it to your PATH:")
        print("   https://www.php.net/downloads")
        print("\n   Static files will still be served.\n")
        HANDLER_CLASS = http.server.SimpleHTTPRequestHandler
    else:
        print("\n✓ PHP found - API requests will be routed to PHP")
        HANDLER_CLASS = FinovateRequestHandler
    
    # Create server
    try:
        with socketserver.TCPServer(("", PORT), HANDLER_CLASS or FinovateRequestHandler) as httpd:
            print(f"\n✓ Server running at http://localhost:{PORT}")
            print(f"✓ Document root: {os.getcwd()}")
            print(f"\nAccess your app:")
            print(f"  • Home:      http://localhost:{PORT}/index.html")
            print(f"  • Auth:      http://localhost:{PORT}/auth.html")
            print(f"  • Dashboard: http://localhost:{PORT}/dashboard/dashboard.html")
            print(f"  • API Docs:  http://localhost:{PORT}/php/api-documentation.php")
            print(f"\nPress Ctrl+C to stop the server")
            print("=" * 60 + "\n")
            
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n✓ Server stopped")
    except OSError as e:
        if e.errno == 48:  # Port in use
            print(f"\n✗ Port {PORT} is already in use!")
            print("  Try using a different port or kill the existing process")
        else:
            print(f"\n✗ Error: {e}")
        sys.exit(1)


if __name__ == '__main__':
    # Change to project directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    if os.path.exists(os.path.join(script_dir, 'index.html')):
        os.chdir(script_dir)
    
    start_server()
