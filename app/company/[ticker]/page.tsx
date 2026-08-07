'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Building2, TrendingUp, TrendingDown, Globe, ArrowLeft, Sparkles, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCompanyProfile } from '@/lib/fmp';

// --- REUSABLE PROGRESSIVE DISCLOSURE COMPONENT ---
function ProgressiveCard({ 
  question, 
  statusText, 
  statusType, 
  thesisSupportText,
  thesisSupportType,
  summary, 
  evidence,
  showThesisBadge = false
}: { 
  question: string, 
  statusText: string, 
  statusType: 'green' | 'yellow' | 'red',
  thesisSupportText: string,
  thesisSupportType: 'supports' | 'neutral' | 'risk',
  summary: string,
  evidence: string[],
  showThesisBadge?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false);

  const styles = {
    green: { bg: 'bg-emerald-50/80', text: 'text-emerald-700', ring: 'ring-emerald-600/20', icon: '🟢' },
    yellow: { bg: 'bg-amber-50/80', text: 'text-amber-700', ring: 'ring-amber-600/20', icon: '🟡' },
    red: { bg: 'bg-rose-50/80', text: 'text-rose-700', ring: 'ring-rose-600/20', icon: '🔴' }
  };

  const thesisStyles = {
    supports: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    neutral: 'bg-amber-50 text-amber-800 border-amber-200',
    risk: 'bg-rose-50 text-rose-800 border-rose-200'
  };

  const activeStyle = styles[statusType];

  return (
    <div className="bg-white rounded-[24px] border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-gray-300">
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg md:text-xl font-extrabold text-gray-900">{question}</h3>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${activeStyle.bg} ${activeStyle.text} ${activeStyle.ring} shadow-sm`}>
              <span className="scale-110 drop-shadow-sm">{activeStyle.icon}</span> {statusText}
            </div>
          </div>
          
          {showThesisBadge && (
            <div className={`text-xs font-extrabold px-3 py-1.5 rounded-full border ${thesisStyles[thesisSupportType]} flex items-center gap-1.5 shadow-sm shrink-0`}>
              <span className="text-[10px] opacity-80 uppercase tracking-widest">Thesis:</span> {thesisSupportText}
            </div>
          )}
        </div>
        
        <div className="mb-2">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Why?</p>
          <p className="text-sm md:text-base text-gray-700 font-medium leading-relaxed max-w-4xl">
            {summary}
          </p>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-blue-50 hover:text-blue-700 border border-gray-200 hover:border-blue-200 rounded-xl transition-all shadow-sm group cursor-pointer"
        >
          {isOpen ? 'Hide Supporting Evidence' : 'View Supporting Evidence'}
          <svg 
            className={`w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="px-6 md:px-8 pb-8 pt-5 bg-gradient-to-b from-gray-50/80 to-gray-50/30 border-t border-gray-100">
          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Evidence</h4>
          <ul className="space-y-3">
            {evidence.map((item, idx) => (
              <li key={idx} className="text-sm md:text-base text-gray-700 font-medium flex items-start gap-3 max-w-4xl bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className={`font-bold mt-0.5 shrink-0 ${statusType === 'red' ? 'text-red-500' : 'text-emerald-500'}`}>
                  {statusType === 'red' ? '⚠' : '✓'}
                </span> 
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
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
  
  // LIVE API STATES
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [headerSearch, setHeaderSearch] = useState('');

  // AI BRAIN STATES
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiData, setAiData] = useState<any>(null);

  useEffect(() => {
    async function initializeOverview() {
      setIsLoading(true);
      
      const liveData = await getCompanyProfile(ticker);
      setProfile(liveData);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        const { data: thesis } = await supabase
          .from('theses')
          .select('id')
          .eq('ticker', ticker)
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (thesis) setHasThesis(true);
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

  const handleLaunchBuilder = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/build-thesis/${ticker}`);
    } else {
      router.push(`/build-thesis/${ticker}`);
    }
  };

  const scrollToThesis = () => {
    const element = document.getElementById('build-thesis-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // --- NEW: CALLING THE AI BACKEND ---
  const generateAIResearch = async () => {
    if (!profile) return;
    setIsAnalyzing(true);
    
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: profile.symbol, companyName: profile.companyName })
      });
      
      const data = await response.json();
      if (data) {
        setAiData(data);
      }
    } catch (error) {
      console.error("Error generating AI research:", error);
    }
    
    setIsAnalyzing(false);
  };

  // --- LOADING STATE ---
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 font-medium animate-pulse">Loading {ticker} research workspace...</div>
      </div>
    );
  }

  // --- ERROR STATE ---
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center font-sans text-slate-500">
        <div className="w-16 h-16 bg-slate-200 rounded-2xl flex items-center justify-center mb-4">
          <Globe className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Company Not Found</h1>
        <p className="font-medium mb-6">We couldn't find live data for the ticker "{ticker}".</p>
        <button onClick={() => router.back()} className="text-blue-600 font-bold hover:text-blue-800 transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Go back
        </button>
      </div>
    );
  }

  const isPositiveChange = profile.changes >= 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* UNIVERSAL NAVIGATION BAR */}
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
                placeholder="Search Company or Ticker..."
                className="bg-gray-100 hover:bg-gray-100/80 focus:bg-white text-xs font-bold py-2 pl-8 pr-3 rounded-xl border border-transparent focus:border-blue-500 focus:outline-none transition-all w-56 focus:w-64"
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

      <main className="max-w-6xl mx-auto px-6 pt-10">
        
        {/* --- LIVE API COMPANY HERO --- */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-8 md:p-10 mb-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden relative">
                {profile.image ? (
                  <img src={profile.image} alt={`${profile.companyName} logo`} className="w-full h-full object-contain p-2" />
                ) : (
                  <Building2 className="w-8 h-8 text-slate-300" />
                )}
              </div>
              
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-tight mb-2">
                  {profile.companyName}
                </h1>
                <div className="flex flex-wrap items-center gap-2 md:gap-3 text-xs md:text-sm font-bold text-slate-500">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/60">{profile.symbol}</span>
                  <span>•</span>
                  <span>{profile.exchangeShortName}</span>
                  <span>•</span>
                  <span>{profile.sector || 'Equities'}</span>
                </div>
              </div>
            </div>

            <div className="text-left md:text-right flex flex-row md:flex-col items-end justify-between md:justify-start w-full md:w-auto border-t md:border-t-0 border-slate-100 pt-6 md:pt-0 mt-2 md:mt-0">
              <div className="flex items-center gap-3 mb-1.5 hidden md:flex justify-end">
                {isLoggedIn && hasThesis && (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1 rounded-xl text-[10px] font-bold flex items-center gap-1.5 shadow-sm uppercase tracking-wider">
                    <span>🟢</span> Thesis Strengthening
                  </div>
                )}
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Current Price</p>
              </div>
              
              <p className="text-4xl font-extrabold text-slate-900 tracking-tight">
                ${profile.price?.toFixed(2)}
              </p>
              <div className={`flex items-center gap-1.5 text-sm font-bold mt-1 justify-end ${isPositiveChange ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{profile.changes > 0 ? '+' : ''}{profile.changes?.toFixed(2)}</span>
                <span className="opacity-70">({profile.changes > 0 ? '+' : ''}{((profile.changes / (profile.price - profile.changes)) * 100).toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- AI GENERATION TRIGGER --- */}
        {!aiData && (
          <div className="mb-8 bg-blue-50/50 border border-blue-100 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div>
              <h2 className="text-xl font-extrabold text-blue-950 mb-2 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" /> AI Fundamental Analysis
              </h2>
              <p className="text-sm text-blue-800/80 font-medium max-w-xl">
                Our AI engine will read the latest SEC filings, earnings calls, and management commentary to instantly evaluate {profile.companyName}'s moat, management, and valuation.
              </p>
            </div>
            <button
              onClick={generateAIResearch}
              disabled={isAnalyzing}
              className="w-full md:w-auto shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(37,99,235,0.25)] flex items-center justify-center gap-2 cursor-pointer"
            >
              {isAnalyzing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing 10-Q...</>
              ) : (
                <><Sparkles className="w-5 h-5" /> Generate Research</>
              )}
            </button>
          </div>
        )}
        
     {/* 4 PILLARS & OVERALL ASSESSMENT (DYNAMIC VIA AI) */}
        <div className="mb-10">
          <div className="bg-white p-8 md:p-10 rounded-3xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16">
              
              <div className="flex flex-col justify-between">
                <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Overall Assessment</h2>
                  
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <span className="text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight">Excellent Business</span>
                    <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-700 rounded-full shrink-0">🟢 High Quality</span>
                  </div>
                  
                  <p className="text-sm md:text-base text-gray-600 font-medium leading-relaxed">
                    {aiData?.overallAssessment || `${profile.companyName} remains one of the highest-quality businesses globally, supported by a structural AI moat, dominant developer ecosystem, and stellar margin expansion.`}
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] font-bold text-green-700 uppercase tracking-wider mb-3">Key Strengths</p>
                    <div className="space-y-2">
                      {/* CRASH FIX: Added the question mark (aiData?.strengths?.map) */}
                      {aiData?.strengths ? aiData.strengths.map((strength: string, i: number) => (
                        <p key={i} className="text-sm text-gray-700 font-medium flex gap-1.5"><span className="text-green-500 font-bold">✓</span> {strength}</p>
                      )) : (
                        <>
                          <p className="text-sm text-gray-700 font-medium flex gap-1.5"><span className="text-green-500 font-bold">✓</span> Wide Moat & Software Lock-in</p>
                          <p className="text-sm text-gray-700 font-medium flex gap-1.5"><span className="text-green-500 font-bold">✓</span> Exceptional Operating Margins</p>
                          <p className="text-sm text-gray-700 font-medium flex gap-1.5"><span className="text-green-500 font-bold">✓</span> Durable Cash Flow Generation

</p>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-amber-700 uppercase tracking-wider mb-3">Watch Points</p>
                    <div className="space-y-2">
                      {/* CRASH FIX: Added the question mark (aiData?.risks?.map) */}
                      {aiData?.risks ? aiData.risks.map((risk: string, i: number) => (
                        <p key={i} className="text-sm text-gray-700 font-medium flex gap-1.5"><span className="text-amber-500 font-bold">⚠</span> {risk}</p>
                      )) : (
                        <>
                          <p className="text-sm text-gray-700 font-medium flex gap-1.5"><span className="text-amber-500 font-bold">⚠</span> Premium Historical Valuation</p>
                          <p className="text-sm text-gray-700 font-medium flex gap-1.5"><span className="text-amber-500 font-bold">⚠</span> Export Control Restrictions</p>
                          <p className="text-sm text-gray-700 font-medium flex gap-1.5"><span className="text-amber-500 font-bold">⚠</span> High Customer Concentration</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 flex flex-col justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-6">Quick Snapshot</p>
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-sm font-bold text-gray-600 uppercase">Business Quality</span>
                    <span className="text-base font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-sm">🟢</span> {aiData?.pillars?.quality || 'Excellent'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-sm font-bold text-gray-600 uppercase">Management</span>
                    <span className="text-base font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-sm">🟢</span> {aiData?.pillars?.management || 'Trusted'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-sm font-bold text-gray-600 uppercase">Valuation</span>
                    <span className="text-base font-extrabold text-yellow-600 flex items-center gap-1.5"><span className="text-sm">🟡</span> {aiData?.pillars?.valuation || 'Premium'}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-sm font-bold text-gray-600 uppercase">Understandability</span>
                    <span className="text-base font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-sm">🟢</span> {aiData?.pillars?.understandability || 'Easy'}</span>
                  </div>
                  
                  {/* RESTORED THE 2 MISSING PILLARS */}
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-3">
                    <span className="text-sm font-bold text-gray-600 uppercase">Financial Strength</span>
                    <span className="text-base font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-sm">🟢</span> {aiData?.pillars?.financialStrength || 'Fortress'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-600 uppercase">Compounding Power</span>
                    <span className="text-base font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-sm">🟢</span> {aiData?.pillars?.compoundingPower || 'Exceptional'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* FULL-WIDTH RESEARCH COLUMN */}
        <div className="space-y-8 mt-12">
          
          {/* EARNINGS UPDATES SECTION */}
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
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">Validates Growth Demand</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-800 font-medium bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-green-600 font-bold text-lg leading-none mt-0.5">↑</span> 
                <div>
                  <span className="text-sm font-bold">Membership renewals up</span>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">Validates Moat Strength</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-800 font-medium bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-green-600 font-bold text-lg leading-none mt-0.5">↑</span> 
                <div>
                  <span className="text-sm font-bold">Gross margins improved</span>
                  <p className="text-[11px] text-emerald-600 font-bold mt-1">Validates Pricing Power</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm text-gray-800 font-medium bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <span className="text-amber-600 font-bold text-lg leading-none mt-0.5">⚠</span> 
                <div>
                  <span className="text-sm font-bold">Expansion costs rising</span>
                  <p className="text-[11px] text-amber-600 font-bold mt-1">Watch Item</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <ProgressiveCard 
              question="1. Is this a high-quality business?"
              statusText="Excellent"
              statusType="green"
              thesisSupportText="✔ Supports Thesis"
              thesisSupportType="supports"
              showThesisBadge={hasThesis}
              summary={`${profile.companyName} benefits from predictable recurring revenue, exceptional returns on invested capital, and structural advantages over competitors.`}
              evidence={["Consistently high ROIC (Returns on Invested Capital)", "Recurring revenue acts as a highly predictable base", "Industry-leading unit economics"]}
            />
            
            <ProgressiveCard 
              question="2. Does it have a durable competitive advantage (moat)?"
              statusText="Exceptional Moat"
              statusType="green"
              thesisSupportText="✔ Supports Thesis"
              thesisSupportType="supports"
              showThesisBadge={hasThesis}
              summary="A dominant moat built on scaled economics, customer loyalty, and high switching costs for enterprise software clients."
              evidence={["Unmatched economies of scale allow lowest-cost offerings", "Deep brand trust and customer loyalty", "High switching costs create a captive customer base"]}
            />
            
            <ProgressiveCard 
              question="3. Can management be trusted?"
              statusText="Trusted"
              statusType="green"
              thesisSupportText="✔ Supports Thesis"
              thesisSupportType="supports"
              showThesisBadge={hasThesis}
              summary="Exceptional execution history with highly disciplined capital allocation and transparent shareholder communication."
              evidence={["Management has a proven history of under-promising and over-delivering", "Consistent track record of returning capital via dividends/buybacks", "Long-tenured leadership team with strong insider ownership"]}
            />
            
            <ProgressiveCard 
              question="4. Am I paying a reasonable price?"
              statusText="Premium"
              statusType="yellow"
              thesisSupportText="— Neutral to Thesis"
              thesisSupportType="neutral"
              showThesisBadge={hasThesis}
              summary="The company trades at a premium valuation multiple compared to its historic averages, requiring flawless future execution."
              evidence={["Trading at a higher forward P/E than its 5-year average", "High expectations are already priced into the stock", "Requires sustained double-digit growth to justify current multiple"]}
            />

            <ProgressiveCard 
              question="5. Can I understand this business well enough to own it?"
              statusText="Easy"
              statusType="green"
              thesisSupportText="✔ Supports Thesis"
              thesisSupportType="supports"
              showThesisBadge={hasThesis}
              summary="The business model is straightforward: generate revenue by offering exceptional value through scaled retail/software operations."
              evidence={["Clear, easy-to-read financial statements", "Simple core product offering that solves an obvious customer need", "No complex financial engineering required to generate profits"]}
            />
            
            <ProgressiveCard 
              question="6. What could go wrong?"
              statusText="Monitor"
              statusType="red"
              thesisSupportText="⚠ Thesis Risk"
              thesisSupportType="risk"
              showThesisBadge={hasThesis}
              summary="Macroeconomic slowdowns, heavy reliance on specific geographical markets, or an erosion of the core value proposition."
              evidence={["Consumer spending compression in a recessionary environment", "Rising labor and logistical costs cutting into margins", "Aggressive competitor discounting"]}
            />

            <ProgressiveCard 
              question="7. Can this business keep growing for the next 5–10 years?"
              statusText="Strong Acceleration"
              statusType="green"
              thesisSupportText="✔ Supports Thesis"
              thesisSupportType="supports"
              showThesisBadge={hasThesis}
              summary="Management continues to identify and execute on massive adjacent total addressable markets (TAMs)."
              evidence={["Expanding into rapidly growing international markets", "Successfully passing pricing increases without losing volume", "Significant runway for new store/product expansion"]}
            />
          </div>
        </div>

    {/* 3. FULL-WIDTH THESIS LAUNCHPAD (VERTICAL WATERFALL REDESIGN) */}
        <div id="build-thesis-section" className="mt-16 pt-10 border-t border-gray-200">
          <div className="bg-gradient-to-b from-slate-900 to-blue-950 text-white p-8 md:p-12 rounded-[32px] shadow-2xl border border-blue-900/50 max-w-4xl mx-auto relative overflow-hidden">
            
            {/* Background Decorative Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>

            {/* Step 1: The Context (Header & Intro) */}
            <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
              
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                Build Your Investment Thesis for {ticker}
              </h2>
              
              <p className="text-blue-100/80 text-sm md:text-base font-medium leading-relaxed">
                Record why you're investing in {profile.companyName} today. Choose the fundamental reasons behind your investment, and Investment IQ automatically monitors whether they become stronger or weaker after every earnings report.
              </p>
            </div>

            {/* Step 2: The Process (Vertical Stacked Cards) */}
            <div className="space-y-3 mb-12 relative z-10 max-w-2xl mx-auto">
              
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 flex items-start gap-4 md:gap-5 transition-all hover:bg-white/10 hover:border-white/20">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold shrink-0 border border-blue-500/30 text-sm md:text-base">1</div>
                <div>
                  <h3 className="font-extrabold text-white text-base md:text-lg mb-1">Build Your Thesis</h3>
                  <p className="text-sm text-blue-200/70 font-medium">Select your investment drivers and risks.</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 flex items-start gap-4 md:gap-5 transition-all hover:bg-white/10 hover:border-white/20">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold shrink-0 border border-blue-500/30 text-sm md:text-base">2</div>
                <div>
                  <h3 className="font-extrabold text-white text-base md:text-lg mb-1">AI Monitors Every Quarter</h3>
                  <p className="text-sm text-blue-200/70 font-medium">Earnings calls • SEC filings • Financials • Management</p>
                </div>
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 flex items-start gap-4 md:gap-5 transition-all hover:bg-white/10 hover:border-white/20">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold shrink-0 border border-blue-500/30 text-sm md:text-base">3</div>
                <div>
                  <h3 className="font-extrabold text-white text-base md:text-lg mb-1">Track Your Conviction</h3>
                  <p className="text-sm text-blue-200/70 font-medium">Know when your conviction is strengthening, unchanged, or starting to break.</p>
                </div>
              </div>

            </div>

           {/* Step 3: The Action (CTA) */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10 w-full mt-8 pt-6 border-t border-white/10">
              
              {/* Left Side: Helper Text */}
              <div className="flex items-center gap-2.5 text-xs md:text-sm text-blue-200/90 font-medium text-center md:text-left">
                <span className="text-emerald-400 font-bold text-base">✓</span>
                <span>
                  {!isLoggedIn 
                    ? "Sign in to save your thesis and receive automatic quarterly updates." 
                    : "Launch the builder to finalize and track your thesis."}
                </span>
              </div>

              {/* Right Side: The Button */}
              <button
                onClick={handleLaunchBuilder}
                className="w-full md:w-auto shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm md:text-base font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] cursor-pointer text-center"
              >
                {isLoggedIn 
                  ? (hasThesis ? 'Update Saved Thesis →' : 'Build My Thesis →') 
                  : 'Build My Thesis →'}
              </button>
              
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}