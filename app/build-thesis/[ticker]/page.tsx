'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, Check, Plus, Loader2 } from 'lucide-react';

// --- EXPANDED UNIFORM MOCK DATA (Exactly 6 items each for a perfect 3x2 grid) ---
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
    id: 'd6', title: 'Adjacent TAM Expansion', why: 'New hardware markets present massive revenue opportunities.',
    evidence: ['Partnerships with major auto makers', 'Robotics and edge compute growth', 'PC hardware cycle refreshing'], 
    monitors: ['Automotive revenue', 'Edge compute adoption', 'Client segment growth']
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
  },
  {
    id: 'r5', title: 'Macroeconomic Recession', why: 'Broad economic slowdown forces enterprise budget cuts.',
    evidence: ['GDP growth stalling globally', 'Unemployment creeping upwards', 'Corporate IT budget reductions'], 
    monitors: ['Overall Revenue Growth', 'Guidance revisions', 'Enterprise hardware spend']
  },
  {
    id: 'r6', title: 'Key Person & Execution Risk', why: 'Dependency on current visionary leadership.',
    evidence: ['Founder drives primary product vision', 'Highly centralized decision making', 'Fierce talent competition'], 
    monitors: ['Executive team stability', 'Stock-based compensation trends', 'Product delivery delays']
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

  useEffect(() => {
    async function initializeBuilder() {
      const { data: { session } } = await supabase.auth.getSession();
      
      // 1. Check if logged in
      if (!session) {
        router.push(`/login?redirect=/build-thesis/${ticker}`);
        return;
      }

      // 2. Fetch existing thesis if they are updating
      const { data: existingThesis, error } = await supabase
        .from('theses')
        .select('drivers, risks')
        .eq('ticker', ticker)
        .eq('user_id', session.user.id)
        .maybeSingle();

      // 3. Pre-fill the UI if data exists
      if (existingThesis) {
        if (existingThesis.drivers && existingThesis.drivers.length > 0) {
          setSelectedDrivers(existingThesis.drivers);
        }
        if (existingThesis.risks && existingThesis.risks.length > 0) {
          setSelectedRisks(existingThesis.risks);
        }
      }
    }
    
    initializeBuilder();
  }, [router, ticker]);

  const activeData = step === 1 ? SUGGESTED_DRIVERS : SUGGESTED_RISKS;
  const activeSelection = step === 1 ? selectedDrivers : selectedRisks;
  const activeLimit = step === 1 ? 5 : 3;

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
        console.error("Supabase Error:", error);
        alert(`Database Error: ${error.message || error.details || 'Check console'}`);
        setIsSaving(false);
      }
    }
  };

  return (
    // Note the pb-32 here to prevent content from hiding under the sticky footer!
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative pb-32">
      
      {/* FIXED HEADER */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-extrabold text-xl tracking-tight text-slate-900 flex items-center gap-2">
            Investment IQ
          </Link>
          <button onClick={() => router.back()} className="text-sm font-bold text-slate
          -500 hover:text-slate-900 transition-colors">
            Cancel
          </button>
        </div>
      </nav>

      <main className="flex-grow w-full py-10 md:py-12">
        <div className="max-w-6xl mx-auto px-6">
          
          {/* HEADER SECTION */}
          <div className="mb-12 text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
              Step {step} of 2
            </p>
            <h1 className="text-3xl font-extrabold text-slate-900 mb-3">
              {step === 1 ? `Why are you considering investing in ${ticker}?` : `What could change your mind about ${ticker}?`}
            </h1>
            <p className="text-slate-500 font-medium">
              {step === 1 
                ? `Choose up to 5 drivers. These are suggested by Investment IQ based on ${ticker}'s SEC filings.` 
                : `Choose up to 3 risks. Knowing what breaks your thesis is the key to disciplined investing.`}
            </p>
          </div>

          {/* THE GRID LAYOUT */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {activeData.map((item) => {
              const isSelected = activeSelection.includes(item.title);
              const isMaxedOut = activeSelection.length >= activeLimit && !isSelected;

              return (
                <div 
                  key={item.id}
                  onClick={() => !isMaxedOut && toggleSelection(item.title)}
                  className={`relative p-6 rounded-3xl border-2 transition-all cursor-pointer flex flex-col h-full ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/50 shadow-md ring-4 ring-blue-600/10' 
                      : isMaxedOut 
                        ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed' 
                        : 'border-slate-200 hover:border-blue-300 hover:shadow-sm bg-white'
                  }`}
                >
                  <div className={`absolute top-5 right-5 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300 text-transparent'
                  }`}>
                    <Check className="w-4 h-4" />
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-xl mb-4 pr-10 leading-tight">{item.title}</h3>
                  
                  <div className="flex-grow space-y-5">
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Why this matters</p>
                      <p className="text-sm font-medium text-slate-700 leading-relaxed">{item.why}</p>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Evidence</p>
                      <ul className="text-sm font-medium text-slate-700 space-y-2">
                        {item.evidence.map((ev, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="w-1.5 h-1.5 bg-slate-400 rounded-full shrink-0 mt-2"></span>
                            <span className="leading-tight">{ev}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2">Investment IQ Monitors</p>
                      <ul className="text-xs font-bold text-blue-800 space-y-2 bg-blue-100/50 p-4 rounded-xl border border-blue-200/50">
                        {item.monitors.map((mon, i) => (
                          <li key={i} className="flex items-start gap-2.5">
                            <span className="text-blue-500 shrink-0">⚡</span>
                            <span className="leading-tight">{mon}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className={`mt-6 text-center text-sm font-bold py-3.5 rounded-xl transition-colors ${
                    isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}>
                    {isSelected ? 'Selected' : '+ Add to Thesis'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* CUSTOM INPUT AREA */}
          <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-4xl mx-auto">
            <label className="block text-sm font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Plus className="w-4 h-4 text-slate-400" /> Write My Own {step === 1 ? 'Driver' : 'Risk'}
            </label>
            <p className="text-xs text-slate-500 mb-5 pl-6">Allows experienced investors to create custom tracking parameters.</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input 
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={step === 1 ? "e.g. Sovereign AI demand scaling in Middle East" : "e.g. Hyperscaler capex budgets shrink"}
                className="flex-grow bg-slate-50 border border-slate-200 rounded-xl px-5 py-3.5 text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all"
              />
              <button 
                onClick={handleAddCustom}
                disabled={activeSelection.length >= activeLimit}
                className="bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm whitespace-nowrap"
              >
                Add Custom
              </button>
            </div>
            
            {/* Show Custom Selections */}
            {activeSelection.length > 0 && (
              <div className="mt-8 pt-6 border-t border-slate-100">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-4">Your Selections:</p>
                <div className="flex flex-wrap gap-2.5">
                  {activeSelection.map((sel, i) => (
                    <div key={i} className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 text-sm font-bold px-4 py-2 rounded-full">
                      {sel}
                      <button onClick={() => toggleSelection(sel)} className="text-blue-400 hover:text-blue-600 font-normal ml-1">✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* PREMIUM STICKY FOOTER */}
      <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-md border-t border-slate-200 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 md:py-5 flex flex-col md:flex-row justify-between items-center gap-4">
          
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-start">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm ${
              activeSelection.length > 0 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'
            }`}>
              {activeSelection.length}
            </div>
            <p className="font-bold text-slate-500 text-sm">
              / {activeLimit} {step === 1 ? 'Drivers' : 'Risks'} Selected
            </p>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            {step === 2 && (
              <button 
                onClick={() => setStep(1)} 
                className="w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            )}
            
            <button 
              onClick={() => step === 1 ? setStep(2) : handleSaveToDatabase()}
              disabled={activeSelection.length === 0 || isSaving}
              className="w-full md:w-auto flex-grow md:flex-grow-0 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold px-8 py-3.5 rounded-xl transition-all shadow-md text-sm cursor-pointer flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : step === 1 ? (
                <>Next: Add Risks <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Save & Go to Dashboard <Check className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}