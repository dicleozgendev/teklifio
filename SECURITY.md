# Security Policy

## Proprietary source

Teklifio is proprietary commercial source code. Repository access does not grant permission to copy, modify, redistribute, sublicense, sell, or commercially use the source except under a separate written agreement with the copyright holder. See [PROPRIETARY.md](PROPRIETARY.md). Previous copies lawfully obtained under the terms that applied to those copies retain those previously granted rights.

## Supported versions

Security updates are applied to the current `main` branch. This repository does not currently maintain multiple supported release branches.

## Reporting a vulnerability

Please do not disclose a suspected vulnerability in a public GitHub issue. Contact the repository owner privately through their GitHub profile and include:

- A clear description of the issue
- Steps to reproduce it
- The affected component or route
- The potential impact
- Any suggested mitigation

Do not include real customer data, API keys, passwords, ID tokens, service-account credentials, or other secrets in a report.

## Deployment responsibilities

Operators are responsible for protecting deployment environment variables, keeping Firebase Security Rules deployed, configuring Firebase authorized domains, restricting access to provider dashboards, rotating exposed credentials, and reviewing AI-generated quote content before use.

The Firebase web configuration is public client configuration. Security depends on Firebase Authentication, Firestore Security Rules, organization-scoped queries, and appropriate project settings. `OPENAI_API_KEY` is a server-side secret and must never be exposed through a `NEXT_PUBLIC_` variable.
