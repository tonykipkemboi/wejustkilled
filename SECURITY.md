# Security policy

## Supported versions

Only the current `main` branch (the deployed site) is supported.

## Reporting a vulnerability

Please report privately by contacting the maintainer [@tonykipkemboi](https://github.com/tonykipkemboi) directly.
Do not open a public issue.
Expect an acknowledgement within 3 days and a fix or mitigation plan within 14 days.

## What this project does to stay safe

- **No server, no secrets.** The site is static HTML/CSS/JS with no runtime dependencies, cookies, forms or API keys.
- **Strict CSP** (`vercel.json`): `default-src 'none'`, scripts, styles and fonts only from `'self'`, images only from
  `'self'`, `pbs.twimg.com` and `abs.twimg.com`, no `unsafe-inline`/`unsafe-eval`, `frame-ancestors 'none'`, `base-uri 'none'`,
  `form-action 'none'`, `object-src 'none'`. Also HSTS, `nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`,
  `Permissions-Policy`, COOP and CORP.
- **Untrusted-data handling.** All post text, names and handles are HTML-escaped before rendering; every HTML write goes
  through one sink (`setHTML`/`insertHTML` in `site/app.js`), and ESLint's `no-unsanitized` rule flags any new one.
  Links are only emitted for `https://x.com`/`twitter.com` (and `https://t.co` inside post text); images only from the Twitter CDNs.
  IDs, handles, dates and routes are validated against strict patterns, and lookups are prototype-safe.
- **Self-hosted fonts**, no third-party scripts or styles.
- **Tests.** `npm run test:csp` renders every route in headless Chrome under the production CSP and fails on any CSP
  violation, console error or page error. It also runs XSS probes with a hostile dataset and hostile URLs.
- **Supply chain.** Dev dependencies are pinned exactly with a lockfile; GitHub Actions are pinned to commit SHAs;
  workflows default to read-only permissions; registry signatures are verified with `npm audit signatures`.
- **Continuous checks.** Daily at 11:00 UTC (6:00 AM EST / 7:00 AM EDT): npm audit, OSV-Scanner, gitleaks and CodeQL.
  Dependabot checks npm, pip and Actions daily. Pre-commit runs gitleaks and `detect-private-key` before every commit.

See [docs/security-review.md](docs/security-review.md) for the full review and findings.
