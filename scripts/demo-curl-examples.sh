#!/usr/bin/env sh

# LOCALHOST-ONLY DEMO EXAMPLES
# Vulnerable app: http://127.0.0.1:3000
# Secure app:     http://127.0.0.1:3001

echo "[1] Vulnerable login SQLi demo (expect behavior difference):"
curl -i -X POST http://127.0.0.1:3000/login -d "username=admin'--&password=anything"

echo "\n[2] Secure login same payload (should fail):"
curl -i -X POST http://127.0.0.1:3001/login -d "username=admin'--&password=anything"

echo "\n[3] Vulnerable reflected XSS search payload:"
curl -s "http://127.0.0.1:3000/products?search=%3Cscript%3Ealert('xss')%3C%2Fscript%3E" | head -n 20

echo "\n[4] Secure search payload output encoded:"
curl -s "http://127.0.0.1:3001/products?search=%3Cscript%3Ealert('xss')%3C%2Fscript%3E" | head -n 20

echo "\n[5] Vulnerable SSRF demo to localhost target (local lab only):"
curl -i -X POST http://127.0.0.1:3000/fetch -d "url=http://127.0.0.1:3000/"

echo "\n[6] Secure SSRF blocked unless allowlisted:"
curl -i -X POST http://127.0.0.1:3001/fetch -d "url=http://127.0.0.1:3001/"
