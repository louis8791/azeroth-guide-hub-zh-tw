import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const registry = await readJson(resolve(root, "data/source-registry.json"), {
  policy: {},
  sources: [],
  questionRadar: [],
});
const previous = await readJson(resolve(root, "data/content-source.json"), {
  documents: [],
});
const args = new Map(
  process.argv.slice(2).map((entry) => {
    const [key, value = "true"] = entry.replace(/^--/, "").split("=");
    return [key, value];
  }),
);
const tier = args.get("tier") ?? "all";
const now = new Date().toISOString();
const delayMs = Number(registry.policy.requestDelayMs ?? 1400);
const maxExcerpt = Number(registry.policy.maximumExcerptCharacters ?? 420);
const userAgent = registry.policy.userAgent ?? "AzerothGuideHub/1.0";
const previousBySource = new Map();

for (const document of previous.documents ?? []) {
  const documents = previousBySource.get(document.sourceId) ?? [];
  documents.push(document);
  previousBySource.set(document.sourceId, documents);
}

const tierGroups = {
  urgent: new Set(["官方與版本"]),
  guides: new Set([
    "綜合攻略與資料庫",
    "團本與傳奇鑰石",
    "PvP",
    "專業與經濟",
    "收藏與外觀",
    "插件與介面",
  ]),
  stats: new Set(["數據與角色最佳化", "公會與進度"]),
};

function normalizeSource(source, isQuestionRadar = false) {
  return {
    group: isQuestionRadar ? "台服問題雷達" : "其他",
    coverage: [],
    priority: isQuestionRadar ? 1 : 4,
    note: source.purpose ?? "",
    ...source,
  };
}

const englishSources = registry.sources.map((source) => normalizeSource(source));
const radarSources = registry.questionRadar.map((source) =>
  normalizeSource(source, true),
);

const selectedSources =
  tier === "questions"
    ? radarSources
    : tier === "all" || tier === "backfill"
      ? [...englishSources, ...radarSources]
      : englishSources.filter((source) => tierGroups[tier]?.has(source.group));

function fingerprint(value) {
  return createHash("sha256").update(value).digest("hex");
}

function decodeHtml(value = "") {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTitle(html) {
  const match = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return decodeHtml(match?.[1] ?? "");
}

function extractDescription(html) {
  const patterns = [
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["'][^>]*>/i,
    /<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["'][^>]*>/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtml(match[1]).slice(0, maxExcerpt);
  }
  return "";
}

function extractLinks(html, baseUrl, source) {
  const links = [];
  const seen = new Set();
  const matcher = /<a\b[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(matcher)) {
    try {
      const url = new URL(match[1], baseUrl);
      const title = decodeHtml(match[2]);
      if (url.origin !== new URL(source.url).origin) continue;
      if (source.includePath && !new RegExp(source.includePath).test(url.pathname)) continue;
      if (title.length < 8 || title.length > 180 || seen.has(url.href)) continue;
      seen.add(url.href);
      links.push({ title, url: url.href });
      if (links.length >= Number(source.maxLinks ?? 12)) break;
    } catch {
      // Ignore invalid links from source markup.
    }
  }
  return links;
}

function parseRobots(text) {
  const groups = [];
  let currentAgents = [];
  let currentRules = [];
  const flush = () => {
    if (currentAgents.length) groups.push({ agents: currentAgents, rules: currentRules });
    currentAgents = [];
    currentRules = [];
  };

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const [rawKey, ...rest] = line.split(":");
    const key = rawKey.trim().toLowerCase();
    const value = rest.join(":").trim();
    if (key === "user-agent") {
      if (currentRules.length) flush();
      currentAgents.push(value.toLowerCase());
    } else if ((key === "allow" || key === "disallow") && currentAgents.length) {
      currentRules.push({ type: key, path: value });
    }
  }
  flush();
  return groups;
}

function robotsAllows(url, text) {
  const path = new URL(url).pathname || "/";
  const groups = parseRobots(text);
  const matching =
    groups.filter((group) => group.agents.some((agent) => agent === "azerothguidehub")) ||
    [];
  const applicable = matching.length
    ? matching
    : groups.filter((group) => group.agents.includes("*"));
  const rules = applicable
    .flatMap((group) => group.rules)
    .filter((rule) => rule.path && path.startsWith(rule.path))
    .sort((left, right) => right.path.length - left.path.length);
  return rules[0]?.type !== "disallow";
}

async function fetchText(url, timeout = 25_000) {
  const response = await fetch(url, {
    headers: {
      "user-agent": userAgent,
      accept: "text/html,text/plain;q=0.9",
      "accept-language": "en-US,en;q=0.9,zh-TW;q=0.7",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(timeout),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return { text: await response.text(), finalUrl: response.url };
}

async function robotsStatus(source) {
  try {
    const robotsUrl = new URL("/robots.txt", source.url).href;
    const response = await fetch(robotsUrl, {
      headers: { "user-agent": userAgent, accept: "text/plain" },
      signal: AbortSignal.timeout(12_000),
    });
    if (response.status === 404) return { allowed: true, status: "not-published" };
    if (!response.ok) return { allowed: false, status: `unverified-${response.status}` };
    return {
      allowed: robotsAllows(source.url, await response.text()),
      status: "checked",
    };
  } catch (error) {
    return {
      allowed: false,
      status: "unverified",
      note: error instanceof Error ? error.message : String(error),
    };
  }
}

async function crawl(source) {
  const oldDocuments = previousBySource.get(source.id) ?? [];
  if (source.crawlMode === "manual") {
    return {
      report: { id: source.id, name: source.name, status: "manual", checkedAt: now },
      documents: oldDocuments,
    };
  }

  const robots = await robotsStatus(source);
  if (!robots.allowed) {
    return {
      report: {
        id: source.id,
        name: source.name,
        status: "robots-blocked",
        robotsStatus: robots.status,
        checkedAt: now,
      },
      documents: oldDocuments,
    };
  }

  try {
    if (delayMs > 0) await new Promise((resolveDelay) => setTimeout(resolveDelay, delayMs));
    const page = await fetchText(source.url);
    const title = extractTitle(page.text) || source.name;
    const description = extractDescription(page.text);
    const documents = [
      {
        id: `${source.id}:home`,
        sourceId: source.id,
        sourceName: source.name,
        sourceUrl: source.url,
        group: source.group,
        categoryHints: source.coverage,
        title,
        url: page.finalUrl,
        originalText: description || title,
        locale: source.locale ?? "en-US",
        discoveredAt: now,
        fingerprint: fingerprint(`${title}\n${description}`),
      },
    ];

    if (["index", "question-index"].includes(source.crawlMode)) {
      for (const link of extractLinks(page.text, page.finalUrl, source)) {
        documents.push({
          id: `${source.id}:${fingerprint(link.url).slice(0, 14)}`,
          sourceId: source.id,
          sourceName: source.name,
          sourceUrl: source.url,
          group: source.group,
          categoryHints: source.coverage,
          title: link.title,
          url: link.url,
          originalText: link.title,
          locale: source.locale ?? "en-US",
          discoveredAt: now,
          fingerprint: fingerprint(`${link.title}\n${link.url}`),
        });
      }
    }

    return {
      report: {
        id: source.id,
        name: source.name,
        status: "available",
        checkedAt: now,
        documentCount: documents.length,
      },
      documents,
    };
  } catch (error) {
    return {
      report: {
        id: source.id,
        name: source.name,
        status: "unavailable",
        checkedAt: now,
        note: error instanceof Error ? error.message : String(error),
      },
      documents: oldDocuments,
    };
  }
}

const results = [];
for (const source of selectedSources) {
  process.stdout.write(`Checking ${source.name}... `);
  const result = await crawl(source);
  results.push(result);
  console.log(result.report.status);
}

const untouchedDocuments =
  tier === "all" || tier === "backfill"
    ? []
    : (previous.documents ?? []).filter(
        (document) => !selectedSources.some((source) => source.id === document.sourceId),
      );
const documents = [...untouchedDocuments, ...results.flatMap((result) => result.documents)]
  .filter((document, index, all) => all.findIndex((item) => item.id === document.id) === index)
  .sort((left, right) => left.sourceName.localeCompare(right.sourceName));
const report = {
  schemaVersion: 1,
  generatedAt: now,
  tier,
  selectedSourceCount: selectedSources.length,
  available: results.filter((item) => item.report.status === "available").length,
  manual: results.filter((item) => item.report.status === "manual").length,
  blocked: results.filter((item) => item.report.status === "robots-blocked").length,
  unavailable: results.filter((item) => item.report.status === "unavailable").length,
  documentCount: documents.length,
  sources: results.map((item) => item.report),
};

await writeJson(resolve(root, "data/content-source.json"), {
  schemaVersion: 1,
  generatedAt: now,
  documents,
});
await writeJson(resolve(root, "data/crawl-report.json"), report);
console.log(`Indexed ${documents.length} permitted excerpts and links.`);

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}
