# Orgs, PDPL & Cookie Consent — Implementation Plan

> See Cursor plan `Orgs PDPL Cookies` and design spec `docs/superpowers/specs/2026-08-09-orgs-pdpl-cookies-design.md`.

**Branch:** `feature/orgs-pdpl-cookies`  
**Delivery:** PR via `gh` with no AI trailers.

## Sequence

1. Branch + docs
2. Install `convex-helpers`, `@convex-dev/migrations`
3. Schema phase 1 (optional orgId)
4. Custom functions + org/invite APIs
5. Migrate weebs → require orgId
6. Scope domain modules
7. Frontend gates (terms, join, invite, switcher, settings)
8. Cookie banner + FAQ/legal
9. Verify + PR
