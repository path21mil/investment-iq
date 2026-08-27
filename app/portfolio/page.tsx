'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Search, Loader2, Trash2, Share2, BookOpen } from 'lucide-react';
import { PortfolioShareModal } from '@/components/PortfolioShareModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal'; // ✨ 1. IMPORT YOUR NEW MODAL
import { createClient } from "@supabase/supabase-js";
import Logo from '@/components/Logo';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

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

export default function PortfolioPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<TrackedCompany[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shareCompany, setShareCompany] = useState<TrackedCompany | null>(null);
  
  // ✨ 2. ADD STATE TO TRACK THE COMPANY PENDING DELETION
  const [companyToDelete, setCompanyToDelete] = useState<{ id: string; ticker: string } | null>(null);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login?redirect=/portfolio');
          return;
        }

        const { data: dbTheses, error } = await supabase
          .from("theses")
          .select("*")
          .eq("user_id", session.user.id)
          .order("created_at", { ascending: false });

        if (error) throw error;

        if (dbTheses) {
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
        console.error("Portfolio Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPortfolio();
  }, [router]);

  // ✨ 3. REPLACE OLD window.confirm WITH CLEAN EXECUTION FUNCTION CALLED BY THE MODAL
  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;

    const { id } = companyToDelete;
    setDeletingId(id);

    try {
      const { error } = await supabase.from('theses').delete().eq('id', id);
      if (error) throw error;
      setPortfolio(prev => prev.filter(p => p.id !== id));
      setCompanyToDelete(null); // Close the modal on success
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete thesis. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

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
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24 relative overflow-hidden">
      
      {/* NAVIGATION HEADER */}
      <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 h-[64px] flex items-center">
        <div className="max-w-[960px] w-full mx-auto px-6 flex items-center justify-between">
          <div className="shrink-0">
            <Logo href="/dashboard" />
          </div>
          
          <div className="flex items-center gap-8 text-[14px] font-bold">
            <Link href="/dashboard" className="text-slate-600 hover:text-slate-900 transition-colors">Dashboard</Link>
            <Link href="/portfolio" className="text-blue-600">Portfolio</Link>
            <Link href="/watchlist" className="text-slate-600 hover:text-slate-900 transition-colors">Watchlist</Link>
          </div>

          <div className="w-16"></div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main className="max-w-[960px] mx-auto px-6 pt-12 md:pt-16">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#0F172A] mb-2">My Conviction Portfolio</h1>
          <p className="text-slate-500 text-[15px] font-medium">Manage all your active investment theses and monitor fundamental changes.</p>
        </div>

        {portfolio.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">Your Portfolio is Empty</h2>
            <p className="text-slate-500 text-sm mb-6">Search for a company on your dashboard to build your first thesis.</p>
            <Link href="/dashboard" className="px-6 py-3 bg-[#0F172A] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors">
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {portfolio.map(company => {
              const styles = getStatusStyles(company.status);
              
              return (
                <div key={`port-${company.ticker}`} className="bg-white rounded-3xl border border-slate-200 p-8 flex flex-col hover:border-slate-300 hover:shadow-sm transition-all h-full">
                  
                  <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                      <CompanyLogo 
                        ticker={company.ticker} 
                        containerClass="w-10 h-10 rounded-xl" 
                      />
                      <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight">{company.ticker}</h3>
                    </div>
                    <div className="text-[11px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-widest mt-1">
                      <span className={styles.dotColor}>●</span> {styles.label}
                    </div>
                  </div>
                  
                  <div className="mb-8">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Thesis</h4>
                    <p className="text-[14px] font-bold text-[#0F172A] leading-snug">{company.coreThesis}</p>
                  </div>
                  
                  <div className="flex-grow mb-8">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 border-t border-slate-100 pt-6">Key Changes</h4>
                    {company.updates.length === 0 ? (
                      <p className="text-[13px] font-medium text-slate-500 italic">No recent changes detected.</p>
                    ) : (
                      <div className="space-y-3">
                        {company.updates.map((update, idx) => (
                          <div key={idx} className="flex items-start gap-2.5">
                            <div className="flex-shrink-0">
                              {getTrendIcon(update.trend)}
                            </div>
                            <p className="text-[13px] font-medium text-slate-700 leading-relaxed">
                              {update.text || update.headline || "New market data detected"}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 border-t border-slate-100 flex flex-row items-center justify-between mt-auto">
                    <button 
                      onClick={() => router.push(`/company/${company.ticker}`)}
                      className="px-4 py-2 border border-slate-200 rounded-lg text-[13px] font-bold text-[#0F172A] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      Open Thesis →
                    </button>

                    <button
                      onClick={() => setShareCompany(company)}
                      className="flex items-center gap-2 px-4 py-2 text-[13px] font-[800] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      Share
                    </button>
                    
                    <div className="text-right flex items-center gap-4 shrink-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                        Saved: {company.lastUpdated}
                      </span>
                      {/* ✨ 4. TRIGGER THE MODAL STATE INSTEAD OF WINDOW.CONFIRM */}
                      <button 
                        onClick={() => setCompanyToDelete({ id: company.id, ticker: company.ticker })}
                        disabled={deletingId === company.id}
                        className="text-slate-300 hover:text-rose-600 transition-colors cursor-pointer disabled:opacity-50"
                        title="Delete Thesis"
                      >
                        {deletingId === company.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* SHARE MODAL */}
      {shareCompany && (
        <PortfolioShareModal 
          isOpen={!!shareCompany} 
          onClose={() => setShareCompany(null)} 
          company={shareCompany} 
        />
      )}

      {/* ✨ 5. RENDER YOUR REUSABLE DELETE CONFIRMATION MODAL */}
      <DeleteConfirmModal
        isOpen={!!companyToDelete}
        onClose={() => setCompanyToDelete(null)}
        onConfirm={handleConfirmDelete}
        ticker={companyToDelete?.ticker || ''}
        isDeleting={deletingId === companyToDelete?.id}
      />
    </div>
  );
}