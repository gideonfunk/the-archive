import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);

test("ships The Archive product shell and persistent player", async () => {
  const [layout, page] = await Promise.all([
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("app/page.tsx", root), "utf8"),
  ]);

  assert.match(layout, /The Archive — Five Voices, One Signal/);
  assert.match(layout, /AudioPlayerProvider/);
  assert.match(layout, /PlayerBar/);
  assert.match(page, /FIVE VOICES/);
  assert.doesNotMatch(layout, /codex-preview|Starter Project/);
  assert.doesNotMatch(page, /SkeletonPreview/);
});

test("contains the complete Cloudflare API and migration surface", async () => {
  const requiredFiles = [
    "app/api/catalog/route.ts",
    "app/api/plays/route.ts",
    "app/api/ratings/route.ts",
    "app/api/tags/route.ts",
    "app/api/preferences/route.ts",
    "app/api/annuals/route.ts",
    "app/api/lyrics/route.ts",
    "app/api/manifest/import/route.ts",
    "drizzle/0000_faulty_santa_claus.sql",
    "drizzle/0001_grey_maddog.sql",
    "drizzle/0002_glossy_shotgun.sql",
    "db/seed.sql",
  ];
  await Promise.all(requiredFiles.map((path) => access(new URL(path, root))));
  await assert.rejects(access(new URL("app/api/engagement/route.ts", root)));
});

test("documents GitHub deployment to the correct Cloudflare runtime", async () => {
  const guide = await readFile(new URL("DEPLOYMENT.md", root), "utf8");
  assert.match(guide, /Workers Builds/);
  assert.match(guide, /npx wrangler d1 migrations apply/);
  assert.match(guide, /R2/);
  assert.match(guide, /GitHub/);
});
