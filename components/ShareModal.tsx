'use client';

import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { X, Copy, Download, Share2, Check, Loader2 } from 'lucide-react';
import { ThesisShareCard } from './ThesisShareCard';
import { CinematicShareCard } from './CinematicShareCard';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticker: string;
  percentMove: number; // ✨ ADD THIS LINE ✨
  status?: 'strengthening' | 'weakening' | 'neutral';
  evidence?: string;
  username?: string;
}

export function ShareModal({
  isOpen,
  onClose,
  ticker,
  percentMove, // ✨ AND ADD IT HERE ✨
  status = 'strengthening',
  evidence,
  username = 'investor'
}: ShareModalProps) {
  // ... rest of your modal code
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  if (!isOpen) return null;

// Prepare pre-formatted X Copy for the Cinematic Card
  const tweetText = `My $${ticker} thesis update 👇\n\n` +
    `The stock is ${percentMove > 0 ? 'breaking out' : 'down'}.\n` +
    `But did the thesis break?\n\n` +
    `Tracking my conviction with @InvestmentIQ`;

  const handleCopyText = () => {
    navigator.clipboard.writeText(tweetText);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDownloadImage = async () => {
    if (!cardRef.current) return;
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `${ticker}-Thesis-Card.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to export PNG:', err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShareOnX = () => {
    const encodedText = encodeURIComponent(tweetText);
    window.open(`https://x.com/intent/tweet?text=${encodedText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-4xl w-full shadow-2xl relative flex flex-col gap-6">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-500" /> Share Investment Thesis
            </h2>
            <p className="text-xs font-medium text-slate-400 mt-0.5">
              Preview your personal conviction card formatted for X / LinkedIn.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      {/* Scaled Preview Box - Perfect Aspect Ratio Fix */}
        <div className="w-full bg-slate-950 rounded-2xl p-4 sm:p-6 border border-slate-800 flex justify-center items-center overflow-x-auto">
          
          {/* This wrapper is explicitly sized to match the scaled dimensions of the 1200x675 card. 
            0.30 scale = 360x202 
            0.40 scale = 480x270
            0.50 scale = 600x337
          */}
          <div className="w-[360px] h-[202px] sm:w-[480px] sm:h-[270px] md:w-[600px] md:h-[337px] relative rounded-xl shadow-2xl shrink-0">
            
            <div className="absolute top-0 left-0 origin-top-left scale-[0.30] sm:scale-[0.40] md:scale-[0.50]">
              <CinematicShareCard
                ref={cardRef}
                ticker={ticker}
                percentMove={percentMove}
                evidence={evidence}
              />
            </div>
            
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
          >
            {hasCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {hasCopied ? 'Copied to Clipboard!' : 'Copy Text for X'}
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isDownloading}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
          >
            {isDownloading ? <Loader2 className="w-4 h-4 animate-spin text-blue-400" /> : <Download className="w-4 h-4" />}
            Download PNG (1200×675)
          </button>

          <button
            onClick={handleShareOnX}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share on X ↗
          </button>
        </div>

      </div>
    </div>
  );
}