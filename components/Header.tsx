'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Menu, X, ChevronDown } from 'lucide-react'; 

export default function Header() {
  // ✨ State to track if the mobile menu is open or closed
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="relative bg-white shadow-sm border-b border-slate-200 z-50">
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between">
        
        {/* 1. LOGO */}
        <div className="shrink-0">
          <Logo href="/dashboard" />
        </div>

        {/* 2. DESKTOP NAVIGATION (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-8 text-[14px] font-bold">
          <Link href="/dashboard" className="text-blue-600">Dashboard</Link>
          <Link href="/portfolio" className="text-slate-600 hover:text-slate-900 transition-colors">Portfolio</Link>
          <Link href="/watchlist" className="text-slate-600 hover:text-slate-900 transition-colors">Watchlist</Link>
        </div>

        {/* 3. DESKTOP PROFILE (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors">
          <span className="text-sm font-bold">Padam</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </div>

        {/* 4. MOBILE HAMBURGER BUTTON (Hidden on desktop) */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* 5. MOBILE MENU DROPDOWN */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-[64px] left-0 w-full bg-white border-b border-slate-200 shadow-xl py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
          <Link 
            href="/dashboard" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="text-blue-600 font-bold text-base"
          >
            Dashboard
          </Link>
          <Link 
            href="/portfolio" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="text-slate-600 hover:text-slate-900 font-bold text-base"
          >
            Portfolio
          </Link>
          <Link 
            href="/watchlist" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="text-slate-600 hover:text-slate-900 font-bold text-base"
          >
            Watchlist
          </Link>
          
          {/* Mobile Profile Section */}
          <div className="border-t border-slate-100 pt-4 mt-2 flex items-center justify-between">
            <span className="font-bold text-slate-900">Padam</span>
            <button className="text-xs text-slate-400 hover:text-rose-600 font-medium transition-colors">
              Log out
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}