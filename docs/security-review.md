# Security review: We Just Killed v2

- **Date:** 2026-11-04
- **Scope:** `site/` (index.html, app.js, style.css, data.js, kills.json), the data pipeline in `scripts/`, and deployment config.
- **Threat model:** a static site with no backend, auth, cookies or user input other than the URL hash and the search box.
  The main risk is the data itself. Every case is text, a name, a handle, URLs and avatars copied from public posts on X,
  so any of those fields could carry markup or hostile URLs. A secondary risk is a crafted link (`#/...`) shared with a visitor.
- **Method:** manual code review of every HTML sink, URL sink and route handler. ESLint with `eslint-plugin-security` and
  `eslint-plugin-no-unsanitized`. Headless Chrome tests (`scripts/csp-check.mjs`) that render 15 routes under the production
  CSP and run 16 XSS probes, using a hostile `kills.json` (`javascript:` URLs, `<img onerror>` in text, foreign image hosts,
  `__proto__` handles) and hostile hashes (`#/month/<svg/onload=...>`, `#/killer/__proto__`, malformed `%E0%A4%A`). I ran the
  same probes against the original code to confirm each finding and then against the fixed code. gitleaks ran over the tree
  and history, plus a grep for local paths and personal data.

## Findings

| #   | Severity   | Finding                                                                                                                                                                                                      | Fix                                                                                                                                                                                                             | File                                               |
| --- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| 1   | Medium     | URLs from the data were used unchecked in `href`/`src`. A `javascript:` URL in `url`, or an `avatar`/`image` from any host, rendered as a live link or a tracking pixel (reproduced with the probe dataset). | `safeURL()` allowlists: https only, no credentials. Post links must be on `x.com`/`twitter.com`; images must be on `pbs.twimg.com`/`abs.twimg.com`. Records that fail are dropped or rendered without the link. | `site/app.js` (`prep`, `safeURL`)                  |
| 2   | Low–Medium | The `#/month/<value>` route put part of the hash into `innerHTML` without escaping (markup injection from a crafted link; it was short, but it parsed as HTML).                                              | The route must match `^\d{4}-(0[1-9]                                                                                                                                                                            | 1[0-2])$`; month titles go through `esc()`.        | `site/app.js` (router, `mlabel`) |
| 3   | Low        | Search highlighting ran a regex over already-escaped HTML, so it could split entities and produce broken or unexpected markup.                                                                               | `linkify()` rewritten: it splits the raw text into tokens, escapes each one, then highlights only within the escaped text. `t.co` links are emitted as https only.                                              | `site/app.js` (`linkify`)                          |
| 4   | Low        | Prototype keys in routes (`#/killer/__proto__`, `#/victim/constructor`) hit `Object.prototype` and threw page errors.                                                                                        | Lookup maps use `Object.create(null)`; membership goes through an own-property `has()`.                                                                                                                         | `site/app.js`                                      |
| 5   | Low        | Malformed percent-encoding in the hash (`%E0%A4%A`) threw `URIError` and blanked the page.                                                                                                                   | `safeDecode()` wraps `decodeURIComponent`.                                                                                                                                                                      | `site/app.js`                                      |
| 6   | Low        | External links had `rel="noopener"` but not `noreferrer`, so the full page URL (including the hash route) leaked to destinations as the referrer.                                                            | `rel="noopener noreferrer"` on every external link (`nofollow` kept on `t.co` links).                                                                                                                           | `site/app.js`, `site/index.html`                   |
| 7   | Low        | IDs, handles and dates were not validated before they were used in routes, attributes and file names.                                                                                                        | `prep()` checks ids (`^\d{1,25}$`), handles (`^\w{1,15}$`) and ISO dates, and drops invalid records. The profile URL uses `encodeURIComponent`.                                                                 | `site/app.js` (`prep`)                             |
| 8   | Low        | No security headers (no CSP, framing, HSTS or nosniff).                                                                                                                                                      | `vercel.json` adds a strict CSP and the other headers listed in SECURITY.md. `scripts/serve.mjs` applies the same headers locally.                                                                              | `vercel.json`, `scripts/serve.mjs`                 |
| 9   | Info       | Fonts loaded from Google Fonts (third-party request and IP leak, needs CSP exceptions).                                                                                                                      | Self-hosted WOFF2 (latin and latin-ext) with licences included.                                                                                                                                                 | `site/assets/fonts/`, `site/index.html`            |
| 10  | Info       | Inline `style="..."` attributes, a `data:` favicon and inline styles in templates would need `'unsafe-inline'`.                                                                                              | Static styles moved to CSS classes. Dynamic values now go in `data-sty` and are applied with `style.setProperty` (CSSOM, which CSP allows). The favicon is now `favicon.svg`.                                   | `site/app.js`, `site/style.css`, `site/index.html` |
| 11  | Info       | Two moderate advisories in dev tooling (transitive `minimatch`/`glob`: GHSA-3g3m-2fjr-6pw4, GHSA-g3hv-75wg-m249). These are dev-only and never shipped to the site.                                          | Pinned with npm `overrides`; `npm audit` reports 0.                                                                                                                                                             | `package.json`                                     |
| 12  | Info       | `scripts/verify/apply_verify.py` loaded decisions with `exec()`.                                                                                                                                             | Replaced with a normal import.                                                                                                                                                                                  | `scripts/verify/apply_verify.py`                   |

### Reviewed and found OK

- **Share intents** (`x.com/intent/post`) already build the text and URL with `encodeURIComponent`.
- **The canvas death certificate** draws all data with `fillText` (never parsed as HTML). Avatars are drawn only from the
  allowlisted CDN, and the PNG download uses a `blob:` object URL.
- **Hash routing** uses no `eval`, `Function`, string `setTimeout` or `document.write`. Every route segment is decoded,
  validated, then escaped.
- **No secrets.** gitleaks found nothing in the tree or history. There are no local paths, emails or private fields in the
  data, which holds only public post fields (id, text, author name/handle/avatar, public metrics, URLs).
- **Clickjacking** is blocked by `frame-ancestors 'none'` and `X-Frame-Options: DENY`.

### Residual risk and future hardening

- Trusted Types (`require-trusted-types-for 'script'`) would enforce the single-sink rule in the browser. It is possible
  now that all HTML writes go through `setHTML`/`insertHTML`.
- Avatars and media are hotlinked from X's CDN, so X sees visitor IPs for those images. Self-hosting them would remove that.
- Add `preload` to HSTS once a custom domain is attached.
- Post text is third-party content. Escaping prevents injection, but content moderation is still manual.

## Verification

```text
$ npm run test:csp
OK: 15 routes clean under CSP; 16 XSS probes found nothing.
$ npm audit --audit-level=moderate
found 0 vulnerabilities
```
