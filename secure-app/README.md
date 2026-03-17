# VulnShop Lab Secure Build

This app is the remediated counterpart to `vuln-app` and is used to verify fixes.

## Purpose

- Demonstrate practical remediations for each vulnerable pattern.
- Provide side-by-side comparison with identical business features.
- Support retesting with deterministic seeded data.

## Run

```bash
npm install
npm run reset-db
npm start
```

Default URL: http://127.0.0.1:3001

## Seed Accounts

- `alice / password123` (user)
- `bob / bobspassword` (user)
- `admin / admin1234` (admin)

## Security Controls Included

- Parameterized SQL and input validation.
- Escaped rendering and bounded text inputs.
- Ownership/admin authorization checks.
- Session hardening and login session regeneration.
- Environment-based secret management.
- Upload MIME allowlist and size limits.
- SSRF allowlist and protocol checks.
- Login rate limiting and safer error handling.

## Verification Use

Run the same PoCs from `docs/walkthrough.md` against this app and confirm blocked behavior.
