import Link from "next/link";
import { SideRail } from "./_components/SideRail";
import { SiteFooter } from "./_components/SiteFooter";
import {
  automaticSources,
  contentItems,
  quickLinks,
  sources,
} from "../lib/catalog";

const dungeonRows = [
  ["黑暗深淵", "28", "00:31:45", ["DK", "PA", "MA", "SH"]],
  ["破曉酒莊", "27", "00:28:17", ["WA", "PR", "HU", "RO"]],
  ["水閘行動", "27", "00:29:33", ["DR", "MO", "EV", "WL"]],
  ["懸石之巢", "26", "00:27:41", ["PA", "MA", "RO", "SH"]],
  ["暗焰裂口", "26", "00:32:08", ["DK", "PR", "HU", "WL"]],
] as const;

const rankingRows = [
  ["死亡騎士", "坦克", "2.38%", "class-red"],
  ["惡魔獵人", "近戰輸出", "2.27%", "class-purple"],
  ["法師", "遠程輸出", "2.21%", "class-blue"],
  ["喚能師", "遠程輸出", "2.05%", "class-cyan"],
  ["獵人", "遠程輸出", "1.92%", "class-green"],
] as const;

export const metadata = {
  title: "艾澤拉斯攻略站｜魔獸世界繁體中文攻略",
  description: "整合正式服職業、副本、大秘境、專業、收藏與台服常見問題。",
};

export default function Home() {
  return (
    <>
      <main className="portal-shell">
        <SideRail />

        <div className="portal-main">
          <section className="hero-row">
            <div className="hero-panel">
              <div className="hero-copy">
                <p>12.0.7 正式服</p>
                <h1>至暗之夜</h1>
                <h2>探索艾澤拉斯的最深處</h2>
                <Link href="/guides">查看完整攻略</Link>
              </div>
            </div>

            <aside className="quick-panel">
              <h2>快速連結</h2>
              <div className="quick-grid">
                {quickLinks.map(([label, icon, href]) => (
                  <Link href={href} key={label}>
                    <span aria-hidden="true">{icon}</span>
                    <strong>{label}</strong>
                  </Link>
                ))}
              </div>
            </aside>
          </section>

          <section className="content-panel news-panel">
            <header className="panel-heading">
              <h2>最新攻略與新聞</h2>
              <Link href="/guides">檢視所有攻略</Link>
            </header>
            <div className="news-grid">
              {contentItems.slice(0, 3).map((item) => (
                <a href={item.sourceUrl} key={item.id} rel="noreferrer" target="_blank">
                  <span className={`news-art art-${item.accent}`} aria-hidden="true" />
                  <span className="news-copy">
                    <small>{item.updatedAt}</small>
                    <strong>{item.title}</strong>
                    <p>{item.summary}</p>
                  </span>
                </a>
              ))}
            </div>
          </section>

          <section className="dashboard-grid">
            <div className="content-panel mythic-panel">
              <header className="panel-heading">
                <h2>大秘境計分器</h2>
                <Link href="/guides?category=routes">查看所有地城</Link>
              </header>
              <p className="panel-subtitle">至暗之夜 第 1 賽季</p>
              <div className="dungeon-table" role="table" aria-label="大秘境範例資料">
                <div className="table-head" role="row">
                  <span>地城</span><span>層級</span><span>時間</span><span>隊伍</span>
                </div>
                {dungeonRows.map(([name, level, time, team]) => (
                  <div className="table-row" role="row" key={name}>
                    <strong>{name}</strong>
                    <span className="gold">{level}</span>
                    <span>{time}</span>
                    <span className="team-icons">
                      {team.map((member) => <i key={member}>{member}</i>)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="content-panel raid-panel">
              <header className="panel-heading">
                <h2>團隊副本進度</h2>
                <Link href="/guides?category=raid">查看所有副本</Link>
              </header>
              <div className="raid-banner">
                <span>至暗王座</span>
              </div>
              <div className="progress-list">
                {[
                  ["普通", "100%", "8/8", "normal"],
                  ["英雄", "100%", "8/8", "heroic"],
                  ["傳奇", "25%", "2/8", "mythic"],
                  ["史詩", "0%", "0/8", "epic"],
                ].map(([label, width, count, tone]) => (
                  <div className="progress-row" key={label}>
                    <strong className={tone}>{label}</strong>
                    <span className="progress-track"><i style={{ width }} /></span>
                    <b>{count}</b>
                  </div>
                ))}
              </div>
            </div>

            <div className="content-panel ranking-panel">
              <header className="panel-heading">
                <h2>職業排名</h2>
                <Link href="/guides?category=rankings">檢視詳細排名</Link>
              </header>
              <p className="panel-subtitle">正式服 · 傳奇難度</p>
              <ol className="ranking-list">
                {rankingRows.map(([name, role, score, color], index) => (
                  <li key={name}>
                    <span>{index + 1}</span>
                    <i className={`class-gem ${color}`}>{name.slice(0, 1)}</i>
                    <strong>{name}</strong>
                    <small>{role}</small>
                    <b>{score}</b>
                  </li>
                ))}
              </ol>
              <p className="data-note">
                數據工具入口依來源條件顯示，不將熱門配置視為唯一答案。
              </p>
            </div>
          </section>

          <section className="content-panel coverage-strip">
            <div>
              <span>英文攻略來源</span>
              <strong>{sources.length}</strong>
            </div>
            <div>
              <span>定期檢查</span>
              <strong>{automaticSources.length}</strong>
            </div>
            <div>
              <span>攻略分類</span>
              <strong>30</strong>
            </div>
            <p>另有台服官方與巴哈問題雷達，用於術語校正和找出缺少的答案。</p>
            <Link href="/coverage">查看完整覆蓋比較 →</Link>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
