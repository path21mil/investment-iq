'use client';

import { useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { Menu, X, ChevronDown } from 'lucide-react'; 
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Adjust this path if your supabase client is located elsewhere!

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  
  // ✨ NEW: Initialize router
  const router = useRouter();

  // ✨ NEW: The logout execution function
  const handleLogout = async () => {
    setIsProfileOpen(false);
    setIsMobileMenuOpen(false);
    
    await supabase.auth.signOut();
    
    router.push('/login');
    router.refresh(); 
  };

  return (
    // Changed to a sticky header to contain everything safely
    <header className="sticky top-0 w-full z-50">
      
      {/* TOP NAVBAR (Solid white, explicitly sitting ABOVE the blur) */}
      <div className="relative z-50 bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          
          {/* 1. LOGO */}
          <div className="shrink-0">
            <Logo href="/dashboard" />
          </div>

          {/* 2. DESKTOP NAVIGATION */}
          <div className="hidden md:flex items-center gap-8 text-[14px] font-bold">
            <Link href="/dashboard" className="text-blue-600">Dashboard</Link>
            <Link href="/portfolio" className="text-slate-600 hover:text-slate-900 transition-colors">Portfolio</Link>
            <Link href="/watchlist" className="text-slate-600 hover:text-slate-900 transition-colors">Watchlist</Link>
          </div>

          {/* 3. DESKTOP PROFILE W/ DROPDOWN */}
          <div className="hidden md:block relative">
            <button 
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="flex items-center gap-1.5 cursor-pointer text-slate-700 hover:text-slate-900 transition-colors"
            >
              <span className="text-sm font-bold">Padam</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Desktop Dropdown */}
            {isProfileOpen && (
              <div className="absolute right-0 top-[calc(100%+12px)] w-48 bg-white border border-slate-200 shadow-xl rounded-2xl py-2 flex flex-col z-50 animate-in fade-in zoom-in-95 duration-100">
                <button 
                  onClick={() => setIsProfileOpen(false)}
                  className="text-left px-4 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Settings
                </button>
                <div className="h-px w-full bg-slate-100 my-1" />
                {/* ✨ NEW: Wired up the desktop logout button */}
                <button 
                  onClick={handleLogout}
                  className="text-left px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Log out
                </button>
              </div>
            )}
          </div>

          {/* 4. MOBILE HAMBURGER BUTTON */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* 5. MOBILE MENU DROPDOWN & OVERLAY */}
      {isMobileMenuOpen && (
        <>
          {/* Mobile Overlay (Now locked UNDER the white navbar) */}
          <div 
            className="md:hidden fixed inset-0 top-16 bg-slate-900/20 backdrop-blur-sm z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          
          {/* Mobile Menu Content */}
          <div className="md:hidden absolute top-16 left-0 w-full bg-white border-b border-slate-200 shadow-xl py-6 px-6 flex flex-col gap-5 z-50 animate-in slide-in-from-top-2 duration-200">
            <Link 
              href="/dashboard" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-slate-700 hover:text-slate-900 font-bold text-[16px]"
            >
              Dashboard
            </Link>
            <Link 
              href="/portfolio" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-slate-700 hover:text-slate-900 font-bold text-[16px]"
            >
              Portfolio
            </Link>
            <Link 
              href="/watchlist" 
              onClick={() => setIsMobileMenuOpen(false)} 
              className="text-slate-700 hover:text-slate-900 font-bold text-[16px]"
            >
              Watchlist
            </Link>
            
            {/* Mobile Profile Section */}
            <div className="border-t border-slate-100 pt-5 mt-1 flex items-center justify-between">
              <span className="font-bold text-slate-900 text-[16px]">Padam</span>
              {/* ✨ NEW: Wired up the mobile logout button */}
              <button 
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-rose-600 font-bold transition-colors cursor-pointer"
              >
                Log out
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
}