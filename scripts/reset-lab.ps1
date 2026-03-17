$ErrorActionPreference = 'Stop'

Write-Host '[VulnShop Lab] Resetting vulnerable and secure databases...' -ForegroundColor Cyan
npm run reset-db

if ($LASTEXITCODE -ne 0) {
  throw 'Database reset failed.'
}

Write-Host '[VulnShop Lab] Reset complete. Demo accounts are reseeded.' -ForegroundColor Green
Write-Host '  alice / password123 (user)'
Write-Host '  bob   / bobspassword (user)'
Write-Host '  admin / admin1234 (admin)'
