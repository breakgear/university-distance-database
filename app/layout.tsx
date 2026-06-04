import type { Metadata } from "next";
import "./globals.css";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";

export const metadata: Metadata = {
  title: "大学長距離データベース",
  description: "男子大学長距離・男子大学駅伝を初心者にも見やすく整理する非公式UIプロトタイプ"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="font-sans antialiased">
        <Header />
        <main className="min-h-screen pb-24 md:pb-0">{children}</main>
        <Footer />
        <MobileNav />
      </body>
    </html>
  );
}
