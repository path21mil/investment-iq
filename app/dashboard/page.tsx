'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// --- TYPES ---
type ThesisState = 'Weakening' | 'Review Recommended' | 'Strengthening' | 'No Material Change';

interface TrackedCompany {
  ticker: string;
  name: string;
  price: string;
  valuation: { status: 'green' | 'yellow' | 'red' | 'gray'; text: string };
  thesisState: ThesisState;
  latestUpdateContext: {
    event: string;
    impactText: string;
    impactPoints: string[];
  };
}

export default function DashboardPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real Data States
  const [portfolio, setPortfolio] = useState<TrackedCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // --- FETCH DATA FROM SUPABASE ---
  useEffect(() => {
    async function loadDashboard() {
      // 1. Get current logged-in user
      const { data: { session }, error: authError } = await supabase.auth.getSession();
      
      if (authError || !session) {
        router.push('/login'); // Boot them to login if not authenticated
        return;
      }

      setUserEmail(session.user.email || 'User');

      // 2. Fetch their specific saved theses
      const { data: thesesData, error: dbError } = await supabase
        .from('theses')
        .select('*')
        .eq('user_id', session.user.id);

      if (dbError) {
        console.error('Error fetching portfolio:', dbError);
        setIsLoading(false);
        return;
      }

      // 3. Map DB rows to our UI Card format
      if (thesesData) {
        const formattedPortfolio: TrackedCompany[] = thesesData.map((row) => ({
          ticker: row.ticker,
          name: row.company_name || 'Unknown Company',
          // Price and Valuation will come from our Financial API in the next phase!
          price: '$---', 
          valuation: { status: 'gray', text: 'Live API Pending' },
          
          thesisState: (row.thesis_state as ThesisState) || 'No Material Change',
          latestUpdateContext: {
            event: row.latest_update_event || 'No recent updates',
            impactText: row.latest_update_impact || 'Fundamentals remain aligned with thesis.',
            impactPoints: row.impact_points || []
          }
        }));
        
        setPortfolio(formattedPortfolio);
      }
      
      setIsLoading(false);
    }

    loadDashboard();
  }, [router]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/company/${searchQuery.trim().toUpperCase()}`);
    }
  };

  // --- SORTING LOGIC ---
  const sortedPortfolio = useMemo(() => {
    const sortOrder: Record<ThesisState, number> = {
      'Weakening': 1,
      'Review Recommended': 2,
      'Strengthening': 3,
      'No Material Change': 4
    };
    
    return [...portfolio].sort((a, b) => {
      const orderA = sortOrder[a.thesisState] || 5;
      const orderB = sortOrder[b.thesisState] || 5;
      return orderA - orderB;
    });
  }, [portfolio]);

  // --- UI CONFIGURATION MAPS ---
  const stateConfig: Record<string, { bg: string, text: string, border: string, icon: string }> = {
    'Weakening': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: '🔴' },
    'Review Recommended': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: '🟡' },
    'Strengthening': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '🟢' },
    'No Material Change': { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200', icon: '⚪' }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-blue-600 font-bold animate-pulse text-lg tracking-tight">Loading your conviction portfolio...</div>
      </div>
    );
  }

  const isEmptyState = portfolio.length === 0;

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
            <span className="text-sm font-medium text-gray-500 hidden sm:block">{userEmail}</span>
            <button 
              onClick={async () => {
                await supabase.auth.signOut();
                router.push('/');
              }}
              className="text-sm font-bold text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-6 pt-12">
        
        {/* Welcome Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 mb-2">Welcome back.</h1>
          {!isEmptyState && (
            <p className="text-gray-500 font-medium">Here are the latest updates on your tracked theses.</p>
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

        {/* --- DYNAMIC VIEW PORT --- */}
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
                <button className="text-blue-600 border-b-2 border-blue-600 pb-1">All ({portfolio.length})</button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedPortfolio.map((company) => {
                const config = stateConfig[company.thesisState] || stateConfig['No Material Change'];
                const needsReview = company.thesisState === 'Weakening' || company.thesisState === 'Review Recommended';

                return (
                  <div key={company.ticker} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
                    
                    {/* Top Section */}
                    <div className="p-6 pb-4 border-b border-gray-100">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 text-gray-700 font-extrabold flex items-center justify-center text-lg shadow-inner">
                            {company.ticker.charAt(0)}
                          </div>
                          <div>
                            <h3 className="font-extrabold text-gray-900 text-lg leading-tight">{company.ticker}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate max-w-[120px]">{company.name}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className={`w-full ${config.bg} ${config.text} border ${config.border} px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm`}>
                        <span className="text-sm">{config.icon}</span> 
                        {company.thesisState}
                      </div>
                    </div>

                    {/* Middle Section: Updates */}
                    <div className="p-6 bg-gray-50/50 flex-grow">
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Latest Update</p>
                        <p className="text-[10px] font-bold text-blue-600 bg-blue-100/50 px-2 py-0.5 rounded-full">{company.latestUpdateContext.event}</p>
                      </div>
                      
                      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm">
                        <p className={`text-xs font-bold mb-2 ${needsReview ? 'text-amber-700' : 'text-gray-700'}`}>
                          {company.latestUpdateContext.impactText}
                        </p>
                        {company.latestUpdateContext.impactPoints && company.latestUpdateContext.impactPoints.length > 0 && (
                          <ul className="space-y-1.5">
                            {company.latestUpdateContext.impactPoints.map((point, idx) => (
                              <li key={idx} className="text-[11px] text-gray-600 font-medium flex items-start gap-1">
                                <span className={point.startsWith('+') ? 'text-emerald-500' : point.startsWith('-') ? 'text-rose-500 font-bold' : 'text-blue-500'}>
                                  {point.charAt(0)}
                                </span>
                                {point.substring(1)}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    {/* Bottom Section: API Metrics & Action */}
                    <div className="p-6 pt-4 border-t border-gray-100 bg-white">
                      <div className="flex justify-between items-center text-sm mb-4 opacity-70">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Price</span>
                          <span className="font-bold text-gray-900">{company.price}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Valuation</span>
                          <span className="font-bold flex items-center gap-1.5 text-gray-500">
                            <span className="text-[10px]">⚪</span> {company.valuation.text}
                          </span>
                        </div>
                      </div>

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