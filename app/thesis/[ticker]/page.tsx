'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { TrendingUp, TrendingDown, Loader2, Plus, Zap, Check, ArrowRightLeft, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import SmartSearchBar from '@/components/SmartSearchBar';
import Logo from '@/components/Logo';

interface ThesisConsideration {
  id?: string;
  title: string;
  whyThisMatters: string;
  evidence: string[];
  monitors: string[];
  sourceType: 'emerging_catalyst' | 'fundamental_blindspot';
  targetType: 'driver' | 'risk';
}

const MAX_PILLARS = 6;

function CompanyLogo({ ticker, containerClass }: { ticker: string; containerClass: string }) {
  const [imgSrc, setImgSrc] = useState(`https://financialmodelingprep.com/image-stock/${ticker}.png`);
  const [isFallback, setIsFallback] = useState(false);

  useEffect(() => {
    setImgSrc(`https://financialmodelingprep.com/image-stock/${ticker}.png`);
    setIsFallback(false);
  }, [ticker]);

  return (
    <div className={`flex items-center justify-center shrink-0 ${containerClass}`}>
      <img
        src={imgSrc}
        alt={ticker}
        className={`w-full h-full ${
          isFallback
            ? 'object-cover rounded-xl shadow-sm border border-slate-200'
            : 'object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
        }`}
        onError={() => {
          if (!isFallback) {
            setImgSrc(`https://ui-avatars.com/api/?name=${ticker}&background=f8fafc&color=0f172a&bold=true&font-size=0.45`);
            setIsFallback(true);
          }
        }}
      />
    </div>
  );
}

export default function UserThesisPage({ params }: { params: Promise<{ ticker: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const ticker = (resolvedParams.ticker || '').toUpperCase();

  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [thesis, setThesis] = useState<any>(null);

  const [activeDrivers, setActiveDrivers] = useState<any[]>([]);
  const [activeRisks, setActiveRisks] = useState<any[]>([]);
  const [suggestedConsiderations, setSuggestedConsiderations] = useState<ThesisConsideration[]>([]);
  const [recentUpdates, setRecentUpdates] = useState<any[]>([]);
  const [addingIndex, setAddingIndex] = useState<number | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // Success Notification Modal
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    targetId?: string;
  } | null>(null);

  // 1-for-1 Swap Modal State
  const [swapModal, setSwapModal] = useState<{
    isOpen: boolean;
    incomingItem: ThesisConsideration | null;
    incomingIndex: number | null;
    selectedOldIndex: number;
  }>({
    isOpen: false,
    incomingItem: null,
    incomingIndex: null,
    selectedOldIndex: 0
  });

  useEffect(() => {
    async function loadThesisData() {
      setIsLoading(true);
      try {
        const {
          data: { session }
        } = await supabase.auth.getSession();
        if (!session) {
          router.push('/login');
          return;
        }

        // 1. Fetch user's saved thesis
        const { data: savedThesis } = await supabase
          .from('theses')
          .select('*')
          .eq('user_id', session.user.id)
          .ilike('ticker', ticker)
          .maybeSingle();

        if (!savedThesis) {
          router.push(`/build-thesis/${ticker}`);
          return;
        }
        setThesis(savedThesis);

        // 2. Fetch live stock price
        const profileRes = await fetch(`/api/company-profile?ticker=${ticker}`);
        let liveProfile: any = await profileRes.json();
        if (Array.isArray(liveProfile) && liveProfile.length > 0) liveProfile = liveProfile[0];
        setProfile(liveProfile);

        // 3. Parse drivers & risks from DB
        const parseData = (data: any) => (typeof data === 'string' ? JSON.parse(data) : data || []);
        const parsedDrivers = parseData(savedThesis.drivers);
        const parsedRisks = parseData(savedThesis.risks);

        setActiveDrivers(parsedDrivers);
        setActiveRisks(parsedRisks);

        const cleanKey = (val: any) => {
          const text = typeof val === 'string' ? val : val?.title || '';
          return text.toLowerCase().replace(/[^a-z0-9]/g, '');
        };

        const selectedSet = new Set([
          ...parsedDrivers.map(cleanKey),
          ...parsedRisks.map(cleanKey)
        ]);

        // 4. Fetch Tier 1: Real-time News Catalysts from Supabase portfolio_events
        const { data: recentEvents } = await supabase
          .from('portfolio_events')
          .select('*')
          .eq('ticker', ticker)
          .order('detected_at', { ascending: false })
          .limit(6);

        const emergingCatalysts: ThesisConsideration[] = (recentEvents || [])
          .filter((evt) => !selectedSet.has(cleanKey(evt.headline)))
          .map((evt) => ({
            id: evt.id,
            title: evt.headline,
            whyThisMatters: evt.impact_summary,
            evidence: [
              `Reported by ${evt.source_name || 'Market Wire'} on ${new Date(evt.detected_at).toLocaleDateString()}`,
              `Catalyst classified with ${evt.sentiment} trajectory.`
            ],
            monitors: [
              `Follow-up filings and disclosures from ${evt.source_name || 'SEC EDGAR'}`,
              'Quarterly operational metrics and forward guidance adjustments'
            ],
            sourceType: 'emerging_catalyst',
            targetType: evt.sentiment === 'risk' ? 'risk' : 'driver'
          }));

        // 5. Fetch research data for updates and Tier 2 fallback catalog
        fetch('/api/research', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ticker })
        })
          .then((res) => res.json())
          .then((aiData) => {
            if (aiData.updates) setRecentUpdates(aiData.updates);

            if (emergingCatalysts.length > 0) {
              setSuggestedConsiderations(emergingCatalysts.slice(0, 2));
            } else if (aiData?.drivers || aiData?.risks) {
              const catalogCandidates: ThesisConsideration[] = [
                ...(aiData.drivers || []).map((d: any) => ({
                  title: typeof d === 'string' ? d : d.title,
                  whyThisMatters:
                    d.whyThisMatters || d.description || `${ticker}'s operational expansion and market tailwinds.`,
                  evidence:
                    Array.isArray(d.evidence) && d.evidence.length > 0
                      ? d.evidence
                      : [`Established core pillar from foundational ${ticker} business profile.`],
                  monitors:
                    Array.isArray(d.monitors) && d.monitors.length > 0
                      ? d.monitors
                      : ['Quarterly segment revenue growth', 'Customer retention and contract renewals'],
                  sourceType: 'fundamental_blindspot' as const,
                  targetType: 'driver' as const
                })),
                ...(aiData.risks || []).map((r: any) => ({
                  title: typeof r === 'string' ? r : r.title,
                  whyThisMatters:
                    r.whyThisMatters || r.description || `Monitored structural headwind for ${ticker}.`,
                  evidence:
                    Array.isArray(r.evidence) && r.evidence.length > 0
                      ? r.evidence
                      : ['Monitored counter-thesis factor from initial evaluation.'],
                  monitors:
                    Array.isArray(r.monitors) && r.monitors.length > 0
                      ? r.monitors
                      : ['Operating margin fluctuations', 'Competitive peer activity'],
                  sourceType: 'fundamental_blindspot' as const,
                  targetType: 'risk' as const
                }))
              ];

              const filteredCatalog = catalogCandidates
                .filter((item) => item.title && !selectedSet.has(cleanKey(item.title)))
                .slice(0, 2);

              setSuggestedConsiderations(filteredCatalog);
            }
          })
          .catch((err) => console.log('Silent research fetch failed:', err));
      } catch (error) {
        console.error('Failed to load thesis:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadThesisData();
  }, [ticker, router]);

  const handleAddToThesis = async (item: ThesisConsideration, index: number) => {
    const isRisk = item.targetType === 'risk';
    const currentList = isRisk ? activeRisks : activeDrivers;
    const sectionLabel = isRisk ? "Risks I'm Watching" : 'Why I Invested';
    const targetSectionId = isRisk ? 'risks-watching-section' : 'why-i-invested-section';

    // TRIGGER SWAP MODAL IF AT 6/6 CAPACITY
    if (currentList.length >= MAX_PILLARS) {
      setSwapModal({
        isOpen: true,
        incomingItem: item,
        incomingIndex: index,
        selectedOldIndex: 0
      });
      return;
    }

    // DIRECT ADD IF UNDER 6 SLOTS
    setAddingIndex(index);

    try {
      const newItem = {
        title: item.title,
        desc: item.whyThisMatters,
        whyThisMatters: item.whyThisMatters,
        evidence: item.evidence || [],
        monitors: item.monitors || [],
        status: isRisk ? 'monitoring' : 'strengthening',
        created_at: new Date().toISOString()
      };

      const updatedList = [...currentList, newItem];
      const updatePayload = isRisk ? { risks: updatedList } : { drivers: updatedList };

      const { error } = await supabase
        .from('theses')
        .update(updatePayload)
        .eq('id', thesis.id);

      if (error) throw error;

      if (isRisk) {
        setActiveRisks(updatedList);
      } else {
        setActiveDrivers(updatedList);
      }

      setSuggestedConsiderations((prev) => prev.filter((_, i) => i !== index));

      setModalConfig({
        isOpen: true,
        title: 'Pillar Added to Thesis',
        message: `"${item.title}" has been added to ${sectionLabel} (${updatedList.length}/${MAX_PILLARS} active).`,
        targetId: targetSectionId
      });
    } catch (err: any) {
      console.error('Unexpected error committing thesis:', err?.message || err);
      alert(`Could not save: ${err?.message || 'Database error'}`);
    } finally {
      setAddingIndex(null);
    }
  };

  const handleExecuteSwap = async () => {
    if (!swapModal.incomingItem || swapModal.incomingIndex === null) return;

    setIsSwapping(true);
    const item = swapModal.incomingItem;
    const isRisk = item.targetType === 'risk';
    const currentList = isRisk ? [...activeRisks] : [...activeDrivers];
    const sectionLabel = isRisk ? "Risks I'm Watching" : 'Why I Invested';
    const targetSectionId = isRisk ? 'risks-watching-section' : 'why-i-invested-section';

    const newItem = {
      title: item.title,
      desc: item.whyThisMatters,
      whyThisMatters: item.whyThisMatters,
      evidence: item.evidence || [],
      monitors: item.monitors || [],
      status: isRisk ? 'monitoring' : 'strengthening',
      created_at: new Date().toISOString()
    };

    // Replace selected old item with incoming catalyst
    currentList.splice(swapModal.selectedOldIndex, 1, newItem);
    const updatePayload = isRisk ? { risks: currentList } : { drivers: currentList };

    try {
      const { error } = await supabase
        .from('theses')
        .update(updatePayload)
        .eq('id', thesis.id);

      if (error) throw error;

      if (isRisk) {
        setActiveRisks(currentList);
      } else {
        setActiveDrivers(currentList);
      }

      setSuggestedConsiderations((prev) => prev.filter((_, i) => i !== swapModal.incomingIndex));
      setSwapModal({ isOpen: false, incomingItem: null, incomingIndex: null, selectedOldIndex: 0 });

      setModalConfig({
        isOpen: true,
        title: 'Thesis Pillar Swapped',
        message: `"${item.title}" has replaced the selected pillar in ${sectionLabel}.`,
        targetId: targetSectionId
      });
    } catch (err: any) {
      console.error('Failed to execute swap:', err?.message || err);
      alert(`Could not swap: ${err?.message || 'Database error'}`);
    } finally {
      setIsSwapping(false);
    }
  };

  const getDynamicStatus = (title: string, type: 'driver' | 'risk') => {
    if (!recentUpdates || recentUpdates.length === 0) return { label: 'Stable', dotColor: 'text-slate-400' };
    const updatesText = JSON.stringify(recentUpdates).toLowerCase();
    const keywords = (title || '').toLowerCase().split(' ').filter((w) => w.length > 4);
    const isMatch = keywords.some((kw) => updatesText.includes(kw));

    if (type === 'driver') {
      return isMatch ? { label: 'Strengthening', dotColor: 'text-emerald-500' } : { label: 'Stable', dotColor: 'text-slate-400' };
    }
    return isMatch ? { label: 'Monitoring', dotColor: 'text-amber-500' } : { label: 'Stable', dotColor: 'text-slate-400' };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-4" />
        <div className="text-slate-500 font-bold tracking-tight">Loading your {ticker} portfolio data...</div>
      </div>
    );
  }

  if (!thesis) return null;

  const isPositiveChange = (profile?.changes || 0) >= 0;
  const reviewDate = new Date(thesis.updated_at || thesis.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-[#0F172A] pb-24">
      {/* NAVIGATION */}
      <header className="sticky top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-[960px] mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-8">
          <div className="shrink-0 flex items-center gap-4">
            <Logo href="/dashboard" />
          </div>

          <div className="hidden md:block flex-1 max-w-sm">
            <SmartSearchBar />
          </div>

          <div className="hidden md:flex items-center gap-3 shrink-0">
            <button
              onClick={() => router.push(`/company/${ticker}`)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-[#0F172A] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              View Research
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[13px] font-bold text-[#0F172A] hover:bg-slate-50 transition-colors shadow-sm cursor-pointer"
            >
              Dashboard
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="max-w-[960px] mx-auto px-4 sm:px-6 pt-8 md:pt-12">
        {/* HERO BANNER */}
        <div className="mb-12 bg-white border border-slate-200 rounded-3xl p-5 sm:p-8 shadow-sm flex flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 sm:gap-6 min-w-0">
            <CompanyLogo ticker={ticker} containerClass="w-12 h-12 sm:w-20 sm:h-20 shrink-0" />
            <div className="flex flex-col justify-center gap-1 min-w-0">
              <h1 className="text-xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-[#0F172A] leading-none truncate">
                {profile?.companyName || thesis.company_name}
              </h1>
              <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs font-bold text-slate-500 mt-0.5">
                <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded border border-slate-200">
                  {ticker}
                </span>
                <span className="hidden sm:inline">• {profile?.exchangeShortName || 'NASDAQ'}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end justify-center shrink-0 text-right">
            <span className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight leading-none">
              ${profile?.price?.toFixed(2) || '0.00'}
            </span>
            <div
              className={`flex items-center gap-1 text-[11px] sm:text-base font-extrabold mt-1 sm:mt-1.5 ${
                isPositiveChange ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {isPositiveChange ? (
                <TrendingUp className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0" />
              )}
              <span className="whitespace-nowrap">
                {profile?.changes > 0 ? '+' : ''}
                {profile?.changes?.toFixed(2)} (
                {(((profile?.changes || 0) / ((profile?.price || 1) - (profile?.changes || 0))) * 100).toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {/* MY INVESTMENT THESIS */}
        <section className="mb-12">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 pl-2">My Investment Thesis</p>
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Why I invested</h3>
            <p className="text-[14px] text-[#0F172A] font-bold leading-relaxed">{thesis.summary || 'No summary provided.'}</p>
          </div>
        </section>

        {/* DRIVERS SECTION */}
        <section id="why-i-invested-section" className="mb-12 scroll-mt-24">
          <div className="flex items-center justify-between mb-4 pl-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Why I Invested</p>
            <span className="text-[11px] font-semibold text-slate-400">
              {activeDrivers.length}/{MAX_PILLARS} Tracking
            </span>
          </div>
          <div className="space-y-4">
            {activeDrivers.map((driver, idx) => {
              const status = getDynamicStatus(driver.title || driver, 'driver');
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-start justify-between"
                >
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-[#0F172A] mb-1">{driver.title || driver}</h4>
                    <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                      {driver.desc || driver.whyThisMatters || driver.description || 'Core growth driver tracking.'}
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest shrink-0 mt-1 bg-slate-50 px-3 py-1 rounded border border-slate-100">
                    <span className={status.dotColor}>●</span> {status.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RISKS SECTION */}
        <section id="risks-watching-section" className="mb-16 scroll-mt-24">
          <div className="flex items-center justify-between mb-4 pl-2">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Risks I'm Watching</p>
            <span className="text-[11px] font-semibold text-slate-400">
              {activeRisks.length}/{MAX_PILLARS} Tracking
            </span>
          </div>
          <div className="space-y-4">
            {activeRisks.map((risk, idx) => {
              const status = getDynamicStatus(risk.title || risk, 'risk');
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-start justify-between"
                >
                  <div className="flex-1">
                    <h4 className="text-[15px] font-bold text-[#0F172A] mb-1">{risk.title || risk}</h4>
                    <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                      {risk.desc || risk.whyThisMatters || risk.description || 'Monitored risk factor.'}
                    </p>
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-widest shrink-0 mt-1 bg-slate-50 px-3 py-1 rounded border border-slate-100">
                    <span className={status.dotColor}>●</span> {status.label}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* WHAT'S CHANGED */}
        {recentUpdates.length > 0 && (
          <>
            <hr className="border-slate-200 mb-12" />
            <section className="mb-12">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 pl-2">What's Changed</p>
              <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6">
                  Latest earnings / filings
                </h3>
                <div className="space-y-4">
                  {recentUpdates.map((update: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
                    >
                      <span
                        className={`font-bold shrink-0 mt-0.5 ${
                          update.type === 'positive' ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {update.type === 'positive' ? '↑' : '↓'}
                      </span>
                      <div>
                        <span className="text-[14px] font-bold text-[#0F172A] block mb-1">{update.headline}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                          {update.impact}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* YOU MAY WANT TO CONSIDER */}
        {suggestedConsiderations.length > 0 && (
          <>
            <hr className="border-slate-200 mb-10 sm:mb-12" />
            <section className="mb-12 sm:mb-16">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-6 pl-2">
                You May Want To Consider
              </p>

              <div
                className={`grid gap-6 w-full ${
                  suggestedConsiderations.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
                }`}
              >
                {suggestedConsiderations.map((item, idx) => {
                  const isRisk = item.targetType === 'risk';

                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm flex flex-col justify-between transition-all"
                    >
                      <div>
                        {/* Type & Destination Tag */}
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                          <span
                            className={`inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                              isRisk
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <span>●</span>
                            <span>{isRisk ? 'Risk Factor' : 'Growth Catalyst'}</span>
                          </span>

                          <span className="text-[11px] font-semibold text-slate-400">
                            Target: {isRisk ? "Risks I'm Watching" : 'Why I Invested'}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className="text-[17px] sm:text-[19px] font-extrabold text-[#0F172A] leading-snug mb-5">
                          {item.title}
                        </h4>

                        {/* Why This Matters */}
                        <div className="mb-5">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                            Why This Matters
                          </p>
                          <p className="text-[13px] font-medium text-slate-600 leading-relaxed">
                            {item.whyThisMatters}
                          </p>
                        </div>

                        {/* Evidence */}
                        {item.evidence && item.evidence.length > 0 && (
                          <div className="mb-5">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                              Evidence
                            </p>
                            <ul className="space-y-1.5">
                              {item.evidence.map((point, pIdx) => (
                                <li key={pIdx} className="flex items-start gap-2.5 text-[12px] text-slate-600">
                                  <span className="text-slate-300 shrink-0 mt-0.5">•</span>
                                  <span className="leading-snug">{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Investment IQ Monitors Box */}
                        {item.monitors && item.monitors.length > 0 && (
                          <div className="bg-[#F4F8FF] rounded-2xl p-4 sm:p-5 mb-6 border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-2.5">
                              Investment IQ Monitors
                            </p>
                            <ul className="space-y-2">
                              {item.monitors.map((metric, mIdx) => (
                                <li key={mIdx} className="flex items-start gap-2.5 text-[12px] font-medium text-slate-700">
                                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />
                                  <span className="leading-snug">{metric}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      {/* Action Button */}
                      <button
                        type="button"
                        onClick={() => handleAddToThesis(item, idx)}
                        disabled={addingIndex === idx}
                        className={`inline-flex items-center justify-center gap-2 w-full py-3.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer border ${
                          isRisk
                            ? 'bg-slate-50 hover:bg-rose-50/50 hover:border-rose-200 text-[#0F172A] border-slate-200'
                            : 'bg-slate-50 hover:bg-emerald-50/50 hover:border-emerald-200 text-[#0F172A] border-slate-200'
                        } disabled:opacity-50`}
                      >
                        {addingIndex === idx ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                            <span>Updating Thesis...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            <span>{isRisk ? "Add to Risks I'm Watching" : 'Add to Why I Invested'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        {/* THESIS STATUS FOOTER */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8 mb-12">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Thesis Status</p>
            <div className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
              <span className="text-emerald-500">●</span> Strengthening
            </div>
            <p className="text-[11px] font-medium text-slate-500 mt-2">Last reviewed: {reviewDate}</p>
          </div>

          <div className="flex gap-4 w-full md:w-auto">
            <button
              onClick={() => router.push(`/company/${ticker}`)}
              className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-[#0F172A] text-[13px] font-bold rounded-lg transition-colors cursor-pointer"
            >
              Review Updates
            </button>
            <Link
              href={`/build-thesis/${ticker}`}
              className="flex-1 md:flex-none inline-flex items-center justify-center px-6 py-3 bg-[#0F172A] hover:bg-slate-800 text-white text-[13px] font-bold rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Modify Thesis
            </Link>
          </div>
        </section>

        {/* 1-FOR-1 SWAP MODAL DIALOG */}
        {swapModal.isOpen && swapModal.incomingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-all animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl flex flex-col max-h-[90vh]">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <ArrowRightLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-extrabold text-[#0F172A]">Replace Thesis Pillar</h3>
                    <p className="text-[11px] font-semibold text-slate-400">Maximum capacity reached (6/6 slots tracked)</p>
                  </div>
                </div>
                <button
                  onClick={() => setSwapModal({ isOpen: false, incomingItem: null, incomingIndex: null, selectedOldIndex: 0 })}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="overflow-y-auto pr-1 flex-1">
                {/* Incoming Catalyst Card */}
                <div className="mb-6">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                    Incoming New Catalyst
                  </p>
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        swapModal.incomingItem.targetType === 'risk' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {swapModal.incomingItem.targetType === 'risk' ? 'Risk Factor' : 'Growth Catalyst'}
                      </span>
                    </div>
                    <h4 className="text-[14px] font-extrabold text-[#0F172A] leading-snug mb-1">
                      {swapModal.incomingItem.title}
                    </h4>
                    <p className="text-[12px] text-slate-600 leading-relaxed line-clamp-2">
                      {swapModal.incomingItem.whyThisMatters}
                    </p>
                  </div>
                </div>

                {/* Existing Pillars Selectable List */}
                <div className="mb-4">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pl-1">
                    Select One Existing Pillar To Drop:
                  </p>
                  <div className="space-y-2">
                    {(swapModal.incomingItem.targetType === 'risk' ? activeRisks : activeDrivers).map((oldItem, oIdx) => {
                      const isSelected = swapModal.selectedOldIndex === oIdx;
                      return (
                        <div
                          key={oIdx}
                          onClick={() => setSwapModal((prev) => ({ ...prev, selectedOldIndex: oIdx }))}
                          className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-blue-600 bg-blue-50/40 shadow-sm'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                            </div>
                            <span className="text-[13px] font-bold text-[#0F172A] truncate">
                              {oldItem.title || oldItem}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                            Slot {oIdx + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 mt-2">
                <button
                  type="button"
                  onClick={() => setSwapModal({ isOpen: false, incomingItem: null, incomingIndex: null, selectedOldIndex: 0 })}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-[#0F172A] text-[13px] font-bold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteSwap}
                  disabled={isSwapping}
                  className="flex-1 inline-flex items-center justify-center gap-2 py-3 bg-[#0F172A] hover:bg-slate-800 text-white text-[13px] font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSwapping ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Swapping...</span>
                    </>
                  ) : (
                    <>
                      <ArrowRightLeft className="w-4 h-4" />
                      <span>Confirm Swap</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATION CONFIRMATION MODAL */}
        {modalConfig?.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
            <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-slate-200 shadow-xl flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 bg-emerald-50 text-emerald-600">
                <Check className="w-6 h-6 stroke-[2.5]" />
              </div>

              <h3 className="text-[18px] font-extrabold text-[#0F172A] mb-2 leading-tight">
                {modalConfig.title}
              </h3>

              <p className="text-[13px] font-medium text-slate-500 leading-relaxed mb-6">
                {modalConfig.message}
              </p>

              <button
                onClick={() => {
                  const targetElement = modalConfig.targetId ? document.getElementById(modalConfig.targetId) : null;
                  setModalConfig(null);

                  if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 text-white text-[13px] font-bold rounded-xl transition-colors cursor-pointer"
              >
                View in My Thesis
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}