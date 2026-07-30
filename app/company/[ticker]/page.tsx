'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// --- REUSABLE PROGRESSIVE DISCLOSURE COMPONENT ---
function ProgressiveCard({ 
  question, 
  statusText, 
  statusType, 
  thesisSupportText,
  thesisSupportType,
  summary, 
  evidence 
}: { 
  question: string, 
  statusText: string, 
  statusType: 'green' | 'yellow' | 'red',
  thesisSupportText: string,
  thesisSupportType: 'supports' | 'neutral' | 'risk',
  summary: string,
  evidence: string[]
}) {
  const [isOpen, setIsOpen] = useState(false);

  const styles = {
    green: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-600/20', icon: '🟢' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20', icon: '🟡' },
    red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20', icon: '🔴' }
  };

  const thesisStyles = {
    supports: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    neutral: 'bg-amber-50 text-amber-800 border-amber-200',
    risk: 'bg-rose-50 text-rose-800 border-rose-200'
  };

  const activeStyle = styles[statusType];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-gray-300">
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold text-gray-900">{question}</h3>
          
          <div className={`text-xs font-extrabold px-3 py-1 rounded-full border ${thesisStyles[thesisSupportType]} flex items-center gap-1.5`}>
            <span className="text-[10px]">Thesis:</span> {thesisSupportText}
          </div>
        </div>
        
        <div className="mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset ${activeStyle.bg} ${activeStyle.text} ${activeStyle.ring} mb-4`}>
            <span>{activeStyle.icon}</span> {statusText}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Why?</p>
          <p className="text-sm md:text-base text-gray-700 font-medium leading-relaxed max-w-4xl">
            {summary}
          </p>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="mt-5 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isOpen ? 'Hide Supporting Evidence ↑' : 'View Supporting Evidence ↓'}
        </button>
      </div>

      {isOpen && (
        <div className="px-6 md:px-8 pb-8 pt-4 bg-gray-50/50 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Evidence</h4>
          <ul className="space-y-3">
            {evidence.map((item, idx) => (
              <li key={idx} className="text-sm md:text-base text-gray-700 flex items-start gap-2 max-w-4xl">
                <span className={`font-bold mt-0.5 ${statusType === 'red' ? 'text-red-500' : 'text-green-500'}`}>
                  {statusType === 'red' ? '⚠' : '✓'}
                </span> 
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function CompanyOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const ticker = (params.ticker as string || 'NVDA').toUpperCase();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasThesis, setHasThesis] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [headerSearch, setHeaderSearch] = useState('');

  const [thesisInputs, setThesisInputs] = useState<string[]>([
    'AI infrastructure capital expenditure acceleration',
    'CUDA ecosystem developer lock-in & switching costs',
    'Data center networking margin expansion'
  ]);

  useEffect(() => {
    async function initializeOverview() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsLoggedIn(true);
        const { data: thesis } = await supabase
          .from('theses')
          .select('id, drivers')
          .eq('ticker', ticker)
          .maybeSingle();

        if (thesis) {
          setHasThesis(true);
          if (thesis.drivers && Array.isArray(thesis.drivers)) {
            setThesisInputs(thesis.drivers);
          }
        }
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    }
    initializeOverview();
  }, [ticker]);

  const handleHeaderSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (headerSearch.trim()) {
      router.push(`/company/${headerSearch.trim().toUpperCase()}`);
      setHeaderSearch('');
    }
  };

  const handleThesisInputChange = (index: number, value: string) => {
    const updated = [...thesisInputs];
    updated[index] = value;
    setThesisInputs(updated);
  };

  const handleSaveThesis = async () => {
    if (!isLoggedIn) {
      sessionStorage.setItem(`pending_thesis_${ticker}`, JSON.stringify(thesisInputs));
      router.push(`/login?redirect=/company/${ticker}`);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from('theses')
      .upsert({
        user_id: session.user.id,
        ticker: ticker,
        company_name: `${ticker} Corp`,
        drivers: thesisInputs,
        thesis_state: 'Strengthening'
      }, { onConflict: 'user_id,ticker' });

    if (error) {
      alert('Error saving thesis. Please try again.');
    } else {
      alert('Thesis saved successfully! Investment IQ will now monitor these points.');
      setHasThesis(true);
    }
  };

  const scrollToThesis = () => {
    const element = document.getElementById('build-thesis-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 font-medium animate-pulse">Loading {ticker} research workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* UNIVERSAL NAVIGATION BAR (Restored to max-w-6xl) */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-3 flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-6">
            <Link href="/" className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-2">
              Investment IQ
              <span className="flex gap-0.5">
                <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
                <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
              </span>
            </Link>

            <form onSubmit={handleHeaderSearch} className="hidden sm:flex items-center relative">
              <input 
                type="text" 
                value={headerSearch}
                onChange={(e) => setHeaderSearch(e.target.value)}
                placeholder="Search symbol (e.g. MSFT)..."
                className="bg-gray-100 hover:bg-gray-100/80 focus:bg-white text-xs font-bold py-2 pl-8 pr-3 rounded-xl border border-transparent focus:border-blue-500 focus:outline-none transition-all w-48 focus:w-60"
              />
              <svg className="w-3.5 h-3.5 text-gray-400 absolute left-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </form>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="text-xs font-bold bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-2 rounded-xl border border-blue-200 transition-colors cursor-pointer"
              >
                ← Go to My Dashboard
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-2">
                  Sign In
                </Link>
                <Link href="/login" className="bg-blue-600 text-white text-xs font-extrabold px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm transition-all">
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

        </div>
      </nav>

      {/* Main Content Area (Restored to max-w-6xl) */}
      <main className="max-w-6xl mx-auto px-6 pt-10">
        
        {/* EXECUTIVE SUMMARY HERO */}
        <div className="mb-10">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">{ticker} Research Snapshot</h1>
              <span className="bg-blue-100 text-blue-700 text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider hidden sm:block">Alpha Research</span>
            </div>

            <div className="flex items-center gap-3">
              {isLoggedIn && hasThesis && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm">
                  <span>🟢</span> Thesis Strengthening
                </div>
              )}
              <button 
                onClick={scrollToThesis}
                className="flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                ↓ Jump to Thesis Engine
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium mb-8">
            <span>Explore other research:</span>
            {['MSFT', 'AMD', 'COST', 'AAPL'].map((sym) => (
              <button 
                key={sym} 
                onClick={() => router.push(`/company/${sym}`)}
                className="bg-white border border-gray-200 px-3 py-1 rounded-md hover:border-blue-500 hover:text-blue-600 transition-colors font-bold text-[11px]"
              >
                {sym}
              </button>
            ))}
          </div>
          
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
              
              <div className="flex flex-col justify-between">
                <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Overall Assessment</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl md:text-3xl font-extrabold text-gray-900">Excellent Business</span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">🟢 High Quality</span>
                  </div>
                  <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed">
                    {ticker} remains one of the highest-quality businesses globally, supported by a structural AI moat, dominant developer ecosystem, and stellar margin expansion. The key factor for investors to monitor is sustained capital expenditure levels against premium valuation multiples.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-2">Key Strengths</p>
                    <p className="text-sm text-gray-700 font-medium mb-1">✓ Wide Moat & Software Lock-in</p>
                    <p className="text-sm text-gray-700 font-medium">✓ Exceptional Operating Margins</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-2">Watch Points</p>
                    <p className="text-sm text-gray-700 font-medium mb-1">⚠ Premium Historical Valuation</p>
                    <p className="text-sm text-gray-700 font-medium">⚠ Export Control Restrictions</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Quick Snapshot</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-sm font-bold text-gray-600 uppercase">Business Quality</span>
                    <span className="text-base font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-sm">🟢</span> Excellent</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-sm font-bold text-gray-600 uppercase">Management</span>
                    <span className="text-base font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-sm">🟢</span> Trusted</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-sm font-bold text-gray-600 uppercase">Growth</span>
                    <span className="text-base font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-sm">🟢</span> Exceptional</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-sm font-bold text-gray-600 uppercase">Valuation</span>
                    <span className="text-base font-extrabold text-yellow-600 flex items-center gap-1.5"><span className="text-sm">🟡</span> Premium</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-600 uppercase">Risk Profile</span>
                    <span className="text-base font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-sm">🟢</span> Low Risk</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* HORIZONTAL WORKFLOW BANNER (Replaces Sidebar) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4 flex-1 w-full border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm shrink-0">1</div>
            <div>
              <p className="text-sm font-bold text-gray-900">Review Evidence</p>
              <p className="text-xs text-gray-500 mt-0.5">Analyze quality, moat & risks below.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-1 w-full border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm shrink-0">2</div>
            <div>
              <p className="text-sm font-bold text-gray-900">Formulate Thesis</p>
              <p className="text-xs text-gray-500 mt-0.5">Lock in your 3 conviction drivers.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 flex-1 w-full">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm shrink-0">3</div>
            <div>
              <p className="text-sm font-bold text-gray-900">Track Fundamentals</p>
              <p className="text-xs text-gray-500 mt-0.5">AI compares filings against your thesis.</p>
            </div>
          </div>
        </div>

        {/* FULL-WIDTH RESEARCH COLUMN */}
        <div className="space-y-8">

          {/* WHAT'S CHANGED SECTION */}
          <div id="updates" className="bg-blue-50/50 p-6 md:p-8 rounded-2xl border border-blue-100">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div>
                <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wider">What's Changed Since Last Earnings</h3>
                <p className="text-xs text-blue-700 font-medium mt-1">Evaluation against fundamentals & saved drivers</p>
              </div>
              <span className="text-[11px] font-semibold text-blue-600 bg-blue-100/80 px-3 py-1.5 rounded-full">Updated Q2 FY27</span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-start gap-3 text-sm text-gray-800 font-medium bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-green-600 font-bold text-lg leading-none mt-0.5">↑</span> 
                <div>
                  <span className="text-sm font-bold">Revenue guidance raised</span>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">Validates AI Demand</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-800 font-medium bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-green-600 font-bold text-lg leading-none mt-0.5">↑</span> 
                <div>
                  <span className="text-sm font-bold">Networking demand stronger</span>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">Validates Margin Expansion</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-800 font-medium bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-green-600 font-bold text-lg leading-none mt-0.5">↑</span> 
                <div>
                  <span className="text-sm font-bold">Gross margins improved</span>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">Validates Product Mix</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-800 font-medium bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-amber-600 font-bold text-lg leading-none mt-0.5">⚠</span> 
                <div>
                  <span className="text-sm font-bold">Export restrictions remain</span>
                  <p className="text-[11px] text-amber-600 font-bold mt-1">Watch Item</p>
                </div>
              </div>
            </div>
          </div>

          {/* DEEP RESEARCH CARDS (Now stretching full width of max-w-6xl) */}
          <div className="space-y-6">
            <ProgressiveCard 
              question="1. Is this a high-quality business?"
              statusText="Excellent"
              statusType="green"
              thesisSupportText="✔ Supports Thesis"
              thesisSupportType="supports"
              summary={`${ticker} benefits from expanding structural demand, industry-leading margins, and exceptional cash conversion.`}
              evidence={[
                "Data center revenue accelerating year-over-year",
                "Gross margins expanding due to software and enterprise mix",
                "Cash flow conversion allows heavy R&D reinvestment"
              ]}
            />

            <ProgressiveCard 
              question="2. Does it have a durable competitive advantage?"
              statusText="Exceptional Moat"
              statusType="green"
              thesisSupportText="✔ Supports Thesis"
              thesisSupportType="supports"
              summary="A dominant moat built on proprietary software ecosystems and switching costs for enterprise software developers."
              evidence={[
                "Deep developer lock-in through proprietary CUDA software stack",
                "Unmatched interconnect networking architecture",
                "Aggressive annual product cadence creates massive barriers to entry"
              ]}
            />

            <ProgressiveCard 
              question="3. Can management be trusted?"
              statusText="Trusted"
              statusType="green"
              thesisSupportText="✔ Supports Thesis"
              thesisSupportType="supports"
              summary="Founder-led execution with a proven history of pivoting into massive total addressable markets ahead of competitors."
              evidence={[
                "Founder maintains significant equity alignment",
                "Consistent track record of disciplined R&D capital allocation",
                "Clear, long-term strategic execution"
              ]}
            />

            <ProgressiveCard 
              question="4. What are the key growth drivers?"
              statusText="Strong Acceleration"
              statusType="green"
              thesisSupportText="✔ Supports Thesis"
              thesisSupportType="supports"
              summary="Generative AI adoption across hyperscalers, sovereign enterprise compute, and industrial robotics automation."
              evidence={[
                "Hyperscaler capex commitment continuing to expand",
                "Sovereign AI initiatives driving international orders",
                "Software revenue ramping as enterprise adoption grows"
              ]}
            />

            <ProgressiveCard 
              question="5. What could go wrong? (Key Risks)"
              statusText="Monitor"
              statusType="red"
              thesisSupportText="⚠ Thesis Risk"
              thesisSupportType="risk"
              summary="Geopolitical restrictions, potential capex air pockets, and custom ASIC development by cloud provider clients."
              evidence={[
                "Geopolitical trade restrictions limiting revenue in specific regions",
                "Concentration risk among top 5 hyperscaler cloud customers",
                "Cloud customers building custom silicon in-house"
              ]}
            />

            <ProgressiveCard 
              question="6. Is today's valuation attractive?"
              statusText="Premium"
              statusType="yellow"
              thesisSupportText="⚠ Neutral / Watch"
              thesisSupportType="neutral"
              summary="Trading at a premium multiple relative to historic market averages, requiring sustained hyper-growth to justify."
              evidence={[
                "Forward P/E ratio sitting in upper historical decile",
                "Price-to-Sales ratio reflects elevated growth expectations",
                "High quality business offering lower margin of safety at peak price"
              ]}
            />

            <ProgressiveCard 
              question="7. What do the financial metrics & evidence show?"
              statusText="Robust Financials"
              statusType="green"
              thesisSupportText="✔ Supports Thesis"
              thesisSupportType="supports"
              summary="Balance sheet strength with minimal net debt and best-in-class return on invested capital."
              evidence={[
                "Return on Invested Capital (ROIC) exceeds 50%",
                "Net cash position provides total solvency protection",
                "Free Cash Flow margin exceeds 40%"
              ]}
            />
          </div>

        </div>
{/* 3. FULL-WIDTH THESIS SECTION (COMPACT & SLEEK) */}
        <div id="build-thesis-section" className="mt-12 pt-8 border-t border-gray-200">
          <div className="bg-gradient-to-r from-blue-950 via-indigo-950 to-slate-900 text-white p-6 md:p-8 rounded-[24px] shadow-xl border border-blue-900/50">
            
            {/* Header - Tighter and inline */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2.5 py-1 rounded-full mb-2 border border-blue-400/20">
                  ⚡ Core Feature • Investment Operating System
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">Build My Investment Thesis for {ticker}</h2>
              </div>

              {hasThesis ? (
                <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-inner">
                  <span className="text-sm">🟢</span> Thesis Status: Strengthening
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-3 bg-white/5 border border-white/10 px-4 py-2 rounded-xl max-w-sm text-xs text-blue-200">
                  <span className="text-base">💡</span>
                  <p className="leading-tight">When earnings arrive, we compare new financial data directly against your saved drivers.</p>
                </div>
              )}
            </div>

            {/* Compact Driver Input Cards */}
            <div className="space-y-2.5 mb-6">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-blue-300/70 mb-1 pl-1">
                Key Conviction Drivers ({ticker}):
              </label>
              
              {thesisInputs.map((point, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 p-2.5 rounded-xl border border-white/10 focus-within:border-blue-400 focus-within:bg-white/10 transition-all">
                  <span className="w-7 h-7 rounded-lg bg-blue-600/60 text-white flex items-center justify-center font-extrabold text-xs shrink-0 border border-blue-400/30">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleThesisInputChange(idx, e.target.value)}
                    placeholder={`Key thesis driver #${idx + 1}...`}
                    className="w-full bg-transparent text-sm text-white placeholder-blue-300/40 focus:outline-none font-medium"
                  />
                </div>
              ))}
            </div>

            {/* Bottom Bar: Value Proposition + Primary Call To Action */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-white/10">
              <div className="flex items-center gap-2.5 text-xs text-blue-200/80 font-medium pl-1">
                <span className="text-emerald-400 font-bold text-sm">✓</span>
                <span>
                  {!isLoggedIn 
                    ? "Sign in to save this thesis and enable automated quarterly earnings checks." 
                    : "Your thesis is saved and will be graded against future quarterly earnings."}
                </span>
              </div>

              <button
                onClick={handleSaveThesis}
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-6 py-2.5 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 cursor-pointer whitespace-nowrap text-center"
              >
                {isLoggedIn 
                  ? (hasThesis ? 'Update Saved Thesis →' : 'Save & Track Thesis →') 
                  : 'Sign In to Save & Track Thesis →'}
              </button>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}