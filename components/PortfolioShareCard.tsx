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
      case 'strengthening': return <span className="w-4 h-4 rounded-full bg-[#22C55E] shadow-[0_0_6px_#22C55E] shrink-0 block" />;
      case 'monitoring': return <span className="w-4 h-4 rounded-full bg-[#EAB308] shadow-[0_0_6px_#EAB308] shrink-0 block" />;
      case 'weakening': return <span className="w-4 h-4 rounded-full bg-[#FF3B4D] shadow-[0_0_6px_#FF3B4D] shrink-0 block" />;
      case 'on_track': 
      default: 
        return <span className="w-4 h-4 rounded-full bg-[#5B8DEF] shadow-[0_0_6px_#5B8DEF] shrink-0 block" />;
    }
  };

  const cleanCompanyName = (companyName || '')
    .replace(/(?:\s+Inc\.?|\s+Corp\.?|\s+Ltd\.?|\s+LLC|\s+PLC)$/i, '')
    .trim();

  return (
    <div 
      ref={ref}
      style={{ width: '1200px', height: '675px' }}
      // ✨ MAIN BACKGROUND & BORDER
      className="bg-[#050505] text-[#F5F7FA] px-10 py-6 flex flex-col font-sans shrink-0 overflow-hidden relative border border-[#1B2026] antialiased"
    >
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />

      {/* 1. HEADER */}
      <div className="flex items-start justify-between z-10 border-b border-[#1B2026] pb-5">
        <div className="flex items-center gap-6 min-w-0">
          
          <div className="w-20 h-20 flex items-center justify-center shrink-0">
            {logoUrl ? (
              <img 
                src={logoUrl} 
                alt={`${cleanCompanyName} logo`}
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
              // ✨ LOGO FALLBACK: Card Background
              className="text-4xl font-extrabold text-[#F5F7FA] bg-[#080A0D] w-full h-full items-center justify-center rounded-2xl border border-[#1B2026]" 
              style={{ display: logoUrl ? 'none' : 'flex' }}
            >
              {ticker[0]}
            </span>
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-4 min-w-0">
              {/* ✨ COMPANY NAME: Inter 800 (extrabold) */}
              <h1 className="text-[48px] font-extrabold text-[#F5F7FA] leading-none tracking-tight truncate max-w-[500px]" title={cleanCompanyName}>
                {cleanCompanyName}
              </h1>
              {/* ✨ TICKER PILL: Card Background */}
              <div className="flex items-center gap-2 bg-[#080A0D] px-4 py-1.5 rounded-lg shrink-0 border border-[#1B2026]">
                <span className="text-[24px] font-medium text-[#8E99AA]">|</span>
                {/* ✨ TICKER: Inter 600 (semibold) */}
                <span className="text-[26px] font-semibold text-[#F5F7FA]">${ticker}</span>
              </div>
            </div>
            <div className="flex items-center gap-5 mt-3">
              {/* ✨ PRICE METRIC: Inter 600 (semibold) */}
              <span className="text-[28px] font-semibold text-[#F5F7FA]">${price}</span>
              <span className={`text-[20px] font-semibold ${dayChange >= 0 ? 'text-[#22C55E]' : 'text-[#FF3B4D]'}`}>
                {dayChange > 0 ? '+' : ''}{dayChange}% <span className="text-[#8E99AA] font-medium">today</span>
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 mt-1 shrink-0">
          {/* ✨ SECTION HEADING: Inter 600 (semibold) */}
          <span className="text-[12px] font-semibold uppercase tracking-widest text-[#8E99AA]">Thesis Status</span>
          <div 
            className="flex items-center gap-3 px-6 py-4 rounded-full border"
            style={{ backgroundColor: statusConfig.bg, borderColor: statusConfig.border }}
          >
            <span className="w-3.5 h-3.5 rounded-full animate-pulse" style={{ backgroundColor: statusConfig.color, boxShadow: `0 0 8px ${statusConfig.color}` }} />
            {/* ✨ STATUS HEADLINE: Inter 800 (extrabold) */}
            <span className="text-[23px] font-extrabold tracking-widest leading-none" style={{ color: statusConfig.color }}>
              {overallStatus}
            </span>
          </div>
        </div>
      </div>

      {/* 2. BODY */}
      <div className="flex flex-col gap-5 mt-6 mb-2 flex-1 z-10 justify-between">
        
        {/* WHAT CHANGED */}
        {/* ✨ CARD BACKGROUND & BORDER */}
        <div className="bg-[#080A0D] border border-[#1B2026] rounded-xl p-5">
          {/* ✨ SECTION HEADING: Inter 600 (semibold) */}
          <h2 className="text-[14px] font-semibold uppercase tracking-widest text-[#8E99AA] mb-4">What Changed</h2>
          <div className="grid grid-cols-3 gap-6">
            {updates.slice(0, 3).map((update, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="shrink-0 flex items-center justify-center">
                  {update.type === 'positive' && <span className="text-[36px] font-semibold text-[#22C55E]">↑</span>}
                  {update.type === 'negative' && <span className="text-[36px] font-semibold text-[#FF3B4D]">↓</span>}
                  {update.type === 'warning' && <span className="text-[36px] font-semibold text-[#EAB308]">⚠</span>}
                </div>
                <div>
                  {/* ✨ MAJOR HEADLINE: Inter 700 (bold) */}
                  <h3 className="text-[26px] font-bold text-[#F5F7FA] leading-tight">{update.headline}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* THESIS DRIVERS */}
        {/* ✨ CARD BACKGROUND & BORDER */}
        <div className="bg-[#080A0D] border border-[#1B2026] rounded-xl p-5">
          {/* ✨ SECTION HEADING: Inter 600 (semibold) */}
          <h2 className="text-[14px] font-semibold uppercase tracking-widest text-[#8E99AA] mb-4">Thesis Drivers</h2>
          <div className="grid grid-cols-3 gap-6">
            {drivers.slice(0, 3).map((driver, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className="shrink-0 h-[28px] flex items-center justify-center">
                  {getDriverDot(driver.status)}
                </div>
                {/* ✨ MAJOR HEADLINE: Inter 700 (bold) */}
                <span className="text-[20px] font-bold text-[#F5F7FA] leading-tight">{driver.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* KEY RISK */}
        {keyRisk && (
          // ✨ CARD BACKGROUND (Tinted Red) & BORDER
          <div className="bg-[#080A0D] border border-[#FF3B4D]/20 rounded-xl p-5">
            {/* ✨ SECTION HEADING: Inter 600 (semibold) */}
            <h2 className="text-[14px] font-semibold uppercase tracking-widest text-[#8E99AA] mb-4">Key Risk</h2>
            <div className="flex items-start gap-3">
              <div className="shrink-0 h-[30px] flex items-center justify-center">
                <span className="w-4 h-4 rounded-full bg-[#FF3B4D] shadow-[0_0_6px_#FF3B4D] block" />
              </div>
              {/* ✨ MAJOR HEADLINE: Inter 700 (bold) */}
              <h3 className="text-[22px] font-bold text-[#F5F7FA] leading-tight">{keyRisk}</h3>
            </div>
          </div>
        )}

      </div>

      {/* 3. FOOTER */}
      <div className="mt-auto pt-4 border-t border-[#1B2026] flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-[#5B8DEF] flex items-center justify-center text-[#050505] font-bold text-[12px] shadow-sm">
            IQ
          </div>
          <span className="text-[15px] font-semibold text-[#F5F7FA]">Investment IQ</span>
        </div>
        <div className="flex text-[#8E99AA] text-[13px] font-medium uppercase tracking-widest">
          <span>Last Reviewed {date}</span>
        </div>
      </div>
    </div>
  );
});

PortfolioShareCard.displayName = 'PortfolioShareCard';