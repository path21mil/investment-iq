'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
import Logo from '@/components/Logo'; // Adjust import if needed


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

// ✨ PLACE HELPER FUNCTION HERE (Between CompanyLogo and CompanyResearchPage)
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
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans antialiased p-6">
        <div className="bg-white p-8 sm:p-10 rounded-3xl border border-slate-200 shadow-sm max-w-md w-full flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
          
          {/* Animated Spinner Icon */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-60"></div>
            <div className="relative bg-white rounded-full p-4 border border-slate-100 shadow-sm">
               <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          </div>
          
          {/* Main Title & Explanation */}
          <h3 className="text-xl font-extrabold text-[#0F172A] mb-2 tracking-tight">
            Analyzing ${ticker}
          </h3>
          <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
            Our AI is currently examining live market metrics, cross-referencing financials, and generating a custom thesis. This deep dive takes roughly <strong className="text-slate-700">20 seconds</strong>.
          </p>
          
          {/* Fake Progress Checklist (Gives the user something to look at) */}
          <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-5 mb-2 text-left space-y-3">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              CONNECTING TO LIVE DATA
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-600">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
              EXTRACTING KEY METRICS
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-blue-600">
              <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]"></div>
              SYNTHESIZING RESEARCH...
            </div>
          </div>

          {/* Do Not Refresh Warning */}
          <div className="mt-6 flex items-center gap-2 text-[11px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5" />
            Please do not refresh the page
          </div>
          
        </div>
      </div>
    );
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
      
      {/* Top Navbar */}
      <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 h-[64px] flex items-center mb-8">
        <div className="max-w-[900px] w-full mx-auto px-6 flex items-center justify-between">
          <Logo href="/" />
         <button 
            onClick={() => router.push(`/build-thesis/${ticker}`)}
            className="px-6 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white rounded-full text-sm font-bold transition-all shadow-sm"
          >
            Build Thesis
          </button>
        </div>
      </nav>

      <div className="max-w-[900px] mx-auto w-full px-4 md:px-6">
    
       {/* COMPANY HERO BANNER WITH INLINE PRICE & INTEGRATED MODE SELECTOR */}
        <div className="mb-8 bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* LEFT: Logo, Name, Ticker & Clean Price */}
          <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
            <CompanyLogo 
              ticker={data?.ticker || ticker} 
              containerClass="w-12 h-12 sm:w-16 sm:h-16 shrink-0" 
            />
            
            <div className="flex flex-col justify-center gap-1.5 min-w-0">
             <h1 
  className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-[#0F172A] leading-tight line-clamp-2 sm:line-clamp-1"
  title={data?.companyName || ticker}
>
  {getDisplayName(data?.companyName, ticker)}
</h1>
              <div className="flex items-center gap-2.5 text-xs font-bold text-slate-500">
                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200 text-[11px] shadow-sm">
                  {data?.ticker || ticker}
                </span>
                
                {/* CURRENT PRICE - No dot, using a premium deep slate instead of harsh black */}
                <span className="text-slate-700 font-black text-sm sm:text-base tracking-tight">
                  ${typeof data?.price === 'number' ? data.price.toFixed(2) : data?.metrics?.currentPrice?.replace('$', '') || '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* RIGHT: Mode Selector Pill Toggle */}
          <div className="flex items-center gap-1 text-[10px] sm:text-[11px] font-black tracking-widest uppercase cursor-pointer bg-slate-50 sm:bg-white border border-slate-200 p-1 rounded-full shadow-sm shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full transition-all ${
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
              className={`flex items-center gap-1.5 px-3.5 sm:px-4 py-2 rounded-full transition-all ${
                activeTab !== 'overview' 
                  ? 'bg-slate-100 text-[#0F172A]' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              {activeTab !== 'overview' && <span className="text-blue-600">●</span>}
              DEEP DIVE {activeTab === 'overview' && <span className="text-slate-400"></span>}
            </button>
          </div>

        </div>

        {/* Sticky Horizontal Nav (Visible only when in Deep Dive) */}
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

        {/* Workspace Content Router */}
        <div className="min-h-[500px]">
          {activeTab === 'overview' && <OverviewTab data={data} onExplore={() => setActiveTab('questions')} />}
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
// ⚡ OVERVIEW (QUICK READ)
// ==========================================
function OverviewTab({ data, onExplore }: { data: any, onExplore: () => void }) {
  // Determine lifecycle badge color
  const badgeText = data?.ratingBadge || 'Mature';
  const badgeColor = 
    badgeText === 'Early Stage' ? 'text-purple-500' :
    badgeText === 'Expanding' ? 'text-emerald-500' :
    badgeText === 'Mature' ? 'text-blue-500' : 'text-rose-500';

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* 1. MAIN ASSESSMENT CARD */}
      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm mb-8">
        <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Overall Assessment</h2>
        
        {/* Title & Lifecycle Badge */}
        <div className="flex flex-wrap items-center gap-4 mb-8">
          <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{data?.ratingTitle || 'Market Leader'}</span>
          <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-widest border border-slate-200 bg-slate-50 px-3.5 py-1.5 rounded-full">
            <span className={badgeColor}>●</span> {badgeText}
          </div>
        </div>

        {/* Grid: Paragraph & Snapshot start at the exact same vertical position */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
          
          {/* Left Column: Summary Paragraph + Strengths & Watch Points */}
          <div className="md:col-span-3 flex flex-col">
            <p className="text-[15px] text-slate-700 font-medium leading-relaxed">
              {data?.overallAssessment || "Analyzing fundamental structure..."}
            </p>

            <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Key Strengths</p>
                <div className="space-y-4">
                  {/* Slice to enforce exactly 2 items */}
                  {(data?.strengths || []).slice(0, 2).map((strength: string, i: number) => (
                    <p key={i} className="text-[13px] text-slate-700 font-medium flex gap-3 leading-snug">
                      <span className="text-emerald-500 text-[10px] mt-1 shrink-0">●</span> {strength}
                    </p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Watch Points</p>
                <div className="space-y-4">
                  {/* Slice to enforce exactly 2 items */}
                  {(data?.risks || []).slice(0, 2).map((risk: string, i: number) => (
                    <p key={i} className="text-[13px] text-slate-700 font-medium flex gap-3 leading-snug">
                      <span className="text-amber-500 text-[10px] mt-1 shrink-0">●</span> {risk}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Quick Snapshot Card */}
          <div className="md:col-span-2 bg-[#F8FAFC] rounded-3xl p-8 border border-slate-200 self-start w-full">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-8">Quick Snapshot</p>
            <div className="space-y-5">
              {['quality', 'management', 'valuation', 'understandability', 'financialStrength', 'compoundingPower'].map((key) => {
                const pillarData = data?.pillars?.[key];
                if (!pillarData) return null;
                const dotColor = pillarData.color === 'green' ? 'text-emerald-500' : pillarData.color === 'yellow' ? 'text-amber-500' : 'text-rose-500';
                return (
                  <div key={key} className="flex justify-between items-center border-b border-slate-200/60 pb-4 last:border-0 last:pb-0">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="text-[13px] font-bold text-[#0F172A] flex items-center gap-2">
                      <span className={`${dotColor} text-[10px]`}>●</span>{pillarData.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* 2. LIVE EVALUATION / WHAT CHANGED */}
      {data?.updates && data.updates.length > 0 && (
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm mb-8">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recent Developments</h3>
          <p className="text-2xl font-extrabold text-[#0F172A] tracking-tight mb-8">What's Changed Recently</p>
          
          <div className="space-y-4">
            {data.updates.map((update: any, i: number) => {
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
                    <span className={`text-lg font-bold shrink-0 mt-0.5 ${isPositive ? 'text-emerald-600' : isNegative ? 'text-rose-600' : 'text-amber-500'}`}>
                      {isPositive ? '↑' : isNegative ? '↓' : '⚠'}
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
      )}

   {/* 3. KEY METRICS UI */}
      {/* 3. KEY METRICS UI (Institutional Density Grid) */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm mb-8 overflow-hidden">
        
        {/* Card Header */}
        <div className="px-5 py-4 sm:px-7 sm:py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shadow-sm"></span>
            Fundamental Metrics
          </h3>
          <span className="text-[9px] font-bold text-slate-400 bg-white border border-slate-200 px-2 py-1 rounded-md shadow-sm">TRAILING 12M</span>
        </div>

        {/* Dense Data Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 bg-white">
          
          {/* Row 1 */}
          <div className="p-5 sm:p-7 flex flex-col justify-center border-b border-r border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">P/E Ratio</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{data?.metrics?.pe || '-'}</span>
          </div>
          
          <div className="p-5 sm:p-7 flex flex-col justify-center border-b border-slate-100 md:border-r">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Earnings Yield</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{data?.metrics?.earningsYield || '-'}</span>
          </div>
          
          <div className="p-5 sm:p-7 flex flex-col justify-center border-b border-r border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Rev Growth (YoY)</span>
            <span className="text-xl sm:text-2xl font-black text-emerald-600 tracking-tight">{data?.metrics?.revenueGrowth || '-'}</span>
          </div>
          
          <div className="p-5 sm:p-7 flex flex-col justify-center border-b border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Op Margin</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{data?.metrics?.operatingMargin || '-'}</span>
          </div>
          
          {/* Row 2 */}
          <div className="p-5 sm:p-7 flex flex-col justify-center border-b md:border-b-0 border-r border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Net Margin</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{data?.metrics?.netMargin || '-'}</span>
          </div>
          
          <div className="p-5 sm:p-7 flex flex-col justify-center border-b md:border-b-0 border-slate-100 md:border-r">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">Current Price</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{data?.metrics?.currentPrice || '-'}</span>
          </div>
          
          <div className="p-5 sm:p-7 flex flex-col justify-center border-r border-slate-100 bg-slate-50/30">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">52-Week High</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{data?.metrics?.yearHigh || '-'}</span>
          </div>
          
          <div className="p-5 sm:p-7 flex flex-col justify-center bg-slate-50/30">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1.5">52-Week Low</span>
            <span className="text-xl sm:text-2xl font-black text-[#0F172A] tracking-tight">{data?.metrics?.yearLow || '-'}</span>
          </div>
          
        </div>
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
        // Force clean formatting: "01", "02" and strip "1. " from the question text
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
                  
                  {/* WHY? Section */}
                  <div>
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-3">Why?</h4>
                    <p className="text-slate-700 leading-relaxed text-[13px] font-medium">
                      {q.summary}
                    </p>
                  </div>
                  
                  {/* KEY EVIDENCE Section */}
                  {q.evidence && q.evidence.length > 0 && (
                    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
                      <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Key Evidence</div>
                      <ul className="space-y-2.5">
                        {/* Slice to enforce exactly 3 bullet points */}
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