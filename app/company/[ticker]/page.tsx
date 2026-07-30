'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// --- REUSABLE SNAPSHOT ROW COMPONENT ---
function SnapshotRow({ label, value, color, icon }: { label: string, value: string, color: string, icon: string }) {
  return (
    <div className="flex justify-between items-center border-b border-gray-200/60 pb-3 last:border-0 last:pb-0">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-extrabold flex items-center gap-1.5 ${color}`}>
        <span className="text-[10px]">{icon}</span> {value}
      </span>
    </div>
  );
}

// --- REUSABLE PROGRESSIVE DISCLOSURE COMPONENT ---
function ProgressiveCard({ 
  question, statusText, statusType, thesisSupportText, thesisSupportType, summary, evidence, showThesisBadge = false 
}: { 
  question: string, statusText: string, statusType: 'green' | 'yellow' | 'red', thesisSupportText: string, thesisSupportType: 'supports' | 'neutral' | 'risk', summary: string, evidence: string[], showThesisBadge?: boolean
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
          <p className="text-sm md:text-base text-gray-700 font-medium leading-relaxed max-w-4xl">{summary}</p>
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
  const ticker = (params.ticker as string || 'TSLA').toUpperCase();

  const [searchQuery, setSearchQuery] = useState('');
  
  // -- CRITICAL FIX: Proper Auth State Tracking --
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasThesis, setHasThesis] = useState(false);
  const [thesisState, setThesisState] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuthStateAndThesis() {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setIsAuthenticated(false);
        setHasThesis(false);
        setIsLoading(false);
        return;
      }

      // If they are logged in, mark authenticated and check for a thesis
      setIsAuthenticated(true);
      const { data: savedThesis } = await supabase
        .from('theses')
        .select('id, thesis_state')
        .eq('user_id', session.user.id)
        .eq('ticker', ticker)
        .maybeSingle();

      if (savedThesis) {
        setHasThesis(true);
        setThesisState(savedThesis.thesis_state || 'Strengthening');
      } else {
        setHasThesis(false);
      }
      setIsLoading(false);
    }

    checkAuthStateAndThesis();
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
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="font-extrabold text-lg tracking-tight text-gray-900 flex items-center gap-2 shrink-0">
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
                placeholder="Search symbol (e.g. MSFT)"
                className="w-full bg-gray-100 border border-transparent rounded-xl py-2 pl-9 pr-4 text-xs font-bold text-gray-900 placeholder-gray-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-all"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </form>

          {/* LOGIC FIX: Show 'Dashboard' if logged in, 'Sign In' if logged out */}
          {!isLoading && (
            isAuthenticated ? (
              <Link href="/dashboard" className="bg-blue-50 text-blue-600 border border-blue-100 font-bold px-4 py-2 rounded-xl text-xs hover:bg-blue-100 transition-colors shrink-0">
                ← Go to My Dashboard
              </Link>
            ) : (
              <Link href={`/login?redirect=/company/${ticker}`} className="bg-blue-600 text-white font-bold px-5 py-2 rounded-xl text-xs hover:bg-blue-700 transition-colors shrink-0">
                Sign In
              </Link>
            )
          )}
        </div>
      </nav>

      {/* RESTORED MAIN HEADER */}
      <div className="max-w-[1200px] mx-auto px-6 py-10 mt-2">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight">{ticker} Research Snapshot</h1>
            <span className="bg-blue-100 text-blue-700 text-xs font-extrabold px-3 py-1.5 rounded-md uppercase tracking-wide">
              Alpha Research
            </span>
            
            {/* THESIS BADGE (Only shows if logged in AND has thesis) */}
            {isAuthenticated && hasThesis && (
              <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-extrabold px-3 py-1.5 rounded-md flex items-center gap-1.5 shadow-sm">
                <span>🟢</span> Thesis: {thesisState}
              </span>
            )}
          </div>

          <button 
            onClick={() => router.push(isAuthenticated ? `/build-thesis/${ticker}` : `/login?redirect=/build-thesis/${ticker}`)}
            className="border border-blue-200 text-blue-600 bg-white hover:bg-blue-50 font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm text-sm cursor-pointer flex items-center gap-2"
          >
            {isAuthenticated && hasThesis ? '⚡ Update Saved Thesis' : '↓ Jump to Thesis Engine'}
          </button>
        </div>

        {/* RESTORED EXPLORE BUTTONS */}
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-gray-500">Explore other research:</span>
          {['MSFT', 'AMD', 'COST', 'AAPL'].filter(t => t !== ticker).map(t => (
            <button key={t} onClick={() => router.push(`/company/${t}`)} className="bg-white border border-gray-200 text-gray-600 font-bold text-xs px-3 py-1.5 rounded-lg hover:border-gray-300 hover:text-gray-900 transition-colors">
              {t}
            </button>
          ))}
        </div>

        {/* RESTORED OVERALL ASSESSMENT CARD */}
        <div className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-8 md:p-10 mt-8">
          <div className="flex flex-col lg:flex-row gap-12">
            
            {/* Left Content */}
            <div className="flex-1">
              <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-3">Overall Assessment</p>
              <div className="flex items-center gap-3 mb-6">
                <h2 className="text-3xl font-black text-gray-900">Excellent Business</h2>
                <span className="bg-green-100 text-green-800 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">🟢 High Quality</span>
              </div>
              <p className="text-base text-gray-600 font-medium leading-relaxed mb-8 max-w-2xl">
                {ticker} remains one of the highest-quality businesses globally, supported by a structural AI moat, dominant developer ecosystem, and stellar margin expansion. The key factor for investors to monitor is sustained capital expenditure levels against premium valuation multiples.
              </p>
              
              <div className="flex flex-wrap gap-12 border-t border-gray-100 pt-8">
                <div>
                  <p className="text-[10px] font-extrabold text-green-600 uppercase tracking-widest mb-3">Key Strengths</p>
                  <ul className="text-sm font-medium text-gray-700 space-y-2.5">
                    <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Wide Moat & Software Lock-in</li>
                    <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Exceptional Operating Margins</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-extrabold text-amber-600 uppercase tracking-widest mb-3">Watch Points</p>
                  <ul className="text-sm font-medium text-gray-700 space-y-2.5">
                    <li className="flex items-center gap-2"><span className="text-amber-500 font-bold">⚠</span> Premium Historical Valuation</li>
                    <li className="flex items-center gap-2"><span className="text-amber-500 font-bold">⚠</span> Export Control Restrictions</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Right Content (Snapshot Panel) */}
            <div className="w-full lg:w-80 bg-gray-50/80 rounded-2xl p-6 border border-gray-100 shrink-0">
              <p className="text-[11px] font-extrabold text-gray-400 uppercase tracking-widest mb-6">Quick Snapshot</p>
              <div className="space-y-4">
                <SnapshotRow label="Business Quality" value="Excellent" color="text-green-700" icon="🟢" />
                <SnapshotRow label="Management" value="Trusted" color="text-green-700" icon="🟢" />
                <SnapshotRow label="Growth" value="Exceptional" color="text-green-700" icon="🟢" />
                <SnapshotRow label="Valuation" value="Premium" color="text-amber-700" icon="🟠" />
                <SnapshotRow label="Risk Profile" value="Low Risk" color="text-green-700" icon="🟢" />
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* MAIN RESEARCH CONTENT */}
      <main className="max-w-[1200px] mx-auto px-6 pt-4">

        {/* WORKFLOW BANNER */}
        <div className="mb-10">
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
                <p className="text-xs text-gray-500 mt-0.5">Launch Wizard to lock in 3 drivers.</p>
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
        </div>
      </main>
    </div>
  );
}