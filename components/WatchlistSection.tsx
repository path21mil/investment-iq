'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { X, ExternalLink } from 'lucide-react';
import Link from 'next/link'; // Added Link import

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Opportunity {
  id: string;
  ticker: string;
  company_name: string;
  opportunity_type: string;
  reasons: string[];
  warning?: string;
  metrics: {
    price: number;
    year_high: number | null;
    year_low: number | null;
    pe: number | null;
    earnings_yield: number | null;
    drawdown: number;
    low_distance_pct: number | null;
    revenue_growth: number | null;
    op_margin: number | null;
    debt_equity: number | null;
    net_margin: number | null;
    score: number;
  };
  score: number;
}

// ==========================================
// 🎨 NAKED LOGO COMPONENT
// ==========================================
function CompanyLogo({ ticker, containerClass = "w-6 h-6" }: { ticker: string; containerClass?: string }) {
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
        className={`w-full h-full object-contain ${
          isFallback ? 'rounded-md opacity-80' : 'drop-shadow-sm'
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

export default function WatchlistSection() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [selectedStock, setSelectedStock] = useState<Opportunity | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOpportunities() {
      try {
        const { data, error } = await supabase
          .from('market_opportunities')
          .select('*')
          .order('score', { ascending: false })
          .limit(10);

        if (error) throw error;
        if (data) setOpportunities(data);
      } catch (err) {
        console.error('Failed to load opportunities:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchOpportunities();
  }, []);

  const topTwo = opportunities.slice(0, 2);
  const remaining = opportunities.slice(2, 10);

  const getDotBadge = (type: string) => {
    let dotColor = 'bg-slate-400';
    let textColor = 'text-slate-500';

    if (type === 'PULLBACK') {
      dotColor = 'bg-emerald-500';
      textColor = 'text-emerald-700';
    } else if (type === 'VALUATION') {
      dotColor = 'bg-blue-500';
      textColor = 'text-blue-700';
    } else if (type === 'FUNDAMENTAL ACCELERATION') {
      dotColor = 'bg-purple-500';
      textColor = 'text-purple-700';
    }

    return (
      <div className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest ${textColor}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></div>
        {type}
      </div>
    );
  };

 const handleShareToX = () => {
    if (!selectedStock) return;
    
    const m = selectedStock.metrics;
    
    // Clean up the warning text so it fits nicely
    const warningText = selectedStock.warning 
      ? selectedStock.warning.replace('⚠ Watch: ', '').replace('⚠ ', '') 
      : 'Tracking metrics closely.';

    // Pack all the data into a dense, beautifully formatted string
    const text = `$${selectedStock.ticker} Setup: ${selectedStock.opportunity_type} 🎯\n\n📊 Val: P/E ${m.pe || 'N/A'}x | Yield ${m.earnings_yield || 'N/A'}%\n📉 Price: $${m.price?.toFixed(2)} (${m.drawdown}% off High, +${m.low_distance_pct}% off Low)\n📈 Biz: Rev +${m.revenue_growth || 'N/A'}% | Margin ${m.op_margin || 'N/A'}%\n🛡️ Health: D/E ${m.debt_equity || 'N/A'}% | Net Margin ${m.net_margin || 'N/A'}%\n\n⚠️ ${warningText}\n\nFull breakdown on Investment IQ 🔍`;
    
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };
  
  return (
    <div className="w-full max-w-4xl mx-auto antialiased">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">
          STOCKS WORTH ANOTHER LOOK
        </h2>
        <p className="text-[11px] text-slate-400 mt-0.5">Mega + Large Cap</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 md:p-7">
        {isLoading ? (
          <div className="py-8 text-center text-slate-400 text-sm animate-pulse">
            Scanning market opportunities...
          </div>
        ) : (
       <div className="space-y-6">
            
            {/* Top 2 Featured List */}
            <div className="space-y-4">
              {topTwo.map((stock) => (
                <div
                  key={stock.id || stock.ticker}
                  onClick={() => setSelectedStock(stock)}
                  className="group p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:bg-slate-50/50 cursor-pointer transition flex items-start gap-4"
                >
                  {/* Naked Logo */}
                  <CompanyLogo ticker={stock.ticker} containerClass="w-9 h-9 mt-0.5" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      
                      {/* TICKER + NAME WRAPPER */}
                      <div className="flex items-baseline gap-1.5 min-w-0">
                        <span className="font-bold text-slate-900 text-base tracking-tight shrink-0">
                          ${stock.ticker}
                        </span>
                        {stock.company_name && (
                          <span 
                            className="text-[13px] font-medium text-slate-500 truncate max-w-[140px] sm:max-w-[200px]" 
                            title={stock.company_name}
                          >
                            {stock.company_name}
                          </span>
                        )}
                      </div>

                      {getDotBadge(stock.opportunity_type)}
                    </div>
                    <div className="text-xs space-y-1.5 text-slate-600">
                      {stock.reasons?.[0] && <p className="text-slate-700 font-medium">{stock.reasons[0]}</p>}
                      {stock.reasons?.[1] && <p className="text-emerald-700">{stock.reasons[1]}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 block">
                      ${stock.metrics?.price?.toFixed(2)}
                    </span>
                    <span className="text-[10px] font-medium text-slate-400">
                      Score: {stock.score}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Divider */}
            {remaining.length > 0 && (
              <div className="border-t border-slate-100 pt-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {remaining.map((stock) => (
                    <div
                      key={stock.id || stock.ticker}
                      onClick={() => setSelectedStock(stock)}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-300 hover:bg-slate-50/80 cursor-pointer transition min-w-0 gap-2"
                    >
                      {/* Left: Naked Logo + Ticker + Name */}
                      <div className="flex items-center gap-2 min-w-0 pr-2">
                        <CompanyLogo ticker={stock.ticker} containerClass="w-5 h-5" />
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <span className="font-bold text-slate-900 text-xs shrink-0">${stock.ticker}</span>
                          {stock.company_name && (
                            <span 
                              className="text-[11px] font-medium text-slate-500 truncate" 
                              title={stock.company_name}
                            >
                              {stock.company_name}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Right: Dot Badge */}
                      <div className="shrink-0">
                        {getDotBadge(stock.opportunity_type)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* INSTITUTIONAL TEAR-SHEET MODAL */}
        {selectedStock && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedStock(null)}
          >
            <div
              className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start p-6 border-b border-slate-100 bg-slate-50/50">
                <div className="space-y-1">
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    ${selectedStock.ticker}
                  </h3>
                  {getDotBadge(selectedStock.opportunity_type)}
                </div>
                
                {/* Top Right Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShareToX}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition shadow-sm"
                  >
                    {/* Official X Logo SVG */}
                    <svg viewBox="0 0 24 24" aria-hidden="true" className="w-3 h-3 fill-current"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path></svg>
                    Post
                  </button>
                  <button
                    onClick={() => setSelectedStock(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Scrollable Content */}
              <div className="overflow-y-auto p-6 space-y-8">
                
                {/* 1. WHY IT SURFACED (AI Synth) */}
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Why It Surfaced
                  </h4>
                  <ul className="space-y-2 text-[13px] font-medium text-slate-700">
                    {selectedStock.reasons?.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-slate-400 mt-0.5">•</span>
                        {reason.replace(/^[↑⚠]\s*/, '')}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 2. THE 2x2 MATH GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                  
                  {/* Quadrant 1: Valuation */}
                  <div className="bg-white p-5">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Valuation</h5>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">P/E</span>
                        <span className="font-bold text-slate-900">{selectedStock.metrics.pe ? `${selectedStock.metrics.pe}x` : 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Earnings Yield</span>
                        <span className="font-bold text-slate-900">{selectedStock.metrics.earnings_yield ? `${selectedStock.metrics.earnings_yield}%` : 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quadrant 2: Price Action */}
                  <div className="bg-white p-5">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Price Action</h5>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Current</span>
                        <span className="font-bold text-slate-900">${selectedStock.metrics.price?.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">52W High</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">{selectedStock.metrics.year_high ? `$${selectedStock.metrics.year_high.toFixed(2)}` : 'N/A'}</span>
                          <span className="text-[10px] text-rose-500 font-bold block">{selectedStock.metrics.drawdown}%</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                        <span className="text-slate-500">52W Low</span>
                        <div className="text-right">
                          <span className="font-bold text-slate-900">{selectedStock.metrics.year_low ? `$${selectedStock.metrics.year_low.toFixed(2)}` : 'N/A'}</span>
                          {selectedStock.metrics.low_distance_pct !== null && (
                            <span className="text-[10px] font-bold block text-emerald-500">
                              +{selectedStock.metrics.low_distance_pct}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quadrant 3: Business Performance */}
                  <div className="bg-white p-5">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Business Performance</h5>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Revenue Growth</span>
                        <span className="font-bold text-emerald-600">+{selectedStock.metrics.revenue_growth}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Operating Margin</span>
                        <span className="font-bold text-slate-900">{selectedStock.metrics.op_margin}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Quadrant 4: Financial Health */}
                  <div className="bg-white p-5">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Financial Health</h5>
                    <div className="space-y-2 text-[13px]">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Debt / Equity</span>
                        <span className="font-bold text-slate-900">{selectedStock.metrics.debt_equity}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Net Margin</span>
                        <span className="font-bold text-slate-900">{selectedStock.metrics.net_margin}%</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* 3. WATCH WARNING */}
                {selectedStock.warning && (
                  <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <span className="text-amber-500 shrink-0 mt-0.5">⚠</span>
                    <div>
                      <h5 className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-1">Watch</h5>
                      <p className="text-[13px] text-amber-900 font-medium">
                        {selectedStock.warning.replace('⚠ Watch: ', '').replace('⚠ ', '')}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer (Action) */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end">
                {/* Updated to use Link component for the new research route */}
                <Link 
                  href={`/research/${selectedStock.ticker}`}
                  className="flex items-center gap-2 px-6 py-2.5 bg-[#0F172A] hover:bg-slate-800 text-white text-[13px] font-bold rounded-lg transition shadow-sm cursor-pointer"
                >
                  Full Research <ExternalLink className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}