# Security policy

## Reporting

Do not open a public issue for a suspected vulnerability. Send a private report to the project owner with reproduction steps, affected routes, and potential impact. Do not include credentials or personal data in the report.

## Secrets

- Commit only `.env*.example` files containing placeholders.
- Local credentials belong in gitignored `.env.local`; deployment credentials belong in Vercel Environment Variables or Supabase Vault/Secrets.
- Service-role, database, payment, OAuth, email, and SMS credentials are server-only and must never use a `NEXT_PUBLIC_` prefix.
- Logs, screenshots, fixtures, support bundles, and test output must not contain tokens, passwords, OTPs, request bodies, email addresses, or phone numbers.
- If a credential enters Git history or an untrusted log, removing the file is insufficient: revoke and rotate it at the provider, then invalidate affected sessions/webhooks.
- Use separate development, preview, test, and production credentials. RLS integration tests must target an isolated test project.

## Rotation checklist

1. Rotate the database password and update Supabase/Vercel connection strings.
2. Rotate Supabase service-role/legacy JWT secrets according to Supabase's key-rotation procedure and redeploy all consumers.
3. Roll Stripe restricted/test keys and webhook signing secrets; update webhook endpoints before revoking old secrets.
4. Rotate Google OAuth client secret and verify exact redirect URIs.
5. Revoke Gmail app passwords or SMTP credentials.
6. Rotate Twilio auth tokens/API keys and verify messaging configuration.
7. Rotate application auth secrets, redeploy, and invalidate old sessions where applicable.
8. Run the tracked-file secret scan and verify preview/production health.

## Required controls

RLS is the primary authorization boundary for user-scoped data. Service-role clients are restricted to authenticated admin operations, trusted webhooks, migrations, and offline maintenance scripts. Route handlers must independently authenticate and authorize privileged operations, validate untrusted input, and return sanitized errors.
