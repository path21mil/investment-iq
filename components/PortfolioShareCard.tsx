'use client';

import React, { forwardRef } from 'react';

export interface UpdateItem {
  type: 'positive' | 'negative' | 'warning';
  headline: string;
  context?: string;
}

export interface DriverItem {
  name: string;
  status: 'strengthening' | 'on_track' | 'monitoring' | 'weakening';
}

interface PortfolioShareCardProps {
  ticker: string;
  companyName: string;
  logoUrl?: string; 
  price: string;
  dayChange: number;
  overallStatus: 'STRENGTHENING' | 'INTACT' | 'WEAKENING';
  updates: UpdateItem[];
  drivers: DriverItem[];
  keyRisk?: string;
  date?: string;
}

export const PortfolioShareCard = forwardRef<HTMLDivElement, PortfolioShareCardProps>(({
  ticker,
  companyName,
  logoUrl,
  price,
  dayChange,
  overallStatus,
  updates,
  drivers,
  keyRisk = "Margin pressure emerging in recent quarter",
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}, ref) => {

  const statusConfig = {
    STRENGTHENING: { color: '#22C55E' },
    INTACT: { color: '#3B82F6' },
    WEAKENING: { color: '#EF4444' }
  }[overallStatus] || { color: '#3B82F6' };

  const getDriverDot = (status: DriverItem['status']) => {
    switch (status) {
      case 'strengthening': return <span className="w-4 h-4 rounded-full bg-[#22C55E] shrink-0 block" />;
      case 'monitoring': return <span className="w-4 h-4 rounded-full bg-[#F59E0B] shrink-0 block" />;
      case 'weakening': return <span className="w-4 h-4 rounded-full bg-[#EF4444] shrink-0 block" />;
      case 'on_track': 
      default: 
        return <span className="w-4 h-4 rounded-full bg-[#3B82F6] shrink-0 block" />;
    }
  };

  const getCleanCompanyName = (name: string) => {
    let clean = (name || '').replace(/(?:\s+Inc\.?|\s+Corp\.?|\s+Ltd\.?|\s+LLC|\s+PLC|\s+Company)$/i, '').trim();
    const words = clean.split(/\s+/);
    if (words.length > 2) {
      clean = words.slice(0, 2).join(' ') + '...';
    }
    return clean;
  };
  const displayCompanyName = getCleanCompanyName(companyName);

  // Strictly limit to 1 update point
  const displayUpdates = updates?.slice(0, 1) || [];

  return (
    <div 
      ref={ref}
      style={{ width: '1200px', height: '675px' }}
      className="bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans shrink-0 overflow-hidden relative antialiased"
    >
      {/* Reduced outer padding to p-8 to give the inside more breathing room */}
      <div className="bg-white w-full h-full shadow-sm flex flex-col justify-between p-8 relative overflow-hidden">
        
        {/* 1. HEADER */}
        {/* Reduced bottom padding to pb-4 */}
        <div className="flex items-start justify-between z-10 border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-6 min-w-0 flex-1 pr-6">

            <div className="w-24 h-24 flex items-center justify-center shrink-0">
               {logoUrl ? (
               <img 
                src={logoUrl} 
                alt={`${displayCompanyName} logo`}
                crossOrigin="anonymous"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                  const fallback = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
                ) : (
             <span className="text-[44px] font-extrabold text-[#0F172A] w-full h-full flex items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
             {ticker[0]}
             </span>
                 )}
          </div>
            

            <div className="flex flex-col min-w-0 flex-1">
              <div className="flex items-baseline gap-4 min-w-0">
  <h1 className="text-[48px] font-extrabold text-[#0F172A] leading-none tracking-tight shrink-0">
    {ticker}
  </h1>
  <span className="text-[28px] font-semibold text-slate-500 shrink-0">
    {displayCompanyName}
  </span>
</div>
              <div className="flex items-center gap-4 mt-2.5">
                <span className="text-[24px] font-bold text-[#0F172A]">${price}</span>
                <span className={`text-[20px] font-bold ${dayChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {dayChange > 0 ? '+' : ''}{dayChange}% <span className="text-slate-400 font-medium">today</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-1.5 mt-1 shrink-0">
            
            <div className="flex items-center gap-3 px-6 py-4 rounded-full border border-slate-100 bg-slate-50">
              <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: statusConfig.color }} />
              <span className="text-[32px] font-extrabold tracking-widest leading-none text-black uppercase">
                {overallStatus}
              </span>
            </div>
          </div>
        </div>

        {/* 2. BODY */}
        {/* Added min-h-0 and tightened gaps to ensure it doesn't push the footer out */}
        <div className="flex flex-col gap-4 mt-4 mb-2 flex-1 z-10 justify-center min-h-0">
          
          {/* WHAT CHANGED */}
          {displayUpdates.length > 0 && (
            <div>
              <h2 className="text-[14px] font-bold uppercase tracking-widest text-slate-400 mb-3">Key Changes</h2>
              <div className="flex flex-col gap-4">
                {displayUpdates.map((update, idx) => (
                  <div key={idx} className="flex items-start gap-4 pr-2">
                    <div className="shrink-0 flex items-center justify-center mt-1">
                      {update.type === 'positive' && <span className="text-[32px] font-semibold text-emerald-600 leading-none">↑</span>}
                      {update.type === 'negative' && <span className="text-[32px] font-semibold text-rose-600 leading-none">↓</span>}
                      {update.type === 'warning' && <span className="text-[32px] font-semibold text-amber-500 leading-none">⚠</span>}
                    </div>
                    <div>
                      <h3 className="text-[36px] font-semibold text-[#0F172A] leading-snug max-w-[950px]">{update.headline}</h3>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className="border-slate-100 my-1" />

          {/* THESIS DRIVERS */}
          {drivers && drivers.length > 0 && (
            <div>
              <h2 className="text-[14px] font-bold uppercase tracking-widest text-slate-400 mb-3">Thesis Drivers</h2>
              <div className="grid grid-cols-2 gap-4">
                {drivers.slice(0, 2).map((driver, idx) => (
                  <div key={idx} className="flex items-start gap-4 pr-2">
                    <div className="shrink-0 h-[30px] flex items-center justify-center mt-1">
                      {getDriverDot(driver.status)}
                    </div>
                    <span className="text-[28px] font-semibold text-[#0F172A] leading-tight">{driver.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* KEY RISK */}
          {keyRisk && (
            <>
              <hr className="border-slate-100 my-1" />
              <div>
                <h2 className="text-[14px] font-bold uppercase tracking-widest text-slate-400 mb-3">Key Risk</h2>
                <div className="flex items-start gap-4">
                  <div className="shrink-0 h-[32px] flex items-center justify-center mt-1">
                    <span className="w-4 h-4 rounded-full bg-rose-500 block shrink-0" />
                  </div>
                  <h3 className="text-[32px] font-semibold text-[#0F172A] leading-tight max-w-[950px]">{keyRisk}</h3>
                </div>
              </div>
            </>
          )}

        </div>

        {/* 3. FOOTER */}
        {/* Adjusted padding to pt-4 and added shrink-0 so it stays locked to the bottom */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center h-8">
            <img 
              src="/Group 1.svg" 
              alt="Investment IQ" 
              className="h-full w-auto object-contain"
            />
          </div>
          <div className="flex text-slate-400 text-[14px] font-bold uppercase tracking-widest">
            <span>Saved: {date}</span>
          </div>
        </div>

      </div>
    </div>
  );
});

PortfolioShareCard.displayName = 'PortfolioShareCard';