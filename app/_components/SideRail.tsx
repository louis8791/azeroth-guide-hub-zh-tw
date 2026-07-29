import Link from "next/link";
import { classGuides } from "../../lib/catalog";

const latest = [
  ["12.0.7 版本資訊", "patches"],
  ["至暗之夜第 1 賽季", "weekly"],
  ["團隊副本攻略", "raid"],
  ["職業改動", "classes"],
] as const;

const tools = [
  ["大秘境路線", "routes"],
  ["團隊副本進度", "rankings"],
  ["天賦統計", "talents"],
  ["裝備比較", "gear"],
  ["職業排名", "rankings"],
  ["任務攻略", "quests"],
] as const;

export function SideRail() {
  return (
    <aside className="side-rail">
      <section>
        <h2>最新內容</h2>
        {latest.map(([label, id], index) => (
          <Link className={index === 0 ? "rail-active" : ""} href={`/guides?category=${id}`} key={label}>
            <span aria-hidden="true">{index === 0 ? "✦" : "◈"}</span>{label}
          </Link>
        ))}
      </section>

      <section>
        <h2>熱門工具</h2>
        {tools.map(([label, id]) => (
          <Link href={`/guides?category=${id}`} key={label}>
            <span aria-hidden="true">⌘</span>{label}
          </Link>
        ))}
      </section>

      <section>
        <h2>職業指南</h2>
        {classGuides.map(([name, short, color]) => (
          <Link href={`/guides?category=classes&q=${encodeURIComponent(name)}`} key={name}>
            <span className={`class-gem ${color}`} aria-hidden="true">{short}</span>{name}
          </Link>
        ))}
      </section>
    </aside>
  );
}
