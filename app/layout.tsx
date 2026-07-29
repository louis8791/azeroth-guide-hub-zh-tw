import type { Metadata } from "next";
import { SiteHeader } from "./_components/SiteHeader";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: "艾澤拉斯攻略站",
    template: "%s｜艾澤拉斯攻略站",
  },
  description: "面向台服玩家的《魔獸世界》正式服繁體中文攻略入口。",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "艾澤拉斯攻略站",
    description: "正式服繁體中文攻略",
    images: ["/og.png"],
    locale: "zh_TW",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "艾澤拉斯攻略站",
    description: "正式服繁體中文攻略",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant-TW">
      <body>
        <SiteHeader />
        {children}
      </body>
    </html>
  );
}
