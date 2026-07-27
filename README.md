# The Archive

A mobile-first music curation service for five Gideon Funk artist personas:

- The War Scroll
- Echo Gray
- Chanokh
- Instrumental Band
- Gideon

Listeners can browse the public catalog, play R2-hosted audio, rate tracks, submit moderated tags, and enter campaigns through stable QR links. Identity is a random browser-local UUID; there are no listener accounts or fingerprints.

## Architecture

- **Application:** Next.js 16 API surface on experimental vinext/Vite
- **Runtime and Git deployment:** Cloudflare Workers and Workers Builds
- **Database:** Cloudflare D1 with Drizzle ORM
- **Media:** Cloudflare R2
- **Identity:** browser-local UUID

Cloudflare Pages is not the deployment target. This is a full-stack application with API and D1 routes, so it requires the Workers runtime.

## Local setup

```bash
npm ci
npm run dev
```

The local vinext server supplies a local D1 binding based on `.openai/hosting.json`. Apply migrations to the local database before testing catalog behavior.

## Quality checks

```bash
npm run check
npm run lint
npm run typecheck
npm test
```

## Database

The schema has 14 tables in [db/schema.ts](db/schema.ts). Drizzle migrations are committed under [drizzle](drizzle), and [db/seed.sql](db/seed.sql) provides an idempotent initial catalog seed.

Create a new migration after a schema change:

```bash
npm run db:generate
```

Never edit an already-applied migration. Review generated SQL before committing it.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for D1/R2 provisioning, migrations, media CORS, GitHub integration, Workers Builds, and post-deployment checks.

## Important limitations

- vinext describes itself as experimental and should be upgraded cautiously.
- Browser-local identity deters casual duplicates but is not strong authentication.
- Rate limits tied only to the anonymous UUID can be bypassed by clearing browser storage.
- Placeholder catalog versions have no audio URL and remain private until real web derivatives are uploaded.
- Tag moderation and play-event retention are operational tasks that still need a curator workflow.
