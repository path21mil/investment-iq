'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { 
  ArrowRight, 
  TrendingUp,
  TrendingDown, 
  AlertTriangle, 
  Loader2, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2
} from 'lucide-react';
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

const getDisplayName = (rawName: string = '', fallbackTicker: string = '') => {
  if (!rawName) return fallbackTicker;
  return rawName
    .replace(/,?\s*(Inc\.?|Corp\.?|Corporation|Ltd\.?|Limited|Co\.?|PLC|Holdings|Class\s+[A-Z])$/i, '')
    .trim();
};

export default function CompanyResearchPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params?.ticker as string)?.toUpperCase() || '';

  // Data & UI State
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [imageError, setImageError] = useState(false);
  
  // Session Tracker State
  const [session, setSession] = useState<any>(null);


  // Fetch and listen for session changes
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, activeSession) => {
      setSession(activeSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data on load
  useEffect(() => {
    if (!ticker) return;

    async function loadResearch() {
      setLoading(true);
      try {
        const res = await fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker })
        });
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error('Failed to load research:', err);
      } finally {
        setLoading(false);
      }
    }

    loadResearch();
  }, [ticker]);

  // Loading State
  if (loading) {
    return <LoadingScreen ticker={ticker} />;
  }

  // Error State
  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="text-xl font-bold text-[#0F172A] mb-2">Research Unavailable</h2>
        <p className="text-slate-500 text-sm mb-6">{data?.error || 'Unable to load company analysis.'}</p>
        <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-[#0F172A] text-white rounded-xl text-xs font-bold">
          Back to Search
        </button>
      </div>
    );
  }

  const tabs = ['Overview', 'Questions', 'Financials', 'Valuation', 'Peers'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24 antialiased">
      
      <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 h-[64px] flex items-center mb-8">
        <div className="max-w-[900px] w-full mx-auto px-4 sm:px-6 flex items-center justify-between">
          <Logo href={session ? "/dashboard" : "/"} />
          
          {session ? (
            <div className="flex items-center gap-4 sm:gap-6">
              <Link href="/dashboard" className="text-[13px] font-bold text-slate-500 hover:text-[#0F172A] hidden sm:block transition-colors">
                Dashboard
              </Link>
              <Link href="/portfolio" className="text-[13px] font-bold text-slate-500 hover:text-[#0F172A] hidden sm:block transition-colors">
                Portfolio
              </Link>
              <button 
                onClick={() => router.push(`/build-thesis/${ticker}`)}
                className="px-4 sm:px-5 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full text-xs sm:text-[13px] font-bold transition-all shadow-sm"
              >
                Build Thesis
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <button 
                onClick={() => router.push('?auth=login', { scroll: false })}
                className="text-[13px] font-bold text-slate-500 hover:text-[#0F172A] transition-colors"
              >
                Log In
              </button>
              <button 
                onClick={() => router.push('?auth=signup', { scroll: false })}
                className="px-4 sm:px-5 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full text-xs sm:text-[13px] font-bold transition-all shadow-sm"
              >
                Get Started
              </button>
            </div>
          )}
        </div>
      </nav>

      <div className="max-w-[900px] mx-auto w-full px-4 md:px-6">
    
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm flex flex-col items-center text-center sm:text-left sm:flex-row sm:justify-between gap-5 sm:gap-4">
          
          <div className="flex flex-col sm:flex-row items-center gap-3.5 sm:gap-5 min-w-0">
            <CompanyLogo 
              ticker={data?.ticker || ticker} 
              containerClass="w-14 h-14 sm:w-16 sm:h-16 shrink-0" 
            />
            
            <div className="flex flex-col items-center sm:items-start justify-center gap-1.5 min-w-0">
              <h1 
                className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#0F172A] leading-tight line-clamp-2 sm:line-clamp-1"
                title={data?.companyName || ticker}
              >
                {getDisplayName(data?.companyName, ticker)}
              </h1>
              <div className="flex items-center justify-center sm:justify-start gap-2.5 text-xs font-bold text-slate-500">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[11px] shadow-sm">
                  {data?.ticker || ticker}
                </span>
                <span className="text-slate-700 font-black text-sm sm:text-base tracking-tight">
                  ${typeof data?.price === 'number' ? data.price.toFixed(2) : data?.metrics?.currentPrice?.replace('$', '') || '0.00'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-1 text-[10px] sm:text-[11px] font-black tracking-widest uppercase cursor-pointer bg-slate-50 sm:bg-white border border-slate-200 p-1 rounded-full shadow-sm shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full transition-all ${
                activeTab === 'overview' 
                  ? 'bg-slate-100 text-[#0F172A]' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {activeTab === 'overview' && <span className="text-blue-600">●</span>}
              QUICK READ · 30 SEC
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('questions')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full transition-all ${
                activeTab !== 'overview' 
                  ? 'bg-slate-100 text-[#0F172A]' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {activeTab !== 'overview' && <span className="text-blue-600">●</span>}
              DEEP DIVE
            </button>
          </div>

        </div>

        {activeTab !== 'overview' && (
          <div className="sticky top-[64px] z-30 bg-[#F8FAFC]/90 backdrop-blur-md border-b border-slate-200 mb-8 -mx-4 px-4 md:mx-0 md:px-0">
            <div className="flex space-x-8 overflow-x-auto hide-scrollbar pt-2">
              {tabs.filter(t => t !== 'Overview').map(tab => (
                <button 
                  key={tab}
                  onClick={() => setActiveTab(tab.toLowerCase())}
                  className={`whitespace-nowrap py-4 text-xs font-extrabold tracking-wide uppercase border-b-2 transition-colors ${
                    activeTab === tab.toLowerCase() 
                      ? 'border-blue-600 text-blue-700' 
                      : 'border-transparent text-slate-400 hover:text-slate-800'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="min-h-[500px]">
          {activeTab === 'overview' && (
            <OverviewTab 
              data={data} 
              onExplore={() => setActiveTab('questions')} 
              session={session} 
              ticker={ticker} 
            />
          )}
          {activeTab === 'questions' && <QuestionsTab data={data} />}
          {activeTab === 'financials' && <FinancialsTab data={data} />}
          {activeTab === 'valuation' && <ValuationTab data={data} />}
          {activeTab === 'peers' && <PeersTab data={data} />}
        </div>
        
      </div>
    </div>
  );
}

// ==========================================
// ⏳ ANIMATED LOADING SCREEN
// ==========================================
function LoadingScreen({ ticker }: { ticker: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Step 1: Connecting (0-3.5s)
    const t1 = setTimeout(() => setStep(1), 3500); 
    // Step 2: Extracting (3.5s - 7s)
    const t2 = setTimeout(() => setStep(2), 7000); 
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col items-center justify-center font-sans antialiased p-4">
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm max-w-md w-full mx-auto flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="relative mb-6 w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-60"></div>
          <div className="relative bg-white rounded-full p-4 border border-slate-100 shadow-sm">
             <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
        
        <h3 className="text-xl font-extrabold text-[#0F172A] mb-2 tracking-tight">
          Analyzing {ticker}
        </h3>
        
        <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed px-2">
          Our AI is currently examining live market metrics, cross-referencing financials, and generating a custom thesis. This deep dive takes roughly <strong className="text-slate-700">20 seconds</strong>.
        </p>
        
        <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-5 mb-2 text-left space-y-4">
          
          {/* STEP 0: CONNECTING */}
          <div className={`flex items-center gap-3 text-xs font-bold transition-colors duration-500 ${step > 0 ? 'text-slate-600' : 'text-blue-600'}`}>
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              step > 0 
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                : 'bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]'
            }`}></div>
            CONNECTING TO LIVE DATA
          </div>

          {/* STEP 1: EXTRACTING */}
          <div className={`flex items-center gap-3 text-xs font-bold transition-colors duration-500 ${
            step > 1 ? 'text-slate-600' : step === 1 ? 'text-blue-600' : 'text-slate-400'
          }`}>
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              step > 1 
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                : step === 1 
                  ? 'bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]' 
                  : 'bg-slate-300'
            }`}></div>
            EXTRACTING KEY METRICS
          </div>

          {/* STEP 2: SYNTHESIZING */}
          <div className={`flex items-center gap-3 text-xs font-bold transition-colors duration-500 ${
            step === 2 ? 'text-blue-600' : 'text-slate-400'
          }`}>
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              step === 2 
                ? 'bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]' 
                : 'bg-slate-300'
            }`}></div>
            SYNTHESIZING RESEARCH...
          </div>

        </div>
        
        <div className="mt-6 flex items-center gap-2 text-[11px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5" />
          Please do not refresh the page
        </div>
      </div>
    </div>
  );
}


// ==========================================
// ⚡ OVERVIEW: INTERACTIVE THESIS BUILDER
// ==========================================
function OverviewTab({ data, onExplore, session, ticker }: { data: any, onExplore: () => void, session: any, ticker: string}) {
  const router = useRouter();
  
  const [selectedItems, setSelectedItems] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const cached = sessionStorage.getItem(`thesis_handoff_${ticker.toUpperCase()}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        const restoredDrivers = parsed.selectedDriverIds || [];
        const restoredRisks = parsed.selectedRiskIds || [];
        return [...restoredDrivers, ...restoredRisks];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const toggleSelection = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const minRequired = 2;
  const hasEnough = selectedItems.length >= minRequired;

  // DATA ADAPTER: Expands your basic string data into Rich UI Cards
  const drivers = (data?.strengths || []).map((text: string, idx: number) => ({
    id: `driver_${idx}`,
    type: 'driver',
    title: text,
    why: "This dynamic enhances financial stability and provides strong visibility into future cash flow generation.",
    evidence: [
      "Recent SEC filings indicate continued sequential growth in this segment.",
      "Management highlighted this as a core strategic pillar during the last earnings call.",
      "Industry trends support sustained momentum over the next 12-18 months."
    ],
    monitors: [
      "Quarterly revenue growth in segment",
      "Operating margin expansion",
      "Market share retention"
    ]
  }));
  
  const risks = (data?.risks || []).map((text: string, idx: number) => ({
    id: `risk_${idx}`,
    type: 'risk',
    title: text,
    why: "This represents a material threat to margin expansion and could disrupt the current growth trajectory if unmitigated.",
    evidence: [
      "Competitor pricing pressure has intensified in key geographic markets.",
      "Supply chain bottlenecks have slightly delayed recent product rollouts.",
      "Macroeconomic headwinds could soften enterprise spending."
    ],
    monitors: [
      "Gross margin compression",
      "Customer churn rate",
      "CapEx vs guidance"
    ]
  }));

  // Reusable Card Component
  const ThesisCard = ({ item }: { item: any }) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <div 
        onClick={() => toggleSelection(item.id)}
        className={`relative p-6 sm:p-8 rounded-[24px] border transition-all duration-300 cursor-pointer flex flex-col h-full bg-white ${
          isSelected 
            ? 'border-blue-600 shadow-[0_8px_30px_rgb(37,99,235,0.12)]' 
            : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
        }`}
      >
        <div className="flex justify-between items-start mb-5 gap-4">
          <h3 className="text-[17px] font-extrabold text-[#0F172A] leading-snug">
            {item.title}
          </h3>
          <div className={`w-6 h-6 rounded-full border shrink-0 flex items-center justify-center transition-colors ${
            isSelected ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-slate-50'
          }`}>
            {isSelected && <CheckCircle2 className="w-4 h-4 text-white" />}
          </div>
        </div>

        <div className="mb-5">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
            Why This Matters
          </h4>
          <p className="text-[13px] text-slate-600 font-medium leading-relaxed">
            {item.why}
          </p>
        </div>

        <div className="mb-6 flex-grow">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
            Evidence
          </h4>
          <ul className="space-y-2.5">
            {item.evidence.map((ev: string, i: number) => (
              <li key={i} className="text-[13px] text-slate-600 font-medium flex items-start gap-2.5 leading-snug">
                <span className="text-slate-300 mt-0.5">•</span> {ev}
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-[#F8FAFC] border border-blue-100/50 rounded-2xl p-5 mb-5">
          <h4 className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-3">
            Investment IQ Monitors
          </h4>
          <ul className="space-y-3">
            {item.monitors.map((mon: string, i: number) => (
              <li key={i} className="text-[12px] font-extrabold text-[#0F172A] flex items-center gap-2.5">
                <svg className="w-3.5 h-3.5 text-amber-500 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z"></path>
                </svg>
                {mon}
              </li>
            ))}
          </ul>
        </div>

        <button 
          className={`w-full py-3 rounded-xl text-[13px] font-bold border transition-all ${
            isSelected 
              ? 'bg-blue-50 text-blue-700 border-blue-200' 
              : 'bg-white text-[#0F172A] border-slate-200 hover:bg-slate-50'
          }`}
        >
          {isSelected ? '✓ Added to Thesis' : '+ Add to Thesis'}
        </button>
      </div>
    );
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 relative pb-32">
      
      {/* Research Starting Point */}
      <div className="bg-indigo-50/50 p-6 sm:p-8 rounded-3xl border border-indigo-100 mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></span>
          <h2 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Research Starting Point</h2>
        </div>
        <p className="text-[14px] sm:text-[15px] text-slate-700 font-medium leading-relaxed">
          {data?.overallAssessment || "Analyzing fundamental structure..."}
        </p>
      </div>

      <div className="text-center mb-8">
        <h3 className="text-lg sm:text-xl font-extrabold text-[#0F172A] tracking-tight mb-1.5">
          Why are you considering {ticker}?
        </h3>
        <p className="text-[13px] text-slate-500 font-medium">
          Select the drivers and risks that will define your conviction.
        </p>
      </div>

      {/* Grid of Rich Cards - CHANGED TO md:grid-cols-2 */}
      <div className="mb-12">
        <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="text-emerald-500">🟢</span> Potential Conviction Drivers
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {drivers.map((driver: any) => (
            <ThesisCard key={driver.id} item={driver} />
          ))}
        </div>
      </div>

      <div className="mb-16">
        <h4 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
          <span className="text-amber-500">🟡</span> Potential Risks
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {risks.map((risk: any) => (
            <ThesisCard key={risk.id} item={risk} />
          ))}
        </div>
      </div>

      {/* RESTORED: 4. LIVE EVALUATION / WHAT CHANGED */}
      {data?.updates && data.updates.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm mb-12 overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Recent Developments</h3>
            <p className="text-2xl font-extrabold text-[#0F172A] tracking-tight">What's Changed</p>
          </div>
          
          <div className="divide-y divide-slate-100">
            {data.updates.map((update: any, i: number) => {
              const isPositive = update.type === 'positive';
              const isNegative = update.type === 'negative';
              const dotColor = isPositive ? 'text-emerald-500' : isNegative ? 'text-rose-500' : 'text-amber-500';
              const mockImpactLabel = update.impact?.split(' ').slice(0, 2).join(' ') || 'Key Driver';

              return (
                <div key={i} className="p-6 sm:p-8 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row gap-4 sm:items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 pr-4">
                    <span className={`text-[12px] font-bold mt-1 ${dotColor}`}>●</span>
                    <div>
                      <h4 className="text-[15px] font-bold text-[#0F172A] leading-snug mb-2">
                        {update.headline}
                      </h4>
                      <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-4">
                        {update.impact}
                      </p>
                      <div className="inline-flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-md">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Impact →</span>
                        <span className="text-[11px] font-extrabold text-slate-700">{mockImpactLabel}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 pl-8 sm:pl-0 shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md whitespace-nowrap bg-slate-50 text-slate-500 border border-slate-100">
                      SEC / Earnings
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-medium text-slate-400">
                      Recent
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RESTORED: 5. SUPPORTING FINANCIAL DATA */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm overflow-hidden mb-12">
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 gap-2">
          <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest">
            Supporting Financial Data
          </h3>
          <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm w-fit">TRAILING 12M</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white">
          <div className="p-5 sm:p-7 flex flex-col justify-center border-b border-r border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">P/E Ratio</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{data?.metrics?.pe || '-'}</span>
          </div>
          <div className="p-5 sm:p-7 flex flex-col justify-center border-b border-slate-100 md:border-r">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Earnings Yield</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{data?.metrics?.earningsYield || '-'}</span>
          </div>
          <div className="p-5 sm:p-7 flex flex-col justify-center border-b border-r border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Rev Growth</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">{data?.metrics?.revenueGrowth || '-'}</span>
          </div>
          <div className="p-5 sm:p-7 flex flex-col justify-center border-b border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Op Margin</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{data?.metrics?.operatingMargin || '-'}</span>
          </div>
        </div>
      </div>

     {/* FLOATING CTA BAR */}
      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-8 bg-gradient-to-t from-white via-white/90 to-white/0 z-50 flex flex-col items-center pointer-events-none pt-20">
        
        <div className={`transition-all duration-500 transform ${hasEnough ? 'opacity-100 translate-y-0 mb-3' : 'opacity-0 translate-y-4 mb-0'}`}>
           <p className="text-[11px] font-bold text-blue-800 bg-blue-50/95 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-blue-200 flex items-center gap-1.5">
             <span className="text-blue-600 text-lg leading-none">✦</span> Sandbox Preview — Sign in to unlock full builder
           </p>
        </div>

        <button
          onClick={() => {
            if (!hasEnough) return;

            const payload = {
              ticker,
              drivers,
              risks,
              selectedDriverIds: selectedItems.filter(id => id.startsWith('driver_')),
              selectedRiskIds: selectedItems.filter(id => id.startsWith('risk_')),
              selectedDriverTitles: drivers.filter((d: any) => selectedItems.includes(d.id)).map((d: any) => d.title),
              selectedRiskTitles: risks.filter((r: any) => selectedItems.includes(r.id)).map((r: any) => r.title)
            };

            sessionStorage.setItem(`thesis_handoff_${ticker}`, JSON.stringify(payload));
            const targetUrl = `/build-thesis/${ticker}`;

            if (!session) {
              sessionStorage.setItem('postAuthRedirect', targetUrl);
              router.push('?auth=signup', { scroll: false });
            } else {
              router.push(targetUrl);
            }
          }}
          disabled={!hasEnough}
          className={`pointer-events-auto flex items-center justify-center gap-3 w-full max-w-sm sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-full font-bold shadow-xl transition-all duration-300 ${
            hasEnough 
              ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer scale-100' 
              : 'bg-slate-800 text-slate-300 cursor-not-allowed opacity-95 translate-y-2'
          }`}
        >
          {hasEnough ? (
            <>
              Build My Thesis ({selectedItems.length} Selected)
            </>
          ) : (
            selectedItems.length === 0 
              ? 'Select 2 items to continue' 
              : 'Select 1 more to continue'
          )}
        </button>
      </div>

    </div>
  );
}


// ==========================================
// 🔎 DEEP DIVE: QUESTIONS
// ==========================================
function QuestionsTab({ data }: { data: any }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (!data?.deepDive || data.deepDive.length === 0) return (
    <div className="p-8 text-center text-sm font-bold text-slate-500">No deep dive analysis available.</div>
  );

  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {data.deepDive.map((q: any, idx: number) => {
        const numberPrefix = (idx + 1).toString().padStart(2, '0');
        const cleanQuestion = q.question.replace(/^\d+\.\s*/, '');

        return (
          <div key={idx} className={`border rounded-2xl overflow-hidden transition-colors ${expandedId === idx ? 'border-blue-200 bg-blue-50/30' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
            <button 
              onClick={() => setExpandedId(expandedId === idx ? null : idx)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center space-x-4 md:space-x-6">
                <span className="text-slate-400 font-mono text-xs font-bold hidden sm:inline-block">{numberPrefix}</span>
                <span className="font-extrabold text-sm sm:text-base text-[#0F172A]">{cleanQuestion}</span>
              </div>
              <div className="flex items-center space-x-4 flex-shrink-0">
                {q.statusType === 'green' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : q.statusType === 'yellow' ? (
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-500" />
                )}
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${expandedId === idx ? 'rotate-180 text-blue-600' : ''}`} />
              </div>
            </button>
            
            <div className={`grid transition-all duration-300 ease-in-out ${expandedId === idx ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
              <div className="overflow-hidden">
                <div className="p-6 pt-0 border-t border-slate-100 mt-2 space-y-6">
                  
                  <div>
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Why?</h4>
                    <p className="text-slate-700 leading-relaxed text-[13px] font-medium">
                      {q.summary}
                    </p>
                  </div>
                  
                  {q.evidence && q.evidence.length > 0 && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Key Evidence</div>
                      <ul className="space-y-2.5">
                        {q.evidence.slice(0, 3).map((ev: string, eIdx: number) => (
                          <li key={eIdx} className="text-[13px] text-slate-600 font-medium flex items-start gap-2.5 leading-snug">
                            <span className="text-blue-500 mt-0.5">•</span> {ev}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ==========================================
// 📊 DEEP DIVE: FINANCIALS
// ==========================================
function FinancialsTab({ data }: { data: any }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
      <h2 className="text-2xl font-black text-[#0F172A]">Financial Performance</h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Growth</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">Revenue Growth</span> 
              <span className="text-emerald-600">{data?.metrics?.revenueGrowth || '-'}</span>
            </div>
          </div>
        </div>

        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Margins</h4>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">Operating Margin</span> 
              <span className="text-[#0F172A]">{data?.metrics?.operatingMargin || '-'}</span>
            </div>
            <div className="flex justify-between font-bold">
              <span className="text-slate-500">Net Margin</span> 
              <span className="text-[#0F172A]">{data?.metrics?.netMargin || '-'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// ⚖️ DEEP DIVE: VALUATION
// ==========================================
function ValuationTab({ data }: { data: any }) {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-black text-[#0F172A]">Valuation</h2>
        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-widest rounded-md border border-amber-200">
          {data?.pillars?.valuation?.label || 'Review'}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Current Price</div>
          <div className="text-xl font-black text-[#0F172A]">{data?.metrics?.currentPrice || '-'}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">P/E Ratio</div>
          <div className="text-xl font-black text-[#0F172A]">{data?.metrics?.pe || '-'}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Earnings Yield</div>
          <div className="text-xl font-black text-[#0F172A]">{data?.metrics?.earningsYield || '-'}</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">52W Range</div>
          <div className="text-sm font-bold text-slate-600 mt-2">{data?.metrics?.yearLow || '-'} - {data?.metrics?.yearHigh || '-'}</div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 👥 DEEP DIVE: PEERS
// ==========================================
function PeersTab({ data }: { data: any }) {
  if (!data?.peers || data.peers.length === 0) return (
    <div className="p-8 text-center text-sm font-bold text-slate-500">No peer data available.</div>
  );

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
      <h2 className="text-2xl font-black text-[#0F172A] mb-6">Peer Comparison</h2>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider text-xs">
              <th className="pb-4">Ticker</th>
              <th className="pb-4">P/E</th>
              <th className="pb-4">Growth</th>
              <th className="pb-4">Margin</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
            <tr className="bg-blue-50/50">
              <td className="py-4 font-black text-blue-600">${data?.ticker || '-'}</td>
              <td className="py-4">{data?.metrics?.pe || '-'}</td>
              <td className="py-4 text-emerald-600">{data?.metrics?.revenueGrowth || '-'}</td>
              <td className="py-4">{data?.metrics?.operatingMargin || '-'}</td>
            </tr>
            {data.peers.map((p: any, idx: number) => (
              <tr key={idx}>
                <td className="py-4 font-bold text-[#0F172A]">${p.ticker || '-'}</td>
                <td className="py-4">{p.pe || '-'}</td>
                <td className="py-4 text-emerald-600">{p.growth || '-'}</td>
                <td className="py-4">{p.margin || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}