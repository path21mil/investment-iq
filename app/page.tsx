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
      <main className="flex-grow flex flex-col items-center pt-16 md:pt-24 pb-20 px-6">
        
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
        <div className="w-full max-w-4xl mx-auto mb-28 relative px-2 md:px-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-blue-100 to-emerald-100 rounded-[2rem] md:rounded-[3rem] blur-xl opacity-60"></div>
          
          <div className="relative bg-white p-6 md:p-10 rounded-3xl border border-gray-200 shadow-2xl">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gray-900 text-white rounded-2xl flex items-center justify-center text-2xl font-extrabold shadow-inner shrink-0">A</div>
                <div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Apple Inc.</h2>
                  <p className="text-xs md:text-sm text-gray-500 font-bold uppercase tracking-wider">AAPL • Consumer Electronics</p>
                </div>
              </div>
              <div className="inline-flex px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl font-bold text-sm items-center justify-center gap-2 border border-emerald-100 self-start md:self-auto w-full md:w-auto">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-sm"></span>
                Thesis: Strengthening
              </div>
            </div>

            {/* Grid Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Business Quality</p>
                <p className="font-extrabold text-gray-900 flex items-center gap-2 text-lg">
                  <span className="text-amber-400 tracking-tighter">★★★★★</span> Excellent
                </p>
              </div>
              <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex flex-col justify-center">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Management</p>
                <p className="font-extrabold text-gray-900 flex items-center gap-2 text-lg">
                  <span className="text-amber-400 tracking-tighter">★★★★★</span> Trusted
                </p>
              </div>
            </div>

            {/* Updates Section */}
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4 border-b border-gray-100 pb-2">Latest Changes</p>
              <div className="space-y-3">
                <div className="flex items-start gap-4 bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-extrabold shrink-0 border border-blue-100">✓</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Services revenue accelerated</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Updated 2 days ago</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-extrabold shrink-0 border border-blue-100">✓</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Installed base reached new high</p>
                    <p className="text-xs text-gray-400 mt-1 font-medium">Updated after latest earnings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 5. THE STORY WORKFLOW (Clean Timeline) */}
        <div className="w-full max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-4">How Investment IQ Works</h2>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center relative px-6 md:px-0 gap-6 md:gap-4">
            
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center w-full md:w-1/4">
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">Research Company</h3>
              <p className="text-gray-500 text-sm font-medium">Analyze a business</p>
            </div>

            {/* Separator */}
            <ArrowRight className="hidden md:block w-6 h-6 text-blue-400 opacity-50 shrink-0" />
            <ArrowDown className="md:hidden w-5 h-5 text-blue-400 opacity-50 shrink-0" />

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center w-full md:w-1/4">
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">Build Thesis</h3>
              <p className="text-gray-500 text-sm font-medium">Record why you invested</p>
            </div>

            {/* Separator */}
            <ArrowRight className="hidden md:block w-6 h-6 text-blue-400 opacity-50 shrink-0" />
            <ArrowDown className="md:hidden w-5 h-5 text-blue-400 opacity-50 shrink-0" />

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center w-full md:w-1/4">
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">AI Monitors</h3>
              <p className="text-gray-500 text-sm font-medium">We monitor every report</p>
            </div>

            {/* Separator */}
            <ArrowRight className="hidden md:block w-6 h-6 text-blue-400 opacity-50 shrink-0" />
            <ArrowDown className="md:hidden w-5 h-5 text-blue-400 opacity-50 shrink-0" />

            {/* Step 4 */}
            <div className="flex flex-col items-center text-center w-full md:w-1/4">
              <h3 className="text-lg font-extrabold text-gray-900 mb-1">Track Conviction</h3>
              <p className="text-gray-500 text-sm font-medium">Know exactly when to sell</p>
            </div>

          </div>
        </div>

      </main>
      
      {/* 6. EXPANDED FOOTER */}
      <footer className="w-full border-t border-gray-200 pt-16 pb-8 bg-white mt-20">
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