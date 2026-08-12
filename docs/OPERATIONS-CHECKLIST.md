# Production Operations Checklist

## Daily

- Check health endpoint, runtime error rate, AI 429/5xx rate and provider status.
- Review critical errors using only privacy-safe metadata.

## Release

- Run unit/security tests, Firestore Rules tests, browser tests, lint, production build and secret scan.
- Confirm production environment variables remain server/client scoped correctly.
- Deploy immutable build, smoke-test authentication, CRUD, quote, AI, PDF, share and logout.

## Before real customer data or paid use

- Obtain professional review of KVKK/privacy/terms against the real legal entity and actual processing.
- Complete company, tax and invoicing setup.
- Document controller/processor roles, subprocessors and international-transfer implications for Firebase, Vercel and OpenAI.
- Make retention/deletion, incident response, backups, restore drills and customer support operational.
