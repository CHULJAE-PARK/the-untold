import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "The Untold — 내가 몰랐던 그 사람의 이야기",
  description: "세상을 떠난 소중한 사람의 이야기를 기억하고, 나누는 공간입니다.",
  openGraph: {
    title: "The Untold",
    description: "세상을 떠난 소중한 사람의 이야기를 기억하고, 나누는 공간입니다.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900">
        {children}
      </body>
    </html>
  );
}
