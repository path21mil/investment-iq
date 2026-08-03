'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { supabase } from '@/lib/supabase'; // MUST IMPORT SUPABASE

// Defining the shape of our data
interface TrackedCompany {
  ticker: string;
  name: string;
  status: string;
  latestUpdate: string;
  updateTime: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [portfolio, setPortfolio] = useState<TrackedCompany[]>([]);
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      // 1. Check Auth Status
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login'); // Kick them out if not logged in
        return;
      }
      
      setUserEmail(session.user.email || 'User');

      // 2. Fetch REAL Portfolio Data from Supabase
      const { data: theses, error } = await supabase
        .from('theses')
        .select('*')
        .eq('user_id', session.user.id);

      if (error) throw error;

      // Map the database rows to our UI format
      const userPortfolio = (theses || []).map(t => ({
        ticker: t.ticker,
        name: t.company_name || `${t.ticker} INC.`,
        status: t.thesis_state || 'Strengthening',
        latestUpdate: 'Fundamentals remain aligned with thesis.',
        updateTime: 'Tracking active'
      }));
      
      setPortfolio(userPortfolio);

      // 3. Fetch the LIVE PRICES using the real tickers
      const tickers = userPortfolio.map(c => c.ticker).join(',');
      
      if (tickers) {
        const res = await fetch(`/api/stock?symbols=${tickers}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.prices) {
            setLivePrices(data.prices);
          }
        }
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setTimeout(() => setIsLoading(false), 800);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/company/${searchQuery.trim().toUpperCase()}`);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // ==========================================
  // 1. THE SKELETON LOADER STATE
  // ==========================================
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
        <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-4 w-48 bg-gray-100 rounded animate-pulse"></div>
        </nav>

        <main className="flex-grow max-w-5xl mx-auto w-full px-6 py-12">
          <div className="mb-10">
            <div className="h-10 bg-gray-200 rounded-lg w-64 mb-4 animate-pulse"></div>
            <div className="h-5 bg-gray-200 rounded-lg w-96 animate-pulse"></div>
          </div>
          <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
             <div className="h-6 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
             <div className="h-6 bg-gray-200 rounded-lg w-16 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm flex flex-col h-[350px]">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-2xl animate-pulse shrink-0"></div>
                  <div className="w-full">
                    <div className="h-5 bg-gray-200 rounded-md w-1/2 mb-2 animate-pulse"></div>
                    <div className="h-3 bg-gray-100 rounded-md w-1/3 animate-pulse"></div>
                  </div>
                </div>
                <div className="h-10 bg-gray-50 rounded-xl w-full mb-6 border border-gray-100 animate-pulse"></div>
                <div className="h-20 bg-gray-50 rounded-xl w-full mb-6 border border-gray-100 animate-pulse"></div>
                <div className="h-12 bg-gray-200 rounded-xl w-full animate-pulse mt-auto"></div>
              </div>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ==========================================
  // 2. THE ACTUAL DASHBOARD STATE
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-extrabold text-xl tracking-tight flex items-center gap-2 cursor-pointer" onClick={() => router.push('/')}>
            Investment IQ
            <span className="flex gap-0.5">
              <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
              <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
            <span className="hidden sm:inline">{userEmail}</span>
            <button onClick={handleSignOut} className="font-bold text-gray-900 hover:text-blue-600 transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight mb-2">Welcome back.</h1>
          <p className="text-lg text-gray-500 font-medium">Here are the latest updates on your tracked theses.</p>
        </div>

        {/* Search Bar */}
        <div className="max-w-2xl mb-12">
          <form onSubmit={handleSearch} className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search to track a new company..."
              className="w-full bg-white border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-gray-900 font-medium placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all shadow-sm"
            />
          </form>
          <div className="mt-3 flex items-center gap-3 text-xs font-medium text-gray-400">
            <span>Examples:</span>
            {['NVDA', 'MSFT', 'AMD', 'COST'].map(t => (
              <button key={t} onClick={() => router.push(`/company/${t}`)} className="hover:text-blue-600 transition-colors cursor-pointer">
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="flex justify-between items-end mb-6 border-b border-gray-200 pb-4">
          <h2 className="text-xl font-extrabold">My Conviction Portfolio</h2>
          <span className="text-sm font-bold text-blue-600 border-b-2 border-blue-600 pb-1">
            All ({portfolio.length})
          </span>
        </div>

        {/* Dynamic Grid: Empty State vs Loaded */}
        {portfolio.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-500">
            <p className="font-bold text-lg text-gray-900 mb-2">Your portfolio is empty.</p>
            <p>Search for a company above to build your first investment thesis!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {portfolio.map((company) => (
              <div key={company.ticker} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                
                {/* Card Header */}
                <div className="flex items-center gap-4 mb-5">
                  <div className="w-12 h-12 bg-gray-50 border border-gray-100 text-gray-900 rounded-2xl flex items-center justify-center text-xl font-extrabold shadow-inner shrink-0">
                    {company.ticker.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900 leading-tight">{company.ticker}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{company.name}</p>
                  </div>
                </div>

                {/* Status Pill */}
                <div className="w-full bg-emerald-50 border border-emerald-100 text-emerald-700 py-2 px-4 rounded-xl text-sm font-bold flex items-center gap-2 mb-6">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shadow-sm"></span>
                  {company.status}
                </div>

                {/* Latest Update */}
                <div className="mb-6 flex-grow">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Latest Update</p>
                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-md">{company.updateTime}</span>
                  </div>
                  <div className="bg-white border border-gray-100 p-4 rounded-xl shadow-sm">
                    <p className="text-sm font-bold text-gray-900">{company.latestUpdate}</p>
                  </div>
                </div>

                {/* Price & Valuation Row */}
                <div className="flex justify-between items-end mb-5 border-t border-gray-50 pt-4">
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Price</p>
                    <p className="font-extrabold text-gray-900">
                      {livePrices[company.ticker] ? `$${livePrices[company.ticker].toFixed(2)}` : 'Loading...'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Valuation</p>
                    <p className="font-bold text-gray-400 text-sm flex items-center justify-end gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-200"></span> Live Tracking Active
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                <button 
                  onClick={() => router.push(`/company/${company.ticker}`)}
                  className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold py-3.5 rounded-xl transition-colors mt-auto"
                >
                  Open Research &rarr;
                </button>

              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}