'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [placeholderText, setPlaceholderText] = useState('Search company or ticker...');
  const router = useRouter();

  // Rotating placeholder animation
  useEffect(() => {
    const tickers = ['NVDA', 'META', 'GOOG', 'TSLA', 'AMZN'];
    let i = 0;
    const interval = setInterval(() => {
      setPlaceholderText(`Search ${tickers[i]}...`);
      i = (i + 1) % tickers.length;
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = searchQuery.trim().toUpperCase();
    if (!ticker) return;
    router.push(`/company/${ticker}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white font-sans text-gray-900 selection:bg-blue-600 selection:text-white overflow-hidden">
      
      {/* Navigation */}
      <nav className="max-w-7xl w-full mx-auto px-6 py-6 flex justify-between items-center relative z-10">
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <span className="text-xl font-extrabold tracking-tight text-gray-900">Investment IQ</span>
          <div className="flex gap-1 items-end h-6">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full group-hover:h-4 transition-all duration-300"></span>
            <span className="w-1.5 h-5 bg-blue-600 rounded-full group-hover:h-6 transition-all duration-300"></span>
            <span className="w-1.5 h-7 bg-blue-600 rounded-full"></span>
          </div>
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
            Sign In
          </Link>
          <Link href="/login" className="bg-gray-900 text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            Get Started Free
          </Link>
        </div>
      </nav>

      {/* Hero Section (Tightened Bottom Padding) */}
      <main className="max-w-7xl mx-auto px-6 pt-12 pb-12 lg:pt-16 lg:pb-16 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Copy & Search */}
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              Built for Long-Term Investors
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-6">
              Understand Businesses. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Build Conviction.
              </span>
            </h1>
            
            <p className="text-lg text-gray-500 font-medium mb-10 leading-relaxed max-w-lg">
              Everything you need to understand a business, build conviction, and track your investment thesis over time.
            </p>

            {/* Interactive Search Product Lead */}
            <div className="bg-white p-2 rounded-3xl shadow-xl border border-gray-100 mb-4 relative z-20 transition-all focus-within:ring-4 focus-within:ring-blue-50">
              <form onSubmit={handleSearch} className="relative flex items-center">
                <div className="pl-4 pr-2 text-gray-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={placeholderText}
                  className="w-full bg-transparent py-4 text-gray-900 text-lg font-medium placeholder-gray-400 focus:outline-none transition-all"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl transition-all shadow-md whitespace-nowrap cursor-pointer"
                >
                  Start Research
                </button>
              </form>
            </div>

            {/* Trending Tags & Credibility Subtext */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="text-gray-400 font-medium text-xs uppercase tracking-wider">Trending:</span>
                {['NVDA', 'AAPL', 'MSFT', 'TSLA'].map((t) => (
                  <button
                    key={t}
                    onClick={() => router.push(`/company/${t}`)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold px-4 py-1.5 rounded-full transition-colors cursor-pointer"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                Built on earnings calls, SEC filings, and business fundamentals.
              </p>
            </div>
          </div>

          {/* Right Column: Visual Mockup (The "Magic") */}
          <div className="relative hidden lg:block perspective-1000">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
            <div className="absolute top-1/4 right-1/4 w-72 h-72 bg-indigo-400/20 rounded-full blur-3xl"></div>

            <div className="relative bg-white/80 backdrop-blur-xl border border-gray-200 p-8 rounded-3xl shadow-2xl transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-700">
              
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-inner">
                    A
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-900 text-xl">Apple Inc.</h3>
                    <p className="text-sm text-gray-500 font-medium">AAPL • Consumer Electronics</p>
                  </div>
                </div>
                <div className="bg-blue-50 border border-blue-200 text-blue-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Tracking Thesis
                </div>
              </div>

              {/* 2x2 Grid for Metrics */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Business Quality</p>
                  <p className="text-yellow-500 font-bold tracking-widest text-sm">
                    ★★★★★ <span className="text-gray-900 font-extrabold text-xs tracking-normal ml-0.5">Excellent</span>
                  </p>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Management</p>
                  <p className="text-yellow-500 font-bold tracking-widest text-sm">
                    ★★★★★ <span className="text-gray-900 font-extrabold text-xs tracking-normal ml-0.5">Trusted</span>
                  </p>
                </div>
                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Valuation</p>
                  <p className="text-gray-900 font-extrabold text-sm">Fair</p>
                </div>
                <div className="bg-green-50/50 p-3.5 rounded-2xl border border-green-200 shadow-sm ring-1 ring-green-50">
                  <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider mb-1">Investment Thesis</p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🟢</span>
                    <p className="text-green-800 font-extrabold text-sm">Strengthening</p>
                  </div>
                </div>
              </div>

              {/* Story-driven Earnings Updates */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2">Last Earnings Update</h4>
                
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-blue-100 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">✓</div>
                    <div>
                      <span className="font-semibold text-sm text-gray-800">Services revenue accelerated</span>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Updated 2 days ago</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm transition-all hover:border-blue-100 hover:shadow-md">
                  <div className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-[10px] mt-0.5 shrink-0">✓</div>
                    <div>
                      <span className="font-semibold text-sm text-gray-800">Installed base reached new high</span>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Updated after latest earnings</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}