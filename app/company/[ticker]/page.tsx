'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building2, TrendingUp, TrendingDown, Globe, ArrowLeft, Sparkles, 
  Loader2, AlertCircle, ShieldCheck, Plus, ArrowRight, Activity, Check 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCompanyProfile } from '@/lib/fmp';
import SmartSearchBar from '@/components/SmartSearchBar';

// --- REUSABLE PROGRESSIVE CARD COMPONENT ---
function ProgressiveCard({ question, statusText, statusType, thesisSupportText, thesisSupportType, summary, evidence, showThesisBadge = false }: any) {
  const [isOpen, setIsOpen] = useState(false);

  const styles: any = {
    green: { bg: 'bg-emerald-50/80', text: 'text-emerald-700', ring: 'ring-emerald-600/20', icon: '🟢' },
    yellow: { bg: 'bg-amber-50/80', text: 'text-amber-700', ring: 'ring-amber-600/20', icon: '🟡' },
    red: { bg: 'bg-rose-50/80', text: 'text-rose-700', ring: 'ring-rose-600/20', icon: '🔴' }
  };

  const thesisStyles: any = {
    supports: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    neutral: 'bg-amber-50 text-amber-800 border-amber-200',
    risk: 'bg-rose-50 text-rose-800 border-rose-200'
  };

  const activeStyle = styles[statusType] || styles.green;

  return (
    <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-slate-300">
      <div className="p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight">{question}</h3>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ring-1 ring-inset ${activeStyle.bg} ${activeStyle.text} ${activeStyle.ring} shadow-sm`}>
              <span className="scale-110 drop-shadow-sm">{activeStyle.icon}</span> {statusText}
            </div>
          </div>
          
          {showThesisBadge && (
            <div className={`text-[10px] font-extrabold px-3 py-1.5 rounded-full border ${thesisStyles[thesisSupportType]} flex items-center gap-1.5 shadow-sm shrink-0 uppercase tracking-widest`}>
              <span className="opacity-70">Thesis:</span> {thesisSupportText}
            </div>
          )}
        </div>
        
        <div className="mb-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5">Why?</p>
          <p className="text-sm md:text-base text-slate-700 font-medium leading-relaxed max-w-4xl">
            {summary}
          </p>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-200 rounded-xl transition-all shadow-sm group cursor-pointer"
        >
          {isOpen ? 'Hide Supporting Evidence' : 'View Supporting Evidence'}
          <svg 
            className={`w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-transform duration-300 ease-in-out ${isOpen ? 'rotate-180' : 'rotate-0'}`} 
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="px-6 md:px-8 pb-8 pt-5 bg-gradient-to-b from-slate-50/80 to-white border-t border-slate-100">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Evidence</h4>
          <ul className="space-y-3">
            {evidence?.map((item: string, idx: number) => (
              <li key={idx} className="text-sm md:text-base text-slate-700 font-medium flex items-start gap-3 max-w-4xl bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                <span className={`font-bold mt-0.5 shrink-0 ${statusType === 'red' ? 'text-rose-500' : 'text-emerald-500'}`}>
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

// --- MAIN CONTROLLER COMPONENT ---
export default function CompanyPage({ params }: { params: Promise<{ ticker: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const ticker = (resolvedParams.ticker || 'MSFT').toUpperCase();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [viewMode, setViewMode] = useState<'dashboard' | 'research'>('dashboard');

  // Thesis State
  const [savedThesis, setSavedThesis] = useState<any>(null);
  const [activeDrivers, setActiveDrivers] = useState<any[]>([]);
  const [activeRisks, setActiveRisks] = useState<any[]>([]);
  const [suggestedConsiderations, setSuggestedConsiderations] = useState<any[]>([]);

  // AI Research State
  const [aiData, setAiData] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    async function initPage() {
      setIsLoading(true);

      // 1. Fetch Live Company Profile
      let liveProfile: any = await getCompanyProfile(ticker);
      if (Array.isArray(liveProfile) && liveProfile.length > 0) liveProfile = liveProfile[0];
      setProfile(liveProfile);

      // 2. Fetch Cached AI Research (if available)
      try {
        const { data: cacheData } = await supabase
          .from('ai_cache')
          .select('*')
          .eq('ticker', ticker)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (cacheData && cacheData.ai_data) {
          let cachedPayload = cacheData.ai_data;
          if (typeof cachedPayload === 'string') {
            try { cachedPayload = JSON.parse(cachedPayload); } catch (e) {}
          }
          setAiData(cachedPayload);
        }
      } catch (err) {
        console.error("Cache check failed:", err);
      }

      // 3. Check Session & Saved Thesis
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsLoggedIn(true);
        const { data: thesis } = await supabase
          .from('theses')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('ticker', ticker)
          .maybeSingle();

        if (thesis) {
          setSavedThesis(thesis);
          setViewMode('dashboard');

          // Pull driver/risk options cache to match titles
          const { data: optionsCache } = await supabase
            .from('thesis_options_cache')
            .select('data')
            .eq('ticker', ticker)
            .maybeSingle();

          if (optionsCache && optionsCache.data) {
            const allDrivers = optionsCache.data.drivers || [];
            const allRisks = optionsCache.data.risks || [];

            const myDrivers = allDrivers.filter((d: any) => (thesis.drivers || []).includes(d.id));
            const myRisks = allRisks.filter((r: any) => (thesis.risks || []).includes(r.id));
            const unusedOptions = [
              ...allDrivers.filter((d: any) => !(thesis.drivers || []).includes(d.id)),
              ...allRisks.filter((r: any) => !(thesis.risks || []).includes(r.id))
            ].slice(0, 2);

            setActiveDrivers(myDrivers);
            setActiveRisks(myRisks);
            setSuggestedConsiderations(unusedOptions);
          }
        } else {
          // Logged in, but NO thesis for this stock -> default to Research View!
          setViewMode('research');
        }
      } else {
        // Unauthenticated user -> default to Research View!
        setIsLoggedIn(false);
        setViewMode('research');
      }

      setIsLoading(false);
    }

    initPage();
  }, [ticker]);

  const handleLaunchBuilder = () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/build-thesis/${ticker}`);
    } else {
      router.push(`/build-thesis/${ticker}`);
    }
  };

  const handleGenerateResearch = async () => {
    if (!profile) return;
    setIsAnalyzing(true);
    setAiError(null);
    try {
      const response = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker: profile.symbol, companyName: profile.companyName })
      });
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server Error: Unable to reach AI endpoint.");
      }
      if (!response.ok) throw new Error('Failed to generate research');

      const data = await response.json();
      setAiData(data);
    } catch (error: any) {
      setAiError(error.message || "An unexpected error occurred.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-bold flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading {ticker}...
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500">
        <Globe className="w-10 h-10 text-slate-300 mb-4" />
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Company Not Found</h1>
        <button onClick={() => router.back()} className="text-blue-600 font-bold hover:underline">← Go back</button>
      </div>
    );
  }

  // Fallback deep dive data
  const fallbackDeepDive = [
    { question: "1. Is this a high-quality business?", statusText: "Excellent", statusType: "green", summary: `${profile?.companyName} benefits from predictable recurring revenue, exceptional returns on invested capital, and structural advantages over competitors.`, evidence: ["Consistently high ROIC", "Predictable revenue base", "Industry-leading unit economics"] },
    { question: "2. Does it have a durable competitive advantage (moat)?", statusText: "Exceptional Moat", statusType: "green", summary: "A dominant moat built on scaled economics, customer loyalty, and high switching costs.", evidence: ["Unmatched economies of scale", "Deep brand trust", "High switching costs"] },
    { question: "3. Can management be trusted?", statusText: "Trusted", statusType: "green", summary: "Exceptional execution history with highly disciplined capital allocation.", evidence: ["History of over-delivering", "Consistent share buybacks", "Strong insider ownership"] },
    { question: "4. Am I paying a reasonable price?", statusText: "Premium", statusType: "yellow", summary: "The company trades at a premium valuation multiple, requiring flawless future execution.", evidence: ["Trading above historic averages", "High expectations priced in", "Requires double-digit growth"] },
    { question: "5. Can I understand this business well enough to own it?", statusText: "Easy", statusType: "green", summary: "The business model is straightforward: generate revenue by offering exceptional value through scaled operations.", evidence: ["Clear financial statements", "Simple core product offering", "No complex financial engineering"] },
    { question: "6. What could go wrong?", statusText: "Monitor", statusType: "red", summary: "Macroeconomic slowdowns, heavy reliance on specific geographical markets, or an erosion of the core value proposition.", evidence: ["Consumer spending compression", "Rising operational costs", "Aggressive competitor discounting"] },
    { question: "7. Can this business keep growing for the next 5–10 years?", statusText: "Strong Acceleration", statusType: "green", summary: "Management continues to identify and execute on massive adjacent market opportunities.", evidence: ["Expanding into growing adjacent markets", "Strong pricing power", "Long runway for product expansion"] }
  ];

  const reviewDate = savedThesis ? new Date(savedThesis.updated_at || savedThesis.created_at).toLocaleDateString('en-US', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  }) : '';

  // --- RENDER VIEW 1: MY SAVED THESIS DASHBOARD ---
  if (savedThesis && viewMode === 'dashboard') {
    return (
      <div className="min-h-screen bg-slate-50 font-sans pb-24">
        <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Portfolio
            </Link>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setViewMode('research')}
                className="text-xs font-extrabold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100"
              >
                View Fundamental Research
              </button>
              <div className="font-extrabold text-slate-900">Investment IQ</div>
            </div>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 pt-10">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                {ticker}
                <span className="text-2xl font-bold text-slate-400 font-normal">{profile?.companyName}</span>
              </h1>
            </div>
            <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full text-sm font-extrabold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Thesis Strengthening
            </div>
          </div>

          <hr className="border-slate-200 mb-10" />

          {/* MY INVESTMENT THESIS */}
          <section className="mb-12">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">My Investment Thesis</p>
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
              <h3 className="text-sm font-extrabold text-slate-900 mb-2">Why I invested</h3>
              <p className="text-slate-700 font-medium leading-relaxed">
                {savedThesis.summary || "No summary provided."}
              </p>
            </div>
          </section>

          <hr className="border-slate-200 mb-12" />

          {/* WHY I INVESTED (Drivers) */}
          <section className="mb-12">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Why I Invested</p>
            <div className="space-y-4">
              {activeDrivers.map((driver, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <h4 className="text-base font-extrabold text-slate-900 mb-1">{driver.title}</h4>
                    <p className="text-sm font-medium text-slate-500">{driver.whyThisMatters}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-emerald-100">
                    <TrendingUp className="w-3.5 h-3.5" /> Strengthening
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-200 mb-12" />

          {/* RISKS I'M WATCHING */}
          <section className="mb-12">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">Risks I'm Watching</p>
            <div className="space-y-4">
              {activeRisks.map((risk, idx) => (
                <div key={idx} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-6 items-start">
                  <div className="flex-1">
                    <h4 className="text-base font-extrabold text-slate-900 mb-1">{risk.title}</h4>
                    <p className="text-sm font-medium text-slate-500">{risk.whyThisMatters}</p>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-100">
                    <AlertCircle className="w-3.5 h-3.5" /> Monitoring
                  </div>
                </div>
              ))}
            </div>
          </section>

          <hr className="border-slate-200 mb-12" />

          {/* WHAT'S CHANGED */}
          <section className="mb-12">
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">What's Changed</p>
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-lg">
              <h3 className="text-sm font-extrabold text-slate-300 mb-6">Latest earnings / filings</h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-200">Core metrics accelerated this quarter.</span>
                </li>
                <li className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-200">Market position continues expanding in key verticals.</span>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                  <span className="text-sm font-medium text-slate-200">Short-term competitive pressures require ongoing monitoring.</span>
                </li>
              </ul>
            </div>
          </section>

          {/* CONSIDERATIONS */}
          {suggestedConsiderations.length > 0 && (
            <>
              <hr className="border-slate-200 mb-12" />
              <section className="mb-12">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-4">You May Want To Consider</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {suggestedConsiderations.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 shadow-sm flex flex-col">
                      <h4 className="text-sm font-extrabold text-slate-900 mb-2">{item.title}</h4>
                      <p className="text-xs font-medium text-slate-500 mb-6 flex-grow">
                        Recent developments could affect this assumption.
                      </p>
                      <Link 
                        href={`/build-thesis/${ticker}`}
                        className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add to My Thesis
                      </Link>
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <hr className="border-slate-200 mb-12" />

          {/* THESIS STATUS */}
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Thesis Status</p>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-lg font-extrabold text-slate-900">Strengthening</span>
              </div>
              <p className="text-xs font-medium text-slate-500 mt-2">Last reviewed: {reviewDate}</p>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={() => setViewMode('research')}
                className="flex-1 md:flex-none px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-extrabold rounded-xl transition-colors"
              >
                Review Updates
              </button>
              <Link 
                href={`/build-thesis/${ticker}`}
                className="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white text-sm font-extrabold rounded-xl transition-colors shadow-md"
              >
                Modify Thesis
              </Link>
            </div>
          </section>
        </main>
      </div>
    );
  }

  // --- RENDER VIEW 2: GENERAL RESEARCH PAGE (For non-thesis stocks / new users) ---
  const isPositiveChange = profile.changes >= 0;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="font-extrabold text-xl tracking-tight flex items-center gap-2">
            Investment IQ
            <span className="flex gap-0.5">
              <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            </span>
          </Link>
          
          <div className="hidden sm:block">
            <SmartSearchBar />
          </div>
          
          <div className="flex items-center gap-3">
            {savedThesis && (
              <button 
                onClick={() => setViewMode('dashboard')}
                className="text-xs font-extrabold bg-emerald-50 text-emerald-700 px-3.5 py-2 rounded-xl border border-emerald-200"
              >
                My Thesis Dashboard →
              </button>
            )}
            {isLoggedIn ? (
              <button onClick={() => router.push('/dashboard')} className="text-xs font-bold bg-blue-50 text-blue-700 px-4 py-2 rounded-xl border border-blue-200">
                ← Portfolio
              </button>
            ) : (
              <Link href="/login" className="bg-blue-600 text-white text-xs font-extrabold px-4 py-2 rounded-xl shadow-sm hover:bg-blue-700">
                Get Started
              </Link>
            )}
          </div>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 pt-10">
        
        {/* HERO SECTION */}
        <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm p-8 md:p-10 mb-8">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-8">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-white border border-slate-100 rounded-2xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden">
                {profile.image ? <img src={profile.image} alt="logo" className="w-full h-full object-contain p-2" /> : <Building2 className="w-8 h-8 text-slate-300" />}
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">{profile.companyName}</h1>
                <div className="flex items-center gap-2 text-xs md:text-sm font-bold text-slate-500">
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200/60">{profile.symbol}</span>
                  <span>• {profile.exchangeShortName}</span>
                </div>
              </div>
            </div>
            <div className="text-left md:text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 hidden md:block">Current Price</p>
              <p className="text-4xl font-extrabold tracking-tight">${profile.price?.toFixed(2)}</p>
              <div className={`flex items-center gap-1.5 text-sm font-bold mt-1 md:justify-end ${isPositiveChange ? 'text-emerald-600' : 'text-rose-600'}`}>
                {isPositiveChange ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{profile.changes > 0 ? '+' : ''}{profile.changes?.toFixed(2)} ({((profile.changes / (profile.price - profile.changes)) * 100).toFixed(2)}%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI GENERATION BANNER */}
        {!aiData && (
          <div className="mb-10 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/80 rounded-[32px] p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-sm relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-xl md:text-2xl font-extrabold text-blue-950 mb-3 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-blue-600" /> AI Fundamental Analysis
              </h2>
              <p className="text-sm text-blue-900/70 font-medium max-w-xl leading-relaxed">
                Our AI engine evaluates {profile.companyName}'s trajectory, moat, and valuation based on recent market developments.
              </p>
              {aiError && (
                <div className="mt-4 flex items-start gap-2 text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-200 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 shrink-0" /> <p>{aiError}</p>
                </div>
              )}
            </div>
            <button onClick={handleGenerateResearch} disabled={isAnalyzing} className="w-full md:w-auto relative z-10 shrink-0 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-extrabold px-8 py-4 rounded-2xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2">
              {isAnalyzing ? <><Loader2 className="w-5 h-5 animate-spin" /> Parsing Live Data...</> : <><Sparkles className="w-5 h-5" /> Generate Research</>}
            </button>
          </div>
        )}

        {/* OVERALL ASSESSMENT & SNAPSHOT */}
        <div className="mb-10">
          <div className="bg-white p-8 md:p-12 rounded-[32px] border border-slate-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-12 items-start">
              
              <div className="md:col-span-3 flex flex-col">
                <div>
                  <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Overall Assessment</h2>
                  <div className="flex flex-wrap items-center gap-3 mb-5">
                    <span className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-none">
                      {aiData?.ratingTitle || 'High Quality Business'}
                    </span>
                    <span className={`text-[11px] font-extrabold px-3 py-1.5 rounded-full border shadow-sm uppercase tracking-widest ${
                      aiData?.ratingBadge === 'High Risk' ? 'bg-rose-50 text-rose-700 border-rose-200' : 
                      aiData?.ratingBadge === 'Speculative' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                      'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {aiData?.ratingBadge || 'High Quality'}
                    </span>
                  </div>
                  <p className="text-base text-slate-600 font-medium leading-relaxed max-w-2xl">
                    {aiData?.overallAssessment || `${profile.companyName} remains a premier business, supported by robust market positioning, operating leverage, and sustained cash flow generation.`}
                  </p>
                </div>

                <div className="mt-10 pt-8 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div>
                    <p className="text-[11px] font-extrabold text-emerald-600 uppercase tracking-widest mb-4">Key Strengths</p>
                    <div className="space-y-3">
                      {(aiData?.strengths || ["Durable Market Moat", "Strong Balance Sheet", "Predictable Cash Flows"]).map((strength: string, i: number) => (
                        <p key={i} className="text-sm text-slate-700 font-medium flex gap-2"><span className="text-emerald-500 font-bold">✓</span> <span className="leading-snug">{strength}</span></p>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-extrabold text-amber-600 uppercase tracking-widest mb-4">Watch Points</p>
                    <div className="space-y-3">
                      {(aiData?.risks || ["Macro Sensitivity", "Valuation Multiple", "Competitive Pressure"]).map((risk: string, i: number) => (
                        <p key={i} className="text-sm text-slate-700 font-medium flex gap-2"><span className="text-amber-500 font-bold">⚠</span> <span className="leading-snug">{risk}</span></p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* SNAPSHOT PILLARS */}
              <div className="md:col-span-2 bg-slate-50/80 rounded-[24px] p-8 border border-slate-100 self-start w-full">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">Quick Snapshot</p>
                <div className="space-y-4">
                  {['Business Quality', 'Management', 'Valuation', 'Understandability', 'Financial Strength', 'Compounding Power'].map((label) => {
                    const keyMap: any = { 'Business Quality': 'quality', 'Management': 'management', 'Valuation': 'valuation', 'Understandability': 'understandability', 'Financial Strength': 'financialStrength', 'Compounding Power': 'compoundingPower' };
                    const key = keyMap[label];
                    
                    let defaultLabels: any = { quality: 'Excellent', management: 'Trusted', valuation: 'Premium', understandability: 'Easy', financialStrength: 'Fortress', compoundingPower: 'Exceptional' };
                    let defaultColors: any = { valuation: 'yellow' };
                    
                    const rawData = aiData?.pillars?.[key];
                    let parsedData = { label: defaultLabels[key], color: defaultColors[key] || 'green' };

                    if (typeof rawData === 'string') {
                      const lower = rawData.toLowerCase();
                      let c = 'green';
                      if (['premium', 'fair', 'medium', 'speculative', 'average', 'monitor'].includes(lower)) c = 'yellow';
                      if (['weak', 'poor', 'vulnerable', 'unproven', 'high risk', 'low'].includes(lower)) c = 'red';
                      parsedData = { label: rawData, color: c };
                    } else if (typeof rawData === 'object' && rawData !== null) {
                      parsedData = { label: rawData.label || defaultLabels[key], color: rawData.color || 'green' };
                    }
                    
                    const dotColorHex = parsedData.color === 'green' ? '#10b981' : 
                                       parsedData.color === 'yellow' ? '#fbbf24' : 
                                       parsedData.color === 'red' ? '#f43f5e' : '#cbd5e1';
                    
                    return (
                      <div key={label} className="flex justify-between items-center border-b border-slate-200/50 pb-3.5 last:border-0 last:pb-0">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
                        <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2.5">
                          <span style={{ backgroundColor: dotColorHex, width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}></span>
                          {parsedData.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* LIVE EVALUATION */}
        <div className="mb-10 bg-slate-900 rounded-[32px] p-8 md:p-12 shadow-xl border border-slate-800">
          <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Live Evaluation</h3>
              <p className="text-2xl font-extrabold text-white tracking-tight">What's Changed Recently</p>
            </div>
            <span className="text-[10px] font-extrabold text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full uppercase tracking-widest border border-emerald-500/20 shadow-sm">
              <span className="mr-1.5 animate-pulse inline-block">●</span> Live API
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
            {(aiData?.updates || [
              { headline: "Revenue performance accelerates", impact: "Validates Demand", type: "positive" },
              { headline: "Key unit economics remain strong", impact: "Validates Moat", type: "positive" },
              { headline: "Operating margins remain steady", impact: "Pricing Power", type: "neutral" },
              { headline: "Short-term supply dynamics monitored", impact: "Watch Item", type: "negative" }
            ]).map((update: any, i: number) => (
              <div key={i} className="flex flex-col h-full bg-slate-800/50 p-6 rounded-2xl border border-slate-700/50 hover:bg-slate-800 transition-colors">
                <div className="flex items-start gap-3 mb-auto">
                  {update.type === 'negative' ? (
                    <span className="text-rose-400 font-bold text-lg leading-none mt-0.5">⚠</span> 
                  ) : update.type === 'neutral' ? (
                    <span className="text-slate-400 font-bold text-lg leading-none mt-0.5">−</span>
                  ) : (
                    <span className="text-emerald-400 font-bold text-lg leading-none mt-0.5">↑</span> 
                  )}
                  <span className="text-sm font-bold text-slate-200 leading-snug">{update.headline}</span>
                </div>
                
                <div className="mt-5 pt-4 border-t border-slate-700/50">
                  <p className={`text-[10px] font-extrabold uppercase tracking-widest ${update.type === 'negative' ? 'text-rose-400' : update.type === 'neutral' ? 'text-slate-400' : 'text-emerald-400'}`}>
                    {update.impact}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 7 DEEP DIVE QUESTIONS */}
        <div className="space-y-6">
          {(aiData?.deepDive || fallbackDeepDive).map((item: any, i: number) => (
            <ProgressiveCard 
              key={i}
              question={item.question}
              statusText={item.statusText}
              statusType={item.statusType}
              thesisSupportText={item.statusType === 'green' ? "✔ Supports Thesis" : item.statusType === 'red' ? "⚠ Thesis Risk" : "— Neutral"}
              thesisSupportType={item.statusType === 'green' ? 'supports' : item.statusType === 'red' ? 'risk' : 'neutral'}
              showThesisBadge={!!savedThesis}
              summary={item.summary}
              evidence={item.evidence}
            />
          ))}
        </div>

        {/* THESIS BUILDER LAUNCHPAD */}
        <div id="build-thesis-section" className="mt-16 pt-10 border-t border-slate-200">
          <div className="bg-gradient-to-b from-slate-900 to-blue-950 text-white p-8 md:p-12 rounded-[32px] shadow-2xl border border-blue-900/50 max-w-4xl mx-auto relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[200px] bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>

            <div className="text-center max-w-2xl mx-auto mb-10 relative z-10">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
                Build Your Investment Thesis for {ticker}
              </h2>
              <p className="text-blue-100/80 text-sm md:text-base font-medium leading-relaxed">
                Record why you're investing in {profile.companyName}. Select key fundamental drivers and risks, and Investment IQ automatically tracks them after every earnings report.
              </p>
            </div>

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
                  <h3 className="font-extrabold text-white text-base md:text-lg mb-1">AI Quarterly Tracking</h3>
                  <p className="text-sm text-blue-200/70 font-medium">Earnings calls • SEC filings • Financials</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 flex items-start gap-4 md:gap-5 transition-all hover:bg-white/10 hover:border-white/20">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-blue-600/30 text-blue-300 flex items-center justify-center font-bold shrink-0 border border-blue-500/30 text-sm md:text-base">3</div>
                <div>
                  <h3 className="font-extrabold text-white text-base md:text-lg mb-1">Monitor Conviction</h3>
                  <p className="text-sm text-blue-200/70 font-medium">Clear signals when your core assumptions strengthen or weaken.</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-center justify-between gap-5 relative z-10 w-full mt-8 pt-6 border-t border-white/10">
              <div className="flex items-center gap-2.5 text-xs md:text-sm text-blue-200/90 font-medium text-center md:text-left">
                <span className="text-emerald-400 font-bold text-base">✓</span>
                <span>
                  {!isLoggedIn 
                    ? "Sign in to save your thesis and track it automatically." 
                    : (savedThesis ? "Modify your active thesis drivers anytime." : "Launch builder to save your thesis.")}
                </span>
              </div>
              <button
                onClick={handleLaunchBuilder}
                className="w-full md:w-auto shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-sm md:text-base font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] hover:shadow-[0_0_30px_rgba(37,99,235,0.6)] cursor-pointer text-center"
              >
                {savedThesis ? 'Modify Saved Thesis →' : 'Build My Thesis →'}
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}