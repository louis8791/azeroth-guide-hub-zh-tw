import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        <strong>艾澤拉斯攻略站</strong>
        <span>非官方玩家製作網站，與 Blizzard Entertainment 無關。</span>
      </div>
      <nav aria-label="頁尾導覽">
        <Link href="/sources">資料來源</Link>
        <Link href="/coverage">攻略覆蓋</Link>
        <Link href="/ask">問題搜尋</Link>
      </nav>
    </footer>
  );
}
