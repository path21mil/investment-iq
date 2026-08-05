'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, TrendingUp, TrendingDown, Info, X, ChevronDown, ChevronUp, AlertTriangle, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// 1. DATA STRUCTURE
interface CompanyUpdate {
  text: string;
  trend: 'up' | 'down' | 'neutral';
  evidenceText?: string;
}

interface TrackedCompany {
  ticker: string;
  name: string;
  domain: string;
  status: 'Strengthening' | 'Review Needed' | 'Weakening';
  summaryBold: string;
  summaryLight: string;
  affectedDriver: string;
  aiSummary: string;
  updates: CompanyUpdate[];
  lastUpdated: string;
  requiresAction: boolean;
  price: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [portfolio, setPortfolio] = useState<TrackedCompany[]>([]);
  const [userName, setUserName] = useState('Investor');
  
  const [reviewCompany, setReviewCompany] = useState<TrackedCompany | null>(null);
  const [expandedEvidenceIdx, setExpandedEvidenceIdx] = useState<number | null>(null);

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
        router.push('/login'); 
        return;
      }
      
      const name = session.user.user_metadata?.full_name?.split(' ')[0] || 'Padam';
      setUserName(name);

      const mockPortfolio: TrackedCompany[] = [
        {
          ticker: 'TSLA',
          name: 'TESLA INC.',
          domain: 'tesla.com',
          status: 'Weakening',
          summaryBold: 'Automotive margins under pressure.',
          summaryLight: 'Price cuts continue to impact profitability.',
          affectedDriver: 'High Operating Margins',
          aiSummary: 'Automotive margins declined due to continued price cuts, reducing overall profitability. Energy growth remained strong, but your original margin thesis weakened this quarter.',
          updates: [
            { text: 'Margin dropped to 5.5%', trend: 'down', evidenceText: '"Operating margin decreased to 5.5% in Q1..."' },
            { text: 'Energy generation grew 40%', trend: 'up', evidenceText: '"Energy generation deployments reached a record high..."' }
          ],
          lastUpdated: 'Yesterday',
          requiresAction: true,
          price: 172.50
        },
        {
          ticker: 'AMD',
          name: 'ADVANCED MICRO DEVICES',
          domain: 'amd.com',
          status: 'Review Needed',
          summaryBold: 'AI GPU demand stronger than expected.',
          summaryLight: 'Gaming segment continues to lag.',
          affectedDriver: 'Data Center Growth Leadership',
          aiSummary: 'Data center GPU revenue accelerated significantly, confirming your thesis on AI demand. However, the gaming segment dropped sharply.',
          updates: [
            { text: 'Data center revenue doubled YoY', trend: 'up', evidenceText: '"Data Center segment revenue was a record $2.3 billion..."' },
            { text: 'Gaming segment dropped 48%', trend: 'down', evidenceText: '"Gaming segment revenue was $922 million, down 48%..."' }
          ],
          lastUpdated: '2 hours ago',
          requiresAction: true,
          price: 164.20
        },
        {
          ticker: 'AAPL',
          name: 'APPLE INC.',
          domain: 'apple.com',
          status: 'Strengthening',
          summaryBold: 'Services revenue accelerating.',
          summaryLight: 'Offsetting slight hardware softness.',
          affectedDriver: 'Sticky Services Ecosystem',
          aiSummary: 'Services revenue hit an all-time high with expanding gross margins. This perfectly validates your thesis that Apple is successfully monetizing its installed base.',
          updates: [
            { text: 'Services revenue grew 14% YoY', trend: 'up', evidenceText: '"Services revenue reached a new all-time record..."' },
            { text: 'China iPhone sales stabilized', trend: 'neutral', evidenceText: '"While the macroeconomic environment remains dynamic..."' }
          ],
          lastUpdated: '3 days ago',
          requiresAction: false,
          price: 175.30
        },
        {
          ticker: 'NVDA',
          name: 'NVIDIA CORP.',
          domain: 'nvidia.com',
          status: 'Strengthening',
          summaryBold: 'Blackwell demand exceeding supply.',
          summaryLight: 'Unprecedented hyperscaler capex continues.',
          affectedDriver: 'Unmatched AI Hardware Moat',
          aiSummary: 'Demand for next-generation chips continues to outstrip supply, driving record gross margins. Management confirmed strong visibility into next year.',
          updates: [
            { text: 'Gross margins expanded to 76%', trend: 'up', evidenceText: '"GAAP gross margin expanded to 76.0%..."' },
            { text: 'Next-gen chips sold out for 12 mos', trend: 'up', evidenceText: '"Demand for our Hopper and Blackwell architectures..."' }
          ],
          lastUpdated: '1 week ago',
          requiresAction: false,
          price: 880.08
        }
      ];

      const sortedPortfolio = mockPortfolio.sort((a, b) => {
        if (a.requiresAction && !b.requiresAction) return -1;
        if (!a.requiresAction && b.requiresAction) return 1;
        const statusWeight = { 'Weakening': 3, 'Review Needed': 2, 'Strengthening': 1 };
        return statusWeight[b.status] - statusWeight[a.status];
      });
      
      setPortfolio(sortedPortfolio);
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsLoading(false), 600);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/company/${searchQuery.trim().toUpperCase()}`);
    }
  };

  const actionItems = portfolio.filter(p => p.requiresAction);

  const getStatusStyles = (status: TrackedCompany['status']) => {
    switch(status) {
      case 'Strengthening': return { border: 'border-emerald-500', badge: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60', icon: '🟢', label: 'Thesis Strengthening' };
      case 'Review Needed': return { border: 'border-amber-400', badge: 'bg-amber-50/80 text-amber-700 border-amber-200/60', icon: '🟡', label: 'Review Needed' };
      case 'Weakening': return { border: 'border-rose-500', badge: 'bg-rose-50/80 text-rose-700 border-rose-200/60', icon: '🔴', label: 'Thesis Weakening' };
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-400">Loading inbox...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 relative">
      
      {/* NAVIGATION: Wider max-w-6xl for desktop layout */}
      <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-8">
          <div className="font-extrabold text-xl tracking-tight flex items-center gap-2 cursor-pointer text-slate-900 shrink-0" onClick={() => router.push('/')}>
            Investment IQ
          </div>
          
          <div className="flex-1 max-w-lg hidden md:block">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company..."
                className="w-full bg-slate-50 border border-slate-200/60 rounded-lg py-2 pl-10 pr-4 text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none text-slate-900 placeholder-slate-400"
              />
            </form>
          </div>

          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors shrink-0">
            Sign Out
          </button>
        </div>
      </nav>

      {/* MAIN CONTAINER: Expanded to max-w-5xl for desktop optimization */}
      <main className="max-w-5xl mx-auto px-6 pt-10 md:pt-14">
        
        {/* HERO: The Conviction Inbox Alert */}
        <div className="mb-10">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-5">Welcome back, {userName} 👋</h1>
          {actionItems.length > 0 ? (
            <div className="flex items-center gap-3 text-rose-700 font-bold bg-rose-50 p-5 rounded-2xl border border-rose-100/80 shadow-sm">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-500" />
              <span className="text-sm md:text-base">Portfolio requires attention. {actionItems.length} companies have new updates.</span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-emerald-700 font-bold bg-emerald-50 p-5 rounded-2xl border border-emerald-100/80 shadow-sm">
              <Check className="w-5 h-5 shrink-0 text-emerald-500" />
              <span className="text-sm md:text-base">Your portfolio is healthy. No recent changes detected.</span>
            </div>
          )}
        </div>

        {/* SECTION 1: LATEST THESIS UPDATES (Full Width Rows for Priority) */}
        {actionItems.length > 0 && (
          <div className="mb-16">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Latest Thesis Updates</h2>
            <div className="flex flex-col gap-3">
              {actionItems.map(company => (
                <div key={`alert-${company.ticker}`} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] gap-4">
                  <div className="flex items-center gap-5">
                    <span className="font-extrabold text-2xl text-slate-900 w-16">{company.ticker}</span>
                    <div className="hidden sm:block w-px h-8 bg-slate-200"></div>
                    <div>
                      <span className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-md border inline-flex items-center gap-1.5 mb-1.5 ${getStatusStyles(company.status).badge}`}>
                        {getStatusStyles(company.status).icon} {getStatusStyles(company.status).label}
                      </span>
                      <p className="text-sm text-slate-700"><span className="font-bold text-slate-900">{company.summaryBold}</span> {company.summaryLight}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setReviewCompany(company)}
                    className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors bg-blue-50/50 hover:bg-blue-50 px-5 py-2.5 rounded-xl border border-blue-100/50 whitespace-nowrap"
                  >
                    Quick Review →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: MY CONVICTION PORTFOLIO (Desktop 2-Column Grid) */}
        <div className="mb-12">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">My Conviction Portfolio</h2>
          
          {/* CRITICAL CHANGE: grid-cols-1 on mobile, grid-cols-2 on large screens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {portfolio.map(company => {
              const styles = getStatusStyles(company.status);
              
              return (
                <div key={`port-${company.ticker}`} className={`bg-white rounded-3xl border border-slate-200/80 shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all flex flex-col overflow-hidden`}>
                  
                  {/* Card Header (Colored Top Border matching Status) */}
                  <div className={`h-1.5 w-full bg-slate-100 ${styles.border} border-t-2`}></div>
                  
                  <div className="p-6 md:p-8 flex flex-col h-full">
                    {/* Ticker & GitHub-style Status Pill */}
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="text-3xl font-extrabold text-slate-900 tracking-tight">{company.ticker}</h3>
                      <div className={`px-3 py-1 rounded-md text-[10px] font-extrabold uppercase tracking-widest border ${styles.badge}`}>
                        {styles.icon} {styles.label}
                      </div>
                    </div>
                    
                    {/* Core Thesis Summary */}
                    <div className="mb-6 flex-grow">
                      <p className="text-base text-slate-900 font-bold mb-1 leading-snug">{company.summaryBold}</p>
                      <p className="text-sm text-slate-500 leading-snug">{company.summaryLight}</p>
                    </div>
                    
                    {/* Key Changes (Clean List) */}
                    <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-100 mb-6">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Key Changes</p>
                      <div className="space-y-3">
                        {company.updates.map((update, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            {update.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                            {update.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                            {update.trend === 'neutral' && <span className="text-slate-400 font-bold shrink-0 mt-0.5 font-mono">—</span>}
                            <p className="text-xs font-bold text-slate-700 leading-snug">{update.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Clean Footer */}
                    <div className="pt-4 flex flex-row items-center justify-between mt-auto">
                      <button 
                        onClick={() => router.push(`/company/${company.ticker}`)}
                        className="text-sm font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1.5"
                      >
                        Open Thesis <ArrowRight className="w-4 h-4" />
                      </button>
                      
                      <div className="text-right flex items-center gap-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{company.lastUpdated}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* BOTTOM SEARCH (Research New Ideas) */}
        <div className="mt-16 pt-10 border-t border-slate-200 text-center pb-16">
          <p className="text-sm font-bold text-slate-500 mb-5">Research another company</p>
          <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by ticker..."
              className="w-full bg-white border border-slate-200/80 rounded-xl py-3.5 pl-11 pr-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all text-sm shadow-sm"
            />
          </form>
        </div>
      </main>

      {/* THE REDESIGNED QUICK REVIEW DRAWER REMAINS EXACTLY THE SAME */}
      {reviewCompany && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          
          <div 
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm cursor-pointer transition-opacity"
            onClick={() => {
              setReviewCompany(null);
              setExpandedEvidenceIdx(null);
            }}
          ></div>

          <div className="relative w-full max-w-[440px] h-full bg-white shadow-2xl border-l border-slate-200/60 flex flex-col animate-[slideIn_0.3s_ease-out]">
            
            <div className="p-5 flex justify-end">
              <button 
                onClick={() => {
                  setReviewCompany(null);
                  setExpandedEvidenceIdx(null);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors border border-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 pb-8">
              
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{reviewCompany.ticker}</h2>
                <div className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 border ${getStatusStyles(reviewCompany.status).badge}`}>
                  <span>{getStatusStyles(reviewCompany.status).icon}</span> {getStatusStyles(reviewCompany.status).label}
                </div>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Affected Thesis</h4>
                <div className="bg-blue-50/50 border border-blue-100/60 rounded-2xl p-5 border-l-4 border-l-blue-500 shadow-sm">
                  <p className="font-extrabold text-blue-950 text-base mb-1">{reviewCompany.affectedDriver}</p>
                  <p className="text-xs text-blue-700/80 font-medium">You selected this as one of your investment drivers.</p>
                </div>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">What Changed This Quarter</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {reviewCompany.aiSummary}
                </p>
              </div>

              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Supporting Evidence</h4>
                <div className="space-y-4">
                  {reviewCompany.updates.map((update, idx) => {
                    const isExpanded = expandedEvidenceIdx === idx;
                    
                    return (
                      <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_4px_14px_rgb(0,0,0,0.02)] transition-all">
                        <div className="p-4 flex flex-col gap-2">
                          <div className="flex items-start gap-2.5">
                            {update.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                            {update.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                            {update.trend === 'neutral' && <span className="text-slate-400 font-bold shrink-0 mt-0.5 font-mono">—</span>}
                            <p className="text-sm font-bold text-slate-900 leading-tight">{update.text}</p>
                          </div>
                          
                          <button 
                            onClick={() => setExpandedEvidenceIdx(isExpanded ? null : idx)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors pl-6 self-start flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            {isExpanded ? 'Hide evidence' : 'View evidence'} 
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>

                        {isExpanded && update.evidenceText && (
                          <div className="bg-slate-50/80 px-5 py-4 border-t border-slate-100 border-l-2 border-l-blue-400">
                            <p className="text-xs text-slate-600 font-medium italic leading-relaxed">
                              {update.evidenceText}
                            </p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-3 flex items-center gap-1"><Info className="w-3 h-3" /> Source: SEC 10-Q Filing</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-slate-200/60 bg-white flex flex-col gap-3">
              <button 
                onClick={() => router.push(`/build-thesis/${reviewCompany.ticker}`)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.4)] text-sm cursor-pointer"
              >
                Modify My Thesis
              </button>
              
              <button 
                onClick={() => {
                  setReviewCompany(null);
                  setExpandedEvidenceIdx(null);
                }}
                className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-3.5 rounded-xl transition-colors text-sm border border-slate-200/80 cursor-pointer shadow-sm"
              >
                Keep Current Thesis
              </button>
              
              <button 
                onClick={() => router.push(`/company/${reviewCompany.ticker}`)}
                className="w-full text-slate-500 hover:text-slate-900 font-bold py-2 rounded-xl transition-colors text-xs mt-1 cursor-pointer"
              >
                Open Full Research →
              </button>
            </div>

          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}