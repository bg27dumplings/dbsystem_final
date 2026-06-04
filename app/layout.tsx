import type { Metadata } from "next";
import "./globals.css";
import { ResponsiveShell } from "@/components/responsive-shell";

export const metadata: Metadata = {
  title: "智慧校園二手共享",
  description: "學生手機優先的校園二手物資共享平台"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-Hant">
      <body>
        <ResponsiveShell>{children}</ResponsiveShell>
      </body>
    </html>
  );
}
