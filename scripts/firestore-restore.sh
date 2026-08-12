#!/usr/bin/env bash
set -euo pipefail
: "${TEKLIFIO_RECOVERY_PROJECT:?Set a NON-PRODUCTION TEKLIFIO_RECOVERY_PROJECT}"
: "${TEKLIFIO_EXPORT_PATH:?Set the exact gs:// export path}"
if [[ "${TEKLIFIO_CONFIRM_NON_PRODUCTION_RESTORE:-}" != "${TEKLIFIO_RECOVERY_PROJECT}" ]]; then
  echo "Restore blocked. Confirm the exact recovery project ID."
  exit 2
fi
if [[ "${TEKLIFIO_RECOVERY_PROJECT}" == "teklifai-82d8e" ]]; then
  echo "Production restore is intentionally blocked by this helper."
  exit 3
fi
gcloud firestore import "${TEKLIFIO_EXPORT_PATH}" --project="${TEKLIFIO_RECOVERY_PROJECT}" --async
