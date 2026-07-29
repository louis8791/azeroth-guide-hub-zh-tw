import { questionRadar, sourceGroups, sources } from "../../lib/catalog";

export const metadata = {
  title: "資料來源",
  description: "30 個英文魔獸網站的用途、覆蓋範圍與自動更新方式。",
};

const modeLabels: Record<string, string> = {
  index: "定期索引",
  page: "單頁檢查",
  manual: "人工入口",
  "question-index": "問題雷達",
};

export default function SourcesPage() {
  return (
    <main className="inner-page">
      <header className="page-title">
        <p>SOURCE NETWORK</p>
        <h1>30 個英文攻略來源</h1>
        <span>每個來源只負責它擅長的事情；受限制的網站不會被硬爬。</span>
      </header>

      <div className="source-summary">
        <div><strong>{sources.length}</strong><span>英文網站</span></div>
        <div><strong>{sources.filter((source) => source.crawlMode === "index").length}</strong><span>定期索引</span></div>
        <div><strong>{sources.filter((source) => source.crawlMode === "page").length}</strong><span>單頁檢查</span></div>
        <div><strong>{sources.filter((source) => source.crawlMode === "manual").length}</strong><span>人工入口</span></div>
      </div>

      {sourceGroups.map((group) => {
        const groupSources = sources.filter((source) => source.group === group);
        return (
          <section className="source-group" key={group}>
            <h2>{group}</h2>
            <div className="source-table">
              {groupSources.map((source) => (
                <article key={source.id}>
                  <div>
                    <a href={source.url} rel="noreferrer" target="_blank">{source.name} ↗</a>
                    <span className={`mode-badge mode-${source.crawlMode}`}>{modeLabels[source.crawlMode]}</span>
                  </div>
                  <p>{source.coverage.join("、")}</p>
                  <small>{source.note}</small>
                </article>
              ))}
            </div>
          </section>
        );
      })}

      <section className="source-group radar-group">
        <h2>台服校正與問題雷達</h2>
        <div className="source-table">
          {questionRadar.map((source) => (
            <article key={source.id}>
              <div>
                <a href={source.url} rel="noreferrer" target="_blank">{source.name} ↗</a>
                <span className="mode-badge mode-question-index">{modeLabels[source.crawlMode]}</span>
              </div>
              <p>{source.purpose}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
