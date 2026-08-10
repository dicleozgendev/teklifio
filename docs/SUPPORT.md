# Support and incident procedure

This document is an operational draft. It does not promise a contractual service-level agreement and must be aligned with the final commercial agreement before paid sales begin.

## Safe support intake

Ask the reporter for:

- UTC or local date and time of the issue;
- affected screen and action;
- browser and device type;
- sanitized screenshot;
- quote number only when necessary.

Never request a password, Firebase token, OpenAI key, full customer export, payment information, or confidential quote content through an ordinary support channel.

## Priority model

- **P0 — Critical:** organization isolation concern, suspected unauthorized access, or production unavailable for all users. Stop releases, preserve logs, and investigate immediately.
- **P1 — High:** sign-in, quote saving, PDF, or core Firestore operations fail for a workspace. Reproduce in staging and prioritize a safe fix.
- **P2 — Normal:** one non-critical feature fails or has a workaround. Record, reproduce, test, and schedule the fix.
- **P3 — Request:** usability feedback or future feature request. Evaluate without promising delivery.

These priorities are triage labels, not guaranteed response or resolution times.

## Incident workflow

1. Confirm scope without changing Firestore rules.
2. Record deployment ID, environment, route, time, and sanitized request ID.
3. Check `/api/health`, Vercel Runtime Logs, Firebase status, and the staging reproduction.
4. If data isolation may be affected, pause affected operations and preserve evidence.
5. Fix in a branch or local workspace, run the complete test chain, and deploy to staging first.
6. Promote only the exact verified revision to production.
7. Document impact, cause, remediation, verification, and notification decision.

## Customer communication

Be factual. State what is affected, what remains safe, the workaround if one exists, and when the next update will be provided. Do not speculate about causes or claim that no data was affected before evidence supports that statement.
