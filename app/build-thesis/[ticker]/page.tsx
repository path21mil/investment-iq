'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// --- MOCK DATA BASED ON FILINGS ---
const SUGGESTED_DRIVERS = [
  {
    id: 'd1',
    title: 'AI Infrastructure Demand',
    why: 'Demand for AI compute continues accelerating.',
    evidence: ['Data Center revenue +58%', 'Management raised guidance'],
    monitors: ['Data Center Revenue', 'Cloud CapEx', 'AI Commentary']
  },
  {
    id: 'd2',
    title: 'Software Ecosystem',
    why: 'CUDA strengthens the competitive advantage.',
    evidence: ['Enterprise adoption', 'Developer growth'],
    monitors: ['CUDA adoption', 'Enterprise customers', 'Software revenue']
  },
  {
    id: 'd3',
    title: 'High Profitability',
    why: 'Strong margins create more cash for reinvestment.',
    evidence: ['Gross Margin 75%', 'Free Cash Flow growth'],
    monitors: ['Gross Margin', 'Operating Margin', 'Free Cash Flow']
  }
];

const SUGGESTED_RISKS = [
  {
    id: 'r1',
    title: 'Competition Increases',
    why: 'Competition could pressure pricing power.',
    evidence: ['AMD MI300 ramping', 'Custom cloud AI chips'],
    monitors: ['Market Share', 'Gross Margin', 'Pricing Commentary']
  },
  {
    id: 'r2',
    title: 'Geopolitical Export Controls',
    why: 'Restrictions limit total addressable market.',
    evidence: ['New entity list additions', 'Revenue drop in specific regions'],
    monitors: ['China Data Center Revenue', 'Regulatory Filings']
  }
];

export default function ThesisBuilderPage() {
  const router = useRouter();
  const params = useParams();
  const ticker = (params.ticker as string || 'NVDA').toUpperCase();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Auth Check
  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push(`/login?redirect=/build-thesis/${ticker}`);
      }
    }
    checkAuth();
  }, [router, ticker]);

  const toggleDriver = (title: string) => {
    if (selectedDrivers.includes(title)) {
      setSelectedDrivers(selectedDrivers.filter(d => d !== title));
    } else if (selectedDrivers.length < 3) {
      setSelectedDrivers([...selectedDrivers, title]);
    }
  };

  const toggleRisk = (title: string) => {
    if (selectedRisks.includes(title)) {
      setSelectedRisks(selectedRisks.filter(r => r !== title));
    } else if (selectedRisks.length < 2) {
      setSelectedRisks([...selectedRisks, title]);
    }
  };

  const handleAddCustom = () => {
    if (!customInput.trim()) return;
    if (step === 1 && selectedDrivers.length < 3) {
      setSelectedDrivers([...selectedDrivers, customInput.trim()]);
      setCustomInput('');
    } else if (step === 2 && selectedRisks.length < 2) {
      setSelectedRisks([...selectedRisks, customInput.trim()]);
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
          risks: selectedRisks, // Make sure 'risks' column exists in your Supabase table!
          thesis_state: 'Strengthening'
        }, { onConflict: 'user_id,ticker' });

      if (!error) {
        router.push('/dashboard'); // Finally, send them to the dashboard!
      } else {
        alert('Error saving thesis.');
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      
      {/* Minimal Navbar to keep user focused */}
      <nav className="bg-white border-b border-gray-200 py-4 px-6 flex justify-between items-center">
        <Link href="/" className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-2">
          Investment IQ
        </Link>
        <button onClick={() => router.back()} className="text-sm font-bold text-gray-500 hover:text-gray-900">
          Cancel
        </button>
      </nav>

      <main className="flex-grow max-w-4xl mx-auto w-full px-6 py-12">
        
        {/* Progress Header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
            Step {step} of 2
          </p>
          <h1 className="text-3xl font-extrabold text-gray-900 mb-3">
            {step === 1 ? `Why are you considering investing in ${ticker}?` : `What could change your mind about ${ticker}?`}
          </h1>
          <p className="text-gray-500 font-medium">
            {step === 1 
              ? `Choose up to 3 drivers. These are suggested by Investment IQ based on ${ticker}'s SEC filings.` 
              : `Choose up to 2 risks. Knowing what breaks your thesis is the key to disciplined investing.`}
          </p>
        </div>

        {/* Dynamic Content Based on Step */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-3 mb-6">
            Potential {step === 1 ? 'Investment Drivers' : 'Risks'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {(step === 1 ? SUGGESTED_DRIVERS : SUGGESTED_RISKS).map((item) => {
              const isSelected = step === 1 ? selectedDrivers.includes(item.title) : selectedRisks.includes(item.title);
              const isMaxedOut = step === 1 ? selectedDrivers.length >= 3 && !isSelected : selectedRisks.length >= 2 && !isSelected;

              return (
                <div 
                  key={item.id}
                  onClick={() => !isMaxedOut && (step === 1 ? toggleDriver(item.title) : toggleRisk(item.title))}
                  className={`relative p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col h-full ${
                    isSelected 
                      ? 'border-blue-600 bg-blue-50/50 shadow-md' 
                      : isMaxedOut 
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed' 
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-sm bg-white'
                  }`}
                >
                  {/* Select Checkbox Indicator */}
                  <div className={`absolute top-4 right-4 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                    isSelected ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300'
                  }`}>
                    {isSelected && <span className="text-sm font-bold">✓</span>}
                  </div>

                  <h3 className="font-extrabold text-gray-900 text-lg mb-4 pr-8 leading-tight">{item.title}</h3>
                  
                  <div className="flex-grow space-y-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Why this matters</p>
                      <p className="text-xs font-medium text-gray-700">{item.why}</p>
                    </div>
                    
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Evidence</p>
                      <ul className="text-xs font-medium text-gray-700 space-y-0.5">
                        {item.evidence.map((ev, i) => <li key={i} className="flex items-center gap-1.5"><span className="w-1 h-1 bg-gray-400 rounded-full"></span>{ev}</li>)}
                      </ul>
                    </div>

                    <div>
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Investment IQ Monitors</p>
                      <ul className="text-[11px] font-bold text-blue-800 space-y-0.5 bg-blue-100/50 p-2 rounded-lg">
                        {item.monitors.map((mon, i) => <li key={i} className="flex items-center gap-1.5"><span className="text-blue-400">⚡</span>{mon}</li>)}
                      </ul>
                    </div>
                  </div>

                  <div className={`mt-5 text-center text-xs font-bold py-2 rounded-xl transition-colors ${
                    isSelected ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {isSelected ? 'Selected' : '+ Add'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Custom Input Area */}
          <div className="pt-6 border-t border-gray-100">
            <label className="block text-sm font-bold text-gray-900 mb-2">
              + Write My Own {step === 1 ? 'Driver' : 'Risk'}
            </label>
            <p className="text-xs text-gray-500 mb-3">Allows experienced investors to create custom tracking parameters.</p>
            <div className="flex gap-3">
              <input 
                type="text"
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                placeholder={step === 1 ? "e.g. Sovereign AI demand scaling in Middle East" : "e.g. Hyperscaler capex budgets shrink"}
                className="flex-grow bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button 
                onClick={handleAddCustom}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-6 py-3 rounded-xl transition-colors text-sm"
              >
                Add
              </button>
            </div>
          </div>
        </div>

      </main>

      {/* Sticky Bottom Action Bar */}
      <div className="bg-white border-t border-gray-200 p-6 sticky bottom-0">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="text-sm font-bold text-gray-500">
            {step === 1 ? `${selectedDrivers.length}/3 Drivers Selected` : `${selectedRisks.length}/2 Risks Selected`}
          </div>
          
          <div className="flex gap-4">
            {step === 2 && (
              <button onClick={() => setStep(1)} className="px-6 py-3 font-bold text-gray-600 hover:text-gray-900 transition-colors">
                Back
              </button>
            )}
            
            <button 
              onClick={() => step === 1 ? setStep(2) : handleSaveToDatabase()}
              disabled={step === 1 ? selectedDrivers.length === 0 : selectedRisks.length === 0 || isSaving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-extrabold px-8 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer flex items-center gap-2"
            >
              {isSaving ? 'Saving...' : step === 1 ? 'Next: Risks →' : 'Save & Go to Dashboard ✓'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}