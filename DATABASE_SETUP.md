# MIDSprout shared database

MIDSprout uses the server-only `MIDSPROUTDATA_POSTGRES_URL` environment variable supplied by the Vercel Supabase integration. The app also recognizes `MIDSPROUTDATA_POSTGRES_PRISMA_URL`, `MIDSPROUTDATA_URL`, `POSTGRES_URL`, and `DATABASE_URL` as fallbacks. Use the Transaction pooler for Vercel/serverless. Do not add a `NEXT_PUBLIC_` prefix or commit the connection URL.

For local development, link the repository to the same Vercel project and pull its environment variables into `.env.development.local`:

```powershell
vercel link
vercel env pull .env.development.local
```

The app creates its tables on the first API request. The first browser to connect bootstraps the database from its existing saved organizations, collaborations, and option lists. Subsequent devices load the shared records and check for updates every five seconds. The existing local browser copy remains as an offline fallback.

Tables created in Supabase:

- `organizations` stores organization profiles and logo data.
- `collaborations` stores collaboration attributes.
- `collaboration_participants` links collaborations to organizations.
- `collaboration_committees` links committees to collaborations.
- `directory_options` stores reusable collaboration types and committees.

This version is configured for open editing, per the selected “anyone with the link can edit” access model. The API routes can be called without a sign-in; add Supabase Auth and access checks before using the directory for confidential data.
