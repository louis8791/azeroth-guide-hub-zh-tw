import Link from "next/link";

const navItems = [
  ["新聞", "/guides?category=news"],
  ["攻略庫", "/guides"],
  ["來源", "/sources"],
  ["職業", "/guides?category=classes"],
  ["天賦", "/guides?category=talents"],
  ["PvP", "/guides?category=pvp"],
  ["團隊副本", "/guides?category=raid"],
  ["地下城", "/guides?category=dungeons"],
  ["大秘境", "/guides?category=routes"],
  ["任務", "/guides?category=quests"],
  ["收藏", "/guides?category=mounts"],
  ["插件", "/guides?category=addons"],
  ["覆蓋比較", "/coverage"],
] as const;

export function SiteHeader() {
  const basePath = process.env.GITHUB_PAGES === "true"
    ? "/azeroth-guide-hub-zh-tw"
    : "";

  return (
    <header className="site-header">
      <div className="topbar">
        <Link className="brand" href="/">
          <span className="brand-rune" aria-hidden="true">✦</span>
          <span>
            <strong>艾澤拉斯攻略站</strong>
            <small>繁體中文</small>
          </span>
        </Link>

        <div className="mode-tabs" aria-label="遊戲版本">
          <span className="mode-active">正式服</span>
          <span>經典版</span>
          <span>探索賽季</span>
        </div>

        <form action={`${basePath}/ask`} className="global-search">
          <span aria-hidden="true">⌕</span>
          <input
            aria-label="搜尋攻略"
            name="q"
            placeholder="搜尋攻略、職業、副本或任務…"
            type="search"
          />
        </form>

        <Link className="login-link" href="/ask">問攻略</Link>
      </div>

      <nav className="main-nav" aria-label="主要導覽">
        {navItems.map(([label, href]) => (
          <Link href={href} key={label}>{label}</Link>
        ))}
      </nav>
    </header>
  );
}
