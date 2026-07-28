'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [theses, setTheses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUser(session.user);

      const { data } = await supabase
        .from('theses')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setTheses(data);
      setIsLoading(false);
    }
    loadDashboard();
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = searchQuery.trim().toUpperCase();
    if (!ticker) return;
    setIsSearching(true);
    router.push(`/company/${ticker}`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 font-medium animate-pulse">Loading portfolio...</div>
      </div>
    );
  }

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || 'Investor';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center shadow-sm mb-8">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold tracking-tight text-gray-900">Investment IQ</span>
          <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider">Dashboard</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">{user?.email}</span>
          <button 
            onClick={handleSignOut}
            className="text-sm font-bold text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6">
        
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome back, {firstName}.</h1>
          <p className="text-gray-500 font-medium mt-1">Here is your active conviction portfolio.</p>
        </div>

        {/* --- EMPTY STATE --- */}
        {theses.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-gray-200 shadow-sm text-center max-w-2xl mx-auto mt-12">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">📈</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">You aren't tracking any companies yet.</h2>
            <p className="text-gray-500 leading-relaxed mb-8 text-sm max-w-md mx-auto">
              Search for a stock below to start building your first thesis.
            </p>
            <form onSubmit={handleSearch} className="relative max-w-md mx-auto shadow-sm">
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. AAPL, TSLA, MSFT"
                  className="w-full bg-gray-50 border border-gray-300 rounded-2xl py-4 pl-5 pr-12 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button type="submit" disabled={isSearching} className="absolute right-4 text-gray-400 hover:text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>
            </form>
          </div>
        ) : (
          
          /* --- POPULATED STATE --- */
          <>
            <form onSubmit={handleSearch} className="mb-12 max-w-md">
              <div className="relative flex items-center">
                <input
                  id="dash-search"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search to track a new company..."
                  className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-4 pr-10 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
                />
                <button type="submit" disabled={isSearching} className="absolute right-3 text-gray-400 hover:text-blue-600">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                </button>
              </div>
            </form>

            <h2 className="text-xl font-bold text-gray-900 mb-6">All Tracked Companies</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {theses.map((thesis) => (
                <div key={thesis.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all group flex flex-col h-full overflow-hidden">
                  
                  {/* Card Header */}
                  <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-700 rounded-xl flex items-center justify-center font-bold text-xl">
                      {thesis.ticker.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg leading-tight">{thesis.company_name}</h3>
                      <p className="text-gray-400 text-xs font-semibold">{thesis.ticker} • NASDAQ</p>
                    </div>
                  </div>
                  
                  {/* Card Stats */}
                  <div className="p-6 flex-1 space-y-4 bg-gray-50/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Current Price</span>
                      <span className="font-bold text-gray-900">$200.09</span>
                    </div>
                    
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Valuation</span>
                      <span className="text-yellow-400 tracking-widest text-lg">⭐⭐⭐<span className="text-gray-300">☆☆</span></span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Thesis Status</span>
                      <span className="flex items-center gap-1.5 font-bold text-green-700 bg-green-50 px-2.5 py-1 rounded-md">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Healthy
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-500 font-medium">Last Validated</span>
                      <span className="font-bold text-gray-700">12 days ago</span>
                    </div>
                  </div>
                  
                  {/* View Thesis Button routes to the NEW review screen */}
                  <div className="p-4 bg-white border-t border-gray-100">
                    <button
                      onClick={() => router.push(`/review/${thesis.ticker}`)}
                      className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3 rounded-xl text-sm transition-colors cursor-pointer"
                    >
                      View Thesis
                    </button>
                  </div>

                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}