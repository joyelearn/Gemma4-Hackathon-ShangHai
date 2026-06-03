import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Anchoracle——与故人同行",
    template: "%s — Anchoracle",
  },
  description: "选择一座城市，与曾生活在那里的历史人物对话，获取景点来历、路线、门票与游览建议",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="min-h-full bg-stone-950 text-white">{children}</body>
    </html>
  );
}
