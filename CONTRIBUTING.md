# Contributing to MOVINIGHT

Thanks for helping keep the crew’s movie tracker sharp. This project is
**proprietary** (see [LICENSE](LICENSE)); contributions are by invitation and
remain subject to that license unless we agree otherwise in writing.

## Workflow

1. Sync with `main`.
2. Create a focused branch (`fix/…`, `feat/…`, `chore/…`, `docs/…`).
3. Make the smallest change that solves the problem.
4. Run quality gates before opening a PR:

```bash
npm run check    # lint + app/Convex typecheck + Vitest
npm run build    # when routing, env, or build config changed
```

5. Open a PR using [`.github/pull_request_template.md`](.github/pull_request_template.md).
   Include diagrams when they clarify architecture or flows.

## Commit messages

- **Subject only** (no commit body)
- Under **100 characters**
- Professional and concise; focus on **why**
- No AI attribution trailers (`Co-Authored-By`, `Made with Cursor`, etc.)
- Prefer **multiple focused commits** when changes cover distinct concerns

Examples:

```text
Restore legacy Weebs access and drop weebs code placeholder.
Defer avatar saves until Save and restore themed presets.
Replace login native validation with shadcn Field errors.
```

## Project conventions (do not fight these)

| Do | Don’t |
| --- | --- |
| shadcn `Field` + local state for forms | Add Zod or react-hook-form for app forms |
| `npx convex dev` while developing | `npx convex deploy` for casual local testing |
| Keep Convex validators on public functions | Trust the client for auth or ownership |
| Prefer indexes over `.filter()` on large tables | Unbounded `.collect()` without a plan |

## Docs and assets

- Product overview: [README.md](README.md)
- Env template: [`.env.example`](.env.example)
- Security reports: [SECURITY.md](SECURITY.md)
- Brand mark: [`public/logo.svg`](public/logo.svg) (also mirrored under `docs/assets/`)

## Questions

Reach the operator at **[mohmadksadah@gmail.com](mailto:mohmadksadah@gmail.com)**.
