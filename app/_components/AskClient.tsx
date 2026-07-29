"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { categories, contentItems, sources } from "../../lib/catalog";

export function AskClient() {
  const searchParams = useSearchParams();
  const query = (searchParams.get("q") ?? "").trim();
  const normalized = query.toLocaleLowerCase("zh-TW");
  const matchingCategories = categories.filter((category) =>
    `${category.label} ${category.sourceCoverage}`.toLocaleLowerCase("zh-TW").includes(normalized),
  );
  const matchingContent = contentItems.filter((item) =>
    `${item.title} ${item.summary} ${item.category}`.toLocaleLowerCase("zh-TW").includes(normalized),
  );
  const matchingSources = sources.filter((source) =>
    `${source.name} ${source.coverage.join(" ")}`.toLocaleLowerCase("zh-TW").includes(normalized),
  );
  const hasQuery = query.length > 0;

  return (
    <main className="inner-page ask-page">
      <header className="page-title">
        <p>GUIDE SEARCH</p>
        <h1>你想查什麼？</h1>
        <span>用台服常見說法輸入問題，系統會先找攻略分類與可核對的來源。</span>
      </header>

      <form className="ask-search">
        <input autoFocus defaultValue={query} name="q" placeholder="例如：回鍋後怎麼提升裝等？" />
        <button type="submit">搜尋攻略</button>
      </form>

      {!hasQuery ? (
        <section className="question-prompts">
          {[
            "滿等後先做什麼？",
            "第一次打大秘境要準備什麼？",
            "兩件裝備怎麼比較？",
            "團本首領機制去哪看？",
            "插件和 WeakAuras 怎麼選？",
            "坐騎與戰寵去哪查？",
          ].map((prompt) => (
            <Link href={`/ask?q=${encodeURIComponent(prompt)}`} key={prompt}>{prompt}</Link>
          ))}
        </section>
      ) : (
        <section className="search-results">
          <div className="result-summary">
            <strong>「{query}」</strong>
            <span>
              找到 {matchingCategories.length + matchingContent.length + matchingSources.length} 個相關入口
            </span>
          </div>

          {matchingCategories.length > 0 && (
            <div className="result-group">
              <h2>攻略分類</h2>
              {matchingCategories.map((category) => (
                <Link href={`/guides?category=${category.id}`} key={category.id}>
                  <span>{category.icon}</span>
                  <div><strong>{category.label}</strong><small>{category.sourceCoverage}</small></div>
                </Link>
              ))}
            </div>
          )}

          {matchingContent.length > 0 && (
            <div className="result-group">
              <h2>近期內容</h2>
              {matchingContent.map((item) => (
                <a href={item.sourceUrl} key={item.id} rel="noreferrer" target="_blank">
                  <span>↗</span>
                  <div><strong>{item.title}</strong><small>{item.summary}</small></div>
                </a>
              ))}
            </div>
          )}

          {matchingSources.length > 0 && (
            <div className="result-group">
              <h2>專門來源</h2>
              {matchingSources.slice(0, 8).map((source) => (
                <a href={source.url} key={source.id} rel="noreferrer" target="_blank">
                  <span>◈</span>
                  <div><strong>{source.name}</strong><small>{source.coverage.join("、")}</small></div>
                </a>
              ))}
            </div>
          )}

          {matchingCategories.length + matchingContent.length + matchingSources.length === 0 && (
            <div className="empty-result">
              <strong>目前索引裡還沒有直接答案</strong>
              <p>這個問題會保留為內容缺口；你也可以先查看全部攻略分類。</p>
              <Link href="/guides">查看攻略庫</Link>
            </div>
          )}
        </section>
      )}
    </main>
  );
}
