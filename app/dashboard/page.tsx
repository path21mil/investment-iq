'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Info, ChevronDown, ChevronUp, BookOpen, Loader2, RefreshCw, User, Settings, LogOut, X, Check } from 'lucide-react';
import { createClient } from "@supabase/supabase-js";
import Logo from '@/components/Logo';
import WatchlistSection from '@/components/WatchlistSection';

export const dynamic = 'force-dynamic';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const MAX_STOCKS_LIMIT = 5;

interface Driver {
  title: string;
  description?: string;
  status?: string;
}

interface CompanyUpdate {
  text: string;
  trend: 'up' | 'down' | 'neutral';
  evidenceText?: string;
}

interface TrackedCompany {
  id: string;
  ticker: string;
  name: string;
  status: 'Strengthening' | 'Review Needed' | 'Weakening';
  coreThesis: string;
  aiSummary: string;
  updates: CompanyUpdate[];
  drivers: Driver[];
  primaryRisk?: string;
  lastUpdated: string;
  rawUpdatedAt: string; 
  requiresAction: boolean;
}

function getTimeAgo(dateString: string | null) {
  if (!dateString) return 'Never updated';
  const now = new Date();
  const past = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 60000);

  if (diffInMinutes < 1) return 'Updated just now';
  if (diffInMinutes < 60) return `Updated ${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `Updated ${Math.floor(diffInMinutes / 60)} hours ago`;
  return `Updated ${Math.floor(diffInMinutes / 1440)} days ago`;
}

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

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [portfolio, setPortfolio] = useState<TrackedCompany[]>([]);
  const [userName, setUserName] = useState('Investor');
  
  const [reviewCompany, setReviewCompany] = useState<TrackedCompany | null>(null);
  const [expandedEvidenceIdx, setExpandedEvidenceIdx] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{title: string, description: string} | null>(null);
  const [showAlphaWelcome, setShowAlphaWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenAlphaWelcome');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => {
        setShowAlphaWelcome(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const closeAlphaWelcome = () => {
    localStorage.setItem('hasSeenAlphaWelcome', 'true');
    setShowAlphaWelcome(false);
  };

  useEffect(() => {
    setExpandedEvidenceIdx(null);
  }, [reviewCompany]);

  useEffect(() => {
    loadDashboard();
    
    if (window.location.hash) {
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }, 500);
    }
  }, []);

  const loadDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login?redirect=/dashboard');
        return;
      }
      
      const name = session.user.user_metadata?.full_name?.split(' ')[0] || 'Padam';
      setUserName(name);

      const { data: dbTheses, error } = await supabase
        .from("theses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!dbTheses || dbTheses.length === 0) {
        setPortfolio([]);
      } else {
        const mappedPortfolio: TrackedCompany[] = dbTheses.map((t: any) => ({
          id: t.id,
          ticker: t.ticker,
          name: t.company_name || t.ticker,
          status: t.status || 'Strengthening', 
          coreThesis: t.drivers?.[0]?.title || 'Long-term growth compounding',
          aiSummary: t.ai_summary || 'Tracking active. Awaiting next earnings call or SEC filing for new insights.',
          updates: typeof t.updates === 'string' ? JSON.parse(t.updates) : (t.updates || []), 
          drivers: typeof t.drivers === 'string' ? JSON.parse(t.drivers) : (t.drivers || []),
          primaryRisk: t.primary_risk || (typeof t.risks === 'string' ? JSON.parse(t.risks)?.[0]?.title : t.risks?.[0]?.title) || undefined,
          lastUpdated: new Date(t.last_scanned_at || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rawUpdatedAt: t.last_scanned_at || t.updated_at || t.created_at, 
          requiresAction: t.requires_action || false
        }));

        setPortfolio(mappedPortfolio);
      }
    } catch (err) {
      console.error("Dashboard Load Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    if (portfolio.length >= MAX_STOCKS_LIMIT) {
      setToastMessage({
        title: "Limit Reached",
        description: `You are tracking the maximum of ${MAX_STOCKS_LIMIT} stocks during Alpha.`
      });
      setTimeout(() => setToastMessage(null), 5000);
      return;
    }

    router.push(`/company/${searchQuery.trim().toUpperCase()}`);
  };

  const handleSmartSync = async () => {
    setIsSyncing(true);
    try {
      if (mostRecentTime) {
        const now = new Date();
        const lastUpdate = new Date(mostRecentTime);
        const diffInHours = (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60);

        if (diffInHours < 24) {
          await new Promise(resolve => setTimeout(resolve, 7500));
          
          setToastMessage({
            title: "Portfolio up to date",
            description: `All investment drivers are current. Next scheduled market sync is in ${Math.ceil(24 - diffInHours)} hours.`
          });
          
          setTimeout(() => setToastMessage(null), 6000);
          return; 
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id })
      });
      
      await loadDashboard(); 
    } catch (err) {
      console.error(err);
    } finally {
      setIsSyncing(false);
    }
  };

  const attentionCompanies = portfolio.filter(p => p.status === 'Weakening' || p.status === 'Review Needed' || p.requiresAction);
  const attentionIds = new Set(attentionCompanies.map(c => c.id));
  const riskCompanies = portfolio.filter(p => !attentionIds.has(p.id) && p.updates.some(u => u.trend === 'down'));
  const riskIds = new Set(riskCompanies.map(c => c.id));
  const strengtheningCompanies = portfolio.filter(p => !attentionIds.has(p.id) && !riskIds.has(p.id));

  const sortedActionItems = [...portfolio].sort((a, b) => {
    const getPriority = (status: string) => {
      if (status === 'Weakening') return 1;
      if (status === 'Review Needed') return 2;
      return 3;
    };
    return getPriority(a.status) - getPriority(b.status);
  });

  const mostRecentTime = portfolio.length > 0 
    ? portfolio.reduce((latest, company) => 
        new Date(company.rawUpdatedAt) > new Date(latest.rawUpdatedAt) ? company : latest
      ).rawUpdatedAt 
    : null;

  const getStatusStyles = (status: TrackedCompany['status']) => {
    switch(status) {
      case 'Strengthening': return { dotColor: 'text-emerald-500', label: 'Strengthening' };
      case 'Review Needed': return { dotColor: 'text-amber-500', label: 'Review Needed' };
      case 'Weakening': return { dotColor: 'text-rose-500', label: 'Weakening' };
      default: return { dotColor: 'text-slate-400', label: 'Active' };
    }
  };

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return <span className="text-emerald-600 font-bold shrink-0 mt-0.5">↑</span>;
      case 'down': return <span className="text-rose-600 font-bold shrink-0 mt-0.5">↓</span>;
      default: return <span className="text-slate-400 font-bold shrink-0 mt-0.5">—</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans antialiased">
        <div className="text-slate-500 font-bold flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24 relative overflow-hidden antialiased">

      {/* NAVIGATION HEADER */}
      <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 h-[64px] flex items-center">
        <div className="max-w-[960px] w-full mx-auto px-6 flex items-center justify-between">
          <div className="shrink-0">
            <Logo href="/dashboard" />
          </div>
          
          <div className="flex items-center gap-8 text-[14px] font-bold">
            <Link href="/dashboard" className="text-blue-600">Dashboard</Link>
            <Link href="/portfolio" className="text-slate-600 hover:text-slate-900 transition-colors">Portfolio</Link>
            <Link href="/watchlist" className="text-slate-600 hover:text-slate-900 transition-colors">Watchlist</Link>
          </div>

          <div className="relative group shrink-0 py-4 cursor-pointer">
            <div className="flex items-center gap-1.5 text-[13px] font-bold text-slate-600 hover:text-[#0F172A] transition-colors">
              {userName} <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            </div>
            
            <div className="absolute right-0 top-[45px] w-48 bg-white border border-slate-200 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 ease-out transform origin-top-right scale-95 group-hover:scale-100 z-50">
              <div className="p-2 space-y-0.5">
                <div className="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">{userName}</div>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 rounded-xl transition-colors text-left">
                  <User className="w-4 h-4 text-slate-400" /> Account
                </button>
                <button className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-slate-600 hover:text-[#0F172A] hover:bg-slate-50 rounded-xl transition-colors text-left">
                  <Settings className="w-4 h-4 text-slate-400" /> Settings
                </button>
                <div className="h-px bg-slate-100 my-1.5"></div>
                <button 
                  onClick={() => supabase.auth.signOut().then(() => router.push('/'))} 
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                >
                  <LogOut className="w-4 h-4 text-rose-500" /> Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-[960px] mx-auto px-6 pt-12 md:pt-14">
        
        {portfolio.length === 0 ? (
          <div className="text-center py-16">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A] mb-4">Welcome to Investment IQ, {userName}</h1>
            <p className="text-slate-500 mb-12 max-w-xl mx-auto text-lg">Your portfolio is empty. Let's build your first investment thesis so we can track risks and drivers on your behalf.</p>
            
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-6">Research a company to begin</h2>
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. AAPL, TSLA, NVDA"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-inner"
                />
              </form>
            </div>
          </div>
        ) : (
          <>
            {/* WELCOME HERO & SYNC CONTROLS */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0F172A]">Welcome Back, {userName}</h1>
                  
                  <div className="flex items-center gap-2 mt-1 sm:mt-0">
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest bg-white border border-slate-200 px-2 py-1 rounded shadow-sm">
                      {getTimeAgo(mostRecentTime)}
                    </span>
                    <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-100 rounded shadow-sm text-[9px] font-bold uppercase tracking-widest text-red-600">
                      <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                      <span>{portfolio.length} / {MAX_STOCKS_LIMIT} Limit</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleSmartSync}
                  disabled={isSyncing}
                  className="shrink-0 bg-white border border-slate-200 text-slate-600 text-[11px] font-bold px-3 py-1.5 rounded hover:bg-slate-50 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
                  {isSyncing ? 'Checking...' : 'Check for updates'}
                </button>
              </div>

              <p className="text-[14px] font-medium text-slate-500">
                Here’s what matters today.
              </p>
            </div>

          {/* FLOW ORDER STEP 1: SINCE YOUR LAST VISIT */}
            <div className="mb-12">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                Since Your Last Visit
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Box 1: Strengthening */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-lg shrink-0">
                      {strengtheningCompanies.length}
                    </div>
                    <div className="text-xs font-bold text-slate-700 leading-tight">Companies<br/>strengthening</div>
                  </div>
                  {strengtheningCompanies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                      {strengtheningCompanies.map(c => (
                        <span key={c.ticker} className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          {c.ticker}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Box 2: Risks */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-lg shrink-0">
                      {riskCompanies.length}
                    </div>
                    <div className="text-xs font-bold text-slate-700 leading-tight">Companies with<br/>increased risks</div>
                  </div>
                  {riskCompanies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                      {riskCompanies.map(c => (
                        <span key={c.ticker} className="text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                          {c.ticker}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Box 3: Attention */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-extrabold text-lg shrink-0">
                      {attentionCompanies.length}
                    </div>
                    <div className="text-xs font-bold text-slate-700 leading-tight">Companies need<br/>attention</div>
                  </div>
                  {attentionCompanies.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                      {attentionCompanies.map(c => (
                        <span key={c.ticker} className="text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                          {c.ticker}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* FLOW ORDER STEP 2: WHAT CHANGED */}
            {sortedActionItems.length > 0 && (
              <div className="mb-12">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">What Changed</h2>
                <div className="flex flex-col gap-3">
                  {sortedActionItems.map(company => (
                    <div key={`alert-${company.ticker}`} className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-4 flex-grow">
                        <CompanyLogo 
                          ticker={company.ticker} 
                          containerClass="w-10 h-10 rounded-lg" 
                        />
                        <div className="flex-grow pt-0.5">
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="font-bold text-lg text-[#0F172A] leading-none">{company.ticker}</span>
                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest">
                              <span className={getStatusStyles(company.status).dotColor}>●</span> {getStatusStyles(company.status).label}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl line-clamp-2">{company.aiSummary}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => setReviewCompany(company)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all whitespace-nowrap shadow-sm shrink-0 cursor-pointer"
                      >
                        Review
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FLOW ORDER STEP 3: MARKET OPPORTUNITIES */}
            <WatchlistSection />

            {/* BOTTOM SEARCH BAR */}
            <div className="mt-16 pt-10 border-t border-slate-200 text-center pb-16">
              <div className="flex items-center justify-center gap-3 mb-5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {portfolio.length >= MAX_STOCKS_LIMIT ? 'Alpha Limit Reached' : 'Research another company'}
                </p>
              </div>
              <form 
                onSubmit={(e) => {
                  if (portfolio.length >= MAX_STOCKS_LIMIT) {
                    e.preventDefault();
                    setToastMessage({
                      title: "Limit Reached",
                      description: `You are tracking the maximum of ${MAX_STOCKS_LIMIT} stocks during Alpha.`
                    });
                    setTimeout(() => setToastMessage(null), 5000);
                    return;
                  }
                  handleSearch(e);
                }} 
                className="max-w-md mx-auto relative"
              >
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  disabled={portfolio.length >= MAX_STOCKS_LIMIT}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={portfolio.length >= MAX_STOCKS_LIMIT ? `Limit reached (${MAX_STOCKS_LIMIT}/${MAX_STOCKS_LIMIT})` : "Search by ticker..."}
                  className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[13px] shadow-sm disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
                />
              </form>
            </div>
          </>
        )}
      </main>

      {/* QUICK REVIEW DRAWER */}
      {reviewCompany && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div 
            className="absolute inset-0 bg-[#0F172A]/40 backdrop-blur-sm cursor-pointer transition-opacity"
            onClick={() => {
              setReviewCompany(null);
              setExpandedEvidenceIdx(null);
            }}
          ></div>

          <div className="relative w-full max-w-[440px] h-full bg-white shadow-2xl border-l border-slate-200 flex flex-col animate-[slideIn_0.3s_ease-out]">
            <div className="p-5 flex justify-end">
              <button 
                onClick={() => {
                  setReviewCompany(null);
                  setExpandedEvidenceIdx(null);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors border border-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8">
              <div className="flex items-center justify-between gap-4 mb-10">
                <div className="flex items-center gap-4">
                  <CompanyLogo 
                    ticker={reviewCompany.ticker} 
                    containerClass="w-12 h-12 rounded-xl" 
                  />
                  <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{reviewCompany.ticker}</h2>
                </div>
                
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                  <span className={getStatusStyles(reviewCompany.status).dotColor}>●</span> {getStatusStyles(reviewCompany.status).label}
                </div>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Affected Thesis</h4>
                <p className="font-bold text-[#0F172A] text-[14px] leading-relaxed">{reviewCompany.coreThesis}</p>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-t border-slate-100 pt-8">What Changed This Quarter</h4>
                <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                  {reviewCompany.aiSummary}
                </p>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-t border-slate-100 pt-8">Supporting Evidence</h4>
                <div className="space-y-4">
                  {reviewCompany.updates.map((update, idx) => {
                    const isExpanded = expandedEvidenceIdx === idx;
                    return (
                      <div key={idx} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all">
                        <div className="p-4 flex flex-col gap-2">
                          <div className="flex items-start gap-2.5">
                            {getTrendIcon(update.trend)}
                            <p className="text-[13px] font-bold text-[#0F172A] leading-tight">{update.text}</p>
                          </div>
                          
                          {update.evidenceText && (
                            <button 
                              onClick={() => setExpandedEvidenceIdx(isExpanded ? null : idx)}
                              className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors pl-5 self-start flex items-center gap-1 mt-1 cursor-pointer"
                            >
                              {isExpanded ? 'Hide evidence' : 'View evidence'} 
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        {isExpanded && update.evidenceText && (
                          <div className="bg-slate-50 px-5 py-4 border-t border-slate-100">
                            <p className="text-[13px] text-slate-600 font-medium italic leading-relaxed">
                              "{update.evidenceText}"
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 flex items-center gap-1"><Info className="w-3 h-3" /> Source: SEC Filing</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex flex-col gap-3">
              <button 
                onClick={() => router.push(`/build-thesis/${reviewCompany.ticker}`)}
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors text-[13px] cursor-pointer"
              >
                Modify My Thesis
              </button>
              
              <button 
                onClick={() => router.push(`/company/${reviewCompany.ticker}?view=research`)}
                className="w-full text-blue-600 hover:text-blue-800 font-bold py-2 rounded-xl transition-colors text-[13px] mt-1 cursor-pointer"
              >
                Open Full Research →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[200] animate-[slideIn_0.3s_ease-out]">
          <div className="bg-white border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-2xl p-5 flex gap-4 max-w-sm items-start">
            <div className="w-8 h-8 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 border border-emerald-100 mt-0.5">
              <Check className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex-1 pr-2">
              <h4 className="text-[14px] font-bold text-[#0F172A] mb-1">{toastMessage.title}</h4>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                {toastMessage.description}
              </p>
            </div>
            <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer mt-0.5">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* FIRST-TIME ALPHA WELCOME MODAL */}
      {showAlphaWelcome && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-200 animate-[slideIn_0.4s_ease-out] relative">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-blue-100">
              <span className="text-3xl">👋</span>
            </div>
            
            <h3 className="text-2xl font-extrabold text-[#0F172A] mb-3">Welcome to the Alpha!</h3>
            
            <div className="text-[14px] text-slate-600 font-medium leading-relaxed mb-8 space-y-4 text-left bg-slate-50 p-5 rounded-2xl border border-slate-100">
              <p>
                We are so excited to have you as one of our early testers. Since we are currently in our closed Alpha phase, your account has been granted <strong className="text-[#0F172A]">free access to track up to 5 stocks</strong>.
              </p>
              <p>
                As we build out our Pro features (unlimited stocks, instant alerts, etc.), we would love your direct feedback on what we should build next and how we should price it.
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  closeAlphaWelcome();
                  router.push('/feedback');
                }}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-sm shadow-blue-600/20 cursor-pointer"
              >
                View Roadmap & Give Feedback
              </button>
              
              <button 
                onClick={closeAlphaWelcome} 
                className="w-full py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all cursor-pointer"
              >
                Continue to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}