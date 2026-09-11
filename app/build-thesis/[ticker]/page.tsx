'use client';

import { useState, useEffect, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, Check, Zap, Plus, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Logo from '@/components/Logo';

export default function BuildThesisPage({ params }: { params: Promise<{ ticker: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const resolvedParams = use(params);
  const ticker = (resolvedParams.ticker || 'MSFT').toUpperCase();

  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showCollisionModal, setShowCollisionModal] = useState(false);
  const [step, setStep] = useState<number>(1); 
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [profile, setProfile] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [createdDate, setCreatedDate] = useState<string | null>(null);

  const [suggestedDrivers, setSuggestedDrivers] = useState<any[]>([]);
  const [suggestedRisks, setSuggestedRisks] = useState<any[]>([]);

  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);

  const [summaryDraft, setSummaryDraft] = useState<string>('');
  const [isGeneratingSummary, setIsGeneratingSummary] = useState<boolean>(false);

  const [customInput, setCustomInput] = useState('');
  
  const [apiError, setApiError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  

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
        sessionStorage.setItem('postAuthRedirect', `/build-thesis/${ticker}`);
        router.push('/?auth=login');
        return; 
      }
      
      setUserId(session.user.id);
      const cleanTicker = ticker.toUpperCase().trim();

      const { data: existingThesis } = await supabase
        .from('theses')
        .select('drivers, risks, created_at, summary')
        .eq('user_id', session.user.id)
        .eq('ticker', cleanTicker)
        .maybeSingle();

      if (!existingThesis) {
        const { count } = await supabase
          .from('theses')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', session.user.id);

        if (count && count >= 5) {
          setShowLimitModal(true);
          setIsLoading(false);
          return;
        }
      }

      try {
        const profileRes = await fetch(`/api/company-profile?ticker=${cleanTicker}`);
        let liveProfile: any = await profileRes.json();
        if (Array.isArray(liveProfile) && liveProfile.length > 0) liveProfile = liveProfile[0];
        setProfile(liveProfile);
      } catch (e) {
        console.warn('Profile fetch failed, continuing with fallback');
      }

      const cachedHandoff = sessionStorage.getItem(`thesis_handoff_${cleanTicker}`);

      // ✨ DELAYED COLLISION CHECK (Simulates AI processing for 5 seconds)
      if (existingThesis) {
        if (existingThesis.created_at) {
          setCreatedDate(new Date(existingThesis.created_at).toLocaleDateString('en-US', {
            month: 'long', day: 'numeric', year: 'numeric'
          }));
        }
        if (existingThesis.summary) setSummaryDraft(existingThesis.summary);

        // Let the loading screen play for 5 seconds before showing the modal
        setTimeout(() => {
          setShowCollisionModal(true);
          setIsLoading(false);
        }, 5000);
        
        return; 
      }

      // NO COLLISION: Process normal handoff for new thesis
      if (cachedHandoff) {
        try {
          const parsed = JSON.parse(cachedHandoff);

          const baseDrivers = (parsed.drivers || []).map((d: any, idx: number) => ({
            id: d.id || `driver_${idx}`,
            title: d.title || d.text,
            whyThisMatters: d.why || d.whyThisMatters || 'Core growth driver.',
            evidence: d.evidence || ['Key catalyst identified from research analysis'],
            monitors: d.monitors || ['Segment performance metrics']
          }));

          const baseRisks = (parsed.risks || []).map((r: any, idx: number) => ({
            id: r.id || `risk_${idx}`,
            title: r.title || r.text,
            whyThisMatters: r.why || r.whyThisMatters || 'Core risk factor.',
            evidence: r.evidence || ['Risk factor identified during research analysis'],
            monitors: r.monitors || ['Macro & operational headwinds']
          }));

          setSuggestedDrivers(baseDrivers);
          setSuggestedRisks(baseRisks);
          setSelectedDrivers(parsed.selectedDriverIds || []);
          setSelectedRisks(parsed.selectedRiskIds || []);

          setIsLoading(false);
          return;
        } catch (err) {
          console.error('Failed to parse handoff data', err);
        }
      }

      // FALLBACK: Modify existing thesis or fetch API
      try {
        const res = await fetch('/api/thesis-options', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker: cleanTicker, companyName: profile?.companyName || cleanTicker })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "AI generation failed");

        let finalSuggestedDrivers = (data.drivers || []).map((d: any, i: number) => ({ ...d, id: `driver_${i}` }));
        let finalSuggestedRisks = (data.risks || []).map((r: any, i: number) => ({ ...r, id: `risk_${i}` }));


        setSuggestedDrivers(finalSuggestedDrivers);
        setSuggestedRisks(finalSuggestedRisks);
      } catch (err: any) {
        console.error("Failed to generate thesis options:", err);
        setApiError("API failed to retrieve data. Please try again later.");
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
      } else {
        setSelectedDrivers([...selectedDrivers, id]);
      }
    } else {
      if (selectedRisks.includes(id)) {
        setSelectedRisks(selectedRisks.filter(r => r !== id));
      } else {
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
        evidence: ['User-defined tracking parameter'],
        monitors: ['Custom AI monitoring enabled']
      }]);
      setSelectedDrivers([...selectedDrivers, newId]);
      setCustomInput('');
    } else if (step === 2 && selectedRisks.length < 5) {
      const newId = `custom-r-${Date.now()}`;
      setSuggestedRisks([...suggestedRisks, {
        id: newId,
        title: customInput,
        whyThisMatters: 'Custom user-defined risk parameter.',
        evidence: ['User-defined risk factor'],
        monitors: ['Custom AI monitoring enabled']
      }]);
      setSelectedRisks([...selectedRisks, newId]);
      setCustomInput('');
    }
  };

  const handleProceedToReview = async () => {
    setStep(3);
    if (isEditing && summaryDraft) return;

    setIsGeneratingSummary(true);
    try {
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
        setSaveError("You must be logged in to save a thesis!");
        setIsSaving(false);
        return;
      }

      const formattedDrivers = selectedDrivers.map(id => {
        const found = suggestedDrivers.find(d => d.id === id);
        return { title: found ? found.title : "Core Driver", status: "on_track" };
      });

      const formattedRisks = selectedRisks.map(id => {
        const found = suggestedRisks.find(r => r.id === id);
        return { title: found ? found.title : "Macroeconomic Risk" };
      });

      const primaryRiskText = formattedRisks.length > 0 ? formattedRisks[0].title : "Macroeconomic pressures and sector rotation";

      const payload = {
        user_id: userId,
        ticker: ticker.toUpperCase(),
        company_name: profile?.companyName || ticker,
        drivers: formattedDrivers,
        risks: formattedRisks,
        primary_risk: primaryRiskText,
        summary: summaryDraft,
        status: 'Strengthening',
        requires_action: false
      };

      const { error } = await supabase.from('theses').upsert(payload, { onConflict: 'user_id,ticker' });
      if (error) throw error;

      fetch('/api/engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      }).catch(err => console.log("Silent engine trigger failed:", err));

      router.push(`/thesis/${ticker.toUpperCase()}`);
    } catch (err: any) {
      console.log("Supabase Save Error:", JSON.stringify(err, null, 2));
      if (err.message?.includes('Alpha limit reached') || err.details?.includes('Alpha limit reached')) {
        setShowLimitModal(true);
      } else {
        setSaveError(err.message || "Failed to connect to the database. Please try again.");
      }
    } finally {
      setIsSaving(false);
    }
  };

 if (isLoading) {
    return <BuilderLoadingScreen ticker={ticker} />;
  }

  const currentOptions = step === 1 ? suggestedDrivers : suggestedRisks;
  const currentSelections = step === 1 ? selectedDrivers : selectedRisks;

  const renderCard = (item: any) => {
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
            {item.evidence?.map((ev: string, idx: number) => (
              <li key={idx} className="flex items-start gap-2 text-xs font-medium text-slate-600 leading-snug">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 mt-1 shrink-0"></span> {ev}
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-auto mb-4 bg-blue-50/50 border border-blue-100 rounded-2xl p-4">
          <p className="text-[8px] font-extrabold text-blue-600 uppercase tracking-widest mb-2.5">Investment IQ Monitors</p>
          <ul className="space-y-2">
            {item.monitors?.map((mon: string, idx: number) => (
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
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Logo href="/dashboard" />
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
        <div className="text-center mb-12 flex flex-col items-center">
          {isEditing && createdDate && (
            <div className="inline-flex items-center gap-2 bg-blue-50/80 text-blue-700 px-4 py-2 rounded-full text-xs font-medium italic mb-4 border border-blue-100 shadow-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              You added {ticker} to your portfolio on {createdDate}.
            </div>
          )}

          <p className="text-[10px] font-extrabold text-blue-600 uppercase tracking-widest mb-3">STEP {step} OF 3</p>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-3">
            {isEditing
              ? (step === 1 ? `Update your ${ticker} Drivers` : step === 2 ? `Update your ${ticker} Risks` : `Review your ${ticker} Thesis`)
              : (step === 1 ? `Why are you considering investing in ${ticker}?` : step === 2 ? `What are the biggest risks to ${ticker}?` : `Review your AI-Drafted Thesis`)
            }
          </h1>
          <p className="text-sm font-medium text-slate-500 max-w-lg mx-auto">
            {step === 3
              ? "Investment IQ has drafted an executive summary based on your selections. Review and customize before saving."
              : isEditing
                ? `Review and modify the ${step === 1 ? 'drivers' : 'risks'} you are tracking below.`
                : `Choose up to 5 ${step === 1 ? 'drivers' : 'risks'} to monitor. You have selected ${currentSelections.length > 5 ? 5 : currentSelections.length} of 5.`
            }
          </p>
        </div>

        {/* STEP 3: SUMMARY */}
        {step === 3 && (
          <div className="max-w-2xl mx-auto mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400"></div>
              <h3 className="text-lg font-extrabold text-slate-900 mb-2 flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> Executive Summary
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
                    rows={6}
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

        {/* STEPS 1 & 2: STANDARD CARDS GRID */}
        {step !== 3 && (
          <>
            {apiError ? (
              <div className="max-w-2xl mx-auto bg-rose-50 border border-rose-200 p-8 rounded-3xl text-center space-y-4 shadow-sm mb-12">
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <AlertTriangle className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-lg font-extrabold text-rose-700">Analysis Interrupted</h3>
                <p className="text-sm font-medium text-rose-600/80">{apiError}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl hover:bg-rose-700 transition-colors shadow-sm cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
                  {currentOptions.map(item => renderCard(item))}
                </div>

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
                      disabled={currentSelections.length >= 5}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-medium focus:outline-none focus:border-blue-500 focus:bg-white transition-colors disabled:opacity-50"
                    />
                  </div>
                  <button
                    onClick={handleAddCustom}
                    disabled={!customInput.trim() || currentSelections.length >= 5}
                    className="w-full md:w-auto self-end bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-colors cursor-pointer"
                  >
                    Add Custom
                  </button>
                </div>
              </>
            )}
          </>
        )}
      </main>

      <div className="fixed bottom-0 left-0 right-0 bg-slate-100 border-t border-slate-200 py-4 px-6 z-40">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full bg-white border flex items-center justify-center text-xs font-extrabold ${
              currentSelections.length > 5 ? 'border-rose-500 text-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.2)]' : 'border-slate-200 text-slate-900'
            }`}>
              {step === 3 ? <Check className="w-4 h-4 text-emerald-600" strokeWidth={4} /> : currentSelections.length}
            </div>
            <span className={`text-xs font-bold ${currentSelections.length > 5 ? 'text-rose-500' : 'text-slate-600'}`}>
              {step === 3
                ? 'Final Review'
                : `/ 5 ${step === 1 ? 'Drivers' : 'Risks'} Selected`}
            </span>
          </div>

          <div className="flex gap-3">
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                disabled={selectedDrivers.length === 0 || selectedDrivers.length > 5}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-50 text-white text-sm font-extrabold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
              >
                {selectedDrivers.length > 5 ? 'Remove 1 to Continue' : 'Next: Add Risks'} <ArrowRight className="w-4 h-4" />
              </button>
            )}

            {step === 2 && (
              <>
                <button
                  onClick={() => setStep(1)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-extrabold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleProceedToReview}
                  disabled={selectedRisks.length === 0 || selectedRisks.length > 5}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white text-sm font-extrabold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
                >
                  {selectedRisks.length > 5 ? 'Remove 1 to Continue' : 'Review Thesis'} <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 3 && (
              <div className="flex items-center gap-3">
                {saveError && (
                  <div className="text-xs font-bold text-rose-500 bg-rose-50 px-4 py-2 rounded-lg border border-rose-200 animate-in fade-in zoom-in">
                    {saveError}
                  </div>
                )}
                <button
                  onClick={() => setStep(2)}
                  className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-sm font-extrabold px-5 py-2.5 rounded-xl transition-colors cursor-pointer"
                >
                  Back
                </button>
                <button
                  onClick={handleSaveAndFinish}
                  disabled={isSaving || !summaryDraft.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white text-sm font-extrabold px-6 py-2.5 rounded-xl transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (isEditing ? 'Update Thesis' : 'Save & Track Conviction')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ✨ SIMPLE COLLISION MODAL */}
      {showCollisionModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0F172A]/80 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 border border-slate-200 animate-[slideIn_0.3s_ease-out] text-center">
            
            <h3 className="text-2xl font-extrabold text-[#0F172A] mb-3 flex items-center justify-center gap-2 tracking-tight">
              🛡️ Active Thesis Detected
            </h3>
            
            <p className="text-[14px] text-slate-500 font-medium mb-6">
              You already have an active thesis for <strong>{ticker}</strong> saved on {createdDate || 'a previous date'}.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 mb-8 text-left relative shadow-inner">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-emerald-400 rounded-t-2xl"></div>
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                 <Zap className="w-3 h-3 text-amber-500 fill-amber-500" /> YOUR CURRENT THESIS
              </p>
              <p className="text-[13px] font-medium text-slate-700 leading-relaxed italic">
                "{summaryDraft || 'Active monitoring and conviction parameters are set.'}"
              </p>
            </div>

           <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  sessionStorage.removeItem(`thesis_handoff_${ticker}`);
                  router.push(`/thesis/${ticker}`);
                }}
                className="w-full px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Review & Modify My Thesis
              </button>
              <button
                onClick={() => {
                  // Go back to the Research page, leaving sessionStorage intact
                  router.push(`/company/${ticker.toUpperCase()}`);
                }}
                className="w-full px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-extrabold rounded-xl transition-colors cursor-pointer"
              >
                Ignore & Continue
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ALPHA LIMIT MODAL */}
      {showLimitModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-[#0F172A]/60 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center border border-slate-200 animate-[slideIn_0.3s_ease-out]">
            <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-amber-100">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-extrabold text-[#0F172A] mb-3">Alpha Limit Reached</h3>
            <p className="text-[14px] text-slate-500 font-medium leading-relaxed mb-8">
              You are currently tracking the maximum of 5 stocks allowed during our free Alpha testing phase.
              Please remove an existing thesis from your dashboard to create a new one.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => router.push(`/company/${ticker}`)}
                className="px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl transition-all w-full sm:w-auto cursor-pointer"
              >
                Go Back
              </button>
              <button
                onClick={() => router.push('/dashboard')}
                className="px-6 py-3 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-xl transition-all w-full sm:w-auto shadow-sm cursor-pointer"
              >
                Manage Portfolio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ⏳ ANIMATED LOADING SCREEN (BUILDER)
// ==========================================
function BuilderLoadingScreen({ ticker }: { ticker: string }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Step 1: Mining (0 - 1.5s)
    const t1 = setTimeout(() => setStep(1), 1500); 
    // Step 2: Extracting (1.5s - 3s)
    const t2 = setTimeout(() => setStep(2), 3000); 
    // Step 3: Finalizing (3s - 5s)
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#F8FAFC] flex flex-col items-center justify-center font-sans antialiased p-4">
      <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-sm max-w-md w-full mx-auto flex flex-col items-center text-center animate-in fade-in zoom-in duration-500">
        <div className="relative mb-6 w-16 h-16 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-60"></div>
          <div className="relative bg-white rounded-full p-4 border border-slate-100 shadow-sm">
             <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        </div>
        
        <h3 className="text-xl font-extrabold text-[#0F172A] mb-8 tracking-tight">
          Preparing Thesis for {ticker}
        </h3>
        
        <div className="w-full bg-slate-50 rounded-2xl border border-slate-100 p-5 mb-2 text-left space-y-4">
          
          {/* STEP 0 */}
          <div className={`flex items-center gap-3 text-xs font-bold transition-colors duration-500 ${step > 0 ? 'text-slate-600' : 'text-blue-600'}`}>
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              step > 0 
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                : 'bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]'
            }`}></div>
            MINING SEC FILINGS
          </div>

          {/* STEP 1 */}
          <div className={`flex items-center gap-3 text-xs font-bold transition-colors duration-500 ${
            step > 1 ? 'text-slate-600' : step === 1 ? 'text-blue-600' : 'text-slate-400'
          }`}>
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              step > 1 
                ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' 
                : step === 1 
                  ? 'bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]' 
                  : 'bg-slate-300'
            }`}></div>
            EXTRACTING CORE DRIVERS
          </div>

          {/* STEP 2 */}
          <div className={`flex items-center gap-3 text-xs font-bold transition-colors duration-500 ${
            step === 2 ? 'text-blue-600' : 'text-slate-400'
          }`}>
            <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
              step === 2 
                ? 'bg-blue-600 animate-pulse shadow-[0_0_8px_rgba(37,99,235,0.5)]' 
                : 'bg-slate-300'
            }`}></div>
            FINALIZING THESIS...
          </div>

        </div>
        
        <div className="mt-6 flex items-center gap-2 text-[11px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 px-4 py-2 rounded-lg">
          <AlertTriangle className="w-3.5 h-3.5" />
          Please do not refresh the page
        </div>
      </div>
    </div>
  );
}