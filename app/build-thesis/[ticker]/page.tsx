'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// --- EXPANDED UNIFORM MOCK DATA (3 Items Each) ---
const SUGGESTED_DRIVERS = [
  {
    id: 'd1', title: 'AI Infrastructure Demand', why: 'Demand for AI compute continues accelerating.',
    evidence: ['Data Center revenue up +58%', 'Management raised full-year guidance', 'Hyperscaler capex budgets expanding'], 
    monitors: ['Data Center Revenue Growth', 'Cloud CapEx Spending', 'Market Share vs Competitors']
  },
  {
    id: 'd2', title: 'Software Ecosystem Lock-in', why: 'Developers are locked into the proprietary ecosystem.',
    evidence: ['Enterprise adoption accelerating', 'Developer base expanding globally', 'High switching costs established'], 
    monitors: ['Ecosystem adoption rates', 'Software segment revenue', 'Customer retention rates']
  },
  {
    id: 'd3', title: 'High Profitability & Margins', why: 'Strong margins create massive free cash flow for R&D.',
    evidence: ['Gross Margins exceeding 70%', 'Free Cash Flow growing double-digits', 'Operating leverage scaling rapidly'], 
    monitors: ['Quarterly Gross Margin', 'Operating Margin', 'Free Cash Flow Yield']
  },
  {
    id: 'd4', title: 'Sovereign AI Initiatives', why: 'Governments are building localized AI infrastructure.',
    evidence: ['Middle East & Asia contracts secured', 'Public sector revenue ramping up', 'Government data sovereignty mandates'], 
    monitors: ['Geographic revenue breakdown', 'Public sector deal volume', 'Policy announcements']
  },
  {
    id: 'd5', title: 'Networking & Interconnects', why: 'Data center bottlenecks drive high-margin networking sales.',
    evidence: ['InfiniBand demand surging', 'Switch revenue doubling YoY', 'Next-gen interconnects launching'], 
    monitors: ['Networking segment revenue', 'Hardware attach rates', 'New product cycles']
  },
  {
    id: 'd6', title: 'Autonomous Driving Pivot', why: 'Automotive segment presents a massive adjacent TAM.',
    evidence: ['Partnerships with major EV makers', 'Self-driving pipeline growth', 'Edge compute adoption expanding'], 
    monitors: ['Automotive revenue', 'OEM Partnership announcements', 'Edge compute adoption']
  }
];

const SUGGESTED_RISKS = [
  {
    id: 'r1', title: 'Custom Cloud Silicon', why: 'Hyperscalers are building their own competing chips.',
    evidence: ['Google TPU scaling internally', 'AWS Trainium adoption rising', 'In-house ASIC investments growing'], 
    monitors: ['Top 5 customer concentration', 'Cloud provider capex mix', 'R&D intensity ratios']
  },
  {
    id: 'r2', title: 'Geopolitical Export Controls', why: 'Trade restrictions limit total addressable market.',
    evidence: ['New entity list additions', 'Revenue drops in restricted regions', 'Supply chain shifting costs'], 
    monitors: ['China/Asia Revenue impact', 'Regulatory Filings', 'Export license approvals']
  },
  {
    id: 'r3', title: 'Valuation Multiple Compression', why: 'Priced for perfection; any growth slowdown crushes the stock.',
    evidence: ['Forward P/E at historic highs', 'High retail investor participation', 'Perfect pricing assumptions built-in'], 
    monitors: ['Forward P/E ratio trends', 'Revenue growth deceleration', 'Macro interest rates']
  },
  {
    id: 'r4', title: 'AI Monetization Plateau', why: 'End-users fail to generate ROI on AI, slowing down orders.',
    evidence: ['Enterprise AI budgets tightening', 'Slower software rollout phases', 'ROI timelines extending'], 
    monitors: ['Hyperscaler cloud growth', 'Enterprise IT spending surveys', 'App deployment rates']
  }
];

export default function ThesisBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const ticker = (params.ticker as string || 'MSFT').toUpperCase();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reference for the scrolling carousel
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/login?redirect=/build-thesis/${ticker}`);
      }
    }
    checkAuth();
  }, [router, ticker]);

  const activeData = step === 1 ? SUGGESTED_DRIVERS : SUGGESTED_RISKS;
  const activeSelection = step === 1 ? selectedDrivers : selectedRisks;
  const activeLimit = step === 1 ? 5 : 3; // Updated limits: 5 drivers, 3 risks

  // Smooth scroll function for the arrow buttons
  const scroll = (offset: number) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  const toggleSelection = (title: string) => {
    if (step === 1) {
      if (selectedDrivers.includes(title)) {
        setSelectedDrivers(selectedDrivers.filter(d => d !== title));
      } else if (selectedDrivers.length < activeLimit) {
        setSelectedDrivers([...selectedDrivers, title]);
      }
    } else {
      if (selectedRisks.includes(title)) {
        setSelectedRisks(selectedRisks.filter(r => r !== title));
      } else if (selectedRisks.length < activeLimit) {
        setSelectedRisks([...selectedRisks, title]);
      }
    }
  };

  const handleAddCustom = () => {
    if (!customInput.trim()) return;
    if (activeSelection.length < activeLimit) {
      if (step === 1) {
        setSelectedDrivers([...selectedDrivers, customInput.trim()]);
      } else {
        setSelectedRisks([...selectedRisks, customInput.trim()]);
      }
      setCustomInput('');
    }
  };

  const handleSaveToDatabase = async () => {
    setIsSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const { error } = await supabase
        .from('theses')
        .upsert({
          user_id: session.user.id,
          ticker: ticker,
          company_name: `${ticker} Corp`,
          drivers: selectedDrivers,
          risks: selectedRisks,
          thesis_state: 'Strengthening'
        }, { onConflict: 'user_id,ticker' });

      if (!error) {
        router.push('/dashboard');
      } else {
        alert('Error saving thesis.');
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* FIXED HEADER: Constrained to max-w-5xl */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-2">
            Investment IQ
          </Link>
          <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-gray-900">
            Cancel
          </button>
        </div>
      </nav>

      <main className="flex-grow w-full py-10 md:py-12">
        
        <div className="max-w-5xl mx-auto px-6">
          <div className="mb-10 text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              Step {step} of 2
            </p>
            <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
              {step === 1 ? `Why are you considering investing in ${ticker}?` : `What could change your mind about ${ticker}?`}
            </h1>
            <p className="text-gray-500 font-medium">
              {step === 1 
                ? `Choose up to 5 drivers. These are suggested by Investment IQ based on ${ticker}'s SEC filings.` 
                : `Choose up to 3 risks. Knowing what breaks your thesis is the key to disciplined investing.`}
            </p>
          </div>
        </div>

        {/* HORIZONTAL SLIDER WITH ARROW CONTROLS */}
        <div className="relative w-full group">
          
          {/* Hide default scrollbar but keep functionality */}
          <style dangerouslySetInnerHTML={{__html: `
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}} />

          {/* Left Arrow Button (Appears on hover) */}
          <button 
            onClick={() => scroll(-360)} 
            className="hidden md:flex absolute left-4 md:left-[calc(50vw-512px-24px)] top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-full w-12 h-12 items-center justify-center text-gray-700 hover:text-blue-600 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 border border-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* The Scrollable Carousel */}
          <div ref={scrollRef} className="flex overflow-x-auto pb-8 pt-2 snap-x snap-mandatory hide-scrollbar gap-6 px-6 md:pl-[calc(50vw-512px+24px)] md:pr-[calc(50vw-512px+24px)]">
            {activeData.map((item) => {
              const isSelected = activeSelection.includes(item.title);
              const isMaxedOut = activeSelection.length >= activeLimit && !isSelected;

              return (
                <div 
                  key={item.id}
                  onClick={() => !isMaxedOut && toggleSelection(item.title)}
                  className={`relative shrink-0 w-[320px] md:w-[360px] snap-start p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col h-[440px] ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/50 shadow-md' 
                      : isMaxedOut 
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                  }`}
                >
                  <div className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                  }`}>
                    {isSelected && <span className="text-sm font-bold">✓</span>}
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-xl mb-4 pr-10 leading-tight">{item.title}</h3>
                  
                  <div className="flex-grow space-y-4 overflow-y-auto hide-scrollbar">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Why this matters</p>
                      <p className="text-sm font-medium text-gray-700">{item.why}</p>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Evidence</p>
                      <ul className="text-sm font-medium text-gray-700 space-y-1.5">
                        {item.evidence.map((ev, i) => <li key={i} className="flex items-start gap-2"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full shrink-0 mt-1.5"></span><span className="leading-tight">{ev}</span></li>)}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Investment IQ Monitors</p>
                      <ul className="text-xs font-bold text-blue-800 space-y-1.5 bg-blue-100/50 p-3 rounded-xl border border-blue-200/50">
                        {item.monitors.map((mon, i) => <li key={i} className="flex items-start gap-2"><span className="text-blue-500 shrink-0">⚡</span><span className="leading-tight">{mon}</span></li>)}
                      </ul>
                    </div>
                  </div>

                  <div className={`mt-5 text-center text-sm font-bold py-3 rounded-xl transition-colors ${
                    isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                    {isSelected ? 'Selected' : '+ Add to Thesis'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Arrow Button (Appears on hover) */}
          <button 
            onClick={() => scroll(360)} 
            className="hidden md:flex absolute right-4 md:right-[calc(50vw-512px-24px)] top-1/2 -translate-y-1/2 z-10 bg-white/90 backdrop-blur shadow-[0_4px_20px_rgba(0,0,0,0.15)] rounded-full w-12 h-12 items-center justify-center text-gray-700 hover:text-blue-600 hover:scale-105 transition-all opacity-0 group-hover:opacity-100 border border-gray-100"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        </div>

        {/* CUSTOM INPUT AREA */}
        <div className="max-w-5xl mx-auto px-6 mt-4">
          <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
            <label className="block text-sm font-bold text-gray-900 mb-1">
              + Write My Own {step === 1 ? 'Driver' : 'Risk'}
            </label>
            <p className="text-xs text-gray-500 mb-4">Allows experienced investors to create custom tracking parameters.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={step === 1 ? "e.g. Sovereign AI demand scaling in Middle East" : "e.g. Hyperscaler capex budgets shrink"}
                className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={handleAddCustom}
                disabled={activeSelection.length >= activeLimit}
                className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm"
              >
                Add Custom
              </button>
            </div>
            
            {/* Show Custom Selections */}
            {activeSelection.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">Your Selections:</p>
                <div className="flex flex-wrap gap-2">
                  {activeSelection.map((sel, i) => (
                    <div key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold px-3 py-1.5 rounded-full">
                      {sel}
                      <button onClick={() => toggleSelection(sel)} className="text-blue-400 hover:text-blue-600">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* STICKY FOOTER */}
      <div className="bg-white border-t border-gray-200 p-6 sticky bottom-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="text-sm font-bold text-gray-500">
            {step === 1 ? `${selectedDrivers.length}/${activeLimit} Drivers Selected` : `${selectedRisks.length}/${activeLimit} Risks Selected`}
          </div>
          
          <div className="flex gap-4">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="px-6 py-3 font-bold text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">
                Back to Drivers
              </button>
            )}
            
            <button 
              onClick={() => step === 1 ? setStep(2) : handleSaveToDatabase()}
              disabled={step === 1 ? selectedDrivers.length === 0 : selectedRisks.length === 0 || isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-md text-sm cursor-pointer flex items-center gap-2"
            >
              {isSaving ? 'Saving...' : step === 1 ? 'Next: Add Risks →' : 'Save & Go to Dashboard ✓'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}