import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Investment IQ",
  description: "Track your alpha, secure your theses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {/* GLOBAL ALPHA BANNER */}
        <div className="bg-[#FFFBEB] border-b border-amber-100/50 py-1.5 px-6 flex items-center justify-center gap-2 w-full z-[100] relative">
          <span className="text-amber-500 text-[9px] mt-[1px]">●</span>
          <p className="text-[11px] font-medium text-amber-900/60 text-center">
            Investment IQ is currently in Alpha. All thesis data is generated as a UI demonstration and does not reflect real financial data.
          </p>
        </div>
        
        {children}
        <footer className="text-center py-6 text-xs font-medium text-gray-400">
  &copy; {new Date().getFullYear()} Investment IQ. All rights reserved.
</footer>
      </body>
    </html>
  );
}