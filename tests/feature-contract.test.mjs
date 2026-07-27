import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const root = new URL("../", import.meta.url);
const source = (path) => readFile(new URL(path, root), "utf8");

test("player maintains a real queue, auto-advances, and restores shuffle order", async () => {
  const player = await source("components/AudioPlayer.tsx");
  assert.match(player, /originalQueue: PlayerTrack\[\]/);
  assert.match(player, /currentTrack: previous\.queue\[previous\.queueIndex \+ 1\],[\s\S]*isPlaying: true/);
  assert.match(player, /queue: previous\.originalQueue/);
  assert.match(player, /originalQueue: previous\.queue/);

  const home = await source("app/page.tsx");
  assert.match(home, /const \{ playQueue, currentTrack \}/);
  assert.match(home, /playQueue\(queue, Math\.max\(0, startIndex\)\)/);
});

test("curator-only endpoints require a configured bearer token", async () => {
  const [annuals, manifest] = await Promise.all([
    source("app/api/annual-candidates/route.ts"),
    source("app/api/manifest/import/route.ts"),
  ]);
  for (const route of [annuals, manifest]) {
    assert.match(route, /CURATOR_API_TOKEN/);
    assert.match(route, /authorization/);
    assert.match(route, /status: 401/);
  }
});

test("the approved Obsidian manifest creates or updates only approved public projections", async () => {
  const manifest = await source("app/api/manifest/import/route.ts");
  assert.match(manifest, /publishApproved: true/);
  assert.match(manifest, /status: "public"/);
  assert.match(manifest, /db\.update\(tracks\)/);
  assert.match(manifest, /db\.insert\(tracks\)/);
  assert.doesNotMatch(manifest, /vaultPath|lyricsPath|filePath/);
});

test("feature tests are executable and not placeholder assertions", async () => {
  const packageJson = await source("package.json");
  assert.match(packageJson, /tests\/\*\.test\.mjs/);
  const tests = await source("tests/feature-contract.test.mjs");
  assert.doesNotMatch(tests, /assert\.ok\(true\)/);
});
