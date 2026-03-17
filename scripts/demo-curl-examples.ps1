# LOCALHOST-ONLY DEMO EXAMPLES
# Vulnerable app: http://127.0.0.1:3000
# Secure app:     http://127.0.0.1:3001

Write-Host "[1] Vulnerable login SQLi demo (expect behavior difference):"
Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:3000/login" -Body "username=admin'--&password=anything" -ContentType "application/x-www-form-urlencoded" -UseBasicParsing

Write-Host "[2] Secure login same payload (should fail):"
Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:3001/login" -Body "username=admin'--&password=anything" -ContentType "application/x-www-form-urlencoded" -UseBasicParsing

Write-Host "[3] Vulnerable reflected XSS search payload:"
Invoke-WebRequest -Uri "http://127.0.0.1:3000/products?search=%3Cscript%3Ealert('xss')%3C%2Fscript%3E" -UseBasicParsing

Write-Host "[4] Secure search payload output encoded:"
Invoke-WebRequest -Uri "http://127.0.0.1:3001/products?search=%3Cscript%3Ealert('xss')%3C%2Fscript%3E" -UseBasicParsing

Write-Host "[5] Vulnerable SSRF demo to localhost target (local lab only):"
Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:3000/fetch" -Body "url=http://127.0.0.1:3000/" -ContentType "application/x-www-form-urlencoded" -UseBasicParsing

Write-Host "[6] Secure SSRF blocked unless allowlisted:"
Invoke-WebRequest -Method Post -Uri "http://127.0.0.1:3001/fetch" -Body "url=http://127.0.0.1:3001/" -ContentType "application/x-www-form-urlencoded" -UseBasicParsing
