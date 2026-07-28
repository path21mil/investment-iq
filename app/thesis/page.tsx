'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function ThesisBuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ticker = (searchParams.get('ticker') || 'NVDA').toUpperCase();

  const [companyName, setCompanyName] = useState(`${ticker} Corporation`);
  const [selectedDrivers, setSelectedDrivers] = useState<string[]>([]);
  const [selectedRisks, setSelectedRisks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializePage() {
      // 1. Security Check: Ensure user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }

      // 2. Check if a thesis already exists for this ticker
      const { data: existingThesis } = await supabase
        .from('theses')
        .select('id')
        .eq('ticker', ticker)
        .maybeSingle();

      if (existingThesis) {
        // If it already exists, skip builder and go straight to overview
        router.push(`/company/${ticker}`);
        return;
      }

      // 3. Set company name based on ticker
      if (ticker === 'AMZN') setCompanyName('Amazon.com, Inc.');
      else if (ticker === 'MSFT') setCompanyName('Microsoft Corporation');
      else if (ticker === 'NVDA') setCompanyName('NVIDIA Corporation');
      else if (ticker === 'AAPL') setCompanyName('Apple Inc.');
      else if (ticker === 'AMD') setCompanyName('Advanced Micro Devices, Inc.');
      else setCompanyName(`${ticker} Corporation`);

      setIsLoading(false);
    }

    initializePage();
  }, [router, ticker]);

  const toggleDriver = (title: string) => {
    if (selectedDrivers.includes(title)) {
      setSelectedDrivers(selectedDrivers.filter(d => d !== title));
    } else {
      setSelectedDrivers([...selectedDrivers, title]);
    }
  };

  const toggleRisk = (title: string) => {
    if (selectedRisks.includes(title)) {
      setSelectedRisks(selectedRisks.filter(r => r !== title));
    } else {
      setSelectedRisks([...selectedRisks, title]);
    }
  };

  const handleSaveThesis = async () => {
    setIsSubmitting(true);

    const driversData = selectedDrivers.map((d, index) => ({
      id: index + 1,
      title: d,
      desc: `Core growth driver tracking for ${ticker}.`,
      tracks: 'Revenue, Margin'
    }));

    const risksData = selectedRisks.map((r, index) => ({
      id: index + 1,
      title: r,
      desc: `Monitored risk factor for ${ticker}.`
    }));

    const { data: existing } = await supabase
      .from('theses')
      .select('id')
      .eq('ticker', ticker)
      .maybeSingle();

    let saveError = null;

    if (existing) {
      const { error } = await supabase
        .from('theses')
        .update({
          company_name: companyName,
          drivers: driversData,
          risks: risksData,
        })
        .eq('id', existing.id);
      saveError = error;
    } else {
      const { error } = await supabase
        .from('theses')
        .insert({
          ticker: ticker,
          company_name: companyName,
          drivers: driversData,
          risks: risksData,
          created_at: new Date().toISOString()
        });
      saveError = error;
    }

    setIsSubmitting(false);

    if (saveError) {
      alert(saveError.message);
    } else {
      router.push(`/company/${ticker}`);
    }
  };

  const potentialDrivers = [
    {
      title: 'Infrastructure & Industry Demand',
      why: `${companyName}'s growth is supported by increasing demand for compute/services from cloud providers and enterprises.`,
      evidence: ['Data center / Segment revenue growth', 'Strong customer demand', 'Management commentary']
    },
    {
      title: 'Gross Margin Strength',
      why: 'High margins indicate strong pricing power and competitive positioning.',
      evidence: ['Gross margin trend', 'Product mix improvement']
    },
    {
      title: 'Software & Ecosystem Expansion',
      why: 'Proprietary software and ecosystem lock-in create additional competitive advantages.',
      evidence: ['Developer adoption', 'Enterprise ecosystem growth']
    }
  ];

  const potentialRisks = [
    {
      title: 'Capital Spending Slows',
      why: `${companyName}'s growth depends heavily on continued infrastructure and consumer investment.`,
      monitor: ['Cloud capital expenditure', 'Segment demand', 'Customer spending trends']
    },
    {
      title: 'Competition Increases',
      why: 'New competitors or custom chips/software could pressure market share and margins.',
      monitor: ['Market share', 'Pricing trends', 'Competitor product launches']
    },
    {
      title: 'Margin Compression',
      why: 'Lower pricing power could impact profitability.',
      monitor: ['Gross margin', 'Product pricing', 'Supply costs']
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 font-medium animate-pulse">Loading thesis analysis...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-black pb-24">
      
      {/* Dynamic Top Bar Navigation */}
      <div className="max-w-3xl mx-auto px-6 py-6 flex justify-between items-center">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="text-gray-500 hover:text-gray-900 text-sm font-semibold flex items-center gap-1 cursor-pointer"
        >
          ← Back to Dashboard
        </button>
      </div>

      <main className="max-w-3xl mx-auto px-6">
        
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6 tracking-tight">Build Investment Thesis</h1>

        {/* Company Header Card */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm mb-6 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center font-bold text-xl">
              {ticker.charAt(0)}
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg">{companyName}</h3>
              <p className="text-xs text-gray-400 font-medium">{ticker} • NASDAQ</p>
            </div>
          </div>
          <div className="text-sm font-bold text-gray-700 bg-gray-100 px-4 py-2 rounded-xl">
            Selections: <span className="text-blue-600">{selectedDrivers.length} Drivers</span> • <span className="text-orange-600">{selectedRisks.length} Risks</span>
          </div>
        </div>

        {/* Intro Context Paragraph */}
        <p className="text-gray-600 text-sm leading-relaxed mb-10 bg-blue-50/50 p-5 rounded-2xl border border-blue-100">
          Based on {companyName}'s latest financial results, SEC filings, and management commentary, Investment IQ identified these potential reasons investors may be interested in this business.
        </p>

        {/* --- DRIVERS SECTION --- */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Potential Investment Drivers</h2>
        <div className="space-y-6 mb-12">
          {potentialDrivers.map((driver, index) => {
            const isSelected = selectedDrivers.includes(driver.title);
            return (
              <div key={driver.title} className={`p-6 rounded-2xl border transition-all ${isSelected ? 'border-blue-600 ring-1 ring-blue-600 bg-blue-50/10' : 'border-gray-200 bg-white shadow-sm'}`}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{index + 1}. {driver.title}</h3>
                
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Why this matters:</h4>
                  <p className="text-gray-800 text-sm mt-1 font-medium">{driver.why}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Evidence:</h4>
                  <ul className="mt-2 space-y-1">
                    {driver.evidence.map(item => (
                      <li key={item} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => toggleDriver(driver.title)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isSelected ? '✓ Added to Thesis' : '+ Add to My Thesis'}
                </button>
              </div>
            );
          })}
        </div>

        {/* --- RISKS SECTION --- */}
        <h2 className="text-2xl font-bold text-gray-900 mb-6 border-t border-gray-200 pt-10">Potential Risks To Monitor</h2>
        <div className="space-y-6 mb-12">
          {potentialRisks.map((risk, index) => {
            const isSelected = selectedRisks.includes(risk.title);
            return (
              <div key={risk.title} className={`p-6 rounded-2xl border transition-all ${isSelected ? 'border-orange-500 ring-1 ring-orange-500 bg-orange-50/10' : 'border-gray-200 bg-white shadow-sm'}`}>
                <h3 className="text-lg font-bold text-gray-900 mb-4">{index + 1}. {risk.title}</h3>
                
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Why this matters:</h4>
                  <p className="text-gray-800 text-sm mt-1 font-medium">{risk.why}</p>
                </div>
                
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Monitor:</h4>
                  <ul className="mt-2 space-y-1">
                    {risk.monitor.map(item => (
                      <li key={item} className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => toggleRisk(risk.title)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-colors cursor-pointer ${
                    isSelected 
                      ? 'bg-orange-500 text-white shadow-md' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {isSelected ? '✓ Added to Risks' : '+ Add to My Risks'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSaveThesis}
          disabled={isSubmitting || (selectedDrivers.length === 0 && selectedRisks.length === 0)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed mb-12"
        >
          {isSubmitting ? 'Saving Thesis...' : `Save & Launch ${ticker} Overview →`}
        </button>

      </main>
    </div>
  );
}

export default function ThesisBuilder() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <ThesisBuilderContent />
    </Suspense>
  );
}