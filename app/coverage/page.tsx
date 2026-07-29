import {
  additionalCategories,
  categories,
  referenceImageCategories,
} from "../../lib/catalog";

export const metadata = {
  title: "攻略覆蓋比較",
  description: "參考首頁與英文攻略網站的分類缺口比較。",
};

function CategoryRows({
  items,
}: {
  items: typeof categories;
}) {
  return (
    <div className="coverage-rows">
      {items.map((category) => (
        <article key={category.id}>
          <span aria-hidden="true">{category.icon}</span>
          <div>
            <strong>{category.label}</strong>
            <small>{category.sourceCoverage}</small>
          </div>
          <b className={category.status === "active" ? "coverage-active" : "coverage-planned"}>
            {category.status === "active" ? "已接入" : "排程中"}
          </b>
        </article>
      ))}
    </div>
  );
}

export default function CoveragePage() {
  return (
    <main className="inner-page">
      <header className="page-title">
        <p>COVERAGE MAP</p>
        <h1>圖片與英文網站的攻略差異</h1>
        <span>圖片適合當入口，但不足以表達英文攻略網站實際涵蓋的所有玩法。</span>
      </header>

      <section className="comparison-grid">
        <div className="comparison-card">
          <header>
            <span>圖片已有</span>
            <strong>{referenceImageCategories.length} 類</strong>
          </header>
          <p>職業、副本、天賦、PvP、任務、聲望、成就、工具與排名等主要入口。</p>
          <CategoryRows items={referenceImageCategories} />
        </div>

        <div className="comparison-card comparison-card-highlight">
          <header>
            <span>英文網站另有</span>
            <strong>{additionalCategories.length} 類</strong>
          </header>
          <p>這些是參考圖片沒有明確呈現、但玩家經常需要查找的攻略項目。</p>
          <CategoryRows items={additionalCategories} />
        </div>
      </section>

      <section className="exclusive-note">
        <h2>圖片有，但不是「英文攻略文章」的項目</h2>
        <div>
          <article>
            <strong>大秘境計分器與團本進度</strong>
            <p>主要來自 Raider.IO、WoWProgress 等角色／公會資料工具，不是一般文字攻略。</p>
          </article>
          <article>
            <strong>裝備比較與天賦模擬</strong>
            <p>需要 Raidbots、Bloodmallet 或角色資料，不能用固定文章結果取代。</p>
          </article>
          <article>
            <strong>台服問題與巴哈問答</strong>
            <p>英文網站不會處理台服譯名、伺服器情境與巴哈常見問法，本站會另外建立問題索引。</p>
          </article>
        </div>
      </section>
    </main>
  );
}
