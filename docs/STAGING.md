# Staging environment

Use a separate Firebase project for staging. Do not point automated tests or preview deployments at the production Firestore database.

## Required separation

- Create a dedicated Firebase project, for example `teklifio-staging`.
- Enable Email/Password Authentication in that project.
- Deploy `firestore.rules` and `firestore.indexes.json` to the staging project.
- Configure a separate Vercel Preview environment with the staging Firebase web configuration.
- Use a separate, restricted server-side OpenAI API key or leave the key unset to exercise the deterministic fallback.

## Vercel Preview variables

```text
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_DEMO_MODE=true
NEXT_PUBLIC_SEED_DEMO_DATA=true
NEXT_PUBLIC_FIREBASE_API_KEY=staging_web_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=staging_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=staging_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=staging_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=staging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=staging_app_id
OPENAI_API_KEY=optional_staging_server_key
```

Production must use `NEXT_PUBLIC_APP_ENV=production` and `NEXT_PUBLIC_SEED_DEMO_DATA=false`. The application also refuses to seed fictional records when the environment is production, even if the seed variable is accidentally enabled.

## Deploy Firebase configuration

```bash
npx firebase-tools deploy --only firestore --project YOUR_STAGING_PROJECT_ID
```

Never commit `.env.local`, test passwords, Firebase service-account files, or OpenAI API keys.
