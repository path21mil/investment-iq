'use client';

import React, { forwardRef } from 'react';

interface CinematicShareCardProps {
  ticker: string;
  percentMove: number;
  evidence?: string;
  date?: string;
  activeTab: string;
  multiData?: Record<string, any>;
}

export const CinematicShareCard = forwardRef<HTMLDivElement, CinematicShareCardProps>(({
  ticker,
  percentMove,
  evidence,
  date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  activeTab,
  multiData
}, ref) => {

  const isSplit = activeTab.includes('|');
  const activeTabs = activeTab.split('|').map(t => t.trim());

  const primaryData = multiData?.[activeTabs[0]];
  const isChartDown = primaryData?.pricing?.regChange != null 
    ? primaryData.pricing.regChange < 0 
    : percentMove < 0;

  const finalEvidence = evidence || (isChartDown 
    ? "AI demand remains strong and core growth drivers are intact."
    : "AI demand remains stronger than expected.");

  const themeColor = isChartDown ? '#D2122E' : '#22C55E';
  
  const questionText = isChartDown ? 'BUT DID THE THESIS BREAK?' : 'IS THE THESIS GETTING STRONGER?';
  const resolutionText = isChartDown ? 'THESIS INTACT' : 'THESIS STRENGTHENING';

  const generateSparkline = (data: number[], width: number, height: number) => {
    if (!data || data.length === 0) return { path: "", area: "", endY: 0 };
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1; 
    const paddingY = 20; 
    const usableHeight = height - (paddingY * 2);

    const points = data.map((val, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = paddingY + usableHeight - ((val - min) / range) * usableHeight;
      return { x, y };
    });

    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const endY = points[points.length - 1].y;
    const area = `${path} L ${width} ${height} L 0 ${height} Z`;

    return { path, area, endY };
  };

  const renderDataBlock = (tfKey: string) => {
    const data = multiData?.[tfKey];
    if (!data) return <div className="animate-pulse w-full h-full min-h-[150px] bg-white/5 rounded-xl" />;
    
    const { chartData, pricing } = data;
    
    const isLocalDown = pricing?.regChange != null 
      ? pricing.regChange < 0 
      : chartData[chartData.length - 1] < chartData[0];
      
    const localTheme = isLocalDown ? '#D2122E' : '#22C55E';
    
    const width = isSplit ? 500 : 1100;
    const height = isSplit ? 220 : 280; 
    const { path, endY } = generateSparkline(chartData, width, height);

    return (
      <div className={`relative ${isSplit ? 'flex flex-col gap-1 h-full w-full' : 'w-full h-[280px] flex items-center'}`}>
        
        {/* TEXT LAYER */}
        <div className={`${isSplit ? 'w-full' : 'absolute left-0 z-10 flex flex-col justify-center pointer-events-none -translate-y-16'}`}>
          <div className="flex items-baseline gap-3">
            <h1 
              className={`${isSplit ? 'text-[56px]' : 'text-[90px]'} font-[900] text-white tracking-tighter leading-none`}
              style={{ textShadow: isSplit ? 'none' : '0 10px 30px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.5)' }}
            >
              ${pricing.currentPrice.toFixed(2)}
            </h1>
            <span className="text-[20px] font-bold text-[#8B93A1]">{pricing.currency}</span>
          </div>

          {pricing.regChange != null && pricing.regChangePercent != null && (
            <p 
              className={`text-[20px] font-[600] tracking-wide mt-2 ${pricing.regChange >= 0 ? 'text-[#22C55E]' : 'text-[#D2122E]'}`}
              style={{ textShadow: isSplit ? 'none' : '0 4px 12px rgba(0,0,0,0.9)' }}
            >
              {pricing.regChange > 0 ? '+' : ''}${pricing.regChange.toFixed(2)} 
              <span className="ml-2">({pricing.regChange > 0 ? '+' : ''}{pricing.regChangePercent.toFixed(2)}%)</span>
              <span className="text-[#8B93A1] ml-3">{pricing.timeframeLabel}</span>
            </p>
          )}
        </div>

        {/* CHART LAYER */}
        <div className={`${isSplit ? 'w-full flex-1 relative' : 'absolute inset-0 w-full h-full'} flex items-center justify-center z-0`}>
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`chartStroke-${tfKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
                {!isSplit && (
                  <>
                    <stop offset="0%" stopColor={localTheme} stopOpacity="0" />
                    <stop offset="35%" stopColor={localTheme} stopOpacity="0" />
                    <stop offset="55%" stopColor={localTheme} stopOpacity="0.8" />
                  </>
                )}
                {isSplit && <stop offset="0%" stopColor={localTheme} stopOpacity="0.8" />}
                <stop offset="100%" stopColor={localTheme} stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id={`coreStroke-${tfKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
                {!isSplit && (
                  <>
                    <stop offset="0%" stopColor={localTheme} stopOpacity="0" />
                    <stop offset="35%" stopColor={localTheme} stopOpacity="0" />
                    <stop offset="55%" stopColor={localTheme} stopOpacity="1" />
                  </>
                )}
                {isSplit && <stop offset="0%" stopColor={localTheme} stopOpacity="1" />}
                <stop offset="100%" stopColor={localTheme} stopOpacity="1" />
              </linearGradient>
            </defs>

            <path d={path} fill="none" stroke={`url(#chartStroke-${tfKey})`} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} fill="none" stroke={`url(#coreStroke-${tfKey})`} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            
            {/* ✨ FIX: Replaced drop-shadow filter with native SVG opacity circles to guarantee clean downloads */}
            <circle cx={width} cy={endY} r="14" fill={localTheme} opacity="0.25" />
            <circle cx={width} cy={endY} r="6" fill={localTheme} />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={ref}
      style={{ width: '1200px', height: '675px' }}
      className="bg-[#050B14] text-[#F5F7FA] p-8 flex flex-col font-sans shrink-0 overflow-hidden relative"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* ✨ FIX: Replaced the CSS blur-[150px] with native radial gradients. This renders perfectly in html-to-image. */}
      <div 
        className="absolute top-1/4 left-1/4 w-[1000px] h-[1000px] pointer-events-none -translate-y-1/2 -translate-x-1/2" 
        style={{ background: `radial-gradient(circle, ${themeColor}25 0%, transparent 60%)` }} 
      />
      <div 
        className="absolute -bottom-20 right-0 w-[900px] h-[700px] pointer-events-none" 
        style={{ background: `radial-gradient(circle, ${themeColor}15 0%, transparent 60%)` }} 
      />

      <div className="z-20 mb-4 w-fit">
        <div 
          className="flex items-center gap-3 px-6 py-2.5 rounded-full bg-[#0A1018] shadow-2xl"
          style={{ border: `1px solid ${themeColor}60` }}
        >
          {/* ✨ FIX: Replaced box-shadow pulse with a standard hex color for stability */}
          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: themeColor }} />
          <span className="text-[#F5F7FA] text-[20px] font-[900] tracking-widest leading-none">${ticker}</span>
        </div>
      </div>

      <div className="flex-1 w-full z-10 relative mb-4 min-h-0 flex flex-col justify-center">
        {isSplit ? (
          <div className="grid grid-cols-2 gap-8 w-full h-full items-center">
            <div className="border-r border-[#202631] pr-6 relative h-full flex flex-col justify-center">
              {renderDataBlock(activeTabs[0])}
            </div>
            <div className="relative h-full flex flex-col justify-center pl-2">
              {renderDataBlock(activeTabs[1])}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center">
             {renderDataBlock(activeTabs[0])}
          </div>
        )}
      </div>

      {/* ✨ FIX: Removed backdrop-blur-xl and used a solid dark background color to prevent glitching */}
      <div 
        className="z-10 mb-5 w-full bg-[#03060A] rounded-3xl p-7 relative overflow-hidden shrink-0"
        style={{ border: `1px solid ${themeColor}30` }}
      >
        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${themeColor}80, transparent)` }} />
        
        <p className="text-[14px] font-[800] uppercase tracking-widest text-[#8B93A1] mb-3">
          {questionText}
        </p>
        
        <div className="flex items-center gap-3 mb-4">
          <span 
            className="text-[26px] font-[900] flex items-center gap-3 tracking-widest"
            style={{ color: themeColor }}
          >
            {/* ✨ FIX: Replaced drop-shadow on the dot */}
            <div className="relative w-4 h-4 flex items-center justify-center">
              <span className="absolute w-8 h-8 rounded-full opacity-20" style={{ backgroundColor: themeColor }} />
              <span className="relative w-4 h-4 rounded-full" style={{ backgroundColor: themeColor }} />
            </div>
            {resolutionText}
          </span>
        </div>

        <p className="text-[22px] font-[500] text-white italic leading-relaxed tracking-wide">
          "{finalEvidence}"
        </p>
      </div>

      <div className="pt-3 flex items-center justify-between text-[#8B93A1] text-[12px] font-[700] z-10 border-t border-[#202631]/80 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white font-black text-[10px]">
            IQ
          </div>
          <span className="font-bold text-zinc-200 text-sm tracking-tight">Investment IQ</span>
        </div>

        <span className="tracking-widest uppercase">
          LAST REVIEWED {date.toUpperCase()}
        </span>
      </div>
    </div>
  );
});

CinematicShareCard.displayName = 'CinematicShareCard';