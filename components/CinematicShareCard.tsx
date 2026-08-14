'use client';

import React, { forwardRef } from 'react';

interface CinematicShareCardProps {
  ticker: string;
  percentMove: number;
  evidence?: string;
  date?: string;
}

export const CinematicShareCard = forwardRef<HTMLDivElement, CinematicShareCardProps>(({
  ticker,
  percentMove,
  evidence,
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}, ref) => {

  // Auto-detects if the stock is crashing based on the math
  const isDown = percentMove < 0; 
  const absPercent = Math.abs(percentMove).toFixed(1);
  const sign = percentMove > 0 ? '+' : '−';
  
  // Logical evidence fallback
  const finalEvidence = evidence || (isDown 
    ? "AI demand remains strong and core growth drivers are intact."
    : "AI demand remains stronger than expected.");

  // 🔥 THE COLOR FIX: True Blood Red (#D2122E) instead of the pinkish neon red
  const themeColor = isDown ? '#D2122E' : '#22C55E';
  
  // Deepened the glow slightly for the blood red to make it feel heavier/moodier
  const themeGlow = isDown ? 'rgba(210, 18, 46, 0.25)' : 'rgba(34, 197, 94, 0.15)';
  
  // Storytelling Text Copy
  const statusLabel = 'MARKET MOVE';
  const impactText = isDown ? 'THE STOCK JUST GOT HIT.' : 'THE STOCK IS BREAKING OUT.';
  const questionText = isDown ? 'BUT DID THE THESIS BREAK?' : 'IS THE THESIS GETTING STRONGER?';
  const resolutionText = isDown ? 'THESIS INTACT' : 'THESIS STRENGTHENING';

  // Jagged Zig-Zag Chart Paths (Downward crash vs Upward breakout)
  const chartPath = isDown
    ? "M 0 30 L 40 50 L 70 20 L 120 80 L 160 60 L 210 140 L 250 110 L 310 190 L 350 160 L 410 240 L 450 210 L 510 270 L 550 240 L 600 260"
    : "M 0 250 L 30 230 L 60 260 L 100 210 L 130 225 L 180 160 L 220 190 L 270 120 L 310 145 L 370 80 L 410 110 L 470 50 L 520 75 L 570 30 L 600 20";

  const areaPath = `${chartPath} L 600 300 L 0 300 Z`;

  return (
    <div 
      ref={ref}
      style={{ width: '1200px', height: '675px' }}
      className="bg-[#07090D] text-[#F5F7FA] px-12 pt-12 pb-6 flex flex-col justify-between font-sans shrink-0 overflow-hidden relative border border-[#202631]"
    >
      {/* Background Grid Accent */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }}
      />

      {/* ATMOSPHERIC RADIAL BLOOM */}
      <div 
        className="absolute top-1/3 left-1/4 w-[800px] h-[800px] rounded-full blur-[150px] pointer-events-none -translate-y-1/2 -translate-x-1/2 transition-all duration-500"
        style={{ backgroundColor: themeColor, opacity: 0.20 }} // Boosted opacity slightly for the deeper red
      />
      
      {/* SECONDARY THESIS GLOW */}
      <div className="absolute -bottom-10 right-10 w-[700px] h-[500px] bg-[#5B8CFF] rounded-full blur-[150px] pointer-events-none opacity-[0.25]" />

      {/* HEADER - Upgraded to a sleek Frosted Pill */}
      <div className="flex items-center justify-end z-10">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-md shadow-2xl">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor, boxShadow: `0 0 10px ${themeColor}` }} />
          <span className="text-[#F5F7FA] text-[16px] font-[800] tracking-widest leading-none">${ticker}</span>
        </div>
      </div>

      {/* CENTER HERO AREA */}
      <div className="grid grid-cols-12 gap-8 items-center mt-auto mb-6 z-10 relative">
        
        {/* Left Column: Massive Metric */}
        <div className="col-span-5 flex flex-col justify-center">
          <p className="text-[14px] font-[800] uppercase tracking-[0.2em] text-[#8B93A1] mb-2">
            {statusLabel}
          </p>
          
          <h1 
            className="text-[130px] font-[900] tracking-tighter leading-none my-2"
            style={{ color: themeColor, textShadow: `0 0 40px ${themeGlow}, 0 0 80px ${themeGlow}` }}
          >
            {sign}{absPercent}%
          </h1>

          <p className="text-[18px] font-[700] text-[#8B93A1] mt-2 tracking-wide">
            {impactText}
          </p>
        </div>

        {/* Right Column: Jagged Chart Visualization */}
        <div className="col-span-7 h-[260px] relative flex items-center justify-center">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 600 300" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartStroke" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor={themeColor} stopOpacity="1" />
                <stop offset="70%" stopColor={themeColor} stopOpacity="0.8" />
                <stop offset="100%" stopColor={themeColor} stopOpacity="0.2" />
              </linearGradient>
              <linearGradient id="chartArea" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={themeColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={themeColor} stopOpacity="0.0" />
              </linearGradient>
              <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path d={areaPath} fill="url(#chartArea)" />
            <path d={chartPath} fill="none" stroke="url(#chartStroke)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" filter="url(#neonGlow)" />
            <path d={chartPath} fill="none" stroke={themeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="600" cy={isDown ? "260" : "20"} r="6" fill={themeColor} style={{ filter: `drop-shadow(0 0 12px ${themeColor})` }} />
          </svg>
        </div>
      </div>

      {/* RESOLUTION SECTION: Upgraded with ultra-dark glass panel and wider gaps */}
      <div className="z-10 mb-8 max-w-4xl bg-black/40 backdrop-blur-md rounded-3xl p-8 border border-white/5 shadow-2xl">
        <p className="text-[20px] font-[800] uppercase tracking-widest text-[#8B93A1] mb-6">
          {questionText}
        </p>
        
        {/* Generous spacing added here (mb-8) */}
        <div className="flex items-center gap-4 mb-8">
          <span className="text-[28px] font-[900] text-[#5B8CFF] flex items-center gap-3 tracking-widest drop-shadow-[0_0_15px_rgba(91,140,255,0.3)]">
            <span className="w-4 h-4 rounded-full bg-[#5B8CFF] shadow-[0_0_15px_#5B8CFF]" />
            {resolutionText}
          </span>
        </div>

        {/* Pure white text for maximum readability against the dark glass */}
        <p className="text-[24px] font-[500] text-white italic leading-relaxed tracking-wide">
          "{finalEvidence}"
        </p>
      </div>

      {/* FOOTER: Tighter padding and smaller text */}
      <div className="pt-4 flex items-center justify-between text-[#8B93A1] text-[11px] font-[600] z-10 border-t border-[#202631]/60">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-[#5B8CFF] flex items-center justify-center text-white font-black text-[7px]">
            IQ
          </div>
          <span className="font-[700] text-[#F5F7FA]">Investment IQ</span>
        </div>
        <span>{date}</span>
      </div>
    </div>
  );
});

CinematicShareCard.displayName = 'CinematicShareCard';