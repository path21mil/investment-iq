'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ArrowRight, Info, X, ChevronDown, ChevronUp, BookOpen, Trash2, Loader2, Activity } from 'lucide-react';
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase safely
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// 1. DATA STRUCTURE
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
  lastUpdated: string;
  requiresAction: boolean;
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [portfolio, setPortfolio] = useState<TrackedCompany[]>([]);
  const [userName, setUserName] = useState('Investor');
  
  const [reviewCompany, setReviewCompany] = useState<TrackedCompany | null>(null);
  const [expandedEvidenceIdx, setExpandedEvidenceIdx] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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
          lastUpdated: new Date(t.last_scanned_at || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
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
    if (searchQuery.trim()) {
      router.push(`/company/${searchQuery.trim().toUpperCase()}`);
    }
  };

  const triggerAIEngine = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: session.user.id })
      });
      if (!res.ok) throw new Error("Engine failed to run");
      await loadDashboard(); 
    } catch (err) {
      console.error(err);
      alert("Failed to run AI Engine.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteThesis = async (id: string, ticker: string) => {
    if (!confirm(`Are you sure you want to delete your investment thesis for ${ticker}?`)) return;
    setDeletingId(id);
    try {
      const { error } = await supabase.from('theses').delete().eq('id', id);
      if (error) throw error;
      setPortfolio(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete thesis. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const actionItems = portfolio.filter(p => p.requiresAction);

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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="text-slate-500 font-bold flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading Portfolio...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24 relative">
      
      {/* NAVIGATION */}
      <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-[960px] mx-auto px-6 py-3 flex items-center justify-between gap-8">
          <div className="font-extrabold text-xl tracking-tight flex items-center gap-2.5 cursor-pointer text-[#0F172A] shrink-0" onClick={() => router.push('/')}>
            Investment IQ
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
              <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
              <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
            </span>
          </div>
          
          <div className="flex-1 max-w-sm hidden md:block">
            <form onSubmit={handleSearch} className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search company..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-10 pr-4 text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none text-[#0F172A] placeholder-slate-400"
              />
            </form>
          </div>

          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))} className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors shrink-0">
            Sign Out
          </button>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-[960px] mx-auto px-6 pt-12 md:pt-16">
        
        {portfolio.length === 0 ? (
          <div className="text-center py-16">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A] mb-4">Welcome to Investment IQ, {userName} 👋</h1>
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
            {/* HERO */}
            <div className="mb-16 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A] mb-3">Welcome back, {userName} 👋</h1>
                {actionItems.length > 0 ? (
                  <p className="text-slate-500 text-lg leading-relaxed">
                    <span className="font-bold text-[#0F172A]">{actionItems.length} companies need your attention.</span><br/>
                    Review the latest changes to your investment theses.
                  </p>
                ) : (
                  <p className="text-slate-500 text-lg leading-relaxed">Your portfolio is healthy. No recent changes detected.</p>
                )}
              </div>
              
              <button 
                onClick={triggerAIEngine}
                className="bg-white border border-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-slate-50 shadow-sm transition-colors flex items-center gap-2 shrink-0 self-start md:self-auto"
              >
                <Activity className="w-4 h-4 text-blue-600" />
                [DEV] Run AI Engine
              </button>
            </div>

            {/* SECTION 1: WHAT CHANGED */}
            {actionItems.length > 0 && (
              <div className="mb-20">
                <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">What Changed</h2>
                <div className="flex flex-col gap-5">
                  {actionItems.map(company => (
                    /* ✨ Changed sm:items-start to sm:items-center so the button centers beautifully with the text block */
                    <div key={`alert-${company.ticker}`} className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start gap-6 flex-grow">
                        <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm hidden sm:flex">
                          <img 
                            src={`https://financialmodelingprep.com/image-stock/${company.ticker}.png`} 
                            alt={company.ticker}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.src = `https://ui-avatars.com/api/?name=${company.ticker}&background=f8fafc&color=64748b&bold=true&font-size=0.35`;
                              e.currentTarget.className = "w-full h-full object-cover";
                            }}
                          />
                        </div>
                        <div className="flex-grow">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="font-extrabold text-xl text-[#0F172A]">{company.ticker}</span>
                            <div className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest">
                              <span className={getStatusStyles(company.status).dotColor}>●</span> {getStatusStyles(company.status).label}
                            </div>
                          </div>
                          <p className="text-[13px] text-slate-700 font-medium leading-relaxed max-w-2xl line-clamp-2">{company.aiSummary}</p>
                        </div>
                      </div>
                      {/* ✨ Updated to a small outlined button */}
                      <button 
                        onClick={() => setReviewCompany(company)}
                        className="px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-[#0F172A] hover:bg-slate-50 hover:border-slate-300 transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0"
                      >
                        Review update →
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* SECTION 2: MY CONVICTION PORTFOLIO */}
            <div className="mb-12">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">My Conviction Portfolio</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {portfolio.map(company => {
                  const styles = getStatusStyles(company.status);
                  
                  return (
                    <div key={`port-${company.ticker}`} className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col hover:border-slate-300 hover:shadow-sm transition-all h-full">
                      
                      {/* HEADER */}
                      <div className="flex items-start justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                            <img 
                              src={`https://financialmodelingprep.com/image-stock/${company.ticker}.png`} 
                              alt={company.ticker}
                              className="w-6 h-6 object-contain"
                              onError={(e) => {
                                e.currentTarget.src = `https://ui-avatars.com/api/?name=${company.ticker}&background=f8fafc&color=64748b&bold=true&font-size=0.35`;
                                e.currentTarget.className = "w-full h-full object-cover";
                              }}
                            />
                          </div>
                          <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight">{company.ticker}</h3>
                        </div>
                        <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-widest mt-1">
                          <span className={styles.dotColor}>●</span> {styles.label}
                        </div>
                      </div>
                      
                      {/* CORE THESIS */}
                      <div className="mb-8">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Thesis</h4>
                        <p className="text-[14px] font-bold text-[#0F172A] leading-snug">{company.coreThesis}</p>
                      </div>
                      
                      {/* KEY CHANGES */}
                      <div className="flex-grow mb-8">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-t border-slate-100 pt-6">Key Changes</h4>
                        {company.updates.length === 0 ? (
                          <p className="text-[13px] font-medium text-slate-500 italic">No recent changes detected.</p>
                        ) : (
                          <div className="space-y-3">
                            {company.updates.map((update, idx) => (
                              <div key={idx} className="flex items-start gap-2.5">
                                {getTrendIcon(update.trend)}
                                <p className="text-[13px] font-medium text-slate-700 leading-relaxed">{update.text}</p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* FOOTER */}
                      <div className="pt-6 border-t border-slate-100 flex flex-row items-center justify-between mt-auto">
                        {/* ✨ Updated to a small outlined button */}
                        <button 
                          onClick={() => router.push(`/company/${company.ticker}`)}
                          className="px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-[#0F172A] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5"
                        >
                          Open Thesis →
                        </button>
                        
                        <div className="text-right flex items-center gap-4">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">Saved: {company.lastUpdated}</span>
                          <button 
                            onClick={() => handleDeleteThesis(company.id, company.ticker)}
                            disabled={deletingId === company.id}
                            className="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                            title="Delete Thesis"
                          >
                            {deletingId === company.id ? <Loader2 className="w-4 h-4 animate-spin text-rose-600" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-16 pt-10 border-t border-slate-200 text-center pb-16">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-5">Research another company</p>
              <form onSubmit={handleSearch} className="max-w-md mx-auto relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by ticker..."
                  className="w-full bg-white border border-slate-200 rounded-xl py-3.5 pl-11 pr-4 text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-[13px] shadow-sm"
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
                  <div className="w-12 h-12 bg-white border border-slate-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
                    <img 
                      src={`https://financialmodelingprep.com/image-stock/${reviewCompany.ticker}.png`} 
                      alt={reviewCompany.ticker}
                      className="w-8 h-8 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = `https://ui-avatars.com/api/?name=${reviewCompany.ticker}&background=f8fafc&color=64748b&bold=true&font-size=0.35`;
                        e.currentTarget.className = "w-full h-full object-cover";
                      }}
                    />
                  </div>
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
                          
                          <button 
                            onClick={() => setExpandedEvidenceIdx(isExpanded ? null : idx)}
                            className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors pl-5 self-start flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            {isExpanded ? 'Hide evidence' : 'View evidence'} 
                            {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
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
                onClick={() => router.push(`/company/${reviewCompany.ticker}`)}
                className="w-full text-blue-600 hover:text-blue-800 font-bold py-2 rounded-xl transition-colors text-[13px] mt-1 cursor-pointer"
              >
                Open Full Research →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}