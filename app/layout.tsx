import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "B2B\u5e93\u5b58\u5206\u914d",
  description: "B2B \u5e93\u5b58\u5206\u914d\u5e73\u53f0"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
