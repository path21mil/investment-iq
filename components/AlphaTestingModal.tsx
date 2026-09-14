'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function AlphaTestingModal() {
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const hasSeenNotice = localStorage.getItem('alpha_notice_seen');
    if (!hasSeenNotice) {
      setShowModal(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('alpha_notice_seen', 'true');
    setShowModal(false);
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-200 animate-in zoom-in-95 duration-300">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-2xl font-extrabold text-[#0F172A] mb-3">
          Welcome to Investment IQ Alpha
        </h3>
        <p className="text-[14px] text-slate-600 font-medium leading-relaxed mb-4">
          You’re exploring an early version of Investment IQ. Some financial data may be incomplete, delayed, or inaccurate during Alpha. The thesis-building and tracking experience is what we’re currently testing.
        </p>
        <p className="text-[14px] text-slate-600 font-medium leading-relaxed mb-8">
          Try it out, build a thesis, and tell us what you think.
        </p>
        <button
          onClick={handleDismiss}
          className="w-full px-6 py-3.5 bg-[#0F172A] hover:bg-slate-800 text-white font-extrabold rounded-xl transition-all shadow-sm cursor-pointer"
        >
          Got it — Let me Explore
        </button>
      </div>
    </div>
  );
}