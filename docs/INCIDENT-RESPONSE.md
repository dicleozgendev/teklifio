# Incident Response

## Severity

- **Critical:** confirmed cross-organization access, leaked secret/token, account takeover or destructive data loss.
- **High:** sustained authentication outage, quote corruption or exploitable authorization weakness.
- **Medium/Low:** localized functional or performance degradation without confidentiality impact.

## Procedure

1. Record a privacy-safe incident ID, UTC time, environment, route and safe error category.
2. Contain the issue: revoke affected credentials, disable the affected account or roll back the deployment as appropriate.
3. Preserve relevant provider audit logs without copying customer content into ordinary chat or tickets.
4. Investigate in staging and determine affected organizations and time range.
5. Notify the product owner and obtain professional legal/security advice for regulatory or customer notification decisions.
6. Remediate, test organization isolation, deploy, monitor and complete a post-incident review.

Do not claim regulatory compliance or make notification promises without reviewing the actual business identity, processing activities, contracts and applicable law.
