'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, ArrowRight, Star, ShieldCheck, Activity, BookOpen, Circle } from 'lucide-react';
import { searchCompanies } from '@/lib/fmp'; // <-- NEW: Importing our API logic!

// Pool of tickers to randomly cycle through
const TICKER_POOL = ['NVDA', 'MSFT', 'TSLA', 'COST', 'AAPL', 'AMZN', 'GOOGL', 'META', 'NFLX', 'CRM', 'PLTR', 'AMD', 'AAOI'];

// Mock dataset for the interactive landing page pills
const DEMO_COMPANIES = {
  AAPL: {
    name: 'Apple Inc.',
    ticker: 'AAPL',
    sector: 'Consumer Electronics',
    thesis: 'Strengthening',
    thesisColor: 'emerald',
    overallAssessment: 'Apple remains a high-quality business with a durable ecosystem, strong capital allocation, and resilient cash generation.',
    pillars: { quality: 'Excellent', management: 'Trusted', valuation: 'Premium', understandability: 'Easy' },
    changes: [
      { text: 'Services revenue accelerated', sub: 'Supports long-term margin expansion.', status: 'positive' },
      { text: 'Installed base reached a new high', sub: 'Strengthens ecosystem moat.', status: 'positive' },
      { text: 'China demand remains soft', sub: 'Worth monitoring next quarter.', status: 'warning' },
    ]
  },
  NVDA: {
    name: 'NVIDIA Corp.',
    ticker: 'NVDA',
    sector: 'Semiconductors',
    thesis: 'Strengthening',
    thesisColor: 'emerald',
    overallAssessment: 'NVIDIA maintains an unparalleled moat in AI hardware, backed by accelerating hyperscaler capex and flawless execution.',
    pillars: { quality: 'Exceptional', management: 'Visionary', valuation: 'High', understandability: 'Moderate' },
    changes: [
      { text: 'Data Center revenue up 112% YoY', sub: 'Hyperscale demand remains unsated.', status: 'positive' },
      { text: 'Blackwell architecture shipping at scale', sub: 'Secures 2-year technical lead.', status: 'positive' },
      { text: 'Export restriction risks elevated', sub: 'Potential headwinds in restricted regions.', status: 'warning' },
    ]
  },
  AAOI: {
    name: 'Applied Optoelectronics',
    ticker: 'AAOI',
    sector: 'Optical Networking',
    thesis: 'Strengthening',
    thesisColor: 'emerald',
    overallAssessment: 'AAOI’s turnaround thesis is rapidly strengthening. The company successfully executed its AI-driven 800G transition and achieved a pivotal return to non-GAAP profitability. While demand will outpace supply through mid-2027, management is aggressively mitigating this by scaling in-house manufacturing capacity to 650,000 units per month.',
    pillars: { quality: 'Improving', management: 'Executing', valuation: 'Fair', understandability: 'Complex' },
    changes: [
      { text: 'Record revenue and return to profitability', sub: 'Q2 revenue hit $191.9M with $5.5M non-GAAP net income.', status: 'positive' },
      { text: '800G transceiver volume doubled sequentially', sub: 'AI infrastructure demand remains robust.', status: 'positive' },
      { text: 'Q3 forward guidance significantly raised', sub: 'Projecting $255M–$290M revenue.', status: 'positive' },
      { text: 'Production capacity remains a bottleneck', sub: 'Scaling internal capacity to 650k units/mo to meet demand.', status: 'warning' },
    ]
  }
};

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Animation & Dynamic States
  const [isSearching, setIsSearching] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [popularSearches, setPopularSearches] = useState<string[]>(['NVDA', 'AAOI', 'AAPL', 'MSFT']);
  
  // State for the interactive concept card
  const [selectedTicker, setSelectedTicker] = useState<keyof typeof DEMO_COMPANIES>('AAOI');
  const activeData = DEMO_COMPANIES[selectedTicker];

  // --- NEW: Live FMP API Search States ---
  const [liveResults, setLiveResults] = useState<any[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Rotate popular searches every 5 seconds
  useEffect(() => {
    setPopularSearches([...TICKER_POOL].sort(() => 0.5 - Math.random()).slice(0, 4));
    const interval = setInterval(() => {
      setPopularSearches([...TICKER_POOL].sort(() => 0.5 - Math.random()).slice(0, 4));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

 // --- NEW: Debounced Live API Search (CRASH-PROOFED) ---
  useEffect(() => {
    const fetchResults = async () => {
      if (searchQuery.trim().length >= 2) {
        try {
          const results = await searchCompanies(searchQuery);
          console.log("🔥 LIVE DATA FROM FMP API:", results);
          
          // THE FIX: Only filter if the API successfully returned an Array
          if (Array.isArray(results)) {
            const filtered = results
              .filter((r: any) => ['NASDAQ', 'NYSE', 'AMEX'].includes(r.exchangeShortName))
              .slice(0, 5);
            
            setLiveResults(filtered);
            setIsDropdownOpen(filtered.length > 0);
          } else {
            // If the API returns an error object (like rate limits), silently ignore it
            console.warn("FMP API returned a non-array:", results);
            setLiveResults([]);
            setIsDropdownOpen(false);
          }
        } catch (error) {
          setLiveResults([]);
          setIsDropdownOpen(false);
        }
      } else {
        setLiveResults([]);
        setIsDropdownOpen(false);
      }
    };

    // Wait 300ms after the user stops typing before calling the API
    const debounceTimer = setTimeout(fetchResults, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);




  // Close dropdown if user clicks outside of the search box
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadingSteps = [
    "Reading latest 10-Q...",
    "Analyzing earnings call...",
    "Comparing to previous quarter...",
    "Generating research..."
  ];

  const handleSearch = async (e?: React.FormEvent, forceTicker?: string) => {
    if (e) e.preventDefault();
    const finalQuery = forceTicker || searchQuery.trim();
    
    if (finalQuery) {
      setIsDropdownOpen(false); // Close dropdown when submitting
      setIsSearching(true);
      
      for (let i = 0; i < loadingSteps.length; i++) {
        setLoadingText(loadingSteps[i]);
        await new Promise(r => setTimeout(r, 600)); 
      }
      
      router.push(`/company/${finalQuery.toUpperCase()}`);
    }
  };

  const getBadgeStyles = (color: string) => {
    if (color === 'blue') return 'bg-blue-50 border-blue-200/60 text-blue-800';
    return 'bg-emerald-50 border-emerald-200/60 text-emerald-800';
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans overflow-x-hidden">
      
      {/* 1. TOP NAVIGATION */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-2">
            Investment IQ
            <span className="flex gap-0.5">
              <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            </span>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link href="/login" className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold px-4 md:px-5 py-2 md:py-2.5 rounded-xl transition-colors shadow-sm">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <main className="flex-grow flex flex-col items-center pt-16 md:pt-24 pb-10 px-6 relative">
        
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-100/40 rounded-full blur-[100px] pointer-events-none -z-10"></div>

        {/* The Hook & The Who */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
            Don't just buy stocks. <br className="hidden md:block"/> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Track your conviction.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-900 font-bold mb-3">
            Built for long-term investors who buy businesses—not charts.
          </p>
          <p className="text-base md:text-lg text-slate-500 font-medium leading-relaxed px-4 md:px-0 max-w-2xl mx-auto">
            Investment IQ helps you understand great businesses, build your investment thesis, record why you invested, and use AI to identify what has changed since you invested.
          </p>
        </div>

        {/* The Contextual Search Bar */}
        <div className="w-full max-w-2xl mx-auto mb-12 relative z-20" ref={searchContainerRef}>
          <form onSubmit={handleSearch} className="relative group mt-4">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <Search className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (liveResults.length > 0) setIsDropdownOpen(true); }}
              disabled={isSearching}
              placeholder="Search company or ticker (e.g. Apple or AAPL)"
              className="w-full bg-white border-2 border-slate-200/80 rounded-2xl py-4 md:py-5 pl-14 pr-[130px] md:pr-[180px] text-slate-900 text-base md:text-lg font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] disabled:bg-slate-50 disabled:text-slate-400"
            />
            <button 
              type="submit"
              disabled={isSearching}
              className="absolute right-2 md:right-3 top-2 md:top-3 bottom-2 md:bottom-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold px-4 md:px-6 rounded-xl transition-all cursor-pointer text-sm md:text-base whitespace-nowrap flex items-center gap-2 shadow-sm"
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

            {/* --- NEW: LIVE SEARCH DROPDOWN --- */}
            {isDropdownOpen && liveResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] overflow-hidden z-50">
                {liveResults.map((result) => (
                  <button
                    key={result.symbol}
                    type="button"
                    onClick={() => {
                      setSearchQuery(result.symbol);
                      handleSearch(undefined, result.symbol); // Instantly analyze when they click!
                    }}
                    className="w-full text-left px-5 py-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-slate-100 last:border-0 cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">{result.symbol}</span>
                      <span className="text-sm font-medium text-slate-500 truncate max-w-[200px] md:max-w-xs">{result.name}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{result.exchangeShortName}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Dynamic Loading Text OR Suggested Tags */}
          <div className="mt-6 h-8 flex items-center justify-center">
            {isSearching ? (
              <span className="text-sm font-bold text-blue-600 animate-pulse bg-blue-50 px-4 py-1.5 rounded-full border border-blue-100">
                {loadingText}
              </span>
            ) : (
              <div className="flex flex-wrap items-center justify-center gap-2 md:gap-3 text-xs md:text-sm font-medium text-slate-400 transition-opacity duration-500">
                <span className="hidden sm:inline font-bold text-slate-500">Popular Searches:</span>
                {popularSearches.map(t => (
                  <button key={t} onClick={() => router.push(`/company/${t}`)} className="bg-white border border-slate-200/80 px-3 py-1 rounded-lg hover:border-blue-300 hover:text-blue-600 shadow-sm transition-all cursor-pointer">
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* The Credibility Strip */}
        <div className="w-full mt-12 mb-32 relative z-10 flex flex-col items-center px-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">
            Research powered by primary sources
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 md:gap-4">
            <div className="bg-white border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] px-4 py-2 rounded-full text-xs md:text-sm font-bold text-slate-600 flex items-center gap-2">
              <span className="text-emerald-500">✓</span> SEC Filings
            </div>
            <div className="bg-white border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] px-4 py-2 rounded-full text-xs md:text-sm font-bold text-slate-600 flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Earnings Reports
            </div>
            <div className="bg-white border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] px-4 py-2 rounded-full text-xs md:text-sm font-bold text-slate-600 flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Financial Statements
            </div>
            <div className="bg-white border border-slate-200/60 shadow-[0_2px_10px_rgb(0,0,0,0.02)] px-4 py-2 rounded-full text-xs md:text-sm font-bold text-slate-600 flex items-center gap-2">
              <span className="text-emerald-500">✓</span> Management Commentary
            </div>
          </div>
        </div>

        {/* 3. THE "WHY" (The Pain Points) */}
        <div className="w-full max-w-5xl mx-auto mb-20 relative z-10">
          <div className="text-center mb-14 px-4">
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">Never lose track of why you invested</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10">
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col text-center items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-5">🧠</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Remember Why You Invested</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Record exactly why you bought a stock. Never panic sell because of short-term price moves.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col text-center items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-2xl mb-5">🤖</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">AI Monitors Every Update</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">Investment IQ reads every earnings report, SEC filing, and management commentary while you sleep.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] flex flex-col text-center items-center hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mb-5">📈</div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">Know When Your Thesis Changes</h3>
              <p className="text-slate-500 text-sm font-medium leading-relaxed">See instantly whether your original reasons for investing are fundamentally strengthening or breaking.</p>
            </div>
          </div>
        </div>

        {/* 4. THE VISUAL PROOF (INTERACTIVE PREVIEW CARD) */}
        <div className="w-full max-w-3xl mx-auto mb-10 relative px-4 md:px-0 z-10">
          
          <div className="absolute -inset-4 bg-gradient-to-r from-blue-100/50 via-indigo-50/50 to-emerald-100/50 rounded-[3rem] blur-2xl -z-10 pointer-events-none"></div>

          {/* MANUAL SELECTION PILLS */}
          <div className="flex items-center justify-center gap-2 mb-8 flex-wrap">
            {Object.keys(DEMO_COMPANIES).map((ticker) => {
              const isActive = selectedTicker === ticker;
              return (
                <button
                  key={ticker}
                  onClick={() => setSelectedTicker(ticker as keyof typeof DEMO_COMPANIES)}
                  className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md scale-105'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  {DEMO_COMPANIES[ticker as keyof typeof DEMO_COMPANIES].name.split(' ')[0]} ({ticker})
                </button>
              );
            })}
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-200/80 shadow-[0_20px_50px_rgba(0,0,0,0.06)] overflow-hidden font-sans transition-all duration-300">
            
            {/* 1. PREMIUM HEADER */}
            <div className="p-8 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">{activeData.name}</h2>
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 border border-slate-200/80 px-2.5 py-1 rounded-md">{activeData.ticker}</span>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">{activeData.sector}</p>
              </div>

              <div className={`inline-flex items-center border px-4 py-2 rounded-full self-start md:self-auto ${getBadgeStyles(activeData.thesisColor)}`}>
                <span className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <span className={`animate-pulse text-[10px] ${activeData.thesisColor === 'emerald' ? 'text-emerald-500' : 'text-blue-500'}`}>●</span> Thesis {activeData.thesis}
                </span>
              </div>
            </div>

            {/* 2. THE METRICS RIBBON */}
            <div className="bg-slate-50/50 border-y border-slate-100">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-slate-200/60">
                <div className="p-5 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Star className="w-3 h-3" /> Quality
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {activeData.pillars.quality}
                  </p>
                </div>
                <div className="p-5 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3 h-3" /> Management
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {activeData.pillars.management}
                  </p>
                </div>
                <div className="p-5 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <Activity className="w-3 h-3" /> Valuation
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {activeData.pillars.valuation}
                  </p>
                </div>
                <div className="p-5 flex flex-col justify-center">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                    <BookOpen className="w-3 h-3" /> Clarity
                  </p>
                  <p className="text-sm font-extrabold text-slate-900">
                    {activeData.pillars.understandability}
                  </p>
                </div>
              </div>
            </div>

            {/* 3. OVERALL ASSESSMENT */}
            <div className="px-8 py-6 border-b border-slate-100 bg-white">
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Overall Assessment</h3>
              <p className="text-sm font-medium text-slate-800 leading-relaxed">
                {activeData.overallAssessment}
              </p>
            </div>

            {/* 4. LATEST CHANGES ACTIVITY FEED */}
            <div className="p-8">
              <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-5">What Changed Since Last Earnings</h3>
              
              <div className="space-y-3">
                {activeData.changes.map((item, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                      item.status === 'warning' 
                        ? 'bg-amber-50/50 border-amber-200/60' 
                        : 'bg-white border-slate-100 hover:border-slate-200 shadow-sm'
                    }`}
                  >
                    <div className="mt-1">
                      {item.status === 'warning' ? (
                        <span className="text-amber-500 font-bold text-xs">⚠</span>
                      ) : item.status === 'neutral' ? (
                        <span className="text-slate-400 font-bold text-xs">—</span>
                      ) : (
                        <Circle className="w-2.5 h-2.5 fill-emerald-500 text-emerald-500 mt-1" />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-bold mb-0.5 ${item.status === 'warning' ? 'text-amber-950' : 'text-slate-900'}`}>
                        {item.text}
                      </p>
                      <p className={`text-xs font-medium ${item.status === 'warning' ? 'text-amber-700/80' : 'text-slate-500'}`}>
                        {item.sub}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 5. PREMIUM FOOTER ACTION */}
            <div className="p-6 bg-slate-50/80 border-t border-slate-100">
              <button 
                onClick={() => router.push(`/company/${activeData.ticker}`)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.15)] flex items-center justify-center gap-2 text-sm group cursor-pointer"
              >
                View Full Research <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </main>
      
      {/* 6. EXPANDED FOOTER */}
      <footer className="w-full border-t border-slate-200/60 pt-16 pb-8 bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8 mb-12 text-sm">
          <div className="col-span-1 md:col-span-2">
            <div className="font-extrabold text-xl text-slate-900 flex items-center gap-2 mb-4">
              Investment IQ
              <span className="flex gap-0.5 opacity-50">
                <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
                <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              </span>
            </div>
            <p className="text-slate-500 font-medium max-w-sm leading-relaxed">
              The AI-powered journal for long-term investors. Track your conviction, not just price charts.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Product</h4>
            <ul className="space-y-3 text-slate-500 font-medium">
              <li><button className="hover:text-blue-600 transition-colors">Research</button></li>
              <li><button className="hover:text-blue-600 transition-colors">Pricing</button></li>
              <li><button className="hover:text-blue-600 transition-colors">About</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-4">Legal & Social</h4>
            <ul className="space-y-3 text-slate-500 font-medium">
              <li><button className="hover:text-blue-600 transition-colors">Privacy Policy</button></li>
              <li><button className="hover:text-blue-600 transition-colors">Terms of Service</button></li>
              <li><button className="hover:text-blue-600 transition-colors">Twitter / X</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm font-medium text-slate-400">© {new Date().getFullYear()} Investment IQ. For educational purposes only.</p>
        </div>
      </footer>
    </div>
  );
}