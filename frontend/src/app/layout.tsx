import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Arena",
  description:
    "Arena is a fun, interactive tool to compare runtime and execution across different programming languages. Test your code and explore language performance.",
  keywords: [
    "programming languages",
    "code comparison",
    "performance testing",
    "runtime analysis",
    "developer tools",
  ],
  authors: [{ name: "Shivam Mittal" }, { name: "Abhishek Kumar" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
