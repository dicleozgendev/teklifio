# Operations runbook

## Source access and commercial use

This runbook accompanies publicly viewable proprietary Teklifio source code and is intended only for authorized operators, contributors, and evaluators. Public repository access does not grant copying, modification, deployment, redistribution, sublicensing, resale, or commercial-use rights. The current source notice is maintained in `PROPRIETARY.md`; historical license rights for copies lawfully obtained under an earlier revision are not retroactively revoked.

This runbook defines the no-cost operational baseline for Teklifio. It does not enable a paid monitoring, analytics, email, or backup product.

## Health checks

- `GET /api/health` returns a minimal service status and runtime environment.
- It does not query Firestore, expose configuration values, or reveal credentials.
- Check both the production and staging endpoints after every deployment.

## Error monitoring

Client render failures are caught by the existing recovery screen. A sanitized report is also sent to `POST /api/client-error` and written as structured JSON to Vercel Runtime Logs.

The report intentionally contains only:

- error type;
- URL pathname without query parameters;
- optional Next.js error digest;
- runtime environment and platform request identifier.

Do not add names, email addresses, customer data, quote content, prompts, authentication tokens, stacks, or raw exception messages to production logs. Review errors in Vercel → Project → Logs and filter for `client_error`.

The client-error endpoint requires a valid Firebase ID token and uses a Firestore-backed per-user rate-limit bucket. The AI endpoint uses the same distributed design. Rate-limit documents contain only UID, organization ID, scope, counters, and timestamps; they never contain bearer tokens, prompts, customer names, emails, or quote content.

## Closed registration operations

Public UI signup is disabled in production, and Firestore independently blocks arbitrary authenticated users from creating an organization or owner profile. Before an approved new organization registers, an administrator must create this document with trusted Firebase Console/Admin SDK access:

```text
registrationAuthorizations/{lowercase-email}
  email: lowercase-email
  active: true
  expiresAt: future Firestore timestamp
```

Client access to this collection is denied. The authorization is evaluated only inside Firestore Security Rules. Team invitation acceptance remains separate, email-bound, role-bound, and expiring. Remove or deactivate unused authorization records through trusted administration.

## Legal readiness

Before real-customer data or paid commercial use, complete the checklist in `docs/LEGAL-READINESS.md`. The repository's legal pages are professional drafts, not compliance certification or legal advice.

## Deployment check

1. Confirm GitHub `Quality checks` is green.
2. Confirm the deployment is `Ready` in Vercel.
3. Open `/api/health` and verify `status` is `ok` and the expected environment is returned.
4. Test sign-in, one Firestore read, quote preview, and logout in staging.
5. Promote only the already-tested revision.

## Firestore backup policy

Automated Firestore backups and managed export/import are deliberately not activated yet. Firebase requires billing for managed export/import, and exports incur document-read and Cloud Storage costs. Enable them only after the owner approves billing and budgets.

Until then:

- keep staging and production in separate Firebase projects;
- use the in-app organization export for customer-requested portability, not as a database disaster-recovery backup;
- avoid bulk destructive operations in production;
- deploy and test Firestore rules in staging first;
- record every future backup and restore rehearsal with date, project, operator, and result.

When billing is approved, configure scheduled backups in Firebase/Google Cloud, choose a retention period, set a budget alert, and perform a restore rehearsal into a separate database before relying on the backup policy.

## Incident checklist

1. Stop deployments and reproduce in staging when possible.
2. Record the deployment ID, UTC time, affected route, and sanitized request ID.
3. Inspect Vercel Runtime Logs without copying customer data into tickets.
4. Confirm Firebase Authentication and Firestore status before changing code or rules.
5. Never make Firestore rules public as a troubleshooting shortcut.
6. Roll back only to a previously verified Vercel deployment.
7. Document the cause, fix, verification, and any customer notification decision.
