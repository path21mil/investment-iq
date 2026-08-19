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
        const apiKey = process.env.FINNHUB_API_KEY;

        // 1. Fetch Quote (Price & Day Change)
        const priceRes = await fetch(`https://finnhub.io/api/v1/quote?symbol=${company.ticker}&token=${apiKey}`);
        const priceData = await priceRes.json();
        if (priceData && priceData.c !== undefined) {
          setLivePrice(priceData.c.toFixed(2));
          setLiveChange(parseFloat(priceData.dp.toFixed(2)));
        }

      // 2. Fetch Profile (Official Company Logo)
        const profileRes = await fetch(`https://finnhub.io/api/v1/stock/profile2?symbol=${company.ticker}&token=${apiKey}`);
        const profileData = await profileRes.json();
        
        if (profileData && profileData.logo) {
          try {
            // ✨ THE FIX: Route the Finnhub URL through our new server proxy!
            const proxiedUrl = `/api/image-proxy?url=${encodeURIComponent(profileData.logo)}`;
            
            // Fetch the proxied image and convert it to safe Base64
            const imageResponse = await fetch(proxiedUrl);
            if (!imageResponse.ok) throw new Error("Proxy failed to load image");
            
            const blob = await imageResponse.blob();
            const reader = new FileReader();
            reader.onloadend = () => {
              setLogoUrl(reader.result as string); // 100% safe for canvas export
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

  // 1. Map Overall Conviction Status
  const statusMap: Record<string, 'STRENGTHENING' | 'INTACT' | 'WEAKENING'> = {
    'Strengthening': 'STRENGTHENING',
    'Review Needed': 'INTACT', 
    'Weakening': 'WEAKENING',
  };

  // Safe parsing helper for updates
  const safeUpdates = typeof company.updates === 'string' 
    ? JSON.parse(company.updates) 
    : (company.updates || []);

  const safeRisks = typeof company.risks === 'string'
    ? JSON.parse(company.risks)
    : company.risks;

  // ----------------------------------------------------------------
  // 1. THE $10M ZERO-STATE FOR "WHAT CHANGED"
  // ----------------------------------------------------------------
  const mappedUpdates = safeUpdates.length > 0 
    ? safeUpdates.slice(0, 3).map((u: any) => ({
        type: u.trend === 'up' || u.type === 'positive' ? 'positive' : u.trend === 'down' || u.type === 'negative' ? 'negative' : 'warning',
        headline: u.text || u.headline || 'Tracking core drivers',
        context: 'Recent market development'
      }))
    : [{
        type: 'positive',
        headline: 'Initial Baseline Established',
        context: 'Tracking initiated. Awaiting first market catalyst.'
      }];

  // 3. Robust Driver Normalization (Fixes "d0", "d1", "d2" key extraction)
  const normalizeDrivers = (raw: any): DriverItem[] => {
    if (!raw) return [];
    
    let parsed = raw;
    if (typeof parsed === 'string') {
      try { parsed = JSON.parse(parsed); } catch (e) { return []; }
    }

    let items: any[] = [];

    if (Array.isArray(parsed)) {
      items = parsed;
    } else if (typeof parsed === 'object') {
      items = Object.entries(parsed).map(([key, val]) => {
        if (val && typeof val === 'object') {
          return val;
        }
        if (typeof val === 'string') {
          return { title: val, status: 'on_track' };
        }
        return { title: key, status: 'on_track' };
      });
    }

    return items.slice(0, 3).map((item: any) => {
      let name = '';
      if (typeof item === 'string') {
        name = item;
      } else if (item && typeof item === 'object') {
        name = item.title || item.name || item.headline || item.text || item.driver || item.label || '';
        
        if (/^d\d+$/i.test(name)) {
          const innerVal = Object.values(item).find(
            v => typeof v === 'string' && !/^d\d+$/i.test(v) && !['strengthening', 'on_track', 'monitoring', 'weakening'].includes(v.toLowerCase())
          );
          if (innerVal) name = innerVal as string;
        }
      }

      const rawStatus = (item?.status || item?.trend || '').toString().toLowerCase();
      let status: DriverItem['status'] = 'on_track';
      if (rawStatus === 'strengthening' || rawStatus === 'positive' || rawStatus === 'up') status = 'strengthening';
      else if (rawStatus === 'weakening' || rawStatus === 'negative' || rawStatus === 'down') status = 'weakening';
      else if (rawStatus === 'monitoring' || rawStatus === 'warning' || rawStatus === 'review needed') status = 'monitoring';

      return {
        name: name || 'Core Thesis Driver',
        status
      };
    });
  };

  // ----------------------------------------------------------------
  // 2. THE GLITCH-PROOF DRIVER FALLBACK (Fixing d0, d1, d2)
  // ----------------------------------------------------------------
  const mappedDrivers: DriverItem[] = normalizeDrivers(company.drivers).map((driver, index) => {
    let safeName = driver.name;
    
    if (/^d\d+$/i.test(safeName) || !safeName) {
      safeName = `Core Driver ${index + 1}`;
    }

    return {
      name: safeName,
      status: driver.status
    };
  });

  // 4. Primary Risk Extraction
  const rawRisk = company.primaryRisk || (Array.isArray(safeRisks) ? safeRisks[0] : safeRisks);
  
  const primaryRisk = typeof rawRisk === 'string' 
    ? rawRisk 
    : rawRisk?.title || rawRisk?.name || rawRisk?.text || "Macroeconomic pressures and sector rotation";

  const tweetText = `Just reviewed my $${company.ticker} investment thesis 👇\n\n` +
    `Conviction Status: ${statusMap[company.status] || 'INTACT'}\n\n` +
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
        backgroundColor: '#07090D',
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
                logoUrl={logoUrl || undefined} // 👈 Pass official logo URL
                overallStatus={statusMap[company.status] || 'INTACT'}
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