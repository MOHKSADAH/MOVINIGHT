# Orgs, PDPL & Cookie Consent — Design Spec

**Date:** 2026-08-09  
**Status:** Approved

## Goals

1. True multi-tenant organizations with join codes and email invites.
2. Seed organization code `weebs` for existing users and shared data.
3. Practical PDPL-aligned compliance: terms acceptance, cookie consent, FAQ/legal updates (EN/AR).

## Decisions

| Topic | Choice |
|-------|--------|
| Tenancy | True multi-tenant (`orgId` on shared domain tables) |
| Membership | Multi-org; active org switcher |
| Create org | Any signed-in user |
| Roles | Owner + Member |
| App access | Org membership required |
| Seed | Org code `weebs`; migrate existing users/data |
| PDPL depth | Practical v1 (banner + legal + FAQ) |
| FAQ | Included |

## Data model

- `organizations`: name, code (`by_code`), createdBy, createdAt
- `organizationMembers`: orgId, userId, role (`owner` \| `member`), joinedAt
- `organizationInvites`: orgId, email, token, invitedBy, status, createdAt, expiresAt
- Scope with `orgId`: watchlist_entries, movie_nights, watched_entries, collections, restaurants
- `movies` remain global TMDB cache
- `users`: activeOrgId, termsAcceptedAt, privacyAcceptedAt, termsVersion, privacyVersion

## Access control

- `authedQuery` / `authedMutation` via convex-helpers `customQuery` / `customMutation`
- `orgQuery` / `orgMutation`: require membership for `orgId`
- Auth via `getAuthUserId` / `requireActiveUser` — never client email
- Code uniqueness enforced in mutation (index lookup)

## Flows

1. Login → terms acceptance (if missing) → onboarding (name) → join-org gate if no memberships
2. Create org / enter code / accept invite
3. Active org switcher in shell
4. Owner: rotate code, invite by email (Resend), manage members

## Migration

1. Optional `orgId` + org tables
2. Seed `weebs`, memberships, backfill rows
3. Require `orgId`

## PDPL / cookies / FAQ

- Cookie banner: necessary vs optional
- Terms + Privacy checkbox; server-enforced
- Update privacy/terms; new `/faq` (EN+AR)

## Out of scope

Transfer ownership, org soft-delete, audit log, data-export ZIP, invite without email match, rate limits, cross-org admin dashboard.
