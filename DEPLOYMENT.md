# The Archive — Cloudflare Deployment Guide

This project is a full-stack vinext application with server-rendered routes, API routes, D1, and R2.

## Important correction: Workers, not Pages

Deploy this application to **Cloudflare Workers**, using **Workers Builds** for the GitHub integration.

Cloudflare Pages supports static Next.js exports, but Cloudflare directs full-stack server-rendered Next.js applications to Workers. vinext also names Workers as its native Cloudflare deployment target. This application cannot be reduced to a static Pages export because ratings, tags, play counting, QR redirects, and catalog reads require a server runtime and D1 bindings.

Workers, D1, and R2 all have free-plan allowances. Usage must be monitored because writes stop when a free-plan daily limit is reached.

References:

- <https://developers.cloudflare.com/pages/framework-guides/nextjs/>
- <https://developers.cloudflare.com/workers/framework-guides/web-apps/nextjs/>
- <https://developers.cloudflare.com/workers/ci-cd/builds/>
- <https://developers.cloudflare.com/d1/platform/pricing/>
- <https://developers.cloudflare.com/r2/pricing/>

## Prerequisites

- GitHub account
- Cloudflare account
- Node.js 22.13 or newer
- Wrangler authenticated locally for the one-time infrastructure setup
- A domain managed by Cloudflare if production audio will use an R2 custom domain

## 1. Validate locally

```bash
npm ci
npm run check
npm run lint
npm run typecheck
npm run build
```

Do not publish a commit unless all commands succeed.

## 2. Create Cloudflare resources

Authenticate:

```bash
npx wrangler login
```

Create D1 and R2:

```bash
npx wrangler d1 create the-archive-db
npx wrangler r2 bucket create the-archive-media
```

Copy the example configuration:

```bash
cp wrangler.example.jsonc wrangler.jsonc
```

Replace `REPLACE_WITH_D1_DATABASE_ID` in `wrangler.jsonc` with the ID returned by the D1 create command. Keep these binding names unchanged:

- D1: `DB`
- R2: `R2`
- Static assets: `ASSETS`

The Worker name in Cloudflare must match the `name` field in `wrangler.jsonc`: `the-archive`.

## 3. Apply migrations

Preview the migration list:

```bash
npx wrangler d1 migrations list the-archive-db --remote
```

Apply all tracked migrations:

```bash
npx wrangler d1 migrations apply the-archive-db --remote
```

The migration directory is configured as `drizzle`. Do not apply only the newest SQL file to a new database; the files are sequential.

## 4. Seed the catalog

The idempotent seed file creates the five personas and placeholder War Scroll catalog records:

```bash
npx wrangler d1 execute the-archive-db --remote --file=./db/seed.sql
```

Seeded versions remain private and have no public URL. They will not appear in the player until real web audio is uploaded and the corresponding version is activated.

## 5. Configure R2 media delivery

For production, connect the R2 bucket to a custom domain such as:

```text
media.example.com
```

Cloudflare documents `r2.dev` as a rate-limited development endpoint, not a production media URL.

Configure bucket CORS for the final application origin:

```json
[
  {
    "AllowedOrigins": ["https://archive.example.com"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["Range"],
    "ExposeHeaders": ["Accept-Ranges", "Content-Length", "Content-Range", "ETag"],
    "MaxAgeSeconds": 3600
  }
]
```

Upload web derivatives, never masters:

```bash
npx wrangler r2 object put \
  the-archive-media/audio/the-war-scroll/TWS-2026-001/v01/stream.mp3 \
  --file=./local-audio/dawn-witness.mp3 \
  --content-type=audio/mpeg
```

Then set `track_versions.public_url` to the custom-domain URL and `is_public` to `1`. Confirm duration and the object key before activation.

R2 references:

- <https://developers.cloudflare.com/r2/buckets/public-buckets/>
- <https://developers.cloudflare.com/r2/buckets/cors/>

## 6. Test the production runtime locally

The ordinary development server is useful for editing. Before deployment, also test the workerd production path:

```bash
npm run build
npx wrangler dev
```

Verify:

- `/`
- `/privacy`
- `/sitemap.xml`
- `/api/catalog`
- one persona route
- one release route if seeded
- one track route
- one `/listen/<code>` redirect if seeded
- rating create/update
- pending tag submission
- qualified play recording

## 7. Push to GitHub

Create a private repository named `the-archive`, then push `main`.

The repository must include:

- application source;
- `package-lock.json`;
- all `drizzle/*.sql` migrations;
- `db/seed.sql`;
- `wrangler.example.jsonc`;
- this deployment guide.

Do not commit:

- `.env*`;
- `.dev.vars`;
- `wrangler.jsonc` if it contains account-specific IDs;
- audio masters or other unreleased media;
- Wrangler state;
- build output;
- access tokens.

## 8. Connect GitHub to Workers Builds

In Cloudflare:

1. Open **Workers & Pages**.
2. Create or select the Worker named `the-archive`.
3. Open **Settings → Builds**.
4. Connect the GitHub repository and select `main` as the production branch.
5. Use the repository root as the root directory.
6. Set the build command to:

   ```bash
   npm run check && npm run lint && npm run typecheck
   ```

7. Set the deploy command to:

   ```bash
   npm run deploy
   ```

8. Set the non-production branch deploy command to:

   ```bash
   npx vinext deploy --preview
   ```

Cloudflare provides the build token when the repository is connected.

## 9. Configure production values

In the Worker configuration:

- Bind D1 database `the-archive-db` as `DB`.
- Bind R2 bucket `the-archive-media` as `R2`.
- Set `NEXT_PUBLIC_SITE_URL` to the final HTTPS application origin.
- Attach the final custom domain when ready.

The public site URL is used for sitemap and canonical metadata. It is not a secret.

## 10. Post-deployment checks

- [ ] Production build and deployment checks pass
- [ ] D1 migrations are current
- [ ] Five personas are seeded
- [ ] Real audio uses web derivatives in R2
- [ ] R2 production custom domain and CORS are configured
- [ ] Only intended track versions have `is_public = 1`
- [ ] Ratings can be created and revised
- [ ] Listener tags remain pending until moderated
- [ ] Play events are recorded only after the qualification threshold
- [ ] QR redirects cannot leave the site
- [ ] Privacy notice is accessible
- [ ] Sitemap uses the final production origin
- [ ] Free-plan usage is monitored
- [ ] No secrets or unreleased media are present in GitHub

## Remaining operational work

The source is deployable after the account-specific Cloudflare IDs are supplied, but a real launch still requires:

1. actual web audio and artwork;
2. an R2 custom media domain and CORS policy;
3. production D1 migration and seed;
4. a tag-moderation procedure;
5. QR rows and printed-code testing;
6. a retention job for old `play_events`;
7. a final privacy contact method.
