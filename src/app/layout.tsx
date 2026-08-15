import type { Metadata } from "next";
import { Work_Sans, Inter } from "next/font/google";
import "./globals.css";
import { UserStoreProvider } from "@/providers/user-store-provider";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["400", "600", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jastip - Platform Jasa Titip Beli Luar Negeri Terpercaya",
  description: "Beli dan titip barang impian dari luar negeri dengan mudah, aman, dan transparan bersama traveler.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="id"
      className={`${workSans.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#e9ebe6] text-slate-900 font-sans selection:bg-brand-green selection:text-white">
        <UserStoreProvider>
          {children}
        </UserStoreProvider>
      </body>
    </html>
  );
}
