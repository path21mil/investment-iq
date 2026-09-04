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

// Smart text condenser to keep the social card punchy without losing meaning
function shortenForCard(text: string, maxLen: number = 105): string {
  if (!text) return 'Initial Baseline Established';
  const cleaned = text.trim().replace(/\s+/g, ' ');
  if (cleaned.length <= maxLen) return cleaned;

  // 1. Try splitting at common financial clause transitions
  const clauseSplits = [', signaling ', ', indicating ', ' signal a ', ' signals a ', ', driven by '];
  for (const splitter of clauseSplits) {
    if (cleaned.toLowerCase().includes(splitter)) {
      const prefix = cleaned.split(new RegExp(splitter, 'i'))[0].trim();
      if (prefix.length >= 35 && prefix.length <= maxLen) {
        return prefix;
      }
    }
  }

  // 2. Fall back to trimming at nearest word boundary
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

  // Fetch live price AND logo from Finnhub when modal opens
  useEffect(() => {
    async function fetchFinnhubData() {
      if (!company?.ticker || !isOpen) return;
      try {
        // 1. Fetch Quote securely via backend route
        const res = await fetch(`/api/company-profile?ticker=${company.ticker}`);
        const data = await res.json();
        const profile = Array.isArray(data) ? data[0] : data;

        if (profile && (profile.price !== undefined || profile.c !== undefined)) {
          const currentPrice = profile.price ?? profile.c;
          setLivePrice(Number(currentPrice).toFixed(2));
        }

        // 2. Fetch Profile (Official Company Logo)
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
        console.error("Failed to fetch Finnhub data:", err);
      }
    }
    fetchFinnhubData();
  }, [company?.ticker, isOpen]);

  if (!isOpen || !company) return null;

  // 1. Parse Curated Updates & Raw Data
  const curated = typeof company.curated_updates === 'string'
    ? JSON.parse(company.curated_updates)
    : (company.curated_updates || company.curatedUpdates || null);

  const safeDrivers = typeof company.drivers === 'string' 
    ? JSON.parse(company.drivers) 
    : (company.drivers || []);

  const safeRisks = typeof company.risks === 'string'
    ? JSON.parse(company.risks)
    : company.risks;

  // 2. Overall Status
  const currentStatus = curated?.status || company.status || 'Strengthening';
  const statusMap: Record<string, 'STRENGTHENING' | 'INTACT' | 'WEAKENING'> = {
    'Strengthening': 'STRENGTHENING',
    'Review Needed': 'INTACT', 
    'Weakening': 'WEAKENING',
  };

  // 3. Key Changes (Pulls from cron synthesis, shortens for card)
  const rawKeyChange = curated?.key_thesis_change || company.aiSummary || company.updates?.[0]?.headline || '';
  const punchyHeadline = shortenForCard(rawKeyChange);

const mappedUpdates = [{
    type: (currentStatus === 'Weakening' ? 'negative' : currentStatus === 'Review Needed' ? 'warning' : 'positive') as 'negative' | 'warning' | 'positive',
    headline: punchyHeadline,
    context: 'Recent market development'
  }];

  // 4. Max 2 Thesis Drivers (Prioritizes cron-affected drivers, fills with saved)
  const affectedDriverTitles = new Set(
    (curated?.affected_drivers || []).map((d: any) => 
      (typeof d === 'string' ? d : d.title || '').toLowerCase()
    )
  );

  const normalizedDrivers: DriverItem[] = safeDrivers.map((d: any) => {
    const title = typeof d === 'string' ? d : d.title || d.name || 'Core Driver';
    const isAffected = affectedDriverTitles.has(title.toLowerCase());
    return {
      name: title,
      status: isAffected 
        ? (currentStatus === 'Weakening' ? 'weakening' : currentStatus === 'Review Needed' ? 'monitoring' : 'strengthening')
        : 'on_track'
    };
  });

  // Sort affected drivers first, then cap at 2 maximum
  const mappedDrivers: DriverItem[] = normalizedDrivers
    .sort((a, b) => (affectedDriverTitles.has(b.name.toLowerCase()) ? 1 : 0) - (affectedDriverTitles.has(a.name.toLowerCase()) ? 1 : 0))
    .slice(0, 2);

  // 5. Exactly 1 Key Risk
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