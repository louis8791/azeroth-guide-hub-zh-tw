import contentIndex from "../data/content-index.json";
import taxonomy from "../data/guide-taxonomy.json";
import registry from "../data/source-registry.json";

export type SourceProfile = (typeof registry.sources)[number];
export type GuideCategory = (typeof taxonomy.categories)[number];
export type ContentItem = (typeof contentIndex.items)[number];

export const sources: SourceProfile[] = registry.sources;
export const questionRadar = registry.questionRadar;
export const sourcePolicy = registry.policy;
export const categories: GuideCategory[] = taxonomy.categories;
export const contentItems: ContentItem[] = contentIndex.items;
export const contentGeneratedAt = contentIndex.generatedAt;

export const sourceGroups = Array.from(
  new Set(sources.map((source) => source.group)),
);

export const automaticSources = sources.filter(
  (source) => source.crawlMode !== "manual",
);

export const referenceImageCategories = categories.filter(
  (category) => category.inReferenceImage,
);

export const additionalCategories = categories.filter(
  (category) => !category.inReferenceImage,
);

export const classGuides = [
  ["死亡騎士", "DK", "class-red"],
  ["惡魔獵人", "DH", "class-purple"],
  ["德魯伊", "DR", "class-orange"],
  ["喚能師", "EV", "class-cyan"],
  ["獵人", "HU", "class-green"],
  ["法師", "MA", "class-blue"],
  ["武僧", "MO", "class-jade"],
  ["聖騎士", "PA", "class-pink"],
  ["牧師", "PR", "class-white"],
  ["盜賊", "RO", "class-yellow"],
  ["薩滿祭司", "SH", "class-sky"],
  ["術士", "WL", "class-violet"],
  ["戰士", "WA", "class-rust"],
] as const;

export const quickLinks = [
  ["大秘境路線", "⌖", "/guides?category=routes"],
  ["團隊副本攻略", "♜", "/guides?category=raid"],
  ["天賦與專精", "⌘", "/guides?category=talents"],
  ["裝備比較", "◆", "/guides?category=gear"],
  ["職業排名", "№", "/guides?category=rankings"],
  ["任務攻略", "!", "/guides?category=quests"],
  ["成就追蹤", "🏆", "/guides?category=achievements"],
  ["聲望獎勵", "♛", "/guides?category=reputation"],
] as const;
