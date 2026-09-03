'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  Info, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Loader2, 
  RefreshCw, 
  X, 
  Check, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { createClient } from "@supabase/supabase-js";
import WatchlistSection from '@/components/WatchlistSection';
import SmartSearchBar from '@/components/SmartSearchBar';
import Header from '@/components/Header';

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
  headline?: string;
  trend: 'up' | 'down' | 'neutral';
  evidenceText?: string;
  sourceName?: string;
  sourceUrl?: string | null;
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

interface PortfolioEvent {
  id: string;
  ticker: string;
  headline: string;
  impact_summary: string;
  event_type: string;
  sentiment: 'strengthening' | 'monitoring' | 'risk';
  source_url?: string | null;
  source_name?: string | null;
  detected_at: string;
}

function getTimeAgo(dateString: string | null) {
  if (!dateString) return 'recently';
  const now = new Date();
  const past = new Date(dateString);
  const diffInMinutes = Math.floor((now.getTime() - past.getTime()) / 60000);

  if (diffInMinutes < 1) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
  return `${Math.floor(diffInMinutes / 1440)}d ago`;
}

export function CompanyLogo({ ticker, containerClass }: { ticker: string; containerClass: string }) {
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
  const [events, setEvents] = useState<PortfolioEvent[]>([]);
  const [userName, setUserName] = useState('Investor');
  const [sessionLabel, setSessionLabel] = useState('Past 24 Hours');
  const [latestEventScanTime, setLatestEventScanTime] = useState<string | null>(null);

  const [reviewCompany, setReviewCompany] = useState<TrackedCompany | null>(null);
  const [expandedEvidenceIdx, setExpandedEvidenceIdx] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<{title: string; description: string} | null>(null);
  const [showAlphaWelcome, setShowAlphaWelcome] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenAlphaWelcome');
    if (!hasSeenWelcome) {
      const timer = setTimeout(() => setShowAlphaWelcome(true), 1500);
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

      // 1. Fetch User Holdings
      const { data: dbTheses, error } = await supabase
        .from("theses")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (!dbTheses || dbTheses.length === 0) {
        setPortfolio([]);
        setEvents([]);
        setIsLoading(false);
        return;
      }

      const tickers = dbTheses.map((t: any) => t.ticker.toUpperCase());

      // 2. Determine Lookback Window (Floor: 24h, Ceiling: 7 days)
      const storedLastVisit = localStorage.getItem(`last_visit_${session.user.id}`);
      const now = new Date();
      let lookbackDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default 24h floor

      if (storedLastVisit) {
        const lastVisitDate = new Date(storedLastVisit);
        const diffHours = (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60);

        if (diffHours >= 168) {
          // 7 days or more -> Ceiling
          lookbackDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          setSessionLabel('Past 7 Days');
        } else if (diffHours > 24) {
          lookbackDate = lastVisitDate;
          const days = Math.floor(diffHours / 24);
          setSessionLabel(`Past ${days} Day${days > 1 ? 's' : ''}`);
        } else {
          setSessionLabel('Since Yesterday');
        }
      } else {
        setSessionLabel('Past 24 Hours');
      }

      // Record current visit timestamp
      localStorage.setItem(`last_visit_${session.user.id}`, now.toISOString());

      // 3. Fetch Portfolio Events for Held Tickers (Last 7 Days)
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: eventRecords } = await supabase
        .from('portfolio_events')
        .select('*')
        .in('ticker', tickers)
        .gte('detected_at', sevenDaysAgo)
        .order('detected_at', { ascending: false });

      const safeEvents: PortfolioEvent[] = eventRecords || [];
      setEvents(safeEvents);

      if (safeEvents.length > 0) {
        setLatestEventScanTime(safeEvents[0].detected_at);
      }

      // 4. Map DB Theses to Dashboard Structure
      const mappedPortfolio: TrackedCompany[] = dbTheses.map((t: any) => {
        const ticker = t.ticker.toUpperCase();
        const tickerEvents = safeEvents.filter(e => e.ticker.toUpperCase() === ticker);
        
        let dynamicStatus: TrackedCompany['status'] = 'Strengthening';
        if (tickerEvents.some(e => e.sentiment === 'risk')) {
          dynamicStatus = 'Weakening';
        } else if (tickerEvents.some(e => e.sentiment === 'monitoring')) {
          dynamicStatus = 'Review Needed';
        }

        const updates: CompanyUpdate[] = tickerEvents.map(e => ({
          text: e.headline,
          headline: e.headline,
          trend: e.sentiment === 'strengthening' ? 'up' : e.sentiment === 'monitoring' ? 'down' : 'neutral',
          evidenceText: e.impact_summary,
          sourceName: e.source_name || 'Market Filing / Disclosure',
          sourceUrl: e.source_url
        }));

        return {
          id: t.id,
          ticker: ticker,
          name: t.company_name || ticker,
          status: dynamicStatus,
          coreThesis: t.drivers?.[0]?.title || 'Long-term thesis tracking active',
          aiSummary: tickerEvents[0]?.impact_summary || t.ai_summary || 'Tracking active. Awaiting next earnings report or SEC filing.',
          updates: updates.length > 0 ? updates : (typeof t.updates === 'string' ? JSON.parse(t.updates) : t.updates || []),
          drivers: typeof t.drivers === 'string' ? JSON.parse(t.drivers) : (t.drivers || []),
          primaryRisk: t.primary_risk || undefined,
          lastUpdated: new Date(t.last_scanned_at || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          rawUpdatedAt: t.last_scanned_at || t.created_at,
          requiresAction: dynamicStatus !== 'Strengthening'
        };
      });

      setPortfolio(mappedPortfolio);
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

  const handleRefresh = async () => {
    setIsSyncing(true);
    await loadDashboard();
    setIsSyncing(false);
    setToastMessage({
      title: "Dashboard Refreshed",
      description: "Surfaced the latest catalogued portfolio alerts."
    });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // --- DERIVE DELTAS FOR "SINCE YOUR LAST VISIT" ---
  const { strengtheningTickers, riskTickers, attentionTickers } = useMemo(() => {
    const s = new Set<string>();
    const r = new Set<string>();
    const a = new Set<string>();

    events.forEach(e => {
      if (e.sentiment === 'strengthening') s.add(e.ticker);
      if (e.sentiment === 'monitoring') r.add(e.ticker);
      if (e.sentiment === 'risk') a.add(e.ticker);
    });

    return {
      strengtheningTickers: Array.from(s),
      riskTickers: Array.from(r),
      attentionTickers: Array.from(a)
    };
  }, [events]);

  // Companies that have at least one active event in the last 7 days
  const activeEventCompanies = useMemo(() => {
    const eventTickers = new Set(events.map(e => e.ticker.toUpperCase()));
    return portfolio.filter(p => eventTickers.has(p.ticker.toUpperCase()));
  }, [portfolio, events]);

  const getStatusStyles = (status: TrackedCompany['status']) => {
    switch(status) {
      case 'Strengthening': return { dotColor: 'text-emerald-500', label: 'Strengthening' };
      case 'Review Needed': return { dotColor: 'text-amber-500', label: 'Review Needed' };
      case 'Weakening': return { dotColor: 'text-rose-500', label: 'Weakening' };
      default: return { dotColor: 'text-slate-400', label: 'Stable' };
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

      <Header />

      <main className="max-w-[960px] mx-auto px-6 pt-12 md:pt-14">
        
        {portfolio.length === 0 ? (
          <div className="text-center py-16">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A] mb-4">
              Welcome to Investment IQ, {userName}
            </h1>
            <p className="text-slate-500 mb-12 max-w-xl mx-auto text-lg">
              Your portfolio is empty — build your first investment thesis to start monitoring drivers and catalysts.
            </p>
            
            <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-sm max-w-xl mx-auto">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-200">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h2 className="text-xl font-bold text-[#0F172A] mb-6">Research a company to get started</h2>
              <div className="w-full relative z-50">
                <SmartSearchBar variant="hero" />
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* TOP BAR: WELCOME & TRACKING LIMIT STATUS */}
            <div className="mb-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                <div>
                  <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-[#0F172A]">
                    Welcome Back, {userName}
                  </h1>
                  <p className="text-[14px] font-medium text-slate-500 mt-1">
                    Here’s what shifted across your monitored companies.
                  </p>
                </div>

                <div className="flex items-center gap-3 self-start sm:self-center">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100/80 border border-slate-200 rounded-lg text-[10px] font-bold uppercase tracking-wider text-slate-600">
                    <span className="w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    <span>{portfolio.length} / {MAX_STOCKS_LIMIT} Theses Active</span>
                  </div>

                  <button 
                    onClick={handleRefresh}
                    disabled={isSyncing}
                    title="Reload data"
                    className="bg-white border border-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-50 transition-all flex items-center shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-400'}`} />
                  </button>
                </div>
              </div>
            </div>

            {/* SECTION 1: SINCE YOUR LAST VISIT */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Since Your Last Visit
                </h2>
                <span className="text-[10px] font-semibold text-slate-400">
                  {sessionLabel}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Box 1: Strengthening */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-extrabold text-lg shrink-0">
                      {strengtheningTickers.length}
                    </div>
                    <div className="text-xs font-bold text-slate-700 leading-tight">
                      Companies<br/>strengthening
                    </div>
                  </div>
                  {strengtheningTickers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                      {strengtheningTickers.map(ticker => (
                        <span key={ticker} className="text-[12px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
                          {ticker}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100">
                      No positive shifts recorded
                    </p>
                  )}
                </div>

                {/* Box 2: Risks */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-extrabold text-lg shrink-0">
                      {riskTickers.length}
                    </div>
                    <div className="text-xs font-bold text-slate-700 leading-tight">
                      Companies with<br/>increased risks
                    </div>
                  </div>
                  {riskTickers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                      {riskTickers.map(ticker => (
                        <span key={ticker} className="text-[12px] font-semibold bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded flex items-center gap-1">
                          {ticker}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100">
                      No elevated risks detected
                    </p>
                  )}
                </div>

                {/* Box 3: Attention */}
                <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-center gap-3">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center font-extrabold text-lg shrink-0">
                      {attentionTickers.length}
                    </div>
                    <div className="text-xs font-bold text-slate-700 leading-tight">
                      Companies need<br/>attention
                    </div>
                  </div>
                  {attentionTickers.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-3 border-t border-slate-100">
                      {attentionTickers.map(ticker => (
                        <span key={ticker} className="text-[12px] font-semibold bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded flex items-center gap-1">
                          {ticker}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] font-medium text-slate-400 pt-2 border-t border-slate-100">
                      All investment boundaries hold
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: WHAT CHANGED */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  What Changed
                </h2>
                <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-1.5 uppercase tracking-wider">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Monitored {getTimeAgo(latestEventScanTime)}
                </span>
              </div>

              {activeEventCompanies.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {activeEventCompanies.map(company => (
                    <div 
                      key={`alert-${company.ticker}`} 
                      className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start gap-4 flex-grow">
                        <CompanyLogo 
                          ticker={company.ticker} 
                          containerClass="w-10 h-10 rounded-lg" 
                        />
                        <div className="flex-grow pt-0.5">
                          <div className="flex items-center gap-3 mb-1.5">
                            <span className="font-bold text-lg text-[#0F172A] leading-none">
                              {company.ticker}
                            </span>
                            <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest">
                              <span className={getStatusStyles(company.status).dotColor}>●</span> 
                              {getStatusStyles(company.status).label}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 font-medium leading-relaxed max-w-2xl line-clamp-2">
                            {company.aiSummary}
                          </p>
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
              ) : (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col items-center justify-center">
                  <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  </div>
                  <p className="text-sm font-bold text-[#0F172A]">All Quiet Across Monitored Holdings</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">
                    No material SEC filings, earnings surprises, or key management disclosures detected in the past 7 days.
                  </p>
                </div>
              )}
            </div>

            {/* SECTION 3: MARKET OPPORTUNITIES */}
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
                  <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    {reviewCompany.ticker}
                  </h2>
                </div>
                
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                  <span className={getStatusStyles(reviewCompany.status).dotColor}>●</span> 
                  {getStatusStyles(reviewCompany.status).label}
                </div>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Affected Thesis
                </h4>
                <p className="font-bold text-[#0F172A] text-[14px] leading-relaxed">
                  {reviewCompany.coreThesis}
                </p>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-t border-slate-100 pt-8">
                  Detected Impact
                </h4>
                <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                  {reviewCompany.aiSummary}
                </p>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-t border-slate-100 pt-8">
                  Supporting Evidence
                </h4>
                <div className="space-y-4">
                  {reviewCompany.updates.map((update, idx) => {
                    const isExpanded = expandedEvidenceIdx === idx;
                    return (
                      <div 
                        key={idx} 
                        className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm transition-all"
                      >
                        <div className="p-4 flex flex-col gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className="flex-shrink-0">
                              {getTrendIcon(update.trend)}
                            </div>
                            <p className="text-[13px] font-bold text-[#0F172A] leading-tight">
                              {update.headline || update.text || "Market catalyst detected"}
                            </p>
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
                            
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 flex items-center gap-1">
                              <Info className="w-3 h-3" /> 
                              {update.sourceUrl ? (
                                <a 
                                  href={update.sourceUrl} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="hover:text-blue-600 underline transition-colors flex items-center gap-1"
                                >
                                  Source: {update.sourceName || 'View Source'} <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span>Source: {update.sourceName || 'SEC Filing / Public Disclosure'}</span>
                              )}
                            </p>
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
                As we build out our Pro features, we would love your direct feedback on what we should build next and how we should price it.
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