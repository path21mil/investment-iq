'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// --- REUSABLE PROGRESSIVE DISCLOSURE COMPONENT ---
function ProgressiveCard({ 
  question, 
  statusText, 
  statusType, 
  thesisSupportText,
  thesisSupportType,
  summary, 
  evidence,
  showThesisBadge = false 
}: { 
  question: string, 
  statusText: string, 
  statusType: 'green' | 'yellow' | 'red',
  thesisSupportText: string,
  thesisSupportType: 'supports' | 'neutral' | 'risk',
  summary: string,
  evidence: string[],
  showThesisBadge?: boolean
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
      <div className="p-6 md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h3 className="text-xl font-bold text-gray-900">{question}</h3>
          
          {showThesisBadge && (
            <div className={`text-xs font-extrabold px-3 py-1 rounded-full border ${thesisStyles[thesisSupportType]} flex items-center gap-1.5`}>
              <span className="text-[10px]">Thesis:</span> {thesisSupportText}
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold ring-1 ring-inset ${activeStyle.bg} ${activeStyle.text} ${activeStyle.ring} mb-4`}>
            <span>{activeStyle.icon}</span> {statusText}
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Why?</p>
          <p className="text-sm md:text-base text-gray-700 font-medium leading-relaxed max-w-4xl">
            {summary}
          </p>
        </div>

        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="mt-5 text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors cursor-pointer"
        >
          {isOpen ? 'Hide Supporting Evidence ↑' : 'View Supporting Evidence ↓'}
        </button>
      </div>

      {isOpen && (
        <div className="px-6 md:px-8 pb-8 pt-4 bg-gray-50/50 border-t border-gray-100">
          <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Evidence</h4>
          <ul className="space-y-3">
            {evidence.map((item, idx) => (
              <li key={idx} className="text-sm md:text-base text-gray-700 flex items-start gap-2 max-w-4xl">
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

export default function CompanyOverviewPage() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params.ticker as string || 'MSFT').toUpperCase();

  const [searchQuery, setSearchQuery] = useState('');
  const [hasThesis, setHasThesis] = useState(false);
  const [thesisState, setThesisState] = useState<string>('Strengthening');
  const [isLoadingThesis, setIsLoadingThesis] = useState(true);

  // --- CHECK SUPABASE FOR EXISTING SAVED THESIS ON MOUNT / TICKER CHANGE ---
  useEffect(() => {
    async function checkSavedThesis() {
      setIsLoadingThesis(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setHasThesis(false);
        setIsLoadingThesis(false);
        return;
      }

      const { data: savedThesis, error } = await supabase
        .from('theses')
        .select('id, thesis_state')
        .eq('user_id', session.user.id)
        .eq('ticker', ticker)
        .maybeSingle();

      if (savedThesis) {
        setHasThesis(true);
        if (savedThesis.thesis_state) {
          setThesisState(savedThesis.thesis_state);
        }
      } else {
        setHasThesis(false);
      }
      setIsLoadingThesis(false);
    }

    checkSavedThesis();
  }, [ticker]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const targetTicker = searchQuery.trim().toUpperCase();
      setSearchQuery('');
      router.push(`/company/${targetTicker}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-20">
      
      {/* GLOBAL NAVBAR */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="font-extrabold text-lg tracking-tight text-gray-900 flex items-center gap-2 shrink-0">
            Investment IQ
            <span className="flex gap-0.5">
              <span className="w-1 h-2 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-3 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
            </span>
          </Link>

          {/* TOP SEARCH BAR */}
          <form onSubmit={handleSearch} className="flex-grow max-w-md">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticker (e.g. TSLA, NVDA)..."
                className="w-full bg-gray-100 border border-transparent rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          <Link href="/dashboard" className="text-xs font-bold text-gray-600 hover:text-gray-900 shrink-0">
            Dashboard
          </Link>
        </div>
      </nav>

      {/* HERO SECTION */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 py-10 md:py-12">
          
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl font-black text-gray-900 tracking-tight">{ticker}</span>
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">{ticker} Corp</span>
            </div>

            {/* DYNAMIC THESIS STATUS BADGE */}
            {hasThesis && !isLoadingThesis && (
              <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm">
                <span>🟢</span> Thesis: {thesisState}
              </div>
            )}
          </div>

          <p className="text-lg text-gray-600 font-medium max-w-3xl leading-relaxed mb-8">
            Deep-dive fundamental analysis and critical tracking points for {ticker}.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <button 
              onClick={() => router.push(`/build-thesis/${ticker}`)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-6 py-3 rounded-xl transition-all shadow-md text-sm cursor-pointer flex items-center gap-2"
            >
              {hasThesis ? '⚡ Update Saved Thesis' : '🚀 Launch Thesis Builder'}
            </button>
          </div>

        </div>
      </div>

      {/* MAIN RESEARCH CONTENT */}
      <main className="max-w-6xl mx-auto px-6 pt-10">

        {/* WORKFLOW BANNER */}
        <div className="mb-10">
          <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">The Investment IQ Workflow</h3>
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 flex-1 w-full border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm shrink-0">1</div>
              <div>
                <p className="text-sm font-bold text-gray-900">Review Evidence</p>
                <p className="text-xs text-gray-500 mt-0.5">Analyze quality, moat & risks below.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-1 w-full border-b md:border-b-0 md:border-r border-gray-100 pb-4 md:pb-0 md:pr-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm shrink-0">2</div>
              <div>
                <p className="text-sm font-bold text-gray-900">Formulate Thesis</p>
                <p className="text-xs text-gray-500 mt-0.5">Launch Wizard to lock in your drivers.</p>
              </div>
            </div>
            <div className="flex items-center gap-4 flex-1 w-full">
              <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm shrink-0">3</div>
              <div>
                <p className="text-sm font-bold text-gray-900">Track Fundamentals</p>
                <p className="text-xs text-gray-500 mt-0.5">AI compares filings against your thesis.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RESEARCH CARDS */}
        <div className="space-y-6">
          <ProgressiveCard 
            question="1. Is this a high-quality business?"
            statusText="Excellent"
            statusType="green"
            thesisSupportText="✔ Supports Thesis"
            thesisSupportType="supports"
            showThesisBadge={hasThesis}
            summary={`${ticker} benefits from expanding structural demand, industry-leading margins, and exceptional cash conversion.`}
            evidence={["Core segment revenue accelerating year-over-year", "Gross margins expanding due to software and enterprise mix", "Cash flow conversion allows heavy R&D reinvestment"]}
          />
          <ProgressiveCard 
            question="2. Does it have a durable competitive advantage?"
            statusText="Exceptional Moat"
            statusType="green"
            thesisSupportText="✔ Supports Thesis"
            thesisSupportType="supports"
            showThesisBadge={hasThesis}
            summary="A dominant moat built on proprietary software ecosystems and switching costs for enterprise software developers."
            evidence={["Deep developer lock-in through proprietary software stack", "Unmatched architecture and scaling capability", "Aggressive product cadence creates massive barriers to entry"]}
          />
          <ProgressiveCard 
            question="3. Can management be trusted?"
            statusText="Trusted"
            statusType="green"
            thesisSupportText="✔ Supports Thesis"
            thesisSupportType="supports"
            showThesisBadge={hasThesis}
            summary="Visionary execution with a proven history of pivoting into massive total addressable markets ahead of competitors."
            evidence={["Leadership maintains significant equity alignment", "Consistent track record of disciplined R&D capital allocation", "Clear, long-term strategic execution"]}
          />
          <ProgressiveCard 
            question="4. What are the key growth drivers?"
            statusText="Strong Acceleration"
            statusType="green"
            thesisSupportText="✔ Supports Thesis"
            thesisSupportType="supports"
            showThesisBadge={hasThesis}
            summary="Broad secular adoption across enterprise compute, cloud infrastructure, and next-gen hardware software integration."
            evidence={["Enterprise capex commitment continuing to expand", "International initiatives driving new orders", "Recurring revenue ramping as adoption grows"]}
          />
          <ProgressiveCard 
            question="5. What could go wrong? (Key Risks)"
            statusText="Monitor"
            statusType="red"
            thesisSupportText="⚠ Thesis Risk"
            thesisSupportType="risk"
            showThesisBadge={hasThesis}
            summary="Geopolitical trade friction, macro spending pauses, and custom silicon development by large enterprise clients."
            evidence={["Geopolitical trade restrictions limiting revenue in specific regions", "Customer concentration among top key accounts", "Competitors building in-house alternative architectures"]}
          />
        </div>

      </main>
    </div>
  );
}