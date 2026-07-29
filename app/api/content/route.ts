import { NextResponse } from "next/server";
import {
  categories,
  contentGeneratedAt,
  contentItems,
  questionRadar,
  sources,
} from "../../../lib/catalog";

export const dynamic = "force-dynamic";

type LiveItem = {
  id: string;
  title: string;
  summary: string;
  sourceName: string;
  sourceUrl: string;
  group?: string;
  updatedAt?: string;
};

async function loadLiveItems(): Promise<LiveItem[]> {
  const feedUrl = process.env.CONTENT_FEED_URL;
  if (!feedUrl) return [];

  try {
    const response = await fetch(feedUrl, {
      headers: { accept: "application/json" },
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];
    const payload = (await response.json()) as { items?: LiveItem[] };
    return Array.isArray(payload.items) ? payload.items : [];
  } catch {
    return [];
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim().toLocaleLowerCase("zh-TW");
  const liveItems = await loadLiveItems();
  const availableItems: LiveItem[] = liveItems.length ? liveItems : contentItems;
  const items = query
    ? availableItems.filter((item) =>
        `${item.title} ${item.summary} ${"category" in item ? item.category : item.group ?? ""}`
          .toLocaleLowerCase("zh-TW")
          .includes(query),
      )
    : availableItems;

  return NextResponse.json({
    schemaVersion: 1,
    generatedAt: contentGeneratedAt,
    counts: {
      englishSources: sources.length,
      categories: categories.length,
      questionRadar: questionRadar.length,
      items: items.length,
    },
    feed: liveItems.length ? "live" : "bundled-fallback",
    items,
  });
}
