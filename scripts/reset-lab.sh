#!/usr/bin/env bash
set -euo pipefail

echo "[VulnShop Lab] Resetting vulnerable and secure databases..."
npm run reset-db

echo "[VulnShop Lab] Reset complete. Demo accounts are reseeded."
echo "  alice / password123 (user)"
echo "  bob   / bobspassword (user)"
echo "  admin / admin1234 (admin)"
