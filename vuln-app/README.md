# VulnShop Lab Vulnerable Build

This app is intentionally insecure for local cybersecurity learning.

## Purpose

- Demonstrate realistic vulnerable patterns in an Express + SQLite app.
- Provide reproducible exploit paths for interview walkthroughs.
- Act as a baseline for direct comparison with `secure-app`.

## Run

```bash
npm install
npm run reset-db
npm start
```

Default URL: http://127.0.0.1:3000

## Seed Accounts

- `alice / password123` (user)
- `bob / bobspassword` (user)
- `admin / admin1234` (admin)

## Intentional Vulnerability Areas

- SQL injection in auth/search/admin query paths.
- Stored and reflected XSS via unescaped output and unsanitized input.
- IDOR in order/profile/cart access patterns.
- Weak session/auth controls and no login rate limiting.
- Insecure file upload validation.
- SSRF via unrestricted URL fetch.
- Verbose error disclosure.

## Important Warning

Use only in private localhost labs. Do not deploy this app.
