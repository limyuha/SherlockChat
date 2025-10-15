import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import BreakingNewsBar from "./components/BreakingNewsBar"; // 헤더라인

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "사건 리포터 AI",
  description: "공포 뉴스형 추리 챗봇",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {/* ✅ 헤드라인은 클라이언트 컴포넌트로 */}
        <BreakingNewsBar />

        {/* 본문 */}
        <main style={{ paddingTop: "40px" }}>{children}</main>
      </body>
    </html>
  );
}
