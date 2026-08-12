# Legal readiness checklist

This checklist supports production preparation. It is not legal, tax, accounting, or regulatory advice and does not claim that Teklifio is certified or compliant with any law. A qualified Turkish lawyer and financial adviser must review the real business and processing model before paid commercial use or real-customer data processing.

## Before real customer data

- Replace every placeholder business identity in Privacy, KVKK Disclosure, and Terms with the actual legal entity, contact channels, processing purposes, legal bases, recipient groups, and retention periods.
- Review those documents against the application's actual data flows, contracts, support process, logs, backups, AI requests, and subprocessors.
- Document whether the Teklifio operator acts as data controller, data processor, or both for each processing activity.
- Maintain a current subprocessor register covering Firebase/Google Cloud, Vercel, OpenAI, and any future email, monitoring, support, analytics, or payment provider.
- Obtain professional advice on international data-transfer implications and required safeguards for Firebase, Vercel, OpenAI, and their processing locations.
- Operationalize retention and deletion: define owners, deadlines, deletion evidence, backup handling, legal holds, and customer-request handling.
- Operationalize incident response: detection, containment, access revocation, evidence preservation, legal assessment, notification decisions, and post-incident review.
- Minimize customer and quote data in public share documents and production logs; never place secrets or special-category personal data in AI prompts.

## Before paid commercial use

- Complete company formation or the appropriate business registration, tax registration, invoicing setup, bookkeeping, and legally required commercial records.
- Have customer agreements, pricing, renewal, cancellation, refund, support, service-level, liability, intellectual-property, and data-processing terms professionally reviewed.
- Confirm which electronic communications require consent and how consent/opt-out evidence will be retained.
- Verify that production operations match the published policies. A policy document alone is not an operational control.

## Evidence to retain

- Dated legal review and approved policy versions.
- Data inventory, processing-purpose register, and controller/processor assessment.
- Subprocessor list and international-transfer assessment.
- Retention/deletion schedule and completed deletion records.
- Incident-response runbook and rehearsal records.
- Security-rule, organization-isolation, authentication, role, rate-limit, share-link, build, and secret-scan test results.
