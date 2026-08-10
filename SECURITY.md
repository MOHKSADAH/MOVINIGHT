# Security Policy

## Supported versions

Security fixes are applied on the `main` branch of this repository (the
deployed MOVINIGHT / [whopickedthis.app](https://www.whopickedthis.app) line).

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security-sensitive findings.

Email **[mohmadksadah@gmail.com](mailto:mohmadksadah@gmail.com)** with:

- A short description of the issue and impact
- Steps to reproduce (or a proof of concept)
- Affected URL / environment if known (`production`, `preview`, local)

You should receive an acknowledgement within a few days. Please give a
reasonable window before any public disclosure so a fix can be prepared.

## Scope notes

Out of scope for informal reports (still welcome as normal issues when
appropriate):

- Vulnerabilities only in third-party services (TMDB, Resend, Google OAuth)
  that are not caused by our misuse of those APIs
- Findings that require physical access to an unlocked session
- Automated scanner output without a clear exploit path
