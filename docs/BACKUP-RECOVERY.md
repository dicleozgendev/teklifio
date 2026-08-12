# Backup and Recovery

This runbook is for authorized Teklifio operators. It is not evidence that managed backups are currently enabled.

## Current safeguards

- Source code is versioned in GitHub and production deployments are immutable in Vercel.
- Workspace owners can download a portable JSON export from **Settings → My account**. This is a portability export, not a complete disaster-recovery backup.
- Firestore managed export/import is the preferred database backup mechanism once Google Cloud billing, a regional Cloud Storage bucket, IAM, retention and cost alerts are approved.

## Recommended schedule

- Daily Firestore managed export; retain 14 daily and 3 monthly copies.
- Quarterly restore drill into a separate non-production Firebase project.
- Review backup job failures every business day and alert the product owner.

## Recovery procedure

1. Declare the incident and stop writes if continued writes could worsen data loss.
2. Record the affected Firebase project, time range and organization IDs without copying customer content into tickets or chat.
3. Select the last known-good export and verify its project, timestamp and integrity.
4. Import only into an isolated recovery/staging project first.
5. Verify authentication mapping, organization isolation, record counts and representative quote/PDF flows.
6. Obtain owner approval before any production restore.
7. Restore using Google Cloud managed import, validate, reopen writes and document the outcome.

Never test restore against production. Managed Firestore export/import may require billing and Google Cloud IAM configuration; this repository does not enable billing or create cloud resources automatically.
