import Link from "next/link";
import { categories, contentItems } from "../../lib/catalog";

type PageProps = {
  searchParams: Promise<{ category?: string; q?: string }>;
};

export const metadata = {
  title: "攻略庫",
  description: "正式服攻略分類、最新內容與專門工具入口。",
};

export default async function GuidesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const selected = params.category ?? "";
  const query = (params.q ?? "").trim().toLocaleLowerCase("zh-TW");
  const filteredCategories = categories.filter((category) => {
    const matchesCategory = !selected || category.id === selected;
    const haystack = `${category.label} ${category.sourceCoverage}`.toLocaleLowerCase("zh-TW");
    return matchesCategory && (!query || haystack.includes(query));
  });

  return (
    <main className="inner-page">
      <header className="page-title">
        <p>GUIDE LIBRARY</p>
        <h1>攻略庫</h1>
        <span>以玩家要解決的事情分類，不沿用任何單一英文網站的目錄。</span>
      </header>

      <form className="library-search">
        <input defaultValue={params.q} name="q" placeholder="搜尋職業、首領、任務或工具…" />
        <button type="submit">搜尋</button>
      </form>

      <nav className="filter-row" aria-label="攻略篩選">
        <Link className={!selected ? "selected" : ""} href="/guides">全部</Link>
        {categories.slice(0, 12).map((category) => (
          <Link
            className={selected === category.id ? "selected" : ""}
            href={`/guides?category=${category.id}`}
            key={category.id}
          >
            {category.label}
          </Link>
        ))}
      </nav>

      <section className="category-grid">
        {filteredCategories.map((category) => (
          <Link className="category-card" href={`/ask?q=${encodeURIComponent(category.label)}`} key={category.id}>
            <span aria-hidden="true">{category.icon}</span>
            <div>
              <h2>{category.label}</h2>
              <p>{category.sourceCoverage}</p>
              <small>{category.status === "active" ? "已有來源入口" : "排程回填中"}</small>
            </div>
          </Link>
        ))}
      </section>

      <section className="inner-section">
        <header className="panel-heading">
          <h2>近期內容</h2>
          <Link href="/sources">查看來源</Link>
        </header>
        <div className="article-list">
          {contentItems.map((item) => (
            <a href={item.sourceUrl} key={item.id} rel="noreferrer" target="_blank">
              <span className={`article-swatch art-${item.accent}`} />
              <div>
                <small>{item.category} · {item.updatedAt}</small>
                <strong>{item.title}</strong>
                <p>{item.summary}</p>
              </div>
              <b>查看攻略 ↗</b>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
