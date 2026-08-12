# Monitoring and Privacy-Safe Logging

Teklifio emits structured JSON events to Vercel Runtime Logs for server-side failures. Operational fields are limited to event category, route, HTTP status, duration, runtime environment, anonymous request ID and safe error class.

The application must never log Firebase ID tokens, API keys, prompts, quote content, share tokens, names, email addresses, phone numbers or customer/business records. Client error reports are authenticated, sanitized and rate-limited through Firestore-backed distributed counters. The AI endpoint uses the same distributed approach.

## Operator checks

- Monitor 5xx and 429 rates for `/api/ai-quote` and `/api/client-error`.
- Check `/api/health` for a minimal `ok` response; it intentionally exposes no dependency or secret detail.
- Treat repeated authentication, permission and share-access failures as security signals without adding request bodies to logs.
- Configure Vercel log retention/export only after reviewing provider terms, location, retention and cost.

No paid monitoring provider is required for the current baseline. For real-customer SLAs, configure alert delivery and retention in the approved Vercel plan.
