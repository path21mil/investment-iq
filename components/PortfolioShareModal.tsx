'use client';

import React, { useRef, useState, useEffect } from 'react';
import { toPng } from 'html-to-image';
import { X, Copy, Download, Share2, Check, Loader2 } from 'lucide-react';
import { PortfolioShareCard, DriverItem } from './PortfolioShareCard';

interface PortfolioShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: any; 
}

// Smarter text condenser to keep the social card punchy without losing meaning
function shortenForCard(text: string, maxLen: number = 100): string {
  if (!text) return 'Initial Baseline Established';
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= maxLen) return cleaned;

  // 1. Look for natural transition words (with or without commas)
  const transitionRegex = /(?:,\s*)?(enhancing|signaling|indicating|driving|potentially|which|thereby|leading to|resulting in)\b/i;
  const match = cleaned.match(transitionRegex);

  if (match && match.index && match.index > 35) {
    const prefix = cleaned.substring(0, match.index).trim();
    
    // If the prefix fits our size limit, return it cleanly with a period
    if (prefix.length <= maxLen + 15) { 
      return prefix.replace(/,+$/, '') + '.';
    }
  }

  // 2. Fallback: Trim cleanly at the nearest word boundary
  const sliced = cleaned.slice(0, maxLen - 3);
  const lastSpace = sliced.lastIndexOf(' ');
  return (lastSpace > 40 ? sliced.slice(0, lastSpace) : sliced).trim() + '...';
}

export function PortfolioShareModal({ isOpen, onClose, company }: PortfolioShareModalProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // State to hold live stock price and company logo
  const [livePrice, setLivePrice] = useState('---');
  const [liveChange, setLiveChange] = useState(0);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Fetch live price AND logo from backend proxy when modal opens
  useEffect(() => {
    async function fetchFinnhubData() {
      if (!company?.ticker || !isOpen) return;
      try {
        const res = await fetch(`/api/company-profile?ticker=${company.ticker}`);
        const data = await res.json();
        const profile = Array.isArray(data) ? data[0] : data;

        if (profile && (profile.price !== undefined || profile.c !== undefined)) {
          const currentPrice = profile.price ?? profile.c;
          setLivePrice(Number(currentPrice).toFixed(2));
        }

        if (profile && profile.image) {
          try {
            const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(profile.image)}`;
            const imageResponse = await fetch(proxiedUrl);
            if (!imageResponse.ok) throw new Error("Proxy failed to load image");
            
            const blob = await imageResponse.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              setLogoUrl(reader.result as string);
            };
            reader.readAsDataURL(blob);
          } catch (imgError) {
            console.warn("Logo proxy failed, falling back to text icon.", imgError);
            setLogoUrl(null); 
          }
        }
      } catch (err) {
        console.error("Failed to fetch profile data:", err);
      }
    }
    fetchFinnhubData();
  }, [company?.ticker, isOpen]);

  if (!isOpen || !company) return null;

// 1. Robust parse of curated_updates from the thesis evaluation
  const curated = typeof company.curated_updates === 'string'
    ? (() => { try { return JSON.parse(company.curated_updates); } catch { return null; } })()
    : (company.curated_updates || company.curatedUpdates || null);

  const safeDrivers = typeof company.drivers === 'string' 
    ? (() => { try { return JSON.parse(company.drivers); } catch { return []; } })()
    : (company.drivers || []);

  const safeRisks = typeof company.risks === 'string'
    ? (() => { try { return JSON.parse(company.risks); } catch { return []; } })()
    : company.risks;

  // 2. Map Conviction Status
  const currentStatus = curated?.status || company.status || 'Strengthening';
  const statusMap: Record<string, 'STRENGTHENING' | 'INTACT' | 'WEAKENING'> = {
    'Strengthening': 'STRENGTHENING',
    'Review Needed': 'INTACT', 
    'Weakening': 'WEAKENING',
  };

  // 3. Extract the Synthesized Key Change across all schema possibilities
  // Prioritize the new AI-generated social headline, fallback to older summaries if missing
  const punchyHeadline = 
    curated?.social_card_headline || 
    curated?.key_thesis_change || 
    curated?.impact_summary || 
    company.aiSummary || 
    'Initial Baseline Established';

  // If falling back to an old long summary, just enforce a hard cap to prevent UI breaking
  const finalHeadline = punchyHeadline.length > 115 
    ? punchyHeadline.substring(0, 112).trim() + '...' 
    : punchyHeadline;

  const mappedUpdates = [{
    type: (currentStatus === 'Weakening' ? 'negative' : currentStatus === 'Review Needed' ? 'warning' : 'positive') as 'negative' | 'warning' | 'positive',
    headline: finalHeadline,
    context: 'Recent market development'
  }];

  // 4. Pull Affected Drivers first, then cap at 2
  const affectedDriverList: string[] = (curated?.affected_drivers || curated?.affectedDrivers || []).map((d: any) => 
    typeof d === 'string' ? d : d.title || d.name || ''
  ).filter(Boolean);

  const affectedSet = new Set(affectedDriverList.map(s => s.toLowerCase()));

  let mappedDrivers: DriverItem[] = [];

  // Add the AI-flagged drivers first
  if (affectedDriverList.length > 0) {
    mappedDrivers = affectedDriverList.slice(0, 2).map(title => ({
      name: title,
      status: currentStatus === 'Weakening' ? 'weakening' : currentStatus === 'Review Needed' ? 'monitoring' : 'strengthening'
    }));
  }

  // Backfill with saved thesis drivers if fewer than 2 affected drivers exist
  if (mappedDrivers.length < 2) {
    for (const d of safeDrivers) {
      const title = typeof d === 'string' ? d : d.title || d.name || 'Core Driver';
      if (!affectedSet.has(title.toLowerCase())) {
        mappedDrivers.push({
          name: title,
          status: 'on_track'
        });
      }
      if (mappedDrivers.length >= 2) break;
    }
  }

  // 5. Extract Exactly 1 Primary Risk
  const rawRisk = company.primaryRisk || company.primary_risk || (Array.isArray(safeRisks) ? safeRisks[0] : safeRisks);
  const primaryRisk = typeof rawRisk === 'string' 
    ? rawRisk 
    : rawRisk?.title || rawRisk?.name || rawRisk?.text || "Macroeconomic pressures and sector rotation";

  const tweetText = `Just reviewed my $${company.ticker} investment thesis 👇\n\n` +
    `Conviction Status: ${statusMap[currentStatus] || 'INTACT'}\n\n` +
    `Tracking my portfolio rationale via @InvestmentIQ`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(tweetText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 150));
      const dataUrl = await toPng(cardRef.current, {
        cacheBust: true,
        pixelRatio: 3, 
        quality: 1.0,
        backgroundColor: '#FFFFFF',
        style: { transform: 'scale(1)', transformOrigin: 'top left', margin: '0' }
      });

      const link = document.createElement('a');
      link.download = `${company.ticker}-Portfolio-Review.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="bg-slate-900 rounded-3xl w-full max-w-4xl border border-slate-800 shadow-2xl relative z-10 flex flex-col overflow-hidden animate-[slideIn_0.2s_ease-out]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-500" /> Share Thesis Review
            </h2>
            <p className="text-sm font-medium text-slate-400 mt-1">Export your receipt of conviction for X / LinkedIn.</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scaled Preview Box */}
        <div className="p-6 bg-slate-950 flex items-center justify-center overflow-x-auto">
          <div className="w-[360px] h-[202px] sm:w-[480px] sm:h-[270px] md:w-[720px] md:h-[405px] relative rounded-xl shadow-2xl shrink-0">
            <div className="absolute top-0 left-0 origin-top-left scale-[0.30] sm:scale-[0.40] md:scale-[0.60]">
              <PortfolioShareCard
                ref={cardRef}
                ticker={company.ticker}
                companyName={company.name || company.ticker}
                logoUrl={logoUrl || undefined}
                overallStatus={statusMap[currentStatus] || 'INTACT'}
                updates={mappedUpdates}
                drivers={mappedDrivers}
                keyRisk={primaryRisk}
                price={livePrice}
                dayChange={liveChange}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 bg-slate-900 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={handleCopyText} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-slate-800 text-white hover:bg-slate-700 transition-colors col-span-1">
            {hasCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {hasCopied ? 'Copied!' : 'Copy Text'}
          </button>
          
          <button onClick={handleDownloadImage} disabled={isDownloading} className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 transition-colors disabled:opacity-50 col-span-2">
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            Download Receipt PNG
          </button>
        </div>

      </div>
    </div>
  );
}