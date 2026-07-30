'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// --- REUSABLE PROGRESSIVE DISCLOSURE COMPONENT WITH THESIS ALIGNMENT ---
function ProgressiveCard({ 
  question, 
  statusText, 
  statusType, 
  thesisSupportText,
  thesisSupportType,
  summary, 
  evidence 
}: { 
  question: string, 
  statusText: string, 
  statusType: 'green' | 'yellow' | 'red',
  thesisSupportText: string,
  thesisSupportType: 'supports' | 'neutral' | 'risk',
  summary: string,
  evidence: string[]
}) {
  const [isOpen, setIsOpen] = useState(false);

  const styles = {
    green: { bg: 'bg-green-50', text: 'text-green-700', ring: 'ring-green-600/20', icon: '🟢' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', ring: 'ring-yellow-600/20', icon: '🟡' },
    red: { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-red-600/20', icon: '🔴' }
  };

  const thesisStyles = {
    supports: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    neutral: 'bg-amber-50 text-amber-800 border-amber-200',
    risk: 'bg-rose-50 text-rose-800 border-rose-200'
  };

  const activeStyle = styles[statusType];

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:border-gray-300">
      <div className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-lg font-bold text-gray-900">{question}</h3>
          
          {/* Thesis Alignment Tag */}
          <div className={`text-xs font-extrabold px-3 py-1 rounded-full border ${thesisStyles[thesisSupportType]} flex items-center gap-1.5`}>
            <span className="text-[10px]">Thesis:</span> {thesisSupportText}
          </div>
        </div>
        
        <div className="mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset ${activeStyle.bg} ${activeStyle.text} ${activeStyle.ring} mb-3`}>
            <span>{activeStyle.icon}</span> {statusText}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Why?</p>
          <p className="text-sm text-gray-700 font-medium leading-relaxed">
            {summary}
          </p>
        </div>

        {/* Toggle Button */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="mt-4 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isOpen ? 'Hide Supporting Evidence ↑' : 'View Supporting Evidence ↓'}
        </button>
      </div>

      {/* Expanded Evidence Section */}
      {isOpen && (
        <div className="px-6 pb-6 pt-3 bg-gray-50/50 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Evidence</h4>
          <ul className="space-y-2.5">
            {evidence.map((item, idx) => (
              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                <span className={`font-bold mt-0.5 ${statusType === 'red' ? 'text-red-500' : 'text-green-500'}`}>
                  {statusType === 'red' ? '⚠' : '✓'}
                </span> 
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export default function CompanyOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const ticker = (params.ticker as string || 'NVDA').toUpperCase();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasThesis, setHasThesis] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // User Thesis Inputs
  const [thesisInputs, setThesisInputs] = useState<string[]>([
    'Hyperscaler AI capital expenditure acceleration',
    'CUDA software ecosystem moat & switching costs',
    'Data center networking margin expansion'
  ]);

  useEffect(() => {
    async function initializeOverview() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsLoggedIn(true);
        const { data: thesis } = await supabase
          .from('theses')
          .select('id, thesis_points')
          .eq('ticker', ticker)
          .maybeSingle();

        if (thesis) {
          setHasThesis(true);
          if (thesis.thesis_points && Array.isArray(thesis.thesis_points)) {
            setThesisInputs(thesis.thesis_points);
          }
        }
      } else {
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    }
    initializeOverview();
  }, [ticker]);

  const handleThesisInputChange = (index: number, value: string) => {
    const updated = [...thesisInputs];
    updated[index] = value;
    setThesisInputs(updated);
  };

  const handleSaveThesis = () => {
    if (!isLoggedIn) {
      // Store in session storage temporarily and redirect
      sessionStorage.setItem(`pending_thesis_${ticker}`, JSON.stringify(thesisInputs));
      router.push(`/login?redirect=/company/${ticker}`);
    } else {
      // Save thesis action
      alert('Thesis saved! Investment IQ will now monitor these points against future earnings.');
      setHasThesis(true);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 font-medium animate-pulse">Loading {ticker} research workspace...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* Top Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="font-extrabold text-xl tracking-tight text-gray-900 flex items-center gap-2">
            Investment IQ
            <span className="flex gap-0.5">
              <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            </span>
          </Link>

          <div>
            {isLoggedIn ? (
              <button
                onClick={() => router.push('/dashboard')}
                className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition-colors cursor-pointer"
              >
                ← My Dashboard
              </button>
            ) : (
              <div className="flex gap-3">
                <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-3 py-2">
                  Sign In
                </Link>
                <Link href="/login" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 shadow-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-10">
        
        {/* EXECUTIVE SUMMARY HERO */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900">{ticker} Investment Workspace</h1>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">Interactive Research</span>
          </div>
          
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* Bottom Line Assessment */}
              <div className="flex flex-col justify-between">
                <div>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Overall Assessment</h2>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-extrabold text-gray-900">Excellent Business</span>
                    <span className="text-xs font-bold px-2 py-0.5 bg-green-100 text-green-700 rounded-full">🟢 High Quality</span>
                  </div>
                  <p className="text-sm text-gray-600 font-medium leading-relaxed">
                    {ticker} is one of the highest-quality businesses in public markets, supported by a durable competitive moat, exceptional management, and strong secular demand. The primary consideration for investors today is its premium valuation.
                  </p>
                </div>

                {/* Quick Strengths & Watch Points */}
                <div className="mt-6 pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-bold text-green-700 uppercase tracking-wider mb-1.5">Key Strengths</p>
                    <p className="text-xs text-gray-700 font-medium">✓ Wide Moat & AI Leadership</p>
                    <p className="text-xs text-gray-700 font-medium">✓ Exceptional Margins</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider mb-1.5">Watch Points</p>
                    <p className="text-xs text-gray-700 font-medium">⚠ Premium Valuation</p>
                    <p className="text-xs text-gray-700 font-medium">⚠ Geopolitical Restrictions</p>
                  </div>
                </div>
              </div>

              {/* Quick Snapshot Metrics Grid */}
              <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 flex flex-col justify-between">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Snapshot</p>
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                    <span className="text-xs font-bold text-gray-600 uppercase">Business Quality</span>
                    <span className="text-sm font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-xs">🟢</span> Excellent</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                    <span className="text-xs font-bold text-gray-600 uppercase">Management</span>
                    <span className="text-sm font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-xs">🟢</span> Trusted</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                    <span className="text-xs font-bold text-gray-600 uppercase">Growth</span>
                    <span className="text-sm font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-xs">🟢</span> Exceptional</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-gray-200/60 pb-2">
                    <span className="text-xs font-bold text-gray-600 uppercase">Valuation</span>
                    <span className="text-sm font-extrabold text-yellow-600 flex items-center gap-1.5"><span className="text-xs">🟡</span> Premium</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-600 uppercase">Risk Profile</span>
                    <span className="text-sm font-extrabold text-green-700 flex items-center gap-1.5"><span className="text-xs">🟢</span> Low Risk</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      {/* --- CORE PRODUCT MOAT: MY INVESTMENT THESIS --- */}
        <div className="mb-10">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-8 rounded-3xl shadow-xl border border-blue-800">
            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full mb-3 border border-blue-400/30">
                  ⚡ Core Feature
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight">Build My Investment Thesis</h2>
                <p className="text-sm text-blue-200 mt-1.5 font-medium max-w-xl">
                  Record why you're investing before emotions take over.
                </p>
              </div>

              {hasThesis && (
                <div className="bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Thesis Status: Strengthening
                </div>
              )}
            </div>

            {/* Interactive Inputs */}
            <div className="space-y-3 mb-6">
              {thesisInputs.map((point, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2.5 rounded-xl border border-white/10 focus-within:border-blue-400 transition-all">
                  <span className="w-6 h-6 rounded-lg bg-blue-600/50 text-blue-200 flex items-center justify-center font-bold text-xs shrink-0">
                    {idx + 1}
                  </span>
                  <input
                    type="text"
                    value={point}
                    onChange={(e) => handleThesisInputChange(idx, e.target.value)}
                    placeholder={`Key thesis driver #${idx + 1}...`}
                    className="w-full bg-transparent text-sm text-white placeholder-blue-300/50 focus:outline-none font-medium"
                  />
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
              <p className="text-xs text-blue-300 font-medium">
                {!isLoggedIn 
                  ? "Sign in to save your thesis." 
                  : "Your thesis is saved and tracked against future earnings."}
              </p>
              <button
                onClick={handleSaveThesis}
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold px-6 py-3 rounded-xl transition-all shadow-lg hover:shadow-blue-500/25 cursor-pointer whitespace-nowrap"
              >
                {isLoggedIn ? (hasThesis ? 'Update Saved Thesis' : 'Save Thesis') : 'Sign In to Save →'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          
          {/* LEFT 2 COLUMNS: Deep Dive Research */}
          <div className="lg:col-span-2 space-y-8">

            {/* WHAT'S CHANGED SECTION (Connected to Thesis) */}
            <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider">What's Changed Since Last Earnings</h3>
                  <p className="text-[11px] text-blue-700 font-medium">Evaluation against your saved thesis points</p>
                </div>
                <span className="text-[10px] font-semibold text-blue-600 bg-blue-100/80 px-2.5 py-1 rounded-full">Updated after Q2 FY27 earnings</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="flex items-start gap-2 text-sm text-gray-800 font-medium bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-green-600 font-bold">↑</span> 
                  <div>
                    <span>Revenue guidance raised</span>
                    <p className="text-[10px] text-emerald-600 font-bold">Strengthens Thesis Point #1</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-800 font-medium bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-green-600 font-bold">↑</span> 
                  <div>
                    <span>Networking demand stronger</span>
                    <p className="text-[10px] text-emerald-600 font-bold">Strengthens Thesis Point #3</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-800 font-medium bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-green-600 font-bold">↑</span> 
                  <div>
                    <span>Gross margins improved</span>
                    <p className="text-[10px] text-emerald-600 font-bold">Strengthens Thesis Point #3</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-800 font-medium bg-white p-2.5 rounded-xl border border-gray-100 shadow-sm">
                  <span className="text-amber-600 font-bold">⚠</span> 
                  <div>
                    <span>Export restrictions remain</span>
                    <p className="text-[10px] text-amber-600 font-bold">Watch Item for Moat</p>
                  </div>
                </div>
              </div>
            </div>

            {/* PROGRESSIVE DISCLOSURE CARDS WITH THESIS ALIGNMENT */}
            <div className="space-y-6">
              <ProgressiveCard 
                question="Is this a high-quality business?"
                statusText="Excellent"
                statusType="green"
                thesisSupportText="✔ Supports Thesis"
                thesisSupportType="supports"
                summary={`${ticker} benefits from expanding structural demand, industry-leading margins, and exceptional free cash flow generation.`}
                evidence={[
                  "Revenue growth accelerating year-over-year",
                  "Gross margins expanding due to software and high-tier hardware mix",
                  "Robust free cash flow conversion allows heavy R&D reinvestment"
                ]}
              />

              <ProgressiveCard 
                question="Does it have a durable competitive advantage?"
                statusText="Exceptional"
                statusType="green"
                thesisSupportText="✔ Supports Thesis"
                thesisSupportType="supports"
                summary="A dominant moat built on proprietary software ecosystems and immense switching costs for enterprise customers."
                evidence={[
                  "Deep developer lock-in through proprietary software stack",
                  "Unmatched networking leadership in data center architecture",
                  "Aggressive product cadence makes catching up practically impossible"
                ]}
              />

              <ProgressiveCard 
                question="Can management be trusted?"
                statusText="Trusted"
                statusType="green"
                thesisSupportText="✔ Supports Thesis"
                thesisSupportType="supports"
                summary="Founder-led execution with a proven history of pivoting the company into massive new total addressable markets."
                evidence={[
                  "Founder maintains significant skin in the game",
                  "History of disciplined, counter-cyclical capital allocation",
                  "Clear, consistent communication regarding long-term vision"
                ]}
              />

              <ProgressiveCard 
                question="What could go wrong? (Key Risks)"
                statusText="Monitor"
                statusType="red"
                thesisSupportText="⚠ Thesis Risk"
                thesisSupportType="risk"
                summary="The primary threats involve geopolitical constraints, eventual cyclical slowdowns in capital expenditure, and intense competition."
                evidence={[
                  "Geopolitical export restrictions limiting revenue in key global regions",
                  "Over-reliance on top 5 hyperscaler customers for majority of revenue",
                  "Competitors developing in-house custom silicon to bypass dependency"
                ]}
              />

              <ProgressiveCard 
                question="Is today's valuation attractive?"
                statusText="Premium"
                statusType="yellow"
                thesisSupportText="⚠ Neutral / Watch"
                thesisSupportType="neutral"
                summary="The market expects perfection. The stock is trading at a significant premium to historical averages, requiring sustained hyper-growth to justify."
                evidence={[
                  "Forward P/E ratio is sitting in the top decile of its 5-year history",
                  "Price-to-Sales ratio reflects expectations of continued 40%+ growth",
                  "A great business, but offers a low margin of safety at current prices"
                ]}
              />
            </div>
          </div>

          {/* RIGHT COLUMN: Thesis Workflow & Action Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {/* THESIS WORKFLOW CARD */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">The Investment IQ Workflow</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs">1</div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Formulate Thesis</p>
                      <p className="text-[11px] text-gray-500">Document 3 core reasons to own</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs">2</div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Track Fundamentals</p>
                      <p className="text-[11px] text-gray-500">AI monitors SEC filings & transcripts</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-xs">3</div>
                    <div>
                      <p className="text-xs font-bold text-gray-900">Validate Conviction</p>
                      <p className="text-[11px] text-gray-500">Know when thesis strengthens or breaks</p>
                    </div>
                  </div>
                </div>
              </div>

              {!isLoggedIn ? (
                /* EMOTIONAL LOGGED-OUT CTA */
                <div className="bg-gradient-to-br from-gray-900 to-blue-900 text-white p-8 rounded-3xl shadow-xl border border-gray-800">
                  <h3 className="text-2xl font-extrabold mb-4 leading-tight">Never lose your investment thesis.</h3>
                  
                  <ul className="space-y-4 text-sm text-gray-300 mb-8 font-medium">
                    <li className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">✓</span> 
                      Track why you bought
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">✓</span> 
                      Know what changes your mind
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">✓</span> 
                      Receive automated earnings updates
                    </li>
                  </ul>

                  <button
                    onClick={() => router.push(`/login?redirect=/company/${ticker}`)}
                    className="w-full bg-white text-gray-900 font-extrabold py-4 px-4 rounded-xl hover:bg-blue-50 transition-all shadow-md text-center text-sm cursor-pointer"
                  >
                    Create Free Account →
                  </button>
                  <p className="text-center text-xs text-gray-400 mt-4">Free forever for up to 5 companies.</p>
                </div>
              ) : (
                /* LOGGED-IN THESIS SUMMARY CARD */
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-3">Thesis Health</h3>
                  
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3.5 rounded-xl text-xs font-bold mb-4 flex items-center gap-2">
                    <span className="text-sm">🟢</span> Thesis Strengthened (+3 Points Validated)
                  </div>

                  <button
                    onClick={() => router.push(`/dashboard`)}
                    className="w-full bg-gray-900 text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-colors shadow-sm text-xs cursor-pointer"
                  >
                    View All Portfolio Theses →
                  </button>
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}