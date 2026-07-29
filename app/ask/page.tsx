import { Suspense } from "react";
import { AskClient } from "../_components/AskClient";

export const metadata = {
  title: "搜尋攻略",
  description: "從攻略分類、近期內容與來源網站中找答案。",
};

export default function AskPage() {
  return (
    <Suspense fallback={<main className="inner-page ask-page" />}>
      <AskClient />
    </Suspense>
  );
}
