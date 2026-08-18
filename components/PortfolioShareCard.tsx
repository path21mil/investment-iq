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
    STRENGTHENING: { color: '#22C55E', bg: 'rgba(34, 197, 94, 0.1)', border: 'rgba(22, 128, 60, 0.6)' },
    INTACT: { color: '#5B8DEF', bg: 'rgba(91, 141, 239, 0.1)', border: 'rgba(91, 141, 239, 0.5)' },
    WEAKENING: { color: '#FF3B4D', bg: 'rgba(255, 59, 77, 0.1)', border: 'rgba(200, 30, 45, 0.5)' }
  }[overallStatus];

  const getDriverDot = (status: DriverItem['status']) => {
    switch (status) {
      case 'strengthening': return <span className="w-4 h-4 rounded-full bg-[#22C55E] shadow-[0_0_8px_#22C55E] shrink-0 block" />;
      case 'monitoring': return <span className="w-4 h-4 rounded-full bg-[#EAB308] shadow-[0_0_8px_#EAB308] shrink-0 block" />;
      case 'weakening': return <span className="w-4 h-4 rounded-full bg-[#FF3B4D] shadow-[0_0_8px_#FF3B4D] shrink-0 block" />;
      case 'on_track': 
      default: 
        return <span className="w-4 h-4 rounded-full bg-[#5B8DEF] shadow-[0_0_8px_#5B8DEF] shrink-0 block" />;
    }
  };

  // ✨ SMART COMPANY NAME TRIMMER
  const getCleanCompanyName = (name: string) => {
    let clean = (name || '').replace(/(?:\s+Inc\.?|\s+Corp\.?|\s+Ltd\.?|\s+LLC|\s+PLC|\s+Company)$/i, '').trim();
    const words = clean.split(/\s+/);
    if (words.length > 2) {
      clean = words.slice(0, 2).join(' ') + '...';
    }
    return clean;
  };
  const displayCompanyName = getCleanCompanyName(companyName);

  return (
    <div 
      ref={ref}
      style={{ width: '1200px', height: '675px' }}
      className="bg-[#050505] text-[#F5F7FA] px-8 py-5 flex flex-col font-sans shrink-0 overflow-hidden relative border border-[#1B2026] antialiased"
    >
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none z-0" 
        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />


      {/* 1. HEADER */}
      <div className="flex items-start justify-between z-10 border-b border-[#1B2026] pb-4">
        <div className="flex items-center gap-5 min-w-0 flex-1 pr-6">
          
          {/* ✨ Reduced Logo size from w-24 to w-20 */}
          <div className="w-20 h-20 flex items-center justify-center shrink-0">
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
            ) : null}
            <span 
              className="text-[36px] font-extrabold text-[#F5F7FA] bg-[#080A0D] w-full h-full items-center justify-center rounded-2xl border border-[#1B2026]" 
              style={{ display: logoUrl ? 'none' : 'flex' }}
            >
              {ticker[0]}
            </span>
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-4 min-w-0">
              {/* ✨ Font sized reduced from 64px to 56px */}
              <h1 className="text-[56px] font-extrabold text-[#F5F7FA] leading-none tracking-tight truncate max-w-[800px]" title={companyName}>
                {displayCompanyName}
              </h1>
            </div>
            <div className="flex items-center gap-4 mt-2.5">
              {/* ✨ Price reduced from 44px to 40px */}
              <span className="text-[40px] font-semibold text-[#F5F7FA]">${price}</span>
              {/* ✨ Change reduced from 30px to 26px */}
              <span className={`text-[26px] font-semibold ${dayChange >= 0 ? 'text-[#22C55E]' : 'text-[#FF3B4D]'}`}>
                {dayChange > 0 ? '+' : ''}{dayChange}% <span className="text-[#8E99AA] font-medium">today</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1.5 mt-1 shrink-0">
          <span className="text-[14px] font-semibold uppercase tracking-widest text-[#8E99AA]">Thesis Status</span>
          <div 
            className="flex items-center gap-3 px-6 py-4 rounded-full border"
            style={{ backgroundColor: statusConfig.bg, borderColor: statusConfig.border }}
          >
            <span className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ backgroundColor: statusConfig.color, boxShadow: `0 0 10px ${statusConfig.color}` }} />
            {/* ✨ Status text reduced from 32px to 26px */}
            <span className="text-[30px] font-extrabold tracking-widest leading-none" style={{ color: statusConfig.color }}>
              {overallStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 2. BODY */}
      {/* ✨ Reduced vertical gaps between sections */}
      <div className="flex flex-col gap-4 mt-5 mb-3 flex-1 z-10 justify-between">
        
        {/* WHAT CHANGED */}
        <div className="bg-[#080A0D]/90 backdrop-blur-sm border border-[#1B2026] rounded-xl p-5 shadow-xl">
          <h2 className="text-[14px] font-semibold uppercase tracking-widest text-[#8E99AA] mb-3">What Changed</h2>
          <div className="grid grid-cols-2 gap-6">
            {updates.slice(0, 2).map((update, idx) => (
              <div key={idx} className="flex items-center gap-3 pr-2">
                <div className="shrink-0 flex items-center justify-center">
                  {update.type === 'positive' && <span className="text-[32px] font-semibold text-[#22C55E]">↑</span>}
                  {update.type === 'negative' && <span className="text-[32px] font-semibold text-[#FF3B4D]">↓</span>}
                  {update.type === 'warning' && <span className="text-[32px] font-semibold text-[#EAB308]">⚠</span>}
                </div>
                <div>
                  {/* ✨ Headline reduced from 42px to 32px */}
                  <h3 className="text-[36px] font-semibold text-[#F5F7FA] leading-tight">{update.headline}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* THESIS DRIVERS */}
        <div className="bg-[#080A0D]/90 backdrop-blur-sm border border-[#1B2026] rounded-xl p-5 shadow-xl">
          <h2 className="text-[14px] font-semibold uppercase tracking-widest text-[#8E99AA] mb-3">Thesis Drivers</h2>
          <div className="grid grid-cols-2 gap-6">
            {drivers.slice(0, 2).map((driver, idx) => (
              <div key={idx} className="flex items-start gap-3 pr-2">
                <div className="shrink-0 h-[30px] flex items-center justify-center">
                  {getDriverDot(driver.status)}
                </div>
                {/* ✨ Driver text reduced from 30px to 24px */}
                <span className="text-[28px] font-semibold text-[#F5F7FA] leading-tight">{driver.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KEY RISK */}
        {keyRisk && (
          <div className="bg-[#080A0D]/90 backdrop-blur-sm border border-[#FF3B4D]/30 rounded-xl p-5 shadow-xl">
            <h2 className="text-[14px] font-semibold uppercase tracking-widest text-[#8E99AA] mb-3">Key Risk</h2>
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-[32px] flex items-center justify-center">
                <span className="w-4 h-4 rounded-full bg-[#FF3B4D] shadow-[0_0_8px_#FF3B4D] block" />
              </div>
              {/* ✨ Risk text reduced from 32px to 26px */}
              <h3 className="text-[32px] font-semibold text-[#F5F7FA] leading-tight">{keyRisk}</h3>
            </div>
          </div>
        )}

      </div>

      {/* 3. FOOTER */}
      <div className="mt-auto pt-3 border-t border-[#1B2026] flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[#5B8DEF] flex items-center justify-center text-[#050505] font-bold text-[12px] shadow-sm">
            IQ
          </div>
          <span className="text-[18px] font-semibold text-[#F5F7FA]">Investment IQ</span>
        </div>
        <div className="flex text-[#8E99AA] text-[14px] font-medium uppercase tracking-widest">
          <span>Last Reviewed {date}</span>
        </div>
      </div>
    </div>
  );
});

PortfolioShareCard.displayName = 'PortfolioShareCard';