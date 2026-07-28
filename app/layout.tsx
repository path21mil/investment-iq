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
        <div className="bg-yellow-400 text-yellow-900 px-4 py-2.5 text-center text-xs sm:text-sm font-bold z-50 sticky top-0 border-b border-yellow-500 shadow-sm">
          🚧 Investment IQ is currently in Alpha. All thesis data is generated as a UI demonstration and does not reflect real financial data.
        </div>
        
        {children}
        <footer className="text-center py-6 text-xs font-medium text-gray-400">
  &copy; {new Date().getFullYear()} Investment IQ. All rights reserved.
</footer>
      </body>
    </html>
  );
}