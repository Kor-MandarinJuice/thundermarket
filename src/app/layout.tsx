import type { Metadata } from "next";
import { Black_Han_Sans, Noto_Sans_KR } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/Header";

const blackHanSans = Black_Han_Sans({
  variable: "--font-black-han-sans",
  weight: "400",
  subsets: ["latin"],
});

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "천둥마켓 ⚡ 번개처럼 거래하라",
  description: "전설의 중고거래, 천둥마켓. 우리 동네 번개 거래 마켓.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${blackHanSans.variable} ${notoSansKr.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
