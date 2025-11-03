import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import BreakingNewsBar from "./components/BreakingNewsBar";
import { CaseProvider } from "./context/CaseContext";

export const metadata: Metadata = {
  title: "사건 리포터 AI",
  description: "공포 뉴스형 추리 챗봇",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <CaseProvider>
          <Suspense fallback={<div className="breaking-news-bar">Loading Breaking News...</div>}>
            <BreakingNewsBar />
          </Suspense>
          <main style={{ paddingTop: "40px" }}>{children}</main>
        </CaseProvider>
      </body>
    </html>
  );
}
