#!/usr/bin/env bash
set -euo pipefail
: "${TEKLIFIO_FIREBASE_PROJECT:?Set TEKLIFIO_FIREBASE_PROJECT}"
: "${TEKLIFIO_BACKUP_BUCKET:?Set TEKLIFIO_BACKUP_BUCKET (gs://...)}"
if [[ "${TEKLIFIO_ALLOW_MANAGED_EXPORT:-}" != "yes" ]]; then
  echo "Export blocked. Approve billing, IAM, retention and cost alerts, then set TEKLIFIO_ALLOW_MANAGED_EXPORT=yes."
  exit 2
fi
gcloud firestore export "${TEKLIFIO_BACKUP_BUCKET}" --project="${TEKLIFIO_FIREBASE_PROJECT}" --async
