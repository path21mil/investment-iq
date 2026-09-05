'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Loader2, 
  Trash2, 
  Share2, 
  BookOpen, 
  ExternalLink, 
  ChevronUp, 
  ChevronDown, 
  AlertTriangle,
  PlusCircle,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { PortfolioShareModal } from '@/components/PortfolioShareModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { createClient } from "@supabase/supabase-js";
import Header from '@/components/Header';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface Driver {
  title: string;
  description?: string;
  status?: string;
}

interface SupportingEvent {
  headline: string;
  source_name?: string;
  source_url?: string | null;
}

interface CuratedUpdate {
  status: 'Strengthening' | 'Review Needed' | 'Weakening';
  is_critical_override: boolean;
  override_category?: string | null;
  untracked_risk_type?: string | null;
  key_thesis_change: string;
  social_card_headline?: string; // <--- Add this line
  evidence_count: number;
  supporting_events: SupportingEvent[];
  last_evaluated_at?: string;
  affected_drivers?: string[]; 
}

interface TrackedCompany {
  id: string;
  ticker: string;
  name: string;
  status: 'Strengthening' | 'Review Needed' | 'Weakening';
  coreThesis: string;
  drivers: Driver[];
  primaryRisk?: string;
  curatedUpdate?: CuratedUpdate | null;
  curated_updates?: any; // <--- Add this line
  lastUpdated: string;
  rawUpdatedAt: string;
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

export default function PortfolioPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<TrackedCompany[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [shareCompany, setShareCompany] = useState<TrackedCompany | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<{ id: string; ticker: string } | null>(null);
  const [expandedDetails, setExpandedDetails] = useState<Record<string, boolean>>({});

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

        if (!dbTheses || dbTheses.length === 0) {
          setPortfolio([]);
          setIsLoading(false);
          return;
        }

        const mappedPortfolio: TrackedCompany[] = dbTheses.map((t: any) => {
          const rawDrivers = typeof t.drivers === 'string' ? JSON.parse(t.drivers) : (t.drivers || []);
          const parsedCurated = typeof t.curated_updates === 'string' 
            ? JSON.parse(t.curated_updates) 
            : (t.curated_updates || null);

          const effectiveStatus = parsedCurated?.status || t.status || 'Strengthening';

          return {
            id: t.id,
            ticker: t.ticker.toUpperCase(),
            name: t.company_name || t.ticker.toUpperCase(),
            status: effectiveStatus,
            coreThesis: rawDrivers[0]?.title || 'Long-term compounding conviction',
            drivers: rawDrivers,
            primaryRisk: t.primary_risk || undefined,
            curatedUpdate: parsedCurated && parsedCurated.key_thesis_change ? parsedCurated : null,
            curated_updates: t.curated_updates, // <--- Add this line!
            lastUpdated: new Date(t.last_scanned_at || t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            rawUpdatedAt: t.last_scanned_at || t.updated_at || t.created_at
          };
        });

        setPortfolio(mappedPortfolio);
      } catch (err) {
        console.error("Portfolio Load Error:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadPortfolio();
  }, [router]);

  const handleConfirmDelete = async () => {
    if (!companyToDelete) return;

    const { id } = companyToDelete;
    setDeletingId(id);

    try {
      const { error } = await supabase.from('theses').delete().eq('id', id);
      if (error) throw error;
      setPortfolio(prev => prev.filter(p => p.id !== id));
      setCompanyToDelete(null);
    } catch (err) {
      console.error("Delete Error:", err);
      alert("Failed to delete thesis. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (company: TrackedCompany) => {
    if (company.curatedUpdate?.is_critical_override) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
          Critical Company Event
        </span>
      );
    }

    switch (company.status) {
      case 'Strengthening':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-600">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Strengthening
          </span>
        );
      case 'Review Needed':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-amber-600">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
            Review Needed
          </span>
        );
      case 'Weakening':
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-rose-600">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            Weakening
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-slate-500">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
            Stable
          </span>
        );
    }
  };

  const getTrendIcon = (status?: string) => {
    if (status === 'Strengthening') {
      return <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />;
    }
    if (status === 'Weakening' || status === 'Review Needed') {
      return <TrendingDown className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />;
    }
    return <Minus className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center font-sans">
        <div className="text-slate-500 font-bold flex items-center gap-3 animate-pulse">
          <Loader2 className="w-5 h-5 animate-spin text-blue-600" /> Loading Conviction Portfolio...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24 relative overflow-hidden">
      <Header />

      <main className="max-w-[960px] mx-auto px-4 sm:px-6 pt-10 md:pt-14">
        <div className="mb-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0F172A] mb-2">
            My Conviction Portfolio
          </h1>
          <p className="text-slate-500 text-sm sm:text-[15px] font-medium max-w-2xl leading-relaxed">
            Personalized thesis monitoring. Recent developments are synthesized and measured directly against your active conviction drivers.
          </p>
        </div>

        {portfolio.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-[#0F172A] mb-2">Your Portfolio is Empty</h2>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              Build your first investment thesis on the dashboard to activate autonomous catalyst and driver monitoring.
            </p>
            <Link 
              href="/dashboard" 
              className="inline-flex px-6 py-3 bg-[#0F172A] text-white rounded-xl text-sm font-bold shadow-sm hover:bg-slate-800 transition-colors"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {portfolio.map(company => {
              const isExpanded = !!expandedDetails[company.id];
              const isOverride = !!company.curatedUpdate?.is_critical_override;
              const topDrivers = company.drivers; 

              return (
                <div 
                  key={`port-${company.ticker}`} 
                  className={`bg-white rounded-[24px] border p-6 sm:p-8 flex flex-col transition-all h-full shadow-sm hover:shadow-md ${
                    isOverride 
                      ? 'border-rose-200 ring-1 ring-rose-100' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Bar: Company Details & Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-6">
                    <div className="flex items-center gap-3.5">
                      <CompanyLogo 
                        ticker={company.ticker} 
                        containerClass="w-11 h-11 sm:w-12 sm:h-12 rounded-xl" 
                      />
                      <div>
                        <h3 className="text-xl font-extrabold text-[#0F172A] tracking-tight leading-none mb-1">
                          {company.ticker}
                        </h3>
                        <p className="text-xs font-semibold text-slate-400 truncate max-w-[150px] sm:max-w-[180px]">
                          {company.name}
                        </p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      {getStatusBadge(company)}
                    </div>
                  </div>

                  {/* Section 1: Thesis Drivers */}
                  <div className="mb-8">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                      Thesis
                    </h4>
                    <div className="flex flex-col gap-2">
                      {topDrivers.length > 0 ? (
                        topDrivers.map((driver, dIdx) => {
                          const isAffected = company.curatedUpdate?.affected_drivers?.includes(driver.title);
                          
                          if (company.curatedUpdate?.affected_drivers && company.curatedUpdate.affected_drivers.length > 0) {
                             if (!isAffected) return null;
                          } else {
                             if (dIdx >= 2) return null;
                          }

                          return (
                            <span 
                              key={dIdx} 
                              className="text-[15px] font-bold text-[#0F172A]"
                            >
                              {driver.title}
                            </span>
                          )
                        })
                      ) : (
                        <span className="text-[15px] font-bold text-[#0F172A]">Unique Market Position</span>
                      )}
                    </div>
                  </div>

                  {/* Section 2: Key Thesis Change (Single Synthesized Takeaway) */}
                  <div className="flex-grow mb-8">
                    <div className="flex items-center justify-between border-t border-slate-100 pt-6 mb-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        {isOverride ? 'Key Thesis Change (Override)' : 'Key Changes'}
                      </h4>
                      {company.curatedUpdate?.evidence_count ? (
                        <span className="text-[10px] font-bold text-slate-400">
                          {company.curatedUpdate.evidence_count} {company.curatedUpdate.evidence_count === 1 ? 'development' : 'developments'}
                        </span>
                      ) : null}
                    </div>

                    {company.curatedUpdate ? (
                      <div className="space-y-4">
                        {/* Critical Warning Callout if existential event detected */}
                        {isOverride && (
                          <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-3 flex items-start gap-2 text-rose-800">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                            <div className="text-[12px] leading-relaxed">
                              <span className="font-bold">Critical Override:</span> Material development outside tracked parameters.
                            </div>
                          </div>
                        )}

                        {/* The Single Synthesized Statement */}
                        <div className="flex items-start gap-2.5">
                          {getTrendIcon(company.curatedUpdate.status)}
                          <p className="text-[14px] font-medium text-[#0F172A] leading-relaxed">
                            {company.curatedUpdate.key_thesis_change}
                          </p>
                        </div>

                        {/* Collapsible Evidence Audit Trail */}
                        {company.curatedUpdate.supporting_events && company.curatedUpdate.supporting_events.length > 0 && (
                          <div className="pt-2">
                            <button
                              onClick={() => setExpandedDetails(prev => ({ ...prev, [company.id]: !isExpanded }))}
                              className="text-[13px] font-medium text-blue-600 hover:text-blue-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                            >
                              {isExpanded ? (
                                <>Hide evidence <ChevronUp className="w-3.5 h-3.5" /></>
                              ) : (
                                <>View underlying evidence ({company.curatedUpdate.supporting_events.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                              )}
                            </button>

                            {isExpanded && (
                              <div className="mt-3 space-y-2 pl-3 border-l-2 border-slate-200 animate-in fade-in duration-150">
                                {company.curatedUpdate.supporting_events.map((event, sIdx) => (
                                  <div key={sIdx} className="text-[12px] text-slate-600 py-1">
                                    <p className="font-medium leading-snug">{event.headline}</p>
                                    {event.source_url && (
                                      <a
                                        href={event.source_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-blue-600 uppercase tracking-wider mt-1 transition-colors"
                                      >
                                        Source: {event.source_name || 'Market Disclosure'} <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Add Untracked Risk to Thesis (if Critical Override is active) */}
                        {isOverride && company.curatedUpdate.untracked_risk_type && (
                          <div className="pt-2">
                            <button
                              onClick={() => router.push(`/build-thesis/${company.ticker}`)}
                              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              <PlusCircle className="w-3.5 h-3.5" />
                              Add {company.curatedUpdate.untracked_risk_type} to Tracked Risks
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-[14px] font-medium text-slate-500 italic">
                        No recent changes detected.
                      </p>
                    )}
                  </div>

                  {/* Section 3: Bottom Action Footers */}
                  <div className="pt-6 border-t border-slate-100 flex items-center justify-between mt-auto">
                   <button 
                       onClick={() => router.push(`/thesis/${company.ticker}`)}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-[13px] font-bold text-[#0F172A] hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
                      >
                      Open Thesis
                    </button>

                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => setShareCompany(company)}
                        className="flex items-center gap-2 px-3 py-2 text-[13px] font-[800] text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                      >
                        <Share2 className="w-4 h-4" />
                        Share
                      </button>
                      
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:block">
                        Saved: {company.lastUpdated}
                      </span>
                      
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

      {shareCompany && (
        <PortfolioShareModal 
          isOpen={!!shareCompany} 
          onClose={() => setShareCompany(null)} 
          company={shareCompany} 
        />
      )}

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