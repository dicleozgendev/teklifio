# Security Operations

Teklifio uses Firebase Authentication, email-bound expiring invitations, role checks, Firestore organization isolation, server-only OpenAI credentials, distributed API rate limits and revocable expiring quote-share tokens.

Before real-customer operation, review access quarterly, remove dormant users, rotate secrets, verify authorized Firebase domains, test Firestore Rules in the emulator, review Vercel/Firebase/OpenAI subprocessors and complete a staging recovery drill. Report suspected vulnerabilities privately to the repository owner; do not include real customer records or credentials.

See `SECURITY.md` at repository root for disclosure and commercial-use terms.
