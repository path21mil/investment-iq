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

  const themeColor = isChartDown ? '#FF3B4D' : '#22C55E';
  
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
      
    const localTheme = isLocalDown ? '#FF3B4D' : '#22C55E';
    
    const width = isSplit ? 500 : 1100;
    const height = isSplit ? 180 : 200; 
    const { path, endY } = generateSparkline(chartData, width, height);

    return (
      <div className={`w-full flex flex-col ${isSplit ? 'h-[290px]' : 'h-[330px]'}`}>
        
        <div className="flex flex-col z-10 w-full shrink-0">
          <div className="flex items-baseline gap-3">
            <h1 
              className={`${isSplit ? 'text-[64px]' : 'text-[100px]'} font-[900] text-[#F5F7FA] tracking-tighter leading-none`}
            >
              ${pricing.currentPrice.toFixed(2)}
            </h1>
            <span className="text-[24px] font-bold text-[#8E99AA]">{pricing.currency}</span>
          </div>

          {pricing.regChange != null && pricing.regChangePercent != null && (
            <p 
              className={`text-[24px] font-[600] tracking-wide mt-2 ${pricing.regChange >= 0 ? 'text-[#22C55E]' : 'text-[#FF3B4D]'}`}
            >
              {pricing.regChange > 0 ? '+' : ''}${pricing.regChange.toFixed(2)} 
              <span className="ml-2">({pricing.regChange > 0 ? '+' : ''}{pricing.regChangePercent.toFixed(2)}%)</span>
              <span className="text-[#8E99AA] ml-3">{pricing.timeframeLabel}</span>
            </p>
          )}
        </div>

        <div className="relative flex-1 w-full mt-4 flex items-end justify-center z-0">
          <svg className="w-full h-full overflow-visible" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id={`chartStroke-${tfKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={localTheme} stopOpacity="0.8" />
                <stop offset="100%" stopColor={localTheme} stopOpacity="0.2" />
              </linearGradient>

              <linearGradient id={`coreStroke-${tfKey}`} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={localTheme} stopOpacity="1" />
                <stop offset="100%" stopColor={localTheme} stopOpacity="1" />
              </linearGradient>
            </defs>

            <path d={path} fill="none" stroke={`url(#chartStroke-${tfKey})`} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
            <path d={path} fill="none" stroke={`url(#coreStroke-${tfKey})`} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
            
            <circle cx={width} cy={endY} r="14" fill={localTheme} opacity="0.25" />
            <circle cx={width} cy={endY} r="7" fill={localTheme} />
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div 
      ref={ref}
      style={{ width: '1200px', height: '675px' }}
      // ✨ FIX: Reduced left/right padding from px-10 to px-6 to utilize edge space
      className="bg-[#050505] text-[#F5F7FA] px-6 pt-10 pb-5 flex flex-col font-sans shrink-0 overflow-hidden relative"
    >
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
      
      {/* GLOWS */}
      <div 
        className="absolute top-1/4 left-1/4 w-[1000px] h-[1000px] pointer-events-none -translate-y-1/2 -translate-x-1/2" 
        style={{ background: `radial-gradient(circle, ${themeColor}20 0%, transparent 60%)` }} 
      />
      <div 
        className="absolute -bottom-20 right-0 w-[900px] h-[700px] pointer-events-none" 
        style={{ background: `radial-gradient(circle, ${themeColor}15 0%, transparent 60%)` }} 
      />

     {/* ✨ UPGRADED WATERMARK TICKER */}
      {/* Changed inset-0 to top-0 left-0 right-0 bottom-[220px] so it avoids the thesis block entirely */}
      <div className="absolute top-0 left-0 right-0 bottom-[220px] flex items-center justify-center pointer-events-none z-0">
        <span 
          className="text-[280px] font-[800] tracking-tighter leading-none select-none"
          // Tinted it with the themeColor so it subtly matches the red/green vibe of the card!
          style={{ color: themeColor, opacity: 0.1 }}
        >
          {ticker}
        </span>
      </div>

      <div className="flex-1 w-full z-10 relative mb-4 min-h-0 flex flex-col justify-center">
        {isSplit ? (
          <div className="grid grid-cols-2 gap-10 w-full h-full items-start">
            <div className="border-r border-[#1B2026] pr-8 relative h-full flex flex-col">
              {renderDataBlock(activeTabs[0])}
            </div>
            <div className="relative h-full flex flex-col pl-4">
              {renderDataBlock(activeTabs[1])}
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center">
             {renderDataBlock(activeTabs[0])}
          </div>
        )}
      </div>

      {/* ✨ FIX: Increased vertical padding (py-10) to make the Thesis tab taller */}
      <div 
        className="z-10 mb-5 w-full bg-black rounded-3xl py-10 px-8 relative overflow-hidden shrink-0 flex items-center gap-8 shadow-2xl"
        style={{ border: `1px solid #1B2026` }}
      >
        <div className="shrink-0 min-w-[340px] border-r border-[#1B2026] pr-8">
          <p className="text-[20px] font-[900] uppercase tracking-widest text-[#8E99AA] mb-3">
            {questionText}
          </p>
          <div className="flex items-center gap-3">
            <span 
              className="text-[32px] font-[800] flex items-center gap-4 tracking-widest"
              style={{ color: themeColor }}
            >
              <div className="relative w-5 h-5 flex items-center justify-center">
                <span className="absolute w-10 h-10 rounded-full opacity-20" style={{ backgroundColor: themeColor }} />
                <span className="relative w-5 h-5 rounded-full" style={{ backgroundColor: themeColor }} />
              </div>
              {resolutionText}
            </span>
          </div>
        </div>

        <div className="flex-1 pl-2">
          <p className="text-[30px] font-[400] text-[#F5F7FA] italic leading-relaxed tracking-wide line-clamp-2">
            "{finalEvidence}"
          </p>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between text-[#8E99AA] text-[15px] font-[700] z-10 border-t border-[#1B2026] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-[#F5F7FA] font-black text-[12px]">
            IQ
          </div>
          <span className="font-bold text-[#F5F7FA] text-[18px] tracking-tight">Investment IQ</span>
        </div>

        <span className="tracking-widest uppercase">
          LAST REVIEWED {date.toUpperCase()}
        </span>
      </div>
    </div>
  );
});

CinematicShareCard.displayName = 'CinematicShareCard';