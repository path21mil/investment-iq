'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ExternalLink, 
  ChevronDown, 
  ChevronUp, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  Share2, 
  Layers 
} from 'lucide-react';
import Logo from '@/components/Logo';

export default function FullResearchPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params?.ticker as string)?.toUpperCase() || '';

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<{ [key: number]: boolean }>({});

  useEffect(() => {
    if (!ticker) return;

    async function loadResearch() {
      setLoading(true);
      try {
        const res = await fetch('/api/full-research', {
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

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const toggleEvidence = (idx: number) => {
    setExpandedEvidence(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans antialiased text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="font-bold text-sm tracking-wide">Synthesizing institutional research for ${ticker}...</p>
      </div>
    );
  }

  if (!data || data.error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-center font-sans">
        <h2 className="text-xl font-bold text-[#0F172A] mb-2">Research Unavailable</h2>
        <p className="text-slate-500 text-sm mb-6">{data?.error || 'Unable to load company analysis.'}</p>
        <Link href="/dashboard" className="px-5 py-2.5 bg-[#0F172A] text-white rounded-xl text-xs font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24 antialiased">
      
      {/* NAVIGATION */}
      <nav className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40 h-[64px] flex items-center">
        <div className="max-w-[800px] w-full mx-auto px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
          
            <Logo href="/dashboard" />
          </div>
          <button 
            onClick={() => router.push(`/build-thesis/${ticker}`)}
            className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Build Thesis →
          </button>
        </div>
      </nav>

      <main className="max-w-[800px] mx-auto px-6 pt-10 space-y-10">

        {/* 1. HEADER CARD */}
        <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-3 min-w-0">
  <span className="text-2xl font-black text-[#0F172A] shrink-0">${data.ticker}</span>
  
  {/* The 'truncate' class adds the ... if it's too long! */}
  <span 
    className="text-lg font-bold text-slate-500 truncate max-w-[180px] sm:max-w-[300px]" 
    title={data.companyName}
  >
    {data.companyName}
  </span>
</div>
              <span className="inline-block mt-1 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-100">
                {data.opportunityType || 'PULLBACK OPPORTUNITY'}
              </span>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-2xl font-black text-[#0F172A]">{data.metrics.currentPrice}</div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Live Evaluation</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-6 text-center">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Business Quality</div>
              <div className="text-sm font-extrabold text-emerald-600 flex items-center justify-center gap-1">
                ● {data.pillars?.quality?.label || 'Excellent'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Management</div>
              <div className="text-sm font-extrabold text-emerald-600 flex items-center justify-center gap-1">
                ● {data.pillars?.management?.label || 'Trusted'}
              </div>
            </div>
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Valuation</div>
              <div className="text-sm font-extrabold text-amber-500 flex items-center justify-center gap-1">
                ● {data.pillars?.valuation?.label || 'Premium'}
              </div>
            </div>
          </div>
        </section>

        {/* 2. WHY THIS STOCK SURFACED */}
        <section id="why-surfaced" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Why This Stock Surfaced</h3>
          <div className="space-y-3">
            {data.whySurfaced?.map((item: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3">
                <span className={`font-black text-sm shrink-0 mt-0.5 ${item.direction === 'down' ? 'text-rose-500' : item.direction === 'up' ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {item.direction === 'down' ? '↓' : item.direction === 'up' ? '↑' : '—'}
                </span>
                <p className="text-sm font-semibold text-slate-700 leading-snug">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 3. EXECUTIVE SUMMARY */}
        <section id="executive-summary" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Executive Summary</h3>
          <p className="text-[14px] text-slate-700 leading-relaxed font-medium">
            {data.executiveSummary?.summary}
          </p>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 text-xs font-bold">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-1.5">● Business Quality</span>
              <span className="text-[#0F172A]">{data.executiveSummary?.businessQuality}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-1.5">● Growth</span>
              <span className="text-[#0F172A]">{data.executiveSummary?.growth}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500 flex items-center gap-1.5">● Profitability</span>
              <span className="text-[#0F172A]">{data.executiveSummary?.profitability}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-amber-500 flex items-center gap-1.5">● Valuation</span>
              <span className="text-[#0F172A]">{data.executiveSummary?.valuation}</span>
            </div>
            <div className="flex justify-between py-1.5">
              <span className="text-amber-500 flex items-center gap-1.5">● Key Risk</span>
              <span className="text-[#0F172A]">{data.executiveSummary?.keyRisk}</span>
            </div>
          </div>
        </section>

        {/* 4. WHAT CHANGED */}
        <section id="what-changed" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">What Changed</h3>
          </div>

          <div className="space-y-4">
            {data.whatChanged?.map((item: any, idx: number) => {
              const isExp = !!expandedEvidence[idx];
              return (
                <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-2 transition-all">
                  <div className="flex items-start gap-3">
                    <span className={`font-black text-sm shrink-0 mt-0.5 ${item.direction === 'up' ? 'text-emerald-600' : item.direction === 'warning' ? 'text-amber-500' : 'text-rose-500'}`}>
                      {item.direction === 'up' ? '↑' : item.direction === 'warning' ? '⚠' : '↓'}
                    </span>
                    <div className="flex-1">
                      <div className="text-[13px] font-extrabold text-[#0F172A]">{item.headline}</div>
                      <div className="text-xs text-slate-600 mt-0.5">{item.detail}</div>
                    </div>
                  </div>

                  {item.evidenceText && (
                    <div className="pt-2 pl-6">
                      <button 
                        onClick={() => toggleEvidence(idx)}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                      >
                        {isExp ? 'Hide evidence' : 'View evidence'} 
                        {isExp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {isExp && (
                        <div className="mt-3 bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 text-xs text-slate-600">
                          <p className="italic">"{item.evidenceText}"</p>
                          {item.sourceName && (
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider pt-1 flex items-center gap-1">
                              Source: {item.sourceUrl ? (
                                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-800 flex items-center gap-0.5">
                                  {item.sourceName} <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              ) : (
                                <span>{item.sourceName}</span>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* 5. INVESTMENT SNAPSHOT */}
        <section id="snapshot" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Investment Snapshot</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Valuation</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-medium"><span className="text-slate-500">P/E</span> <span className="font-extrabold text-[#0F172A]">{data.metrics.pe}</span></div>
                <div className="flex justify-between font-medium"><span className="text-slate-500">Earnings Yield</span> <span className="font-extrabold text-[#0F172A]">{data.metrics.earningsYield}</span></div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Price Action</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-medium"><span className="text-slate-500">Current</span> <span className="font-extrabold text-[#0F172A]">{data?.metrics?.currentPrice}</span></div>
                <div className="flex justify-between font-medium"><span className="text-slate-500">52W High</span> <span className="font-extrabold text-[#0F172A]">{data.metrics.yearHigh}</span></div>
                <div className="flex justify-between font-medium"><span className="text-slate-500">52W Low</span> <span className="font-extrabold text-[#0F172A]">{data.metrics.yearLow}</span></div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Business Performance</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-medium"><span className="text-slate-500">Revenue Growth</span> <span className="font-extrabold text-emerald-600">{data.metrics.revenueGrowth} YoY</span></div>
                <div className="flex justify-between font-medium"><span className="text-slate-500">Operating Margin</span> <span className="font-extrabold text-[#0F172A]">{data.metrics.operatingMargin}</span></div>
              </div>
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Financial Health</h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between font-medium"><span className="text-slate-500">Debt / Equity</span> <span className="font-extrabold text-[#0F172A]">{data.metrics.debtEquity}</span></div>
                <div className="flex justify-between font-medium"><span className="text-slate-500">Net Margin</span> <span className="font-extrabold text-[#0F172A]">{data.metrics.netMargin}</span></div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. 7 INVESTMENT QUESTIONS */}
        <section id="questions" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Investment Questions</h3>
          
          <div className="divide-y divide-slate-100">
            {data.investmentQuestions?.map((q: any, idx: number) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-extrabold text-[#0F172A] flex items-center gap-2">
                    <span className="text-slate-400 font-mono text-[10px]">{q.number}</span>
                    <span>{q.question}</span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium pl-5">{q.summary}</p>
                </div>
                <div className="shrink-0 mt-0.5">
                  {q.status === 'pass' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 7. FINANCIAL PERFORMANCE */}
        <section id="financials" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Financial Performance</h3>
            <button onClick={() => scrollToSection('financials')} className="text-xs font-bold text-blue-600 hover:text-blue-800">
              Explore financials →
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600">Revenue Growth</span>
                <span className="text-emerald-600">{data.metrics.revenueGrowth}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-emerald-500 h-full rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600">Operating Margin</span>
                <span className="text-[#0F172A]">{data.metrics.operatingMargin}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full rounded-full" style={{ width: '60%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1.5">
                <span className="text-slate-600">Net Margin</span>
                <span className="text-[#0F172A]">{data.metrics.netMargin}</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div className="bg-slate-700 h-full rounded-full" style={{ width: '45%' }}></div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. VALUATION */}
        <section id="valuation" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Valuation</h3>
            <button onClick={() => scrollToSection('valuation')} className="text-xs font-bold text-blue-600 hover:text-blue-800">
              See valuation context →
            </button>
          </div>

          <div className="grid grid-cols-3 gap-4 text-center pb-4 border-b border-slate-100">
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">P/E</div>
              <div className="text-lg font-black text-[#0F172A]">{data.metrics.pe}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Earnings Yield</div>
              <div className="text-lg font-black text-[#0F172A]">{data.metrics.earningsYield}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</div>
              <div className="text-sm font-bold text-amber-500 mt-1">● Premium</div>
            </div>
          </div>

          <p className="text-xs text-slate-500 font-medium leading-relaxed">
            Trading near historical baseline with premium multiples supported by resilient revenue growth and fortress margins.
          </p>
        </section>

        {/* 9. PEER COMPARISON */}
        <section id="peers" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Peer Comparison</h3>
            <button onClick={() => scrollToSection('peers')} className="text-xs font-bold text-blue-600 hover:text-blue-800">
              Compare peers →
            </button>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="pb-3">Ticker</th>
                  <th className="pb-3">P/E</th>
                  <th className="pb-3">Growth</th>
                  <th className="pb-3">Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                <tr className="bg-blue-50/40">
                  <td className="py-3 font-extrabold text-blue-600">${data.ticker}</td>
                  <td className="py-3">{data.metrics.pe}</td>
                  <td className="py-3 text-emerald-600">{data.metrics.revenueGrowth}</td>
                  <td className="py-3">{data.metrics.operatingMargin}</td>
                </tr>
                {data.peers?.map((p: any, idx: number) => (
                  <tr key={idx}>
                    <td className="py-3 font-bold text-[#0F172A]">${p.ticker}</td>
                    <td className="py-3">{p.pe}</td>
                    <td className="py-3 text-emerald-600">{p.growth}</td>
                    <td className="py-3">{p.margin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 10. MANAGEMENT */}
        <section id="management" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Management</h3>
            <button onClick={() => scrollToSection('management')} className="text-xs font-bold text-blue-600 hover:text-blue-800">
              Review management →
            </button>
          </div>

          <div className="space-y-3 text-xs font-bold">
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Capital Allocation</span>
              <span className="text-emerald-600 flex items-center gap-1">● {data.management?.capitalAllocation || 'Strong'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-slate-50">
              <span className="text-slate-500">Execution</span>
              <span className="text-emerald-600 flex items-center gap-1">● {data.management?.execution || 'Trusted'}</span>
            </div>
          </div>

          <p className="text-xs text-slate-600 font-medium leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {data.management?.commentary}
          </p>
        </section>

        {/* 11. YOUR INVESTMENT THESIS CALLOUT */}
        <section className="bg-gradient-to-br from-[#0F172A] to-slate-900 text-white rounded-3xl p-8 shadow-lg space-y-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">Your Investment Thesis</span>
            <h3 className="text-xl font-black mt-1">You decide what matters. Investment IQ monitors it.</h3>
          </div>

          <div className="space-y-2 text-xs font-bold text-slate-300">
            <div className="flex items-center gap-2"><span className="text-emerald-400">●</span> Growth / Demand</div>
            <div className="flex items-center gap-2"><span className="text-emerald-400">●</span> Margin Expansion</div>
            <div className="flex items-center gap-2"><span className="text-amber-400">●</span> Valuation</div>
            <div className="flex items-center gap-2"><span className="text-rose-400">●</span> Competitive Pressure</div>
          </div>

          <button 
            onClick={() => router.push(`/build-thesis/${data.ticker}`)}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl transition-all shadow-md cursor-pointer"
          >
            BUILD / VIEW MY THESIS →
          </button>
        </section>

        {/* 12. SOURCES & EVIDENCE */}
        <section id="sources" className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[11px] font-extrabold text-slate-400 uppercase tracking-widest">Sources & Evidence</h3>
            <button onClick={() => scrollToSection('sources')} className="text-xs font-bold text-blue-600 hover:text-blue-800">
              See all sources →
            </button>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            SEC Filings · Earnings Transcripts · Finnhub Financial Statements · Financial News
          </p>
          <div className="space-y-2 pt-2 border-t border-slate-100">
            {data.sources?.map((s: any, idx: number) => (
              <div key={idx} className="flex justify-between items-center text-xs py-1 text-slate-600 font-medium">
                <span>{s.title}</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 bg-slate-100 rounded">{s.type}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}