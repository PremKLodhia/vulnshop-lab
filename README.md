# VulnShop Lab

VulnShop Lab is a side-by-side security learning project for internship interviews.

- `vuln-app` demonstrates intentionally vulnerable implementations.
- `secure-app` implements matching remediations for each demonstrated issue.

Both builds provide the same product features and nearly identical UI so reviewers can compare behavior directly.

## Local Lab Safety

This project is for local testing only.

- Use only on localhost/private lab networks.
- Do not expose either app to public internet.
- Use fake/demo data only.
- No production secrets or cloud credentials are required.

## Quick Start

### Prerequisites

- Node.js 18+
- Docker Desktop (optional, recommended for one-command startup)

### Run With Docker (recommended)

```bash
docker compose up --build
```

Then open:

- Vulnerable build: http://127.0.0.1:3000
- Secure build: http://127.0.0.1:3001

Stop containers:

```bash
docker compose down
```

### Run Without Docker

```bash
npm run setup
npm run reset-db
npm run run:vuln
npm run run:secure
```

## Repeatable Demo Reset

Use one command to reset both databases and reseed accounts/data before each walkthrough:

```bash
npm run demo:reset
```

Equivalent command:

```bash
npm run reset-db
```

## Seeded Demo Accounts and Roles

The same credentials work in both builds.

| Username | Password | Role | What to Demo |
|---|---|---|---|
| `alice` | `password123` | `user` | cart, orders, profile, support, URL fetch |
| `bob` | `bobspassword` | `user` | second user context for IDOR tests |
| `admin` | `admin1234` | `admin` | admin dashboard, ticket visibility, user management |

Role testing note:

- Log in as `alice` and attempt to access Bob-owned records in vulnerable routes.
- Log in as `admin` to confirm secure admin-only enforcement.

## Vulnerability Coverage and Matching Fixes

Every vulnerability intentionally present in `vuln-app` has a direct remediation in `secure-app`.

| Vulnerability Class | Vulnerable Area | Secure Counterpart |
|---|---|---|
| SQL Injection | auth/products/admin queries | parameterized SQL and validated input |
| XSS (stored/reflected) | unescaped rendering and unsanitized inputs | escaped output and bounded input |
| IDOR / Broken Access Control | orders/profile/cart/support tickets | owner/admin authorization checks |
| CSRF Exposure | support submission route | same-origin request enforcement |
| Session/Auth Weakness | fixation risk, weak session config | session regeneration + hardened cookie config |
| Hardcoded Secret | source-controlled secret | environment-based secret loading |
| Insecure File Upload | no MIME/size enforcement | allowlisted MIME + size limit |
| SSRF | unrestricted URL fetch | host allowlist + protocol checks + redirect blocking |
| Brute Force Exposure | no login throttling | auth route rate limiting |
| Input Validation Gaps | unbounded request data | Joi schema validation |
| Error Disclosure | verbose internals in responses | generic safe error responses |

Code markers:

- Vulnerable code uses `// VULNERABILITY:` comments.
- Secure code uses `// FIX:` comments.



## Useful Scripts

```bash
npm run setup
npm run up
npm run down
npm run run:vuln
npm run run:secure
npm run reset-db
npm run seed-db
npm run demo:reset
```



## Next Improvement Targets

- CSRF defenses for state-changing routes.
- Automated integration tests for authz and validation.
- Structured security logging/audit events.
