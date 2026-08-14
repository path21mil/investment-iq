'use client';

import React, { forwardRef } from 'react';

interface ThesisShareCardProps {
  ticker: string;
  companyName: string;
  status?: 'strengthening' | 'weakening' | 'neutral';
  summary?: string;
  drivers: string[];
  latestChange?: string;
  username?: string;
}

export const ThesisShareCard = forwardRef<HTMLDivElement, ThesisShareCardProps>(({
  ticker,
  companyName,
  status = 'strengthening',
  summary,
  drivers = [],
  latestChange,
  username = 'investor'
}, ref) => {

  // Premium High-Contrast Status Config (Image 2 Style)
  const statusConfig = {
    strengthening: { 
      label: 'THESIS STRENGTHENING', 
      badge: 'bg-[#00291B] text-[#00FF9D] border-[#00FF9D]/30',
      glow: 'bg-[#00FF9D]',
      boxBorder: 'border-[#00FF9D]/40',
      boxBg: 'bg-[#00FF9D]/[0.02]'
    },
    weakening: { 
      label: 'THESIS WEAKENING', 
      badge: 'bg-[#3E0A16] text-[#FF3366] border-[#FF3366]/30',
      glow: 'bg-[#FF3366]',
      boxBorder: 'border-[#FF3366]/40',
      boxBg: 'bg-[#FF3366]/[0.02]'
    },
    neutral: { 
      label: 'THESIS UNCHANGED', 
      badge: 'bg-[#18181B] text-[#A1A1AA] border-[#3F3F46]',
      glow: 'bg-[#A1A1AA]',
      boxBorder: 'border-[#27272A]',
      boxBg: 'bg-[#18181B]'
    },
  }[status];

  // ✨ FIX: Smartly truncate the summary so it never breaks the layout!
  const safeSummary = summary || "Monitoring core fundamentals and growth drivers.";
  const cleanSummary = safeSummary.length > 210 ? safeSummary.substring(0, 207).trim() + "..." : safeSummary;

  return (
    <div 
      ref={ref}
      style={{ width: '1200px', height: '675px' }}
      className="bg-[#09090B] text-zinc-100 p-12 flex flex-col justify-between font-sans relative overflow-hidden shrink-0 border border-zinc-800"
    >
      {/* Background Grid Pattern for that "Terminal" aesthetic */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}
      />
      
      {/* Subtle Neon Glows */}
      <div className={`absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 pointer-events-none ${statusConfig.glow}`} />

      {/* HEADER */}
      <div className="flex items-start justify-between z-10 border-b border-zinc-800/80 pb-6">
        <div className="flex items-baseline gap-4">
          <h1 className="text-[64px] font-black tracking-tight text-white leading-none">{ticker}</h1>
          <span className="text-[22px] font-semibold text-zinc-400 tracking-wide">{companyName}</span>
        </div>

        <div className={`flex items-center gap-2.5 px-4 py-2 rounded-full border text-[11px] font-black tracking-widest ${statusConfig.badge}`}>
          <span className={`w-2 h-2 rounded-full ${statusConfig.glow}`} />
          {statusConfig.label}
        </div>
      </div>

      {/* BODY: Main Content Grid */}
      <div className="grid grid-cols-12 gap-12 my-auto z-10 py-6">
        
        {/* Left Column: Thesis & Drivers */}
        <div className="col-span-7 flex flex-col justify-center space-y-8">
          
          {/* Summary */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-3">My Investment Thesis</p>
            <div className="border-l-2 border-zinc-700 pl-5">
              <p className="text-[17px] font-medium text-zinc-300 leading-relaxed italic">
                "{cleanSummary}"
              </p>
            </div>
          </div>

          {/* Drivers */}
          {drivers.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-4">Core Conviction Drivers</p>
              <ul className="space-y-3.5">
                {drivers.slice(0, 3).map((driver, idx) => (
                  <li key={idx} className="flex items-center gap-3.5 text-[17px] font-semibold text-zinc-100">
                    <span className="w-5 h-5 rounded-full bg-blue-500/20 border border-blue-500/50 text-blue-400 flex items-center justify-center text-[10px] font-black shrink-0">
                      ✓
                    </span>
                    <span className="truncate">{driver}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Right Column: Latest Intelligence */}
        <div className={`col-span-5 rounded-2xl p-7 flex flex-col justify-between border ${statusConfig.boxBorder} ${statusConfig.boxBg} shadow-2xl backdrop-blur-sm z-10`}>
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${statusConfig.glow}`} />
              <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Latest Intelligence</p>
            </div>
            <h3 className="text-xl font-bold text-white leading-snug mb-3">
              {latestChange || "Monitoring SEC filings, earnings transcripts, and key performance drivers in real-time."}
            </h3>
            <p className="text-sm font-medium text-zinc-400 leading-relaxed">
              Recent data points have been evaluated against your core conviction drivers.
            </p>
          </div>

          <div className="pt-4 mt-4 border-t border-zinc-800 flex justify-between items-center text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">
            <span>Verified Data Scan</span>
            <span className="text-zinc-300">Live AI Evaluation</span>
          </div>
        </div>

      </div>

      {/* FOOTER */}
      <div className="pt-6 flex items-center justify-between z-10 text-zinc-400">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-[10px]">
            IQ
          </div>
          <div>
            <span className="font-bold text-zinc-200 text-sm tracking-tight">Investment IQ</span>
            <span className="mx-2 text-zinc-600">|</span>
            <span className="text-[12px] font-medium text-zinc-500">Track your conviction.</span>
          </div>
        </div>

        <div className="text-[12px] font-medium text-zinc-500">
          Thesis by <span className="text-zinc-200 font-bold">@{username.replace('@', '')}</span>
        </div>
      </div>
    </div>
  );
});

ThesisShareCard.displayName = 'ThesisShareCard';