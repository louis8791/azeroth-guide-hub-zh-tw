import assert from "node:assert/strict";
import test from "node:test";

async function loadWorker() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker;
}

async function request(path, headers = { accept: "text/html" }) {
  const worker = await loadWorker();
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("renders the dense Traditional Chinese guide portal", async () => {
  const response = await request("/");
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html[^>]+lang="zh-Hant-TW"/i);
  assert.match(html, /艾澤拉斯攻略站/);
  assert.match(html, /至暗之夜/);
  assert.match(html, /快速連結/);
  assert.match(html, /大秘境計分器/);
  assert.match(html, /團隊副本進度/);
  assert.match(html, /職業排名/);
  assert.match(html, /30/);
  assert.doesNotMatch(html, /原文已同步|最新翻譯|機器翻譯|codex-preview/i);
});

test("renders source and coverage pages", async () => {
  const sourceResponse = await request("/sources");
  const coverageResponse = await request("/coverage");
  assert.equal(sourceResponse.status, 200);
  assert.equal(coverageResponse.status, 200);

  const sourceHtml = await sourceResponse.text();
  const coverageHtml = await coverageResponse.text();
  assert.match(sourceHtml, /30 個英文攻略來源/);
  assert.match(sourceHtml, /Icy Veins/);
  assert.match(sourceHtml, /Warcraft Secrets/);
  assert.match(coverageHtml, /英文網站另有/);
  assert.match(coverageHtml, /探究與單人內容/);
  assert.match(coverageHtml, /台服問題與巴哈問答/);
});

test("serves the backend content index", async () => {
  const response = await request("/api/content?q=團隊", {
    accept: "application/json",
  });
  assert.equal(response.status, 200);
  const payload = await response.json();
  assert.equal(payload.schemaVersion, 1);
  assert.equal(payload.counts.englishSources, 30);
  assert.ok(payload.counts.items >= 1);
  assert.ok(Array.isArray(payload.items));
});
