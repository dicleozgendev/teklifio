# Teklifio

AI-powered B2B quote generation and lightweight CRM platform for creating, managing, and exporting professional sales proposals.

[Live demo](https://teklifai.vercel.app)

> **Demo notice:** The public demo uses fictional company, customer, product, and financial data. Do not enter confidential or production information into a shared demo environment.

## Screenshots

Project screenshots can be added before a marketing launch:

| Dashboard | Quote builder |
| --- | --- |
| _Screenshot placeholder_ | _Screenshot placeholder_ |

| AI quote preview | PDF quote |
| --- | --- |
| _Screenshot placeholder_ | _Screenshot placeholder_ |

## Overview

Teklifio is a responsive Turkish-language B2B SaaS application for managing customers, maintaining a product and service catalog, preparing itemized quotes, and exporting print-ready PDFs. It supports Firebase email/password authentication and isolates business data by organization in Cloud Firestore.

The quote assistant accepts a natural-language request, matches only customers and catalog items already available to the signed-in organization, and presents a draft for human review. It never saves an AI result until the user explicitly applies and submits it.

## Core features

- Responsive dashboard with sales summaries, recent quotes, search, and quick actions
- Customer creation, editing, listing, search, and detail views
- Product and service catalog with pricing, units, default VAT, and descriptions
- Manual quote builder with multiple line items, quantity, unit price, discount, VAT, notes, and validity date
- Automatic subtotal, discount, tax, and total calculations
- Quote list, status filters, search, detail view, and Firestore persistence
- Quote and VAT defaults configurable from the settings screen
- Modern, print-ready PDF generation with company, customer, line-item, total, note, and approval information
- Firebase Authentication with email/password registration, verification, password reset, sign-in, sign-out, and session restoration
- First-run onboarding and account-security settings
- Organization-scoped Firestore data protected by Security Rules
- Legal draft pages for privacy, KVKK disclosure, and terms of use
- Environment-controlled demo notice

## AI-powered quote generation

The **AI ile Oluştur** flow sends the signed-in user's request to the server-side Next.js route at `app/api/ai-quote/route.ts`.

The route:

1. Validates the Firebase ID token.
2. Resolves the user's `organizationId`.
3. Loads only that organization's existing customers and products.
4. Sends the prompt and bounded catalog to OpenAI when `OPENAI_API_KEY` is configured.
5. Validates the structured response against the supplied catalog IDs.
6. Falls back to the deterministic local parser when the OpenAI key is absent or the provider request fails.
7. Returns a preview without writing a quote to Firestore.

`OPENAI_API_KEY` is server-side only and must never use a `NEXT_PUBLIC_` prefix.

> **Human-review requirement:** AI-generated quotes are drafts. Users must verify prices, products and services, quantities, discounts, taxes, and customer information before sending or saving a commercial proposal. The business remains responsible for the final quote.

## Technology stack

- Next.js 16 App Router
- React 19
- TypeScript 5
- Firebase Authentication
- Cloud Firestore
- OpenAI Responses API with structured output
- pdfmake for browser-side PDF generation
- Lucide React icons
- ESLint
- Vercel production hosting

## Architecture

```text
Browser
├── Next.js client application
│   ├── Firebase Authentication session
│   ├── Organization-scoped Firestore reads and writes
│   └── Client-side PDF generation
└── POST /api/ai-quote
    ├── Firebase ID-token validation
    ├── Organization and catalog lookup through Firestore REST
    ├── OpenAI structured-output adapter
    └── Deterministic parser fallback
```

Firestore uses the following top-level collections:

- `organizations`
- `users`
- `customers`
- `products`
- `quotes`
- `quoteItems`

Each business record carries an `organizationId`. The rules in `firestore.rules` require an authenticated user document and restrict reads and writes to that user's organization.

## Local installation

### Prerequisites

- Node.js 22.x
- npm
- A Firebase project with Authentication and Firestore enabled
- An OpenAI API key only if real AI generation is required

### Setup

```bash
git clone https://github.com/dicleozgendev/teklifio.git
cd teklifio
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Before contributing or deploying, verify the project:

```bash
npm run lint
npm run build
```

## Testing

The unit and security-contract suite does not require external services:

```bash
npm run test:unit
```

The Playwright suite starts an isolated local demo server with Firebase configuration disabled. It covers desktop and mobile navigation, legal pages, customer and product creation, manual quote creation, lifecycle status changes, PDF download, search, refresh persistence, and the deterministic AI preview/approval flow. It never writes to production Firestore.

```bash
npx playwright install chromium
npm run test:e2e
```

Run the complete local verification chain with:

```bash
npm run test:all
```

## Environment variables

Copy `.env.example` to `.env.local` and replace every placeholder locally. Never commit `.env.local`.

| Variable | Scope | Required | Purpose |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Browser | Firebase mode | Firebase web API key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Browser | Firebase mode | Firebase Auth domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Browser/server | Firebase mode | Firebase project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Browser | Firebase mode | Firebase storage bucket from the web config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Browser | Firebase mode | Firebase sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Browser | Firebase mode | Firebase web app ID |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | Browser | No | Optional Analytics measurement ID; Analytics is not required by the app |
| `NEXT_PUBLIC_DEMO_MODE` | Browser | No | Shows the demo banner when set to `true` |
| `NEXT_PUBLIC_SEED_DEMO_DATA` | Browser | No | Seeds fictional records only in development/staging when explicitly set to `true` |
| `NEXT_PUBLIC_APP_ENV` | Browser | No | Runtime label: `development`, `staging`, or `production` |
| `OPENAI_API_KEY` | Server only | No | Enables the OpenAI adapter; the deterministic parser remains available without it |

Firebase web configuration is designed to be browser-visible. Access control must be enforced with Authentication and Firestore Security Rules, not by treating the web config as a secret.

## Firebase setup

1. Create a Firebase project and register a Web app.
2. Enable **Email/Password** under Authentication → Sign-in method.
3. Create a Cloud Firestore database.
4. Copy `.env.example` to `.env.local` and add the Firebase web configuration.
5. Install and authenticate the Firebase CLI:

   ```bash
   npm install --global firebase-tools
   firebase login
   firebase use --add
   ```

6. Select your own project when prompted.
7. Deploy the repository's rules and indexes:

   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```

8. Add local and deployed domains to Firebase Authentication's authorized domains when required.

Do not replace `firestore.rules` with public test rules. The included rules are part of the organization's data-isolation boundary.

## OpenAI integration

Add `OPENAI_API_KEY` only to `.env.local` for local development and to the server-side environment settings of the deployment platform. The browser calls the internal `/api/ai-quote` route and never receives the key.

The current adapter uses the OpenAI Responses API with a strict JSON schema. Returned customer and product IDs are checked against the organization-scoped catalog before the preview is returned. Unknown records are discarded rather than invented.

When no key is configured—or the provider call fails—the server returns a deterministic parser result and identifies the mode through the `X-AI-Mode` response header.

## Vercel deployment

1. Import the repository into Vercel or deploy it with the Vercel CLI.
2. Add all required `NEXT_PUBLIC_FIREBASE_*` variables to the intended environment.
3. Set `NEXT_PUBLIC_DEMO_MODE=true` for a public demo, or `false` for a non-demo deployment.
4. Set `NEXT_PUBLIC_APP_ENV=production` and `NEXT_PUBLIC_SEED_DEMO_DATA=false` for production. Demo seeding is automatically refused in production.
4. Add `OPENAI_API_KEY` as a server-side environment variable. Do not expose it with a `NEXT_PUBLIC_` prefix.
5. Deploy and verify registration, Firestore access, AI preview, quote persistence, and PDF download.
6. Add the final Vercel domain to Firebase Authentication's authorized domains.

The standard Vercel build command is `npm run build`. No secret values are stored in `vercel.json`.

## Security

- `.env.local`, `.env*` files other than `.env.example`, Vercel metadata, build output, logs, caches, and private keys are ignored by Git.
- The OpenAI key is read only by the server-side API route.
- The AI route requires a valid Firebase ID token before reading organization data.
- Firestore Security Rules enforce organization-scoped access for customers, products, quotes, and quote items.
- Firebase service-account credentials are not required by this repository and must not be added to browser code or committed.
- AI output is validated against existing organization records and requires user approval before persistence.

For responsible vulnerability reporting, see [SECURITY.md](SECURITY.md).

## Demo notice

The hosted demo may contain seeded, fictional records and example financial values. The demo label is controlled by `NEXT_PUBLIC_DEMO_MODE`; fictional record seeding is controlled separately by `NEXT_PUBLIC_SEED_DEMO_DATA` and is disabled in production. Demo content does not represent real customers, transactions, legal advice, accounting advice, or tax advice.

For isolated preview testing, see [`docs/STAGING.md`](docs/STAGING.md). Never run automated account or data mutation tests against the production Firebase project.

## Limitations and roadmap

Currently implemented:

- Email/password authentication, email verification, password reset, and one organization created during registration
- First-run organization onboarding and a role-ready owner profile
- Organization-scoped CRM, catalog, quotes, PDF export, and AI-assisted draft generation
- A deterministic Turkish parser fallback for a limited set of quote instructions

Not currently implemented:

- Team invitations and multi-role organization administration
- Payment processing, subscriptions, and billing
- Sending quotes by email or collecting legally binding e-signatures
- Server-side PDF storage or version history
- Full accounting, inventory, or tax-compliance automation
- Broad conversational editing based on historical quotes

Future work may add these capabilities only after their security, privacy, and operational requirements are designed and tested.

## License

This project is available under the [MIT License](LICENSE).

## Suggested repository metadata

- **Repository name:** `teklifio`
- **Description:** AI-powered B2B quote generation and lightweight CRM platform for creating, managing, and exporting professional sales proposals.
- **Topics:** `nextjs`, `typescript`, `firebase`, `openai`, `saas`, `crm`, `b2b`, `quotation`, `sales-automation`, `pdf-generation`
