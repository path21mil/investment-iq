import type { Metadata } from "next";
import { Inter, Geist } from "next/font/google";
import "./globals.css";
import { GlobalAuthModal } from "@/components/GlobalAuthModal";
import AlphaTestingModal from "@/components/AlphaTestingModal";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className={inter.className}>
        {/* NEW GLOBAL ALPHA TESTING MODAL */}
        <AlphaTestingModal />
        
        {children}
        
        <footer className="text-center py-6 text-xs font-medium text-gray-400">
          &copy; {new Date().getFullYear()} Investment IQ. All rights reserved.
        </footer>

        {/* GLOBAL AUTH MODAL */}
        <GlobalAuthModal />
      </body>
    </html>
  );
}