'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, TrendingUp, TrendingDown, Clock, Info, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// 1. UPDATED DATA STRUCTURE
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
          ticker: 'AMD',
          name: 'ADVANCED MICRO DEVICES',
          domain: 'amd.com',
          status: 'Review Needed',
          summaryBold: 'AI GPU demand stronger than expected.',
          summaryLight: 'Gaming segment continues to lag.',
          affectedDriver: 'Data Center Growth Leadership',
          aiSummary: 'Data center GPU revenue accelerated significantly, confirming your thesis on AI demand. However, the gaming segment dropped sharply, meaning the overall growth is highly concentrated. Your original thesis needs review to account for this shifting revenue mix.',
          updates: [
            { text: 'Data center revenue doubled YoY', trend: 'up', evidenceText: '"Data Center segment revenue was a record $2.3 billion, up 80% year-over-year, driven by strong growth in AMD Instinct™ GPUs and 4th Gen AMD EPYC™ CPUs."' },
            { text: 'Gaming segment dropped 48%', trend: 'down', evidenceText: '"Gaming segment revenue was $922 million, down 48% year-over-year, primarily due to lower semi-custom revenue and declining discrete graphics sales."' }
          ],
          lastUpdated: '2 hours ago',
          requiresAction: true,
          price: 164.20
        },
        {
          ticker: 'TSLA',
          name: 'TESLA INC.',
          domain: 'tesla.com',
          status: 'Weakening',
          summaryBold: 'Automotive margins under pressure.',
          summaryLight: 'Price cuts continue to impact profitability.',
          affectedDriver: 'High Operating Margins',
          aiSummary: 'Automotive margins declined due to continued price cuts, reducing overall profitability. Energy growth remained strong, but your original margin thesis weakened this quarter as management prioritized volume over premium pricing.',
          updates: [
            { text: 'Operating margin fell to 5.5%', trend: 'down', evidenceText: '"Operating margin decreased to 5.5% in Q1, impacted by reduced ASP (Average Selling Price) across our vehicle lineup as we navigated a high-interest rate environment."' },
            { text: 'Energy generation grew 40%', trend: 'up', evidenceText: '"Energy generation and storage deployments reached a record high, growing 40% year-over-year to 4.1 GWh, driven by strong Megapack demand."' }
          ],
          lastUpdated: 'Yesterday',
          requiresAction: true,
          price: 172.50
        },
        {
          ticker: 'AAPL',
          name: 'APPLE INC.',
          domain: 'apple.com',
          status: 'Strengthening',
          summaryBold: 'Services revenue accelerating.',
          summaryLight: 'Offsetting slight hardware softness.',
          affectedDriver: 'Sticky Services Ecosystem',
          aiSummary: 'Services revenue hit an all-time high with expanding gross margins. This perfectly validates your thesis that Apple is successfully monetizing its installed base, effectively insulating the business from cyclical hardware slowdowns.',
          updates: [
            { text: 'Services revenue grew 14% YoY', trend: 'up', evidenceText: '"Services revenue reached a new all-time record of $23.9 billion, representing a 14% increase year-over-year, with paid subscriptions surpassing 1 billion."' },
            { text: 'China iPhone sales stabilized', trend: 'neutral', evidenceText: '"While the macroeconomic environment in Greater China remains dynamic, iPhone activations remained relatively flat year-over-year in the region."' }
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
          aiSummary: 'Demand for next-generation chips continues to outstrip supply, driving record gross margins. Management confirmed strong visibility into next year, significantly strengthening your thesis regarding their hardware monopoly.',
          updates: [
            { text: 'Gross margins expanded to 76%', trend: 'up', evidenceText: '"GAAP gross margin expanded to 76.0%, driven by favorable component costs and a higher mix of Data Center software and networking revenue."' },
            { text: 'Next-gen chips sold out for 12 mos', trend: 'up', evidenceText: '"Demand for our Hopper and Blackwell architectures continues to outstrip supply. We have full visibility into our production backlog through the next calendar year."' }
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
  const strengtheningCount = portfolio.filter(p => p.status === 'Strengthening').length;

  const getAIWelcomeMessage = () => {
    if (portfolio.length === 0) return "Search for a company below to start tracking your conviction.";
    if (actionItems.length === 0) return "Your portfolio remains healthy. All tracked companies align with your original thesis.";
    
    const weakCount = actionItems.filter(a => a.status === 'Weakening').length;
    if (weakCount > 0) return `Your portfolio requires attention. ${weakCount} thesis has weakened, and ${actionItems.length - weakCount} need closer review.`;
    
    return `${actionItems.length} companies changed recently. Review the latest earnings data to ensure your thesis holds.`;
  };

  const getStatusStyles = (status: TrackedCompany['status']) => {
    switch(status) {
      case 'Strengthening': return { border: 'border-l-emerald-500', badge: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/60', icon: '🟢', label: 'Thesis Strengthening' };
      case 'Review Needed': return { border: 'border-l-amber-400', badge: 'bg-amber-50/80 text-amber-700 border-amber-200/60', icon: '🟡', label: 'Review Thesis' };
      case 'Weakening': return { border: 'border-l-rose-500', badge: 'bg-rose-50/80 text-rose-700 border-rose-200/60', icon: '🔴', label: 'Thesis Weakening' };
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-slate-50 flex items-center justify-center font-sans text-slate-400">Loading your workspace...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 relative">
      
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200/60 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-extrabold text-xl tracking-tight flex items-center gap-2 cursor-pointer text-slate-900" onClick={() => router.push('/')}>
            Investment IQ
            <span className="flex gap-0.5">
              <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            </span>
          </div>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors">
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        
        {/* WELCOME & AI SUMMARY */}
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-4 text-slate-900">Welcome back, {userName} 👋</h1>
          <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-100/60 rounded-2xl p-5 flex items-start gap-3 shadow-[0_4px_20px_rgb(59,130,246,0.05)]">
            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <p className="text-sm text-blue-900/90 font-medium leading-relaxed">{getAIWelcomeMessage()}</p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="mb-10 relative group">
          <form onSubmit={handleSearch} className="relative w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Research a new company..."
              className="w-full bg-white border border-slate-200/80 rounded-2xl py-4 pl-14 pr-4 text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-[0_8px_30px_rgb(0,0,0,0.03)] text-lg"
            />
          </form>
          <div className="mt-4 flex items-center gap-3 text-xs font-bold text-slate-400">
            <span>Popular:</span>
            {['NVDA', 'TSLA', 'META', 'AMD'].map(t => (
              <button key={t} onClick={() => router.push(`/company/${t}`)} className="hover:text-blue-600 transition-colors cursor-pointer bg-white px-2.5 py-1 rounded-md border border-slate-200/60 shadow-sm">
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* REFINED KPI ROW */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Portfolio</p>
            <p className="text-2xl font-extrabold text-slate-900">{portfolio.length} <span className="text-xs text-slate-400 font-bold">Cos</span></p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">New Updates</p>
            <p className="text-2xl font-extrabold text-slate-900">{actionItems.length}</p>
          </div>
          <div className="bg-amber-50/30 p-5 rounded-2xl border border-amber-100/60 shadow-[0_8px_30px_rgb(251,191,36,0.04)] flex flex-col justify-center">
            <p className="text-[10px] font-bold text-amber-600/80 uppercase tracking-widest mb-1.5">Needs Review</p>
            <p className="text-2xl font-extrabold text-amber-600">{actionItems.filter(p => p.status !== 'Strengthening').length}</p>
          </div>
          <div className="bg-emerald-50/30 p-5 rounded-2xl border border-emerald-100/60 shadow-[0_8px_30px_rgb(16,185,129,0.04)] flex flex-col justify-center">
            <p className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-widest mb-1.5">Healthy</p>
            <p className="text-2xl font-extrabold text-emerald-600">{strengtheningCount}</p>
          </div>
        </div>

        {/* SECTION 1: LATEST THESIS UPDATES */}
        {actionItems.length > 0 && (
          <div className="mb-14">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
              Latest Thesis Updates
            </h2>
            <div className="flex flex-col gap-4">
              {actionItems.map(company => (
                <div key={`action-${company.ticker}`} className="bg-white rounded-2xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 group">
                  <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 flex items-center justify-center shadow-sm">
                      <img 
                        src={`https://logo.clearbit.com/${company.domain}`} 
                        alt={company.ticker}
                        className="w-full h-full object-cover absolute inset-0 z-10"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="font-extrabold text-lg text-slate-400">{company.ticker.charAt(0)}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">{company.ticker}</h3>
                        <span className="text-xs font-bold text-slate-500">• {getStatusStyles(company.status).icon} {company.status}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-snug"><span className="font-bold">{company.summaryBold}</span> <span className="text-slate-500">{company.summaryLight}</span></p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setReviewCompany(company)} 
                    className="text-sm font-bold text-blue-600 hover:text-blue-700 bg-blue-50/50 hover:bg-blue-50 px-5 py-2.5 rounded-xl border border-blue-100/50 transition-colors whitespace-nowrap w-full sm:w-auto text-center cursor-pointer shrink-0"
                  >
                    Quick Review →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SECTION 2: MY CONVICTION PORTFOLIO */}
        <div className="mb-5 border-b border-slate-200/60 pb-5">
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">My Conviction Portfolio</h2>
        </div>

        <div className="flex flex-col gap-6">
          {portfolio.map((company) => {
            const styles = getStatusStyles(company.status);
            return (
              <div key={`port-${company.ticker}`} className={`bg-white rounded-[24px] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all flex flex-col overflow-hidden border-l-4 ${styles.border}`}>
                <div className="p-6 md:p-8 flex flex-col md:flex-row gap-6 md:gap-10 items-start md:items-center relative">
                  
                  <div className="flex-1 w-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50 flex items-center justify-center shadow-sm">
                        <img 
                          src={`https://logo.clearbit.com/${company.domain}`} 
                          alt={company.ticker}
                          className="w-full h-full object-cover absolute inset-0 z-10"
                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                        />
                        <span className="font-extrabold text-2xl text-slate-400">{company.ticker.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mb-2">{company.ticker}</h3>
                        <div className={`px-2.5 py-0.5 rounded-md text-[10px] font-extrabold inline-flex items-center gap-1.5 border ${styles.badge}`}>
                          <span>{styles.icon}</span> {styles.label}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-slate-900 mb-3 leading-relaxed"><span className="font-bold">{company.summaryBold}</span> <span className="text-slate-500">{company.summaryLight}</span></p>
                    <button onClick={() => router.push(`/company/${company.ticker}`)} className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-blue-600 transition-colors">
                      <Clock className="w-3.5 h-3.5" /> Updated {company.lastUpdated} →
                    </button>
                  </div>

                  <div className="flex-1 w-full bg-slate-50/50 p-5 rounded-2xl border border-slate-100 self-stretch flex flex-col justify-center">
                    <div className="space-y-3">
                      {company.updates.map((update, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          {update.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                          {update.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                          {update.trend === 'neutral' && <span className="text-slate-400 font-bold shrink-0 mt-0.5">―</span>}
                          <p className="text-xs font-bold text-slate-700 leading-snug">{update.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-32 shrink-0 gap-5 mt-2 md:mt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Current Price</p>
                      <p className="font-bold text-slate-500 text-sm leading-none">${company.price.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => router.push(`/company/${company.ticker}`)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-5 rounded-xl transition-all text-xs flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.15)] whitespace-nowrap w-full md:w-auto"
                    >
                      Open Thesis →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* ==============================================
          THE REDESIGNED QUICK REVIEW DRAWER
          ============================================== */}
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
            
            {/* Minimal Header */}
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

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto px-8 pb-8">
              
              {/* Identity & Status */}
              <div className="flex items-center gap-4 mb-10">
                <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight">{reviewCompany.ticker}</h2>
                <div className={`px-3 py-1.5 rounded-md text-xs font-bold inline-flex items-center gap-1.5 border ${getStatusStyles(reviewCompany.status).badge}`}>
                  <span>{getStatusStyles(reviewCompany.status).icon}</span> {getStatusStyles(reviewCompany.status).label}
                </div>
              </div>

              {/* 1. Affected Thesis */}
              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Affected Thesis</h4>
                <div className="bg-blue-50/50 border border-blue-100/60 rounded-2xl p-5 border-l-4 border-l-blue-500 shadow-sm">
                  <p className="font-extrabold text-blue-950 text-base mb-1">{reviewCompany.affectedDriver}</p>
                  <p className="text-xs text-blue-700/80 font-medium">You selected this as one of your investment drivers.</p>
                </div>
              </div>

              {/* 2. What Changed This Quarter */}
              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">What Changed This Quarter</h4>
                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {reviewCompany.aiSummary}
                </p>
              </div>

              {/* 3. Supporting Evidence (THE ACCORDION FIX) */}
              <div className="mb-10">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Supporting Evidence</h4>
                <div className="space-y-4">
                  {reviewCompany.updates.map((update, idx) => {
                    const isExpanded = expandedEvidenceIdx === idx;
                    
                    return (
                      <div key={idx} className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-[0_4px_14px_rgb(0,0,0,0.02)] transition-all">
                        {/* Always visible header */}
                        <div className="p-4 flex flex-col gap-2">
                          <div className="flex items-start gap-2.5">
                            {update.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                            {update.trend === 'down' && <TrendingDown className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />}
                            {update.trend === 'neutral' && <span className="text-slate-400 font-bold shrink-0 mt-0.5 font-mono">—</span>}
                            <p className="text-sm font-bold text-slate-900 leading-tight">{update.text}</p>
                          </div>
                          
                          {/* The Toggle Button */}
                          <button 
                            onClick={() => setExpandedEvidenceIdx(isExpanded ? null : idx)}
                            className="text-[11px] font-bold text-blue-600 hover:text-blue-800 transition-colors pl-6 self-start flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            {isExpanded ? 'Hide evidence' : 'View evidence'} 
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        </div>

                        {/* Hidden Content (Expands on click) */}
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

            {/* Footer Buttons */}
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