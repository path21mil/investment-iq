'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// --- MOCK DATA TYPES & SETUP ---
type ThesisState = 'Weakening' | 'Review Recommended' | 'Strengthening' | 'No Material Change';

interface TrackedCompany {
  ticker: string;
  name: string;
  price: string;
  valuation: { status: 'green' | 'yellow' | 'red'; text: string };
  thesisState: ThesisState;
  latestUpdateContext: {
    event: string;
    impactText: string;
    impactPoints: string[];
  };
}

const MOCK_PORTFOLIO: TrackedCompany[] = [
  {
    ticker: 'MSFT',
    name: 'Microsoft Corp',
    price: '$415.32',
    valuation: { status: 'green', text: 'Fair' },
    thesisState: 'Review Recommended',
    latestUpdateContext: {
      event: 'Q3 Earnings',
      impactText: '1 of your 3 thesis drivers weakened.',
      impactPoints: ['- Azure growth decelerated to 28%']
    }
  },
  {
    ticker: 'NVDA',
    name: 'NVIDIA Corp',
    price: '$121.52',
    valuation: { status: 'yellow', text: 'Premium' },
    thesisState: 'No Material Change',
    latestUpdateContext: {
      event: 'No recent updates',
      impactText: 'Fundamentals remain aligned with thesis.',
      impactPoints: []
    }
  },
  {
    ticker: 'AMD',
    name: 'Advanced Micro Devices',
    price: '$200.09',
    valuation: { status: 'yellow', text: 'Premium' },
    thesisState: 'Strengthening',
    latestUpdateContext: {
      event: 'Q2 Earnings',
      impactText: '3 of your 4 thesis drivers improved.',
      impactPoints: ['+ AI data center revenue beat expectations', '+ Gross margins expanded 200bps']
    }
  },
  {
    ticker: 'INTC',
    name: 'Intel Corp',
    price: '$30.15',
    valuation: { status: 'red', text: 'Value Trap' },
    thesisState: 'Weakening',
    latestUpdateContext: {
      event: 'Foundry Update',
      impactText: 'Core thesis driver broken.',
      impactPoints: ['- Foundry operating losses expanded', '- Capex reduction limits turnaround']
    }
  }
];

// --- MAIN DASHBOARD COMPONENT ---
export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Toggle this to true to see the "Day 1" Empty State
  const [isEmptyState, setIsEmptyState] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/company/${searchQuery.trim().toUpperCase()}`);
    }
  };

  // --- SORTING LOGIC ---
  // 1. Weakening (🔴) -> 2. Review (🟡) -> 3. Strengthening (🟢) -> 4. No Change (⚪)
  const sortedPortfolio = useMemo(() => {
    const sortOrder: Record<ThesisState, number> = {
      'Weakening': 1,
      'Review Recommended': 2,
      'Strengthening': 3,
      'No Material Change': 4
    };
    
    return [...MOCK_PORTFOLIO].sort((a, b) => sortOrder[a.thesisState] - sortOrder[b.thesisState]);
  }, []);

  // --- UI CONFIGURATION MAPS ---
  const stateConfig: Record<ThesisState, { bg: string, text: string, border: string, icon: string }> = {
    'Weakening': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🔴' },
    'Review Recommended': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🟡' },
    'Strengthening': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🟢' },
    'No Material Change': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: '⚪' }
  };

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
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsEmptyState(!isEmptyState)}
              className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
            >
              Toggle Empty State
            </button>
            <span className="text-sm font-medium text-gray-500 hidden sm:block">padamkcinvesting@gmail.com</span>
            <button className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-12">
        
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Welcome back, Padam.</h1>
          {!isEmptyState && (
            <p className="text-gray-500 font-medium">2 investment theses have changed since your last visit.</p>
          )}
        </div>

        {/* Global Search Bar */}
        <div className="max-w-xl mb-12">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search to track a new company..."
              className="w-full bg-white border border-gray-200 rounded-2xl py-4 pl-12 pr-4 text-gray-900 text-sm font-bold placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-blue-50 focus:border-blue-500 transition-all shadow-sm"
            />
          </form>
          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-gray-400">
            <span>Examples:</span>
            {['NVDA', 'MSFT', 'AMD', 'COST'].map(t => (
              <button key={t} onClick={() => router.push(`/company/${t}`)} className="hover:text-blue-600 transition-colors cursor-pointer">{t}</button>
            ))}
          </div>
        </div>

        {/* --- DYNAMIC VIEW PORT (Empty vs Populated) --- */}
        {isEmptyState ? (
          /* DAY 1 EMPTY STATE */
          <div className="bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 rounded-3xl p-10 text-center text-white shadow-xl max-w-3xl mx-auto mt-16 border border-blue-800 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-emerald-400"></div>
            <div className="w-16 h-16 bg-blue-800/50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-blue-700/50">
              <span className="text-3xl">🧭</span>
            </div>
            <h2 className="text-3xl font-extrabold mb-3">Welcome to Investment IQ.</h2>
            <p className="text-blue-200 text-lg mb-8 max-w-lg mx-auto">
              Every great investment starts with a clear thesis. Search for a company above to research your first business and build your conviction portfolio.
            </p>
            <button 
              onClick={() => document.querySelector('input')?.focus()}
              className="bg-white text-gray-900 font-extrabold px-8 py-3.5 rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-blue-500/20 cursor-pointer"
            >
              Start Researching →
            </button>
          </div>
        ) : (
          /* POPULATED PORTFOLIO STATE */
          <div>
            <div className="flex items-center justify-between mb-6 border-b border-gray-200 pb-4">
              <h2 className="text-xl font-bold text-gray-900">My Conviction Portfolio</h2>
              <div className="flex gap-4 text-sm font-semibold">
                <button className="text-blue-600 border-b-2 border-blue-600 pb-1">All (4)</button>
                <button className="text-gray-400 hover:text-gray-900 transition-colors pb-1">Updated (1)</button>
                <button className="text-gray-400 hover:text-gray-900 transition-colors pb-1">Review Needed (2)</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPortfolio.map((company) => {
                const config = stateConfig[company.thesisState];
                const needsReview = company.thesisState === 'Weakening' || company.thesisState === 'Review Recommended';

                return (
                  <div key={company.ticker} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
                    
                    {/* Top Section: Status & Identity */}
                    <div className="p-6 pb-4 border-b border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 font-extrabold flex items-center justify-center text-lg shadow-inner">
                            {company.ticker.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-lg leading-tight">{company.ticker}</h3>
                          </div>
                        </div>
                      </div>
                      
                      {/* Standardized Thesis Badge */}
                      <div className={`w-full ${config.bg} ${config.text} border ${config.border} px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm`}>
                        <span className="text-sm">{config.icon}</span> 
                        {company.thesisState}
                      </div>
                    </div>

                    {/* Middle Section: The Update Context */}
                    <div className="p-6 bg-gray-50/50 flex-grow">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Latest Update</p>
                        <p className="text-[10px] font-bold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full">{company.latestUpdateContext.event}</p>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <p className={`text-xs font-bold mb-2 ${needsReview ? 'text-amber-700' : 'text-gray-700'}`}>
                          {company.latestUpdateContext.impactText}
                        </p>
                        {company.latestUpdateContext.impactPoints.length > 0 && (
                          <ul className="space-y-1.5">
                            {company.latestUpdateContext.impactPoints.map((point, idx) => (
                              <li key={idx} className="text-[11px] text-gray-600 font-medium flex items-start gap-1">
                                <span className={point.startsWith('+') ? 'text-emerald-500' : 'text-rose-500 font-bold'}>
                                  {point.charAt(0)}
                                </span>
                                {point.substring(1)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Bottom Section: Metrics & Action */}
                    <div className="p-6 pt-4 border-t border-gray-100 bg-white">
                      <div className="flex justify-between items-center text-sm mb-4">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Price</span>
                          <span className="font-bold text-gray-900">{company.price}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Valuation</span>
                          <span className={`font-bold flex items-center gap-1.5 ${
                            company.valuation.status === 'red' ? 'text-rose-700' : 
                            company.valuation.status === 'yellow' ? 'text-amber-700' : 'text-emerald-700'
                          }`}>
                            <span className="text-[10px]">
                              {company.valuation.status === 'red' ? '🔴' : company.valuation.status === 'yellow' ? '🟡' : '🟢'}
                            </span> 
                            {company.valuation.text}
                          </span>
                        </div>
                      </div>

                      {/* Deep Link Action Button */}
                      <button 
                        onClick={() => router.push(`/company/${company.ticker}#updates`)}
                        className={`w-full font-bold py-3.5 rounded-xl transition-all shadow-sm text-sm cursor-pointer ${
                          needsReview 
                            ? 'bg-amber-100 text-amber-900 hover:bg-amber-200' 
                            : 'bg-gray-900 text-white hover:bg-gray-800'
                        }`}
                      >
                        {needsReview ? 'Review Required →' : 'Open Research →'}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}