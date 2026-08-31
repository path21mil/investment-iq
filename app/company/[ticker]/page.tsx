'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Building2, TrendingUp, TrendingDown, Globe, Loader2, 
  AlertCircle, Plus, Activity, Check, Info, ChevronDown, 
  ChevronUp, Share2, Menu, X 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SmartSearchBar from '@/components/SmartSearchBar';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShareModal } from '@/components/ShareModal';
import Logo from '@/components/Logo';


export function CompanyLogo({ ticker, containerClass }: { ticker: string, containerClass: string }) {
  const [imgSrc, setImgSrc] = useState(`https://financialmodelingprep.com/image-stock/${ticker}.png`);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    setImgSrc(`https://financialmodelingprep.com/image-stock/${ticker}.png`);
    setIsFallback(false);
  }, [ticker]);

  return (
    <div className={`flex items-center justify-center shrink-0 ${containerClass}`}>
      <img 
        src={imgSrc} 
        alt={ticker}
        className={`w-full h-full ${
          isFallback 
            ? 'object-cover rounded-xl shadow-sm border border-slate-200' 
            : 'object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
        }`}
        onError={() => {
          if (!isFallback) {
            setImgSrc(`https://ui-avatars.com/api/?name=${ticker}&background=f8fafc&color=0f172a&bold=true&font-size=0.45`);
            setIsFallback(true);
          }
        }}
      />
    </div>
  );
}

function ProgressiveCard({ question, statusText, statusType, thesisSupportText, thesisSupportType, summary, evidence, showThesisBadge = false }: any) {
  const [isOpen, setIsOpen] = useState(false);

  const styles: any = {
    green: { dotColor: 'text-emerald-500' },
    yellow: { dotColor: 'text-amber-500' },
    red: { dotColor: 'text-rose-500' }
  };
  
  const thesisStyles: any = {
    supports: 'text-emerald-600',
    neutral: 'text-slate-500',
    risk: 'text-rose-600'
  };

  const activeStyle = styles[statusType] || styles.green;

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:border-slate-300">
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight">{question}</h3>
            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest mt-1">
              <span className={activeStyle.dotColor}>●</span> {statusText}
            </div>
          </div>
          {showThesisBadge && (
            <div className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 shrink-0 mt-1 ${thesisStyles[thesisSupportType]}`}>
              <span className="opacity-60 text-slate-500">Thesis:</span> {thesisSupportText}
            </div>
          )}
        </div>
        
        <div className="mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Why?</p>
          <p className="text-[14px] text-slate-700 font-medium leading-relaxed max-w-4xl">{summary}</p>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="mt-6 text-[13px] font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
        >
          {isOpen ? 'Hide Evidence' : 'View Evidence'} {isOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 md:px-8 pb-8 pt-5 bg-slate-50 border-t border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Evidence</h4>
          <ul className="space-y-4">
            {evidence?.map((item: string, idx: number) => (
              <li key={idx} className="text-[13px] text-slate-700 font-medium flex items-start gap-3 max-w-4xl bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className={`mt-0.5 shrink-0 text-[10px] ${statusType === 'red' ? 'text-rose-500' : 'text-emerald-500'}`}>●</span> 
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function CompanyPage({ params }: { params: Promise<{ ticker: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const searchParams = useSearchParams();
  const ticker = (resolvedParams.ticker || 'MSFT').toUpperCase();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'research'>('dashboard');
  const [isShareOpen, setIsShareOpen] = useState(false);

  const [savedThesis, setSavedThesis] = useState<any>(null);
  const [activeDrivers, setActiveDrivers] = useState<any[]>([]);
  const [activeRisks, setActiveRisks] = useState<any[]>([]);
  const [suggestedConsiderations, setSuggestedConsiderations] = useState<any[]>([]);

  const [aiData, setAiData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getLifecycleBadgeStyle = (badge: string = '') => {
    switch (badge.toLowerCase()) {
      case 'expanding':
        return { dot: 'text-emerald-500', label: 'Expanding' };
      case 'mature':
        return { dot: 'text-blue-500', label: 'Mature' };
      case 'early stage':
        return { dot: 'text-amber-500', label: 'Early Stage' };
      case 'declining':
        return { dot: 'text-rose-500', label: 'Declining' };
      default:
        return { dot: 'text-slate-400', label: badge || 'Active' };
    }
  };

  const lifecycle = getLifecycleBadgeStyle(aiData?.ratingBadge);

  // Core Research is user-initiated. It must not use the V2 Full Research endpoint,
  // which has a different payload and is reached from the system Watchlist.
  const fetchResearchData = async (companyProfile: any) => {
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: ticker, companyName: companyProfile.companyName })
      });
      
      const responseText = await response.text();
      let responseData;
      try { responseData = JSON.parse(responseText); } catch(e) {}

      if (!response.ok) throw new Error(responseData?.error || `Server returned status ${response.status}`);
      setAiData(responseData);
    } catch (error: any) {
      setAiError(error.message || "An unexpected network error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    async function initPage() {
      setIsLoading(true);
      try {
        // 1. Fetch live profile
        const res = await fetch(`/api/company-profile?ticker=${ticker}`);
        let liveProfile: any = await res.json();
        if (Array.isArray(liveProfile) && liveProfile.length > 0) liveProfile = liveProfile[0];
        setProfile(liveProfile);

        // 2. Fetch User Thesis (if logged in)
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setIsLoggedIn(true);
          const { data: thesis } = await supabase.from('theses').select('*').eq('user_id', session.user.id).ilike('ticker', ticker).maybeSingle();

          if (thesis) {
            setSavedThesis(thesis);
            
            const requestedView = searchParams.get('view');
            setViewMode(requestedView === 'research' ? 'research' : 'dashboard');
            
            const { data: optionsCache } = await supabase.from('thesis_options_cache').select('data').ilike('ticker', ticker).maybeSingle();
            if (optionsCache && optionsCache.data) {
              const allDrivers = optionsCache.data.drivers || [];
              const allRisks = optionsCache.data.risks || [];

              const isSelected = (item: any, savedData: any) => {
                let arr = savedData;
                if (typeof arr === 'string') {
                  try { arr = JSON.parse(arr); } catch(e) { arr = []; }
                }
                if (!Array.isArray(arr)) arr = [];
                return arr.some((saved: any) => {
                  if (typeof saved === 'string') return saved === item.id; 
                  return saved?.title === item.title; 
                });
              };

              setActiveDrivers(allDrivers.filter((d: any) => isSelected(d, thesis.drivers)));
              setActiveRisks(allRisks.filter((r: any) => isSelected(r, thesis.risks)));
              
              setSuggestedConsiderations([
                ...allDrivers.filter((d: any) => !isSelected(d, thesis.drivers)), 
                ...allRisks.filter((r: any) => !isSelected(r, thesis.risks))
              ].slice(0, 2));
            }
          } else {
            setViewMode('research');
          }
        } else {
          setIsLoggedIn(false);
          setViewMode('research');
        }

        // 3. ✨ Let the backend handle the AI Cache and Generation!
        if (liveProfile) {
          setIsLoading(false); // Drop the full screen loader
          await fetchResearchData(liveProfile); // Show the skeleton loader while AI generates
        } else {
          setIsLoading(false);
        }

      } catch (error) {
        console.error("Initialization error:", error);
        setIsLoading(false);
      }
    }

    initPage();
  }, [ticker, searchParams]);

  const handleLaunchBuilder = () => router.push(isLoggedIn ? `/build-thesis/${ticker}` : `/login?redirect=/build-thesis/${ticker}`);

  const getDynamicStatus = (title: string, type: 'driver' | 'risk') => {
    if (!aiData || !aiData.updates) return { label: 'Stable', dotColor: 'text-slate-400' };
    const updatesText = JSON.stringify(aiData.updates).toLowerCase();
    const keywords = title.toLowerCase().split(' ').filter(w => w.length > 4); 
    const isMatch = keywords.some(kw => updatesText.includes(kw));

    if (type === 'driver') return isMatch ? { label: 'Strengthening', dotColor: 'text-emerald-500' } : { label: 'Stable', dotColor: 'text-slate-400' };
    return isMatch ? { label: 'Monitoring', dotColor: 'text-amber-500' } : { label: 'Stable', dotColor: 'text-slate-400' };
  };

  const getTrendIcon = (type: string) => {
    switch(type) {
      case 'positive': return <span className="text-emerald-600 font-bold shrink-0 mt-0.5">↑</span>;
      case 'negative': return <span className="text-rose-600 font-bold shrink-0 mt-0.5">↓</span>;
      default: return <span className="text-slate-400 font-bold shrink-0 mt-0.5">—</span>;
    }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
      <div className="text-slate-500 font-bold flex items-center gap-3 animate-pulse"><Loader2 className="w-5 h-5 animate-spin" /> Loading {ticker}...</div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-500">
      <Globe className="w-10 h-10 text-slate-300 mb-4" />
      <h1 className="text-2xl font-bold text-[#0F172A] mb-2">Company Not Found</h1>
      <button onClick={() => router.back()} className="text-blue-600 font-bold hover:underline">← Go back</button>
    </div>
  );

  const reviewDate = savedThesis ? new Date(savedThesis.updated_at || savedThesis.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const isHighRisk = aiData?.ratingBadge?.toLowerCase().includes('risk') || aiData?.ratingBadge?.toLowerCase().includes('speculative');
  const isPositiveChange = profile.changes >= 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      
      {/* NAVIGATION */}
      <header className="sticky top-0 w-full z-50">
        
        {/* TOP BAR (Creates its own layer above the overlay) */}
        <nav className="relative z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
          <div className="max-w-[960px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-8">
            
            {/* LOGO */}
            <div className="shrink-0">
              <Logo href={isLoggedIn ? "/dashboard" : "/"} /> 
            </div>

            {/* DESKTOP SEARCH BAR */}
            <div className="hidden md:block flex-1 max-w-sm">
              <SmartSearchBar />
            </div>
            
            {/* DESKTOP ACTIONS */}
            <div className="hidden md:flex items-center gap-3 shrink-0">
              {savedThesis && (
                <button 
                  onClick={() => setViewMode(viewMode === 'dashboard' ? 'research' : 'dashboard')} 
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-[#0F172A] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  {viewMode === 'dashboard' ? 'View Research' : 'My Dashboard'}
                </button>
              )}
              {isLoggedIn ? (
                <button 
                  onClick={() => router.push('/dashboard')} 
                  className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-[#0F172A] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
                >
                  Portfolio
                </button>
              ) : (
                <Link 
                  href="/login" 
                  className="bg-[#0F172A] text-white text-[13px] font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Get Started
                </Link>
              )}
            </div>

            {/* MOBILE HAMBURGER BUTTON */}
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </nav>

        {/* MOBILE MENU DROPDOWN & OVERLAY */}
        {isMobileMenuOpen && (
          <>
            {/* ✨ Mobile Overlay (Now properly breaks out and covers the screen) */}
            <div 
              className="md:hidden fixed inset-0 top-[64px] bg-slate-900/40 backdrop-blur-sm z-40"
              onClick={() => setIsMobileMenuOpen(false)}
            />
            
            {/* Mobile Menu Content */}
            <div className="md:hidden absolute top-[64px] left-0 w-full bg-white border-b border-slate-200 shadow-2xl py-6 px-6 flex flex-col gap-4 z-50 animate-in slide-in-from-top-2 duration-200">
              
              {/* FULL WIDTH SEARCH BAR */}
              <div className="w-full flex [&>*]:w-full [&_div]:w-full mb-1">
                <SmartSearchBar />
              </div>

              {/* DYNAMIC NAVIGATION LINKS */}
              {savedThesis && (
                <button 
                  onClick={() => {
                    setViewMode(viewMode === 'dashboard' ? 'research' : 'dashboard');
                    setIsMobileMenuOpen(false); 
                  }} 
                  className="text-left text-[16px] font-bold text-slate-700 hover:text-slate-900 transition-colors py-1 cursor-pointer"
                >
                  {viewMode === 'dashboard' ? 'View Research' : 'My Dashboard'}
                </button>
              )}
              
              {isLoggedIn ? (
                <button 
                  onClick={() => {
                    router.push('/dashboard');
                    setIsMobileMenuOpen(false); 
                  }} 
                  className="text-left text-[16px] font-bold text-slate-700 hover:text-slate-900 transition-colors py-1 cursor-pointer"
                >
                  Portfolio
                </button>
              ) : (
                /* GET STARTED BUTTON */
                <div className="pt-1 w-full">
                  <Link 
                    href="/login" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center justify-center w-full bg-[#0F172A] hover:bg-slate-800 text-white text-[16px] font-bold py-3.5 rounded-xl transition-all shadow-sm active:scale-[0.98]"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[960px] mx-auto px-4 sm:px-6 pt-8 md:pt-12">
        
      {/* COMPANY HERO BANNER (Side-by-Side Mobile Layout) */}
        <div className="mb-8 sm:mb-10 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm flex flex-row items-center justify-between gap-3">
          
          {/* LEFT: Logo, Name, and Ticker */}
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            {/* Logo scales down slightly on mobile to save space */}
            <CompanyLogo ticker={ticker} containerClass="w-12 h-12 sm:w-20 sm:h-20 shrink-0" />
            
            <div className="flex flex-col justify-center gap-1 min-w-0">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-none truncate">
                {profile.companyName}
              </h1>
              
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5">
                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-slate-200">
                  {profile.symbol}
                </span>
                {/* Exchange only shows on larger screens to save horizontal space */}
                <span className="hidden sm:inline">• {profile.exchangeShortName}</span>
              </div>
            </div>
          </div>

          {/* RIGHT: Price and Price Change */}
          <div className="flex flex-col items-end justify-center shrink-0 text-right">
            <span className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              ${profile.price?.toFixed(2)}
            </span>
            
            <div className={`flex items-center gap-1 text-[11px] sm:text-base font-extrabold mt-1 sm:mt-1.5 ${isPositiveChange ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositiveChange ? <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0" /> : <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0" />}
              <span className="whitespace-nowrap">
                {profile.changes > 0 ? '+' : ''}{profile.changes?.toFixed(2)} ({((profile.changes / (profile.price - profile.changes)) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
          
        </div>

        {/* ANALYSIS STATES */}
        {isAnalyzing ? (
          <div className="mb-10 bg-white border border-slate-200 rounded-3xl p-12 flex flex-col items-center justify-center text-center animate-pulse shadow-sm">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-6" />
            <h2 className="text-xl font-extrabold text-[#0F172A] mb-3 tracking-tight">Analyzing Live Market Data</h2>
            <p className="text-[14px] font-medium text-slate-500 max-w-md">Reading SEC filings, transcripts, and news for {profile.companyName}...</p>
          </div>
        ) : (!aiData || aiError) ? (
          <div className="mb-10 bg-white border border-rose-200 rounded-3xl p-8 flex flex-col items-start gap-4 shadow-sm">
            <h2 className="text-lg font-bold text-rose-700 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Analysis Interrupted</h2>
            <div className="w-full bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-600 overflow-x-auto">
              {aiError || "No response generated."}
            </div>
            <button onClick={() => fetchResearchData(profile)} className="bg-[#0F172A] text-white text-[13px] font-bold px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors mt-2 cursor-pointer">Retry Analysis</button>
          </div>
        ) : null}

        {!isAnalyzing && aiData && (
          <>
            {viewMode === 'dashboard' && savedThesis ? (
              // ==========================================
              // VIEW 1: NEUTRALIZED THESIS DASHBOARD
              // ==========================================
              <div className="w-full">
              
              {/* Modal Logic */}
              {(() => {
                const currentPrice = profile?.price || 0;
                const priceChange = profile?.changes || 0;
                const previousClose = currentPrice - priceChange;
                
                // Prevent division by zero, calculate the actual percentage
                const percentMove = previousClose > 0 ? (priceChange / previousClose) * 100 : 0;

                return (
                  <ShareModal
                    isOpen={isShareOpen}
                    onClose={() => setIsShareOpen(false)}
                    ticker={ticker}
                    percentMove={percentMove} 
                    status={isHighRisk ? 'weakening' : 'strengthening'}
                    evidence={aiData?.updates?.[0]?.headline || "Monitoring SEC filings and key performance drivers."}
                    username="investor" 
                  />
                );
              })()}

                {/* MY INVESTMENT THESIS */}
                <section className="mb-16">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">My Investment Thesis</p>
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Why I invested</h3>
                    <p className="text-[14px] text-[#0F172A] font-bold leading-relaxed">{savedThesis.summary || "No summary provided."}</p>
                  </div>
                </section>

                <hr className="border-slate-200 mb-16" />

                {/* WHY I INVESTED (DRIVERS) */}
                <section className="mb-16">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Why I Invested</p>
                  <div className="space-y-4">
                    {activeDrivers.map((driver, idx) => {
                      const status = getDynamicStatus(driver.title, 'driver');
                      return (
                        <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-6 items-start justify-between hover:border-slate-300 transition-colors">
                          <div className="flex-1">
                            <h4 className="text-[15px] font-bold text-[#0F172A] mb-2">{driver.title}</h4>
                            <p className="text-[13px] font-medium text-slate-600 leading-relaxed">{driver.whyThisMatters?.trim() || 'No explanation was saved for this driver.'}</p>
                          </div>
                          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest shrink-0 mt-1">
                            <span className={status.dotColor}>●</span> {status.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <hr className="border-slate-200 mb-16" />

                {/* RISKS I'M WATCHING */}
                <section className="mb-16">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Risks I'm Watching</p>
                  <div className="space-y-4">
                    {activeRisks.map((risk, idx) => {
                      const status = getDynamicStatus(risk.title, 'risk');
                      return (
                        <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-6 items-start justify-between hover:border-slate-300 transition-colors">
                          <div className="flex-1">
                            <h4 className="text-[15px] font-bold text-[#0F172A] mb-2">{risk.title}</h4>
                            <p className="text-[13px] font-medium text-slate-600 leading-relaxed">{risk.whyThisMatters?.trim() || 'No explanation was saved for this risk.'}</p>
                          </div>
                          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest shrink-0 mt-1">
                            <span className={status.dotColor}>●</span> {status.label}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <hr className="border-slate-200 mb-16" />

                {/* WHAT'S CHANGED */}
                <section className="mb-16">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">What's Changed</p>
                  <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Latest earnings / filings</h3>
                    <div className="space-y-4">
                      {(aiData.updates || []).map((update: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          {getTrendIcon(update.type)}
                          <div>
                            <span className="text-[14px] font-bold text-[#0F172A] block mb-1">{update.headline}</span>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{update.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>

                {/* YOU MAY WANT TO CONSIDER */}
                {suggestedConsiderations.length > 0 && (
                  <>
                    <hr className="border-slate-200 mb-16" />
                    <section className="mb-16">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">You May Want To Consider</p>
                      <div className="grid gap-6 md:grid-cols-2">
                        {suggestedConsiderations.map((item, idx) => (
                          <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col hover:border-slate-300 transition-colors">
                            <h4 className="text-[14px] font-bold text-[#0F172A] mb-3">{item.title}</h4>
                            <p className="text-[13px] font-medium text-slate-500 mb-8 flex-grow leading-relaxed">
                              Recent developments could affect this assumption.
                            </p>
                            <Link 
                              href={`/build-thesis/${ticker}`}
                              className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[12px] font-bold text-[#0F172A] hover:bg-slate-100 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" /> Add to My Thesis
                            </Link>
                          </div>
                        ))}
                      </div>
                    </section>
                  </>
                )}

                <hr className="border-slate-200 mb-16" />

                {/* THESIS STATUS */}
                <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Thesis Status</p>
                    <div className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
                      <span className={isHighRisk ? 'text-rose-500' : 'text-emerald-500'}>●</span>
                      {isHighRisk ? 'Elevated Risk' : 'Strengthening'}
                    </div>
                    <p className="text-[11px] font-medium text-slate-500 mt-2">Last reviewed: {reviewDate}</p>
                  </div>
                  
                  <div className="flex gap-4 w-full md:w-auto">
                    <button 
                      onClick={() => setViewMode('research')}
                      className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-[#0F172A] text-[13px] font-bold rounded-lg transition-colors"
                    >
                      Review Updates
                    </button>
                    <Link 
                      href={`/build-thesis/${ticker}`}
                      className="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-3 bg-[#0F172A] hover:bg-slate-800 text-white text-[13px] font-bold rounded-lg transition-colors shadow-sm"
                    >
                      Modify Thesis
                    </Link>
                  </div>
                </section>
              </div>
            ) : (
              // ==========================================
              // VIEW 2: NEUTRALIZED AI RESEARCH PAGE
              // ==========================================
              <div className="mb-12">
                
           {/* OVERALL ASSESSMENT & SNAPSHOT */}
                <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm mb-12">
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Overall Assessment</h2>
                  
                  {/* Title & Lifecycle Badge */}
                  <div className="flex flex-wrap items-center gap-4 mb-8">
                    <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{aiData?.ratingTitle}</span>
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-widest border border-slate-200 bg-slate-50 px-3.5 py-1.5 rounded-full">
                      <span className={lifecycle.dot}>●</span> {lifecycle.label}
                    </div>
                  </div>

                  {/* Grid: Paragraph & Snapshot start at the exact same vertical position */}
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
                    
                    {/* Left Column: Summary Paragraph + Strengths & Watch Points */}
                    <div className="md:col-span-3 flex flex-col">
                      <p className="text-[15px] text-slate-700 font-medium leading-relaxed">{aiData?.overallAssessment}</p>

                      <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Key Strengths</p>
                          <div className="space-y-4">
                            {(aiData.strengths ?? []).map((strength: string, i: number) => (
                              <p key={i} className="text-[13px] text-slate-700 font-medium flex gap-3 leading-snug"><span className="text-emerald-500 text-[10px] mt-1 shrink-0">●</span> {strength}</p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Watch Points</p>
                          <div className="space-y-4">
                            {(aiData.risks ?? []).map((risk: string, i: number) => (
                              <p key={i} className="text-[13px] text-slate-700 font-medium flex gap-3 leading-snug"><span className="text-amber-500 text-[10px] mt-1 shrink-0">●</span> {risk}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Quick Snapshot Card */}
                    <div className="md:col-span-2 bg-slate-50 rounded-3xl p-8 border border-slate-200 self-start w-full">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Quick Snapshot</p>
                      <div className="space-y-5">
                        {['quality', 'management', 'valuation', 'understandability', 'financialStrength', 'compoundingPower'].map((key) => {
                          const data = aiData.pillars?.[key];
                          if (!data) return null;
                          const dotColor = data.color === 'green' ? 'text-emerald-500' : data.color === 'yellow' ? 'text-amber-500' : 'text-rose-500';
                          return (
                            <div key={key} className="flex justify-between items-center border-b border-slate-200/60 pb-4 last:border-0 last:pb-0">
                              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                              <span className="text-[13px] font-bold text-[#0F172A] flex items-center gap-2">
                                <span className={`${dotColor} text-[10px]`}>●</span>{data.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>
                </div>

                  {/* LIVE EVALUATION */}
                <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm mb-12">
                  <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Live Evaluation</h3>
                  <p className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-8">What's Changed Recently</p>
                  
                  <div className="space-y-4">
                    {(aiData?.updates || []).map((update: any, i: number) => {
                      const isPositive = update.type === 'positive';
                      const isNegative = update.type === 'negative';
                      
                      const statusLabel = isPositive ? 'Strengthening' : isNegative ? 'Monitoring' : 'Stable';
                      const statusDot = isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-slate-400';

                      return (
                        <div 
                          key={i} 
                          className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-colors"
                        >
                          {/* Left: Arrow + Title + Subtitle */}
                          <div className="flex items-start gap-4 flex-1">
                            <span className={`text-lg font-bold shrink-0 mt-0.5 ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-slate-400'}`}>
                              {isPositive ? '↑' : isNegative ? '↓' : '—'}
                            </span>
                            <div>
                              <h4 className="text-[15px] font-bold text-[#0F172A] leading-snug mb-1">
                                {update.headline}
                              </h4>
                              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                                {update.impact}
                              </p>
                            </div>
                          </div>

                          {/* Right: Status */}
                          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest shrink-0 self-start sm:self-auto pl-8 sm:pl-0">
                            <span className={statusDot}>●</span> {statusLabel}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
 

                {/* DEEP DIVE */}
                <div className="space-y-6">
                  {(aiData?.deepDive || []).map((item: any, i: number) => (
                    <ProgressiveCard key={i} question={item.question} statusText={item.statusText} statusType={item.statusType} summary={item.summary} evidence={item.evidence} />
                  ))}
                </div>

                {/* THESIS BUILDER LAUNCHPAD */}
                <div id="build-thesis-section" className="mt-20 pt-16 border-t border-slate-200">
                  <div className="bg-[#0F172A] text-white p-10 md:p-14 rounded-3xl border border-slate-800 max-w-4xl mx-auto shadow-xl">
                    <div className="text-center max-w-2xl mx-auto mb-12">
                      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight mb-4">Build Your Investment Thesis for {ticker}</h2>
                      <p className="text-slate-400 text-[15px] font-medium leading-relaxed">Record why you're investing in {profile.companyName}. Choose the key drivers and risks that matter to you. Investment IQ tracks them over time.</p>
                    </div>

                    <div className="space-y-4 mb-12 max-w-2xl mx-auto">
                      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6 flex items-start gap-5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold shrink-0 text-[13px]">1</div>
                        <div>
                          <h3 className="font-bold text-white text-[15px] mb-1">Build Your Thesis</h3>
                          <p className="text-[13px] text-slate-400 font-medium">Select your investment drivers and risks.</p>
                        </div>
                      </div>
                      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6 flex items-start gap-5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold shrink-0 text-[13px]">2</div>
                        <div>
                          <h3 className="font-bold text-white text-[15px] mb-1">AI Thesis Tracking</h3>
                          <p className="text-[13px] text-slate-400 font-medium">News • Earnings calls • SEC filings • Financials</p>
                        </div>
                      </div>
                      <div className="bg-[#1E293B] border border-slate-700/50 rounded-2xl p-6 flex items-start gap-5">
                        <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center font-bold shrink-0 text-[13px]">3</div>
                        <div>
                          <h3 className="font-bold text-white text-[15px] mb-1">Monitor Conviction</h3>
                          <p className="text-[13px] text-slate-400 font-medium">Clear signals when your core assumptions shift.</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-800 pt-8">
                      <div className="flex items-center gap-2 text-[13px] text-slate-400 font-medium">
                        <span className="text-emerald-500 font-bold">✓</span>
                        <span>{!isLoggedIn ? "Sign in to save your thesis." : (savedThesis ? "Modify your active thesis drivers anytime." : "Launch builder to save your thesis.")}</span>
                      </div>
                      <button onClick={handleLaunchBuilder} className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold px-8 py-3.5 rounded-lg transition-colors">
                        {savedThesis ? 'Modify Saved Thesis →' : 'Build My Thesis →'}
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}