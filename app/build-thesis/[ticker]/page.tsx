'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, Check, Zap, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getCompanyProfile } from '@/lib/fmp';

export default function BuildThesisPage({ params }: { params: Promise<{ ticker: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const ticker = (resolvedParams.ticker || 'MSFT').toUpperCase();

  const [step, setStep] = useState<number>(1); // 1 = Drivers, 2 = Risks, 3 = Summary Review
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Smart Edit State
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [createdDate, setCreatedDate] = useState<string | null>(null);

  // AI Generated Data
  const [suggestedDrivers, setSuggestedDrivers] = useState<any[]>([]);
  const [suggestedRisks, setSuggestedRisks] = useState<any[]>([]);

  // User Selections (STRICT LIMIT OF 5)
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  
  // Step 3 States
  const [summaryDraft, setSummaryDraft] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

  // Custom Inputs
  const [customInput, setCustomInput] = useState('');

  // Entertaining Loading State
  const [loadingText, setLoadingText] = useState(`Mining SEC filings for ${ticker}...`);

  useEffect(() => {
    if (!isLoading) return;
    const messages = [
      `Mining SEC filings for ${ticker}...`,
      "Analyzing recent earnings transcripts...",
      "Extracting core growth drivers...",
      "Evaluating macroeconomic risks...",
      "Finalizing institutional-grade thesis..."
    ];
    let i = 0;
    const interval = setInterval(() => {
      i = (i + 1) % messages.length;
      setLoadingText(messages[i]);
    }, 4000); // Changes text every 4 seconds
    return () => clearInterval(interval);
  }, [isLoading, ticker]);

  // Clean up ugly OAuth hash from the URL bar immediately upon landing
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push(`/login?redirect=/build-thesis/${ticker}`);
        return; 
      }

      setUserId(session.user.id);
      const cleanTicker = ticker.toUpperCase().trim();

      // FETCH USER'S EXISTING THESIS (Now including the summary!)
      const { data: existingThesis, error: dbError } = await supabase
        .from('theses')
        .select('drivers, risks, created_at, summary') 
        .eq('user_id', session.user.id)
        .eq('ticker', cleanTicker)
        .maybeSingle();

      if (existingThesis) {
        setIsEditing(true); 
        
        if (existingThesis.created_at) {
          const dateString = new Date(existingThesis.created_at).toLocaleDateString('en-US', { 
            month: 'long', day: 'numeric', year: 'numeric' 
          });
          setCreatedDate(dateString);
        }

        if (existingThesis.drivers) setSelectedDrivers(existingThesis.drivers);
        if (existingThesis.risks) setSelectedRisks(existingThesis.risks);
        if (existingThesis.summary) setSummaryDraft(existingThesis.summary);
      }

      // Load the company profile header
      let liveProfile: any = await getCompanyProfile(cleanTicker);
      if (Array.isArray(liveProfile) && liveProfile.length > 0) liveProfile = liveProfile[0];
      setProfile(liveProfile);

      // Fetch the AI options
      try {
        const res = await fetch('/api/thesis-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: cleanTicker, companyName: liveProfile?.companyName || cleanTicker })
        });
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const textError = await res.text();
          throw new Error("API Route is misconfigured or missing (Check terminal).");
        }

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI generation failed");
        
        if (data.drivers) setSuggestedDrivers(data.drivers);
        if (data.risks) setSuggestedRisks(data.risks);

      } catch (err: any) {
        console.error("Failed to generate thesis options:", err);
        alert(`Error: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    }
    init();
  }, [ticker, router]); 

  const handleToggle = (id: string, type: 'driver' | 'risk') => {
    if (type === 'driver') {
      if (selectedDrivers.includes(id)) {
        setSelectedDrivers(selectedDrivers.filter(d => d !== id));
      } else if (selectedDrivers.length < 5) {
        setSelectedDrivers([...selectedDrivers, id]);
      }
    } else {
      if (selectedRisks.includes(id)) {
        setSelectedRisks(selectedRisks.filter(r => r !== id));
      } else if (selectedRisks.length < 5) {
        setSelectedRisks([...selectedRisks, id]);
      }
    }
  };

  const handleAddCustom = () => {
    if (!customInput.trim()) return;
    
    if (step === 1 && selectedDrivers.length < 5) {
      const newId = `custom-d-${Date.now()}`;
      setSuggestedDrivers([...suggestedDrivers, {
        id: newId,
        title: customInput,
        whyThisMatters: 'Custom user-defined tracking parameter.',
        evidence: ['User defined custom parameter'],
        monitors: ['Custom AI monitoring required']
      }]);
      setSelectedDrivers([...selectedDrivers, newId]);
      setCustomInput('');
    } else if (step === 2 && selectedRisks.length < 5) {
      const newId = `custom-r-${Date.now()}`;
      setSuggestedRisks([...suggestedRisks, {
        id: newId,
        title: customInput,
        whyThisMatters: 'Custom user-defined risk parameter.',
        evidence: ['User defined custom risk'],
        monitors: ['Custom AI monitoring required']
      }]);
      setSelectedRisks([...selectedRisks, newId]);
      setCustomInput('');
    }
  };

  const handleProceedToReview = async () => {
    setStep(3); // Move to Review Step
    
    // If they already have a summary from the database, don't overwrite it!
    if (isEditing && summaryDraft) return; 

    setIsGeneratingSummary(true);
    try {
      // Get the actual text of the selected drivers/risks to send to OpenAI
      const driverTitles = suggestedDrivers.filter(d => selectedDrivers.includes(d.id)).map(d => d.title);
      const riskTitles = suggestedRisks.filter(r => selectedRisks.includes(r.id)).map(r => r.title);

      const res = await fetch('/api/generate-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticker, companyName: profile?.companyName, driverTitles, riskTitles })
      });
      
      const data = await res.json();
      if (data.summary) setSummaryDraft(data.summary);
    } catch (err) {
      console.error("Failed to generate draft", err);
    } finally {
      setIsGeneratingSummary(false);
    }
  };
  
  const handleSaveAndFinish = async () => {
    setIsSaving(true);
    try {
      if (!userId) {
        alert("You must be logged in to save a thesis!");
        setIsSaving(false);
        return;
      }

      const payload = {
        user_id: userId,
        ticker: ticker.toUpperCase(),
        company_name: profile?.companyName || ticker,
        drivers: selectedDrivers,
        risks: selectedRisks,
        summary: summaryDraft, // ✨ NEW: Saves their edited summary to Supabase!
      };

      const { error } = await supabase
        .from('theses')
        .upsert(payload, { onConflict: 'user_id,ticker' });

      if (error) throw error;
      router.push(`/company/${ticker}`);

    } catch (err: any) {
      console.error("Supabase Save Error:", JSON.stringify(err, null, 2));
      alert(`Failed to save thesis: ${err.message || err.details || JSON.stringify(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

 if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center mb-6">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
        <div className="h-8 overflow-hidden relative">
          <span className="text-slate-500 font-extrabold text-sm tracking-wide animate-pulse">
            {loadingText}
          </span>
        </div>
      </div>
    );
  }

  const currentOptions = step === 1 ? suggestedDrivers : suggestedRisks;
  const currentSelections = step === 1 ? selectedDrivers : selectedRisks;
  const isAtLimit = currentSelections.length >= 5;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 group transition-opacity hover:opacity-80">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-sm">
              IQ
            </div>
            <span className="font-extrabold text-slate-900 tracking-tight text-lg">
              Investment IQ
            </span>
          </Link>

          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 transition-all duration-150 border border-slate-200/60 shadow-sm active:scale-95 cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
        </div>
      </header>

      <main className="flex-grow max-w-5xl mx-auto w-full px-6 pt-12 pb-32">
        {/* PROGRESS HEADER */}
        <div className="text-center mb-12 flex flex-col items-center">
          {isEditing && createdDate && (
            <div className="inline-flex items-center gap-2 bg-blue-50/80 text-blue-700 px-4 py-2 rounded-full text-xs font-medium italic mb-4 border border-blue-100 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              You added {ticker} to your portfolio on {createdDate}.
            </div>
          )}

          <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-3">
            STEP {step} OF 3
          </p>
          
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            {isEditing 
              ? (step === 1 ? `Update your ${ticker} Drivers` : step === 2 ? `Update your ${ticker} Risks` : `Review your ${ticker} Thesis`)
              : (step === 1 ? `Why are you considering investing in ${ticker}?` : step === 2 ? `What are the biggest risks to ${ticker}?` : `Review your AI-Drafted Thesis`)
            }
          </h1>
          
          <p className="text-sm font-medium text-slate-500 max-w-lg mx-auto">
            {step === 3 
              ? "Investment IQ has drafted a summary based on your selections. Feel free to edit this before saving."
              : isEditing 
                ? `Review and modify the ${step === 1 ? 'drivers' : 'risks'} you are tracking below.`
                : `Choose up to 5 ${step === 1 ? 'drivers' : 'risks'}. These are suggested by Investment IQ based on ${ticker}'s SEC filings.`
            }
          </p>
        </div>

        {/* STEP 3: EDITABLE SUMMARY */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
              
              <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" />
                Executive Summary
              </h3>
              
              {isGeneratingSummary ? (
                <div className="h-32 mt-6 bg-slate-50 rounded-xl border border-slate-100 flex flex-col items-center justify-center gap-3 animate-pulse">
                  <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
                  <span className="text-xs font-bold text-slate-400">Drafting your conviction...</span>
                </div>
              ) : (
                <div className="relative mt-6">
                  <textarea
                    value={summaryDraft}
                    onChange={(e) => setSummaryDraft(e.target.value)}
                    maxLength={600}
                    rows={6} // ✨ Increased rows so it doesn't scroll!
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors resize-none leading-relaxed shadow-inner"
                  />
                  <div className={`absolute bottom-3 right-4 text-[10px] font-bold ${summaryDraft.length >= 580 ? 'text-rose-500' : 'text-slate-400'}`}>
                    {summaryDraft.length} / 600
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 1 & 2: OPTIONS GRID */}
        {step !== 3 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {currentOptions.map((item) => {
                const isSelected = currentSelections.includes(item.id);
                return (
                  <div 
                    key={item.id}
                    onClick={() => handleToggle(item.id, step === 1 ? 'driver' : 'risk')}
                    className={`bg-white rounded-3xl p-6 border transition-all cursor-pointer flex flex-col h-full ${
                      isSelected 
                        ? (step === 1 ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-amber-500 shadow-md ring-1 ring-amber-500') 
                        : 'border-slate-200 hover:border-slate-300 shadow-sm opacity-90 hover:opacity-100'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-lg font-extrabold text-slate-900 leading-snug pr-4">{item.title}</h3>
                      <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                          ? (step === 1 ? 'bg-blue-600 border-blue-600' : 'bg-amber-500 border-amber-500')
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                      </div>
                    </div>

                    <div className="mb-4">
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-1.5">Why This Matters</p>
                      <p className="text-xs font-medium text-slate-700 leading-relaxed">{item.whyThisMatters}</p>
                    </div>

                    <div className="mb-6">
                      <p className="text-[9px] font-extrabold text-slate-400 uppercase tracking-widest mb-2">Evidence</p>
                      <ul className="space-y-1.5">
                        {item.evidence.map((ev: string, idx: number) => (
                          <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-600 leading-snug">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0"></span> {ev}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="mt-auto mb-4 bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
                      <p className="text-[8px] font-extrabold text-blue-600 uppercase tracking-widest mb-2.5">Investment IQ Monitors</p>
                      <ul className="space-y-2">
                        {item.monitors.map((mon: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2 text-[10px] font-bold text-blue-950">
                            <Zap className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" /> {mon}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <button className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition-colors ${
                      isSelected 
                        ? 'bg-slate-100 text-slate-500' 
                        : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}>
                      {isSelected ? 'Added to Thesis' : '+ Add to Thesis'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* CUSTOM INPUT BOX */}
            <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2 mb-1">
                  <Plus className="w-4 h-4 text-slate-400" /> Write My Own {step === 1 ? 'Driver' : 'Risk'}
                </h4>
                <p className="text-[10px] font-medium text-slate-500 mb-3">Allows experienced investors to create custom tracking parameters.</p>
                <input 
                  type="text"
                  placeholder={step === 1 ? "e.g. Sovereign AI demand scaling in Middle East" : "e.g. Regulatory actions block major acquisition"}
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  disabled={isAtLimit}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors disabled:opacity-50"
                />
              </div>
              <button 
                onClick={handleAddCustom}
                disabled={!customInput.trim() || isAtLimit}
                className="w-full md:w-auto self-end bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-colors cursor-pointer"
              >
                Add Custom
              </button>
            </div>
          </>
        )}
      </main>

      {/* STICKY BOTTOM ACTION BAR (3-STEP LOGIC) */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-100 border-t border-slate-200 py-4 px-6 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-xs font-extrabold text-slate-900">
              {step === 3 ? <Check className="w-4 h-4 text-emerald-600" strokeWidth={4} /> : currentSelections.length}
            </div>
            <span className="text-xs font-bold text-slate-600">
              {step === 3 ? 'Final Review' : `/ 5 ${step === 1 ? 'Drivers' : 'Risks'} Selected`}
            </span>
          </div>

          <div className="flex gap-3">
            {step === 2 && (
              <>
                <button onClick={() => setStep(1)} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-extrabold px-5 py-2.5 rounded-xl transition-colors cursor-pointer">Back</button>
                <button onClick={handleProceedToReview} disabled={selectedRisks.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-extrabold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer">Review Thesis <ArrowRight className="w-4 h-4" /></button>
              </>
            )}
            
            {step === 3 && (
              <>
                <button onClick={() => setStep(2)} className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-extrabold px-5 py-2.5 rounded-xl transition-colors cursor-pointer">Back</button>
                <button onClick={handleSaveAndFinish} disabled={isSaving || !summaryDraft.trim()} className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-extrabold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer">
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? 'Update Thesis' : 'Save & Track Conviction')}
                </button>
              </>
            )}

            {step === 1 && (
              <button onClick={() => setStep(2)} disabled={selectedDrivers.length === 0} className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-50 text-white text-sm font-extrabold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer">Next: Add Risks <ArrowRight className="w-4 h-4" /></button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}