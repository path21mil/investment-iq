'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, ArrowRight, ArrowDown } from 'lucide-react';

// Pool of tickers to randomly cycle through
const TICKER_POOL = ['NVDA', 'MSFT', 'TSLA', 'COST', 'AAPL', 'AMZN', 'GOOGL', 'META', 'NFLX', 'CRM', 'PLTR', 'AMD'];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animation & Dynamic States
  const [isSearching, setIsSearching] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [popularSearches, setPopularSearches] = useState<string[]>(['NVDA', 'MSFT', 'TSLA', 'COST']);

  // Rotate popular searches every 5 seconds for a dynamic feel
  useEffect(() => {
    // Initial shuffle on mount to prevent hydration errors
    setPopularSearches([...TICKER_POOL].sort(() => 0.5 - Math.random()).slice(0, 4));

    const interval = setInterval(() => {
      setPopularSearches([...TICKER_POOL].sort(() => 0.5 - Math.random()).slice(0, 4));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const loadingSteps = [
    "Reading latest 10-Q...",
    "Analyzing earnings call...",
    "Comparing to previous quarter...",
    "Generating research..."
  ];

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setIsSearching(true);
      
      // Simulate the AI "thinking" for a premium feel
      for (let i = 0; i < loadingSteps.length; i++) {
        setLoadingText(loadingSteps[i]);
        await new Promise(r => setTimeout(r, 600)); // 600ms per step
      }
      
      router.push(`/company/${searchQuery.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* 1. TOP NAVIGATION */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-2">
            Investment IQ
            <span className="flex gap-0.5">
              <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            </span>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-xl transition-colors shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <main className="flex-grow flex flex-col items-center pt-16 md:pt-24 pb-10 px-6">
        
        {/* The Hook & The Who */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
            Don't just buy stocks. <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Track your conviction.</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-900 font-bold mb-3">
            Built for long-term investors who buy businesses—not charts.
          </p>
          <p className="text-base md:text-lg text-gray-500 font-medium leading-relaxed px-4 md:px-0">
            Investment IQ helps you understand great businesses, build your investment thesis, record why you invested, and use AI to identify what has changed since you invested.
          </p>
        </div>

        {/* The Contextual Search Bar with Animation (Removed text above it) */}
        <div className="w-full max-w-2xl mx-auto mb-12 relative z-10">
          <form onSubmit={handleSearch} className="relative group mt-4">
            <div className="absolute inset-y-0 left-0 pl-4 md:pl-5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Search className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isSearching}
              placeholder="Search company or ticker (e.g. Apple or AAPL)"
              className="w-full bg-white border-2 border-gray-200 rounded-2xl py-4 md:py-5 pl-12 md:pl-14 pr-[130px] md:pr-[180px] text-gray-900 text-base md:text-lg font-bold placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-lg hover:shadow-xl disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-2 md:right-3 top-2 md:top-3 bottom-2 md:bottom-3 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 text-white font-bold px-4 md:px-6 rounded-xl transition-all cursor-pointer text-sm md:text-base whitespace-nowrap flex items-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing
                </>
              ) : (
                'Start Research'
              )}
            </button>
          </form>

          {/* Dynamic Loading Text OR Suggested Tags */}
          <div className="mt-6 h-8 flex items-center justify-center">
            {isSearching ? (
              <span className="text-sm font-bold text-blue-600 animate-pulse bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                {loadingText}
              </span>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs md:text-sm font-medium text-gray-400 transition-opacity duration-500">
                <span className="hidden sm:inline font-bold text-gray-500">Popular Searches:</span>
                {popularSearches.map(t => (
                  <button key={t} onClick={() => router.push(`/company/${t}`)} className="bg-white border border-gray-200 px-3 py-1 rounded-lg hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer">
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* The Credibility Strip (Now styled as a full-width banner) */}
       {/* The Credibility Strip (Floating Pill Design) */}
        <div className="w-full mt-12 mb-32 relative z-10 flex flex-col items-center px-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-5">
            Research powered by primary sources
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
            <div className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-full text-xs md:text-sm font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:shadow-md transition-all cursor-default flex items-center gap-2">
              <span className="text-gray-300">✓</span> SEC Filings
            </div>
            <div className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-full text-xs md:text-sm font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:shadow-md transition-all cursor-default flex items-center gap-2">
              <span className="text-gray-300">✓</span> Earnings Reports
            </div>
            <div className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-full text-xs md:text-sm font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:shadow-md transition-all cursor-default flex items-center gap-2">
              <span className="text-gray-300">✓</span> Financial Statements
            </div>
            <div className="bg-white border border-gray-200 shadow-sm px-4 py-2 rounded-full text-xs md:text-sm font-bold text-gray-600 hover:border-blue-200 hover:text-blue-600 hover:shadow-md transition-all cursor-default flex items-center gap-2">
              <span className="text-gray-300">✓</span> Management Commentary
            </div>
          </div>
        </div>

        {/* 3. THE "WHY" (The Pain Points) */}
        <div className="w-full max-w-5xl mx-auto mb-20 relative z-10">
          
          {/* New Punchy Header with massive breathing room */}
          <div className="text-center mb-14 px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">Never lose track of why you invested</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col text-center items-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl mb-4">🧠</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Remember Why You Invested</h3>
              <p className="text-gray-500 text-sm font-medium">Record exactly why you bought a stock. Never panic sell because of short-term price moves.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col text-center items-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center text-xl mb-4">🤖</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">AI Monitors Every Update</h3>
              <p className="text-gray-500 text-sm font-medium">Investment IQ reads every earnings report, SEC filing, and management commentary while you sleep.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col text-center items-center hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl mb-4">📈</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Know When Your Thesis Changes</h3>
              <p className="text-gray-500 text-sm font-medium">See instantly whether your original reasons for investing are fundamentally strengthening or breaking.</p>
            </div>
          </div>
        </div>

  {/* 4. THE VISUAL PROOF (Apple Card Preview) */}
        <div className="w-full max-w-4xl mx-auto mb-10 relative px-4 md:px-0 z-10">
          
          {/* Enhanced Decorative Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-200 via-indigo-100 to-emerald-100 rounded-[2.5rem] md:rounded-[3.5rem] blur-3xl opacity-60 mix-blend-multiply"></div>

          {/* Card Container with subtle glass-morphism */}
          <div className="relative bg-white/95 backdrop-blur-xl p-6 md:p-10 rounded-3xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col gap-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-8">
              <div className="flex items-center gap-4">
                {/* SVG Apple Logo (Will never break on Windows) */}
                <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-gray-900/20 shrink-0">
                  <svg viewBox="0 0 384 512" className="w-6 h-6 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"></path>
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Apple Inc.</h2>
                  <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider">AAPL • Consumer Electronics</p>
                </div>
              </div>
              <div className="inline-flex px-4 py-2 bg-emerald-50/80 text-emerald-700 rounded-xl font-bold text-sm items-center justify-center gap-2 border border-emerald-100 w-full md:w-auto shadow-sm">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
                Thesis: Strengthening
              </div>
            </div>

            {/* Stats 2x2 Grid */}
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              <div className="bg-gradient-to-b from-gray-50 to-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Business Quality</p>
                <p className="font-extrabold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Excellent
                </p>
              </div>
              <div className="bg-gradient-to-b from-gray-50 to-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Management</p>
                <p className="font-extrabold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Trusted
                </p>
              </div>
              <div className="bg-gradient-to-b from-gray-50 to-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Valuation</p>
                <p className="font-extrabold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span> Premium
                </p>
              </div>
              <div className="bg-gradient-to-b from-gray-50 to-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Understandability</p>
                <p className="font-extrabold text-gray-900 flex items-center gap-2 text-sm md:text-base">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span> Easy
                </p>
              </div>
            </div>

            {/* Latest Changes List */}
            <div>
              <p className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">Latest Changes</p>
              <div className="flex flex-col gap-3">
                
                {/* Positive Item 1 */}
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-4 rounded-xl border bg-white border-gray-100 transition-all hover:shadow-md hover:border-blue-100 cursor-default">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors">Services revenue accelerated</p>
                      <p className="text-xs font-medium text-gray-500">Supports long-term growth.</p>
                    </div>
                  </div>
                  <span className="text-[11px] italic text-gray-400 pl-5 sm:pl-0 whitespace-nowrap">Updated 2 days ago</span>
                </div>

                {/* Positive Item 2 */}
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-4 rounded-xl border bg-white border-gray-100 transition-all hover:shadow-md hover:border-blue-100 cursor-default">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors">Installed base reached new high</p>
                      <p className="text-xs font-medium text-gray-500">Strengthens ecosystem moat.</p>
                    </div>
                  </div>
                  <span className="text-[11px] italic text-gray-400 pl-5 sm:pl-0 whitespace-nowrap">Updated 5 days ago</span>
                </div>

                {/* Positive Item 3 */}
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-4 rounded-xl border bg-white border-gray-100 transition-all hover:shadow-md hover:border-blue-100 cursor-default">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-0.5 group-hover:text-blue-600 transition-colors">Share buybacks continued</p>
                      <p className="text-xs font-medium text-gray-500">Management allocating capital well.</p>
                    </div>
                  </div>
                  <span className="text-[11px] italic text-gray-400 pl-5 sm:pl-0 whitespace-nowrap">Updated 1 week ago</span>
                </div>

                {/* Warning Item */}
                <div className="group flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 p-4 rounded-xl border bg-gradient-to-r from-amber-50/50 to-white border-amber-100/80 transition-all hover:shadow-md hover:border-amber-300 cursor-default">
                  <div className="flex items-start gap-3">
                    <div className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] group-hover:animate-pulse"></div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-0.5 group-hover:text-amber-700 transition-colors">China demand remains soft</p>
                      <p className="text-xs font-medium text-amber-700/70">Worth monitoring next earnings.</p>
                    </div>
                  </div>
                  <span className="text-[11px] italic text-gray-400 pl-5 sm:pl-0 whitespace-nowrap">Updated 1 week ago</span>
                </div>

              </div>
            </div>

            {/* Footer Button */}
            <button onClick={() => router.push('/company/AAPL')} className="w-full bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_8px_20px_rgb(0,0,0,0.12)] hover:shadow-[0_8px_25px_rgb(0,0,0,0.2)] group mt-2 border border-gray-800">
              Research Snapshot <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

          </div>
        </div>

        
      </main>
      
      {/* 6. EXPANDED FOOTER */}
      <footer className="w-full border-t border-gray-200 pt-16 pb-8 bg-white">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-sm">
          <div className="col-span-1 md:col-span-2">
            <div className="font-extrabold text-xl text-gray-900 flex items-center gap-2 mb-4">
              Investment IQ
              <span className="flex gap-0.5 opacity-50">
                <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
                <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              </span>
            </div>
            <p className="text-gray-500 font-medium max-w-sm">
              The AI-powered journal for long-term investors. Track your conviction, not just price charts.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-3 text-gray-500 font-medium">
              <li><button className="hover:text-blue-600 transition-colors">Research</button></li>
              <li><button className="hover:text-blue-600 transition-colors">Pricing</button></li>
              <li><button className="hover:text-blue-600 transition-colors">About</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 mb-4">Legal & Social</h4>
            <ul className="space-y-3 text-gray-500 font-medium">
              <li><button className="hover:text-blue-600 transition-colors">Privacy Policy</button></li>
              <li><button className="hover:text-blue-600 transition-colors">Terms of Service</button></li>
              <li><button className="hover:text-blue-600 transition-colors">Twitter / X</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-8 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-gray-400">© {new Date().getFullYear()} Investment IQ. For educational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}