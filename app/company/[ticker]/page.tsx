'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { 
  Building2, TrendingUp, TrendingDown, Globe, Loader2, AlertCircle, Plus, Activity, Check, Info, ChevronDown, ChevronUp, Share2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCompanyProfile } from '@/lib/fmp';
import SmartSearchBar from '@/components/SmartSearchBar';
import { useRouter, useSearchParams } from 'next/navigation';
import { ShareModal } from '@/components/ShareModal';

export function CompanyLogo({ ticker, containerClass }: { ticker: string, containerClass: string }) {
  const [imgSrc, setImgSrc] = useState(`https://financialmodelingprep.com/image-stock/${ticker}.png`);
  const [isFallback, setIsFallback] = useState(false);

  // If the ticker changes, reset the image source
  useEffect(() => {
    setImgSrc(`https://financialmodelingprep.com/image-stock/${ticker}.png`);
    setIsFallback(false);
  }, [ticker]);

  return (
    // Completely transparent container wrapper
    <div className={`flex items-center justify-center shrink-0 ${containerClass}`}>
      <img 
        src={imgSrc} 
        alt={ticker}
        className={`w-full h-full ${
          isFallback 
            ? 'object-cover rounded-xl shadow-sm border border-slate-200' 
            // ✨ THE MAGIC FIX: drop-shadow traces the actual logo shape, making white text visible!
            : 'object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
        }`}
        onError={() => {
          // When FMP fails, swap to the generated letter (which includes its own background)
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

  // Minimalist dot styles
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

      let liveProfile: any = await getCompanyProfile(ticker);
      if (Array.isArray(liveProfile) && liveProfile.length > 0) liveProfile = liveProfile[0];
      setProfile(liveProfile);

      let foundCache = false;

      try {
        const { data: cacheData } = await supabase.from('ai_cache').select('*').eq('ticker', ticker).order('updated_at', { ascending: false }).limit(1).maybeSingle();
        if (cacheData && cacheData.ai_data) {
          let cachedPayload = cacheData.ai_data;
          if (typeof cachedPayload === 'string') {
            try { cachedPayload = JSON.parse(cachedPayload); } catch (e) {}
          }
          setAiData(cachedPayload);
          foundCache = true;
        }
      } catch (err) {}

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        const { data: thesis } = await supabase.from('theses').select('*').eq('user_id', session.user.id).ilike('ticker', ticker).maybeSingle();

        if (thesis) {
          setSavedThesis(thesis);
          
          // ✨ FIX: Check the URL. If it says ?view=research, open the research view!
          const requestedView = searchParams.get('view');
          setViewMode(requestedView === 'research' ? 'research' : 'dashboard');
          
   const { data: optionsCache } = await supabase.from('thesis_options_cache').select('data').ilike('ticker', ticker).maybeSingle();
          if (optionsCache && optionsCache.data) {
            const allDrivers = optionsCache.data.drivers || [];
            const allRisks = optionsCache.data.risks || [];

            // ✨ THE FIX: Safely parse strings into arrays before checking!
            const isSelected = (item: any, savedData: any) => {
              let arr = savedData;
              
              // If Supabase returned stringified JSON, parse it into an array
              if (typeof arr === 'string') {
                try { arr = JSON.parse(arr); } catch(e) { arr = []; }
              }
              
              // Failsafe: if it's still not an array, treat it as empty
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
        
        } else setViewMode('research');
      } else {
        setIsLoggedIn(false);
        setViewMode('research');
      }

      if (!foundCache && liveProfile) {
        setIsLoading(false);
        await fetchResearchData(liveProfile);
      } else setIsLoading(false);
    }

    initPage();
  }, [ticker]);

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
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-[960px] mx-auto px-6 py-3 flex items-center justify-between gap-8">
          {/* ✨ LOGO FIX: Explicitly wrapped in a div so Link doesn't break flex alignment */}
          <Link href="/" className="shrink-0">
            <div className="font-extrabold text-xl tracking-tight flex items-center gap-2.5 cursor-pointer text-[#0F172A]">
              Investment IQ
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
                <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
                <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
              </span>
            </div>
          </Link>

          <div className="hidden sm:block flex-1 max-w-sm"><SmartSearchBar /></div>
          
          <div className="flex items-center gap-4 shrink-0">
            {savedThesis && (
              <button 
                onClick={() => setViewMode(viewMode === 'dashboard' ? 'research' : 'dashboard')} 
                className="text-[13px] font-bold text-blue-600 hover:text-blue-800 transition-colors"
              >
                {viewMode === 'dashboard' ? 'View Research →' : 'My Dashboard →'}
              </button>
            )}
            {isLoggedIn ? (
              <button onClick={() => router.push('/dashboard')} className="px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-[#0F172A] hover:bg-slate-50 transition-colors">
                ← Portfolio
              </button>
            ) : (
              <Link href="/login" className="bg-[#0F172A] text-white text-[13px] font-bold px-5 py-2.5 rounded-lg hover:bg-slate-800 transition-colors">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-[960px] mx-auto px-6 pt-12 md:pt-16">
        
        {/* COMMON HERO SECTION */}
        <div className="mb-12 flex flex-col md:flex-row justify-between md:items-start gap-8">
          <div className="flex items-center gap-6">
           
           <CompanyLogo ticker={ticker} containerClass="w-14 h-14" />
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{profile.companyName}</h1>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200">{profile.symbol}</span>
                <span>• {profile.exchangeShortName}</span>
              </div>
            </div>
          </div>
          <div className="text-left md:text-right flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 hidden md:block">Current Price</p>
            <p className="text-3xl font-extrabold tracking-tight">${profile.price?.toFixed(2)}</p>
            <div className={`flex items-center gap-1.5 text-[14px] font-bold mt-1 md:justify-end ${isPositiveChange ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{profile.changes > 0 ? '+' : ''}{profile.changes?.toFixed(2)} ({((profile.changes / (profile.price - profile.changes)) * 100).toFixed(2)}%)</span>
            </div>
          </div>
        </div>

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
            <button onClick={() => fetchResearchData(profile)} className="bg-[#0F172A] text-white text-[13px] font-bold px-6 py-2.5 rounded-lg hover:bg-slate-800 transition-colors mt-2">Retry Analysis</button>
          </div>
        ) : null}

        {!isAnalyzing && aiData && (
          <>
            {viewMode === 'dashboard' && savedThesis ? (
              // ==========================================
              // VIEW 1: NEUTRALIZED THESIS DASHBOARD
              // ==========================================
              
              /* ✨ WIDTH FIX: Removed max-w-[800px] so it fills the 960px container perfectly */
              <div className="w-full">
                
               {/* ACTION BAR: SHARE BUTTON & STATUS BADGE */}
                <div className="mb-12 flex items-center justify-between">
                  <button 
                    onClick={() => setIsShareOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-extrabold text-slate-700 bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    Share Thesis ↗
                  </button>

                  <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest bg-white border border-slate-200 px-4 py-2 rounded-full shadow-sm">
                    <span className={isHighRisk ? 'text-rose-500' : 'text-emerald-500'}>●</span>
                    {isHighRisk ? 'Thesis Under Pressure' : 'Thesis Strengthening'}
                  </div>
                </div>

              {/* 1. Calculate the percentage move safely */}
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
      // Pass the calculated math right into the modal!
      percentMove={percentMove} 
      // Keep your dynamic thesis status
      status={isHighRisk ? 'weakening' : 'strengthening'}
      // Use the latest AI headline as the evidence
      evidence={aiData?.updates?.[0]?.headline || "Monitoring SEC filings and key performance drivers."}
      username="investor" // (You can map this to their real username later!)
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
                            <p className="text-[13px] font-medium text-slate-600 leading-relaxed">{driver.whyThisMatters}</p>
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
                            <p className="text-[13px] font-medium text-slate-600 leading-relaxed">{risk.whyThisMatters}</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
                    <div className="md:col-span-3 flex flex-col">
                      <div>
                        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Overall Assessment</h2>
                        <div className="flex flex-wrap items-center gap-4 mb-6">
                          <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{aiData?.ratingTitle}</span>
                          <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest border border-slate-200 px-3 py-1.5 rounded-full">
                            <span className={aiData?.ratingBadge?.includes('Risk') ? 'text-rose-500' : 'text-emerald-500'}>●</span> {aiData?.ratingBadge}
                          </div>
                        </div>
                        <p className="text-[15px] text-slate-700 font-medium leading-relaxed max-w-2xl">{aiData?.overallAssessment}</p>
                      </div>

                      <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Key Strengths</p>
                          <div className="space-y-4">
                            {(aiData?.strengths || ["Durable Market Moat", "Strong Balance Sheet", "Predictable Cash Flows"]).map((strength: string, i: number) => (
                              <p key={i} className="text-[13px] text-slate-700 font-medium flex gap-3 leading-snug"><span className="text-emerald-500 text-[10px] mt-1 shrink-0">●</span> {strength}</p>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Watch Points</p>
                          <div className="space-y-4">
                            {(aiData?.risks || ["Macro Sensitivity", "Valuation Multiple", "Competitive Pressure"]).map((risk: string, i: number) => (
                              <p key={i} className="text-[13px] text-slate-700 font-medium flex gap-3 leading-snug"><span className="text-amber-500 text-[10px] mt-1 shrink-0">●</span> {risk}</p>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="md:col-span-2 bg-slate-50 rounded-3xl p-8 border border-slate-200 self-start w-full">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Quick Snapshot</p>
                      <div className="space-y-5">
                        {['quality', 'management', 'valuation', 'understandability', 'financialStrength', 'compoundingPower'].map((key) => {
                          const data = aiData?.pillars?.[key] || { label: 'Medium', color: 'yellow' };
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                    {(aiData?.updates || []).map((update: any, i: number) => (
                      <div key={i} className="flex flex-col h-full bg-slate-50 p-6 rounded-2xl border border-slate-200">
                        {getTrendIcon(update.type)}
                        <span className="text-[14px] font-bold text-[#0F172A] mt-3 mb-4 leading-snug">{update.headline}</span>
                        <p className="text-[10px] mt-auto font-bold uppercase tracking-widest text-slate-500">{update.impact}</p>
                      </div>
                    ))}
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
                      <p className="text-slate-400 text-[15px] font-medium leading-relaxed">Record why you're investing in {profile.companyName}. Select key fundamental drivers and risks, and Investment IQ tracks them automatically.</p>
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
                          <h3 className="font-bold text-white text-[15px] mb-1">AI Quarterly Tracking</h3>
                          <p className="text-[13px] text-slate-400 font-medium">Earnings calls • SEC filings • Financials</p>
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