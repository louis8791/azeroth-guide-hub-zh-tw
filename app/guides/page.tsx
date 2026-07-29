import { Suspense } from "react";
import { GuidesClient } from "../_components/GuidesClient";

export const metadata = {
  title: "攻略庫",
  description: "正式服攻略分類、最新內容與專門工具入口。",
};

export default function GuidesPage() {
  return (
    <Suspense fallback={<main className="inner-page" />}>
      <GuidesClient />
    </Suspense>
  );
}
