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

// PREMIUM UX: Clean company names by removing legal jargon
function cleanCompanyName(name: string, ticker: string): string {
  if (!name) return ticker;
  let cleaned = name.replace(/\b(Inc\.?|Corp\.?|Corporation|Company|Co\.?|Ltd\.?|Limited|Plc|Holdings?|Group|Class [A-Z])\b/gi, '').trim();
  cleaned = cleaned.replace(/[,.\- ]+$/, '').trim();
  return cleaned.length > 1 ? cleaned : ticker;
}

function isEventRelevantToThesis(
  event: PortfolioEvent,
  drivers: Driver[],
  primaryRisk?: string
): boolean {
  const targetTopics: string[] = [];

  if (Array.isArray(drivers)) {
    drivers.forEach((d) => {
      if (d.title) targetTopics.push(d.title.toLowerCase());
      if (d.description) targetTopics.push(d.description.toLowerCase());
    });
  }

  if (primaryRisk) {
    targetTopics.push(primaryRisk.toLowerCase());
  }

  if (targetTopics.length === 0) return true;

  const eventContent = `${event.headline} ${event.impact_summary} ${event.event_type || ''}`.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    valuation_financials: ['valuation', 'multiple', 'pe', 'revenue', 'earnings', 'margin', 'ebitda', 'guidance', 'profit', 'cash flow'],
    product_tech: ['product', 'launch', 'tech', 'software', 'hardware', 'fsd', 'ai', 'delivery', 'fleet', 'chip'],
    regulatory_legal: ['sec', 'court', 'lawsuit', 'legal', 'regulation', 'investigation', 'compliance', 'approval', 'doj'],
    leadership_ops: ['ceo', 'cfo', 'executive', 'board', 'layoff', 'restructuring', 'operations', 'musk'],
    macro_market: ['interest rate', 'inflation', 'fed', 'recession', 'tariff', 'macro', 'sector']
  };

  const hasDirectTextMatch = targetTopics.some((topic) => {
    const significantWords = topic.split(/\s+/).filter((w) => w.length > 3);
    return significantWords.some((word) => eventContent.includes(word));
  });

  if (hasDirectTextMatch) return true;

  const eventCategory = event.event_type;
  if (eventCategory && categoryKeywords[eventCategory]) {
    const relevantKeywords = categoryKeywords[eventCategory];
    const userTracksThisCategory = targetTopics.some((topic) =>
      relevantKeywords.some((kw) => topic.includes(kw))
    );
    if (userTracksThisCategory) return true;
  }

  return false;
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
  const [isRedirecting, setIsRedirecting] = useState(false);
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

 // ✨ THE SMART REDIRECT LOGIC
  useEffect(() => {
    const redirectUrl = sessionStorage.getItem('postAuthRedirect');
    
    if (redirectUrl) {
      // 1. Show the teleporting screen
      setIsRedirecting(true);
      
      // 2. Destroy the sticky note
      sessionStorage.removeItem('postAuthRedirect');
      
      // 3. Use a hard redirect (window.location) instead of router.push. 
      // This forces the server to freshly load the destination page and confirm auth.
      window.location.href = redirectUrl;
      
      // 4. Failsafe: If the destination page doesn't exist or fails to load, 
      // drop them back into the dashboard after 3 seconds instead of hanging.
      setTimeout(() => {
        setIsRedirecting(false);
      }, 3000);
      
    } else {
      // If NO redirect, safely show the Alpha Welcome modal after 1.5 seconds
      const timer = setTimeout(() => setShowAlphaWelcome(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [router]);

  const closeAlphaWelcome = () => {
    setShowAlphaWelcome(false);
  };

  useEffect(() => {
    setExpandedEvidenceIdx(null);
  }, [reviewCompany]);

  useEffect(() => {
    // Only load the dashboard data if we aren't teleporting them away
    if (!isRedirecting) {
      loadDashboard();
    }
  }, [isRedirecting]);

  const loadDashboard = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
     if (!session) {
        // For the dashboard, we just send them to login. The GlobalAuthModal
        // defaults to sending users to the Dashboard anyway.
        router.push('/?auth=login');
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
        setEvents([]);
        setIsLoading(false);
        return;
      }

      const tickers = dbTheses.map((t: any) => t.ticker.toUpperCase());

      const storedLastVisit = localStorage.getItem(`last_visit_${session.user.id}`);
      const now = new Date();
      let lookbackDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); 

      if (storedLastVisit) {
        const lastVisitDate = new Date(storedLastVisit);
        const diffHours = (now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60);

        if (diffHours >= 168) {
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

      localStorage.setItem(`last_visit_${session.user.id}`, now.toISOString());

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

      const mappedPortfolio: TrackedCompany[] = dbTheses.map((t: any) => {
        const ticker = t.ticker.toUpperCase();
        const rawDrivers = typeof t.drivers === 'string' ? JSON.parse(t.drivers) : (t.drivers || []);
        const primaryRisk = t.primary_risk || undefined;
        
        const parsedCurated = typeof t.curated_updates === 'string' 
          ? JSON.parse(t.curated_updates) 
          : (t.curated_updates || null);

        const tickerEvents = safeEvents.filter(e => e.ticker.toUpperCase() === ticker);
        const relevantEvents = tickerEvents.filter(e =>
          isEventRelevantToThesis(e, rawDrivers, primaryRisk)
        );

        let dynamicStatus: TrackedCompany['status'] = parsedCurated?.status || t.status || 'Strengthening';
        
        if (!parsedCurated?.status) {
            if (relevantEvents.some(e => e.sentiment === 'risk')) {
              dynamicStatus = 'Weakening';
            } else if (relevantEvents.some(e => e.sentiment === 'monitoring')) {
              dynamicStatus = 'Review Needed';
            }
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
          coreThesis: rawDrivers[0]?.title || 'Long-term thesis tracking active',
          aiSummary: parsedCurated?.key_thesis_change || relevantEvents[0]?.impact_summary || tickerEvents[0]?.impact_summary || t.ai_summary || 'Tracking active. Awaiting next earnings report or SEC filing.',
          updates: parsedCurated?.supporting_events?.map((e: any) => ({
            headline: e.headline, text: e.headline, sourceName: e.source_name, sourceUrl: e.source_url
          })) || updates.slice(0, 3) || [],
          drivers: rawDrivers,
          primaryRisk: primaryRisk,
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
  const { strengtheningCompanies, riskCompanies, attentionCompanies } = useMemo(() => {
    const s = new Map<string, { ticker: string, name: string }>();
    const r = new Map<string, { ticker: string, name: string }>();
    const a = new Map<string, { ticker: string, name: string }>();

    portfolio.forEach((company) => {
      const brandData = {
        ticker: company.ticker,
        name: cleanCompanyName(company.name, company.ticker)
      };

      if (company.status === 'Weakening') {
        a.set(company.ticker, brandData);
      } else if (company.status === 'Review Needed') {
        r.set(company.ticker, brandData);
      } else if (company.status === 'Strengthening' && company.updates.length > 0) {
        s.set(company.ticker, brandData); 
      }
    });

    return {
      strengtheningCompanies: Array.from(s.values()),
      riskCompanies: Array.from(r.values()),
      attentionCompanies: Array.from(a.values())
    };
  }, [portfolio]);

  // --- EVENT-CENTRIC SUMMARY FOR "WHAT CHANGED" SECTION ---
  const portfolioEventsSummary = useMemo(() => {
    const summary: any[] = [];
    const seenTickers = new Set<string>();

    for (const event of events) {
      if (!seenTickers.has(event.ticker)) {
        const company = portfolio.find(p => p.ticker === event.ticker);
        if (company) {
          const updatesCount = company.updates?.length || 0;
          summary.push({
            id: event.id,
            ticker: event.ticker,
            companyName: cleanCompanyName(company.name, company.ticker),
            synthesized_summary: event.impact_summary,
            sentiment: event.sentiment,
            source_url: event.source_url,
            source_name: event.source_name,
            hasMultipleEvidence: updatesCount > 1,
            company: company,
            detected_at: event.detected_at
          });
          seenTickers.add(event.ticker);
        }
      }
      if (summary.length >= 5) break;
    }
    
    return summary;
  }, [events, portfolio]);

  const getStatusStyles = (status?: TrackedCompany['status']) => {
    switch(status) {
      case 'Strengthening': return { dotColor: 'text-emerald-500', label: 'Strengthening' };
      case 'Review Needed': return { dotColor: 'text-amber-500', label: 'Review Needed' };
      case 'Weakening': return { dotColor: 'text-rose-500', label: 'Weakening' };
      default: return { dotColor: 'text-slate-400', label: 'Stable' };
    }
  };

  if (isLoading || isRedirecting) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans antialiased">
        <div className="text-slate-500 font-bold flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> 
          {isRedirecting ? 'Restoring your workspace...' : 'Loading Dashboard...'}
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

            {/* SECTION 1: SINCE YOUR LAST VISIT (UNIFIED HEALTH CARD) */}
            <div className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Since Your Last Visit
                </h2>
                <span className="text-[10px] font-semibold text-slate-400">
                  {sessionLabel}
                </span>
              </div>
              
              <div className="bg-white rounded-[24px] border border-slate-200/90 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                
                {/* 1. Strengthening */}
                <div className="p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 transition-colors ${
                      strengtheningCompanies.length > 0 
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' 
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      {strengtheningCompanies.length}
                    </div>
                    <div className="leading-tight">
                      <p className={`text-xs font-bold ${strengtheningCompanies.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        Companies
                      </p>
                      <p className={`text-xs font-bold ${strengtheningCompanies.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        strengthening
                      </p>
                    </div>
                  </div>

                  {strengtheningCompanies.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100/80 mt-4">
                      {strengtheningCompanies.map(company => (
                        <span 
                          key={company.ticker} 
                          className="flex items-center gap-1.5 text-[11px] bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-lg"
                        >
                          <span className="font-extrabold text-emerald-900">{company.name}</span>
                          <span className="font-bold text-emerald-600/70">{company.ticker}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-slate-100/80 mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                      <span>No positive shifts recorded</span>
                    </div>
                  )}
                </div>

                {/* 2. Increased Risks */}
                <div className="p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 transition-colors ${
                      riskCompanies.length > 0 
                        ? 'bg-amber-50 text-amber-600 border border-amber-100' 
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      {riskCompanies.length}
                    </div>
                    <div className="leading-tight">
                      <p className={`text-xs font-bold ${riskCompanies.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        Companies with
                      </p>
                      <p className={`text-xs font-bold ${riskCompanies.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        increased risks
                      </p>
                    </div>
                  </div>

                  {riskCompanies.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100/80 mt-4">
                      {riskCompanies.map(company => (
                        <span 
                          key={company.ticker} 
                          className="flex items-center gap-1.5 text-[11px] bg-amber-50 border border-amber-200/60 px-2.5 py-1 rounded-lg"
                        >
                          <span className="font-extrabold text-amber-900">{company.name}</span>
                          <span className="font-bold text-amber-600/70">{company.ticker}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-slate-100/80 mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                      <span>No elevated risks detected</span>
                    </div>
                  )}
                </div>

                {/* 3. Attention Needed */}
                <div className="p-6 flex flex-col justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 transition-colors ${
                      attentionCompanies.length > 0 
                        ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                        : 'bg-slate-50 text-slate-400 border border-slate-100'
                    }`}>
                      {attentionCompanies.length}
                    </div>
                    <div className="leading-tight">
                      <p className={`text-xs font-bold ${attentionCompanies.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        Companies need
                      </p>
                      <p className={`text-xs font-bold ${attentionCompanies.length > 0 ? 'text-slate-800' : 'text-slate-400'}`}>
                        attention
                      </p>
                    </div>
                  </div>

                  {attentionCompanies.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-slate-100/80 mt-4">
                      {attentionCompanies.map(company => (
                        <span 
                          key={company.ticker} 
                          className="flex items-center gap-1.5 text-[11px] bg-rose-50 border border-rose-200/60 px-2.5 py-1 rounded-lg"
                        >
                          <span className="font-extrabold text-rose-900">{company.name}</span>
                          <span className="font-bold text-rose-600/70">{company.ticker}</span>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="pt-4 border-t border-slate-100/80 mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-300 shrink-0"></span>
                      <span>All investment boundaries hold</span>
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* SECTION 2: WHAT CHANGED (EVENT-CENTRIC FEED) */}
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

              {portfolioEventsSummary.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {portfolioEventsSummary.map((eventSummary) => {
                    const hasMultiple = eventSummary.hasMultipleEvidence;

                    return (
                      <div 
                        key={`alert-${eventSummary.ticker}-${eventSummary.id}`} 
                        className="bg-white border border-slate-200 rounded-[24px] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start gap-4 flex-grow">
                          <CompanyLogo 
                            ticker={eventSummary.ticker} 
                            containerClass="w-11 h-11 sm:w-12 sm:h-12 rounded-xl" 
                          />
                          <div className="flex-grow pt-0.5">
                            <div className="flex flex-wrap items-center gap-3 mb-2">
                              {/* PREMIUM UX: Display Brand Name + Ticker side-by-side */}
                              <span className="font-extrabold text-xl text-[#0F172A] tracking-tight leading-none">
                                {eventSummary.companyName} <span className="text-slate-400 font-bold text-[16px] ml-1">{eventSummary.ticker}</span>
                              </span>
                              <div className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
                                <span className={eventSummary.sentiment === 'strengthening' ? 'text-emerald-500' : eventSummary.sentiment === 'risk' ? 'text-rose-500' : 'text-amber-500'}>●</span> 
                                <span className={eventSummary.sentiment === 'strengthening' ? 'text-emerald-600' : eventSummary.sentiment === 'risk' ? 'text-rose-600' : 'text-amber-600'}>
                                  {eventSummary.sentiment === 'strengthening' ? 'Positive Event' : eventSummary.sentiment === 'risk' ? 'Risk Event' : 'Monitoring Event'}
                                </span>
                              </div>
                            </div>

                            <p className="text-[14px] text-slate-700 font-medium leading-relaxed max-w-2xl">
                              {eventSummary.synthesized_summary}
                            </p>
                          </div>
                        </div>

                        {/* Symmetrical Right Action */}
                        {hasMultiple ? (
                          <button 
                            onClick={() => setReviewCompany(eventSummary.company)}
                            className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-[#0F172A] hover:bg-slate-50 hover:border-slate-300 transition-all whitespace-nowrap shadow-sm shrink-0 cursor-pointer self-start sm:self-center"
                          >
                            Review ({eventSummary.company.updates?.length})
                          </button>
                        ) : (
                          eventSummary.source_url ? (
                            <a 
                              href={eventSummary.source_url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="px-4 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-[#0F172A] transition-all whitespace-nowrap shadow-sm shrink-0 flex items-center gap-1.5 self-start sm:self-center"
                            >
                              <span>{eventSummary.source_name || 'Source'}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400" />
                            </a>
                          ) : null
                        )}
                      </div>
                    );
                  })}
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
                    ticker={reviewCompany?.ticker} 
                    containerClass="w-12 h-12 rounded-xl" 
                  />
                  {/* PREMIUM UX: Drawer Name Header */}
                  <h2 className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    {cleanCompanyName(reviewCompany?.name || '', reviewCompany?.ticker || '')} <span className="text-slate-400 ml-1.5 font-bold text-2xl">{reviewCompany?.ticker}</span>
                  </h2>
                </div>
                
                <div className="text-[10px] font-bold uppercase tracking-widest text-slate-700 flex items-center gap-1.5">
                  <span className={getStatusStyles(reviewCompany?.status).dotColor}>●</span> 
                  {getStatusStyles(reviewCompany?.status).label}
                </div>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                  Affected Thesis
                </h4>
                <p className="font-bold text-[#0F172A] text-[14px] leading-relaxed">
                  {reviewCompany?.coreThesis}
                </p>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-t border-slate-100 pt-8">
                  Detected Impact
                </h4>
                <p className="text-[13px] text-slate-700 leading-relaxed font-medium">
                  {reviewCompany?.aiSummary}
                </p>
              </div>
              
              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 border-t border-slate-100 pt-8">
                  Supporting Evidence ({reviewCompany?.updates?.length || 0})
                </h4>
                <div className="space-y-3">
                  {reviewCompany?.updates?.map((update, idx) => (
                    <div 
                      key={idx} 
                      className="bg-white border border-slate-200/90 rounded-2xl p-4 shadow-sm hover:border-slate-300 transition-all flex items-start gap-3.5"
                    >
                      <span className="text-[11px] font-mono font-bold text-slate-400 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg mt-0.5 shrink-0">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-1">
                        <p className="text-[13px] font-bold text-[#0F172A] leading-snug">
                          {update.headline || update.text || "Market catalyst detected"}
                        </p>
                        <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          {update.sourceUrl ? (
                            <a 
                              href={update.sourceUrl} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="hover:text-blue-600 transition-colors flex items-center gap-1"
                            >
                              Source: {update.sourceName || 'Market Disclosure'} <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ) : (
                            <span>Source: {update.sourceName || 'Market Disclosure'}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
             
            </div>

            <div className="p-6 border-t border-slate-200 bg-white flex flex-col gap-3">
              <button 
                onClick={() => router.push(`/build-thesis/${reviewCompany?.ticker}`)}
                className="w-full bg-[#0F172A] hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors text-[13px] cursor-pointer"
              >
                Modify My Thesis
              </button>
              
              <button 
                onClick={() => router.push(`/company/${reviewCompany?.ticker}?view=research`)}
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
              <h4 className="text-[14px] font-bold text-[#0F172A] mb-1">{toastMessage?.title}</h4>
              <p className="text-[13px] font-medium text-slate-500 leading-relaxed">
                {toastMessage?.description}
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