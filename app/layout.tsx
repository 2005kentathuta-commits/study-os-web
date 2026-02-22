import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Study OS",
  description: "PDF要約と暗記カード学習をまとめる学習サイト",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
