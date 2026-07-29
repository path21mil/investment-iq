'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CompanyOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const ticker = (params.ticker as string || 'AMD').toUpperCase();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasThesis, setHasThesis] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function checkAuthAndThesis() {
      // 1. Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsLoggedIn(true);

        // 2. If logged in, check if user has a saved thesis for this company
        const { data: thesis } = await supabase
          .from('theses')
          .select('id')
          .eq('ticker', ticker)
          .maybeSingle();

        if (thesis) {
          setHasThesis(true);
        }
      } else {
        setIsLoggedIn(false);
      }

      setIsLoading(false);
    }

    checkAuthAndThesis();
  }, [ticker]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-400 animate-pulse">
        Loading company data...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-black pb-20">
      <main className="max-w-6xl mx-auto px-6 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Public Company Info */}
          <div className="lg:col-span-2 space-y-8">
            <h1 className="text-3xl font-extrabold">{ticker} Overview</h1>
            {/* Core Business, Drivers, and Risks sections go here */}
          </div>

          {/* RIGHT COLUMN: Conditional Sidebar Card */}
          <div className="lg:col-span-1">
            {!isLoggedIn ? (
              /* LOGGED-OUT CTA CARD */
              <div className="bg-gradient-to-br from-blue-900 to-blue-700 text-white p-6 rounded-2xl shadow-lg">
                <h3 className="text-xl font-bold mb-2">Track {ticker}</h3>
                <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                  Sign in or create a free account to build a custom thesis, select drivers, and track your conviction over time.
                </p>
                <button
                  onClick={() => router.push(`/login?redirect=/thesis?ticker=${ticker}`)}
                  className="w-full bg-white text-blue-900 font-bold py-3 px-4 rounded-xl hover:bg-blue-50 transition-colors shadow-sm cursor-pointer"
                >
                  Sign In to Build Thesis →
                </button>
              </div>
            ) : (
              /* LOGGED-IN THESIS STATUS CARD */
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Thesis Status</h3>
                
                {hasThesis ? (
                  <div className="space-y-4">
                    <p className="text-sm text-green-600 font-semibold">✓ Active Thesis Saved</p>
                    <button
                      onClick={() => router.push(`/review/${ticker}`)}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      Manage Conviction
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-500">No thesis created for {ticker} yet.</p>
                    <button
                      onClick={() => router.push(`/thesis?ticker=${ticker}`)}
                      className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors"
                    >
                      + Build Thesis
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}