'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function CompanyOverviewPage() {
  const router = useRouter();
  const params = useParams();
  const ticker = (params.ticker as string || 'NVDA').toUpperCase();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasThesis, setHasThesis] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function initializeOverview() {
      // 1. Check if user is logged in (Do NOT redirect if they are not!)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setIsLoggedIn(true);

        // 2. If logged in, check if they have a saved thesis for this company
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

    initializeOverview();
  }, [ticker]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-400 font-medium animate-pulse">Loading {ticker} overview...</div>
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
      <main className="max-w-6xl mx-auto px-6 pt-8">
        
        {/* Header Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{ticker} Investment Overview</h1>
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-1 rounded-md">FREE RESEARCH</span>
          </div>
          <p className="text-gray-500 text-sm">Fundamental business breakdown and investment drivers.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT 2 COLUMNS: Stage 1 Free Value Proposition */}
          <div className="lg:col-span-2 space-y-8">

            {/* Score Cards / Executive Summary */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Business Quality</p>
                <p className="text-yellow-500 font-bold text-lg">★★★★★</p>
              </div>
              <div className="border-x border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Management</p>
                <p className="text-yellow-500 font-bold text-lg">★★★★☆</p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Valuation</p>
                <p className="text-yellow-500 font-bold text-lg">★★★☆☆</p>
              </div>
            </div>

            {/* Business Quality Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">1. Business Quality</h2>
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Why it matters:</p>
                <p className="text-sm text-gray-800 font-medium mt-1">
                  {ticker} benefits from structural tailwinds and an expanding competitive moat in core growth markets.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Evidence:</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Strong segment revenue acceleration</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Expanding gross and operating margins</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Robust free cash flow conversion</li>
                </ul>
              </div>
            </div>

            {/* Management & Alignment Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">2. Management & Alignment</h2>
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Why it matters:</p>
                <p className="text-sm text-gray-800 font-medium mt-1">
                  Leadership has historically created long-term shareholder value through disciplined capital allocation.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Evidence:</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Consistent ROIC expansion</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Strategic R&D reinvestment</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Clear long-term executive vision</li>
                </ul>
              </div>
            </div>

            {/* Valuation Section */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-2">3. Valuation Breakdown</h2>
              <div className="mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Why it matters:</p>
                <p className="text-sm text-gray-800 font-medium mt-1">
                  A superior business can still yield poor investment returns if purchased at excessive expectations.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Evidence:</p>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> Trading within historical forward P/E range</li>
                  <li className="flex items-center gap-2"><span className="text-green-500 font-bold">✓</span> EV/EBITDA aligned with peer averages</li>
                </ul>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Natural Login Bridge / Action Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              
              {!isLoggedIn ? (
                /* STAGE 1 LOGGED-OUT CTA: Converts guest to user */
                <div className="bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-6 rounded-2xl shadow-xl border border-blue-800">
                  <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center font-bold text-blue-300 text-lg mb-4">
                    ⚡
                  </div>
                  <h3 className="text-xl font-bold mb-2">Want to track {ticker}?</h3>
                  <p className="text-blue-100 text-sm mb-6 leading-relaxed">
                    Build your personal investment thesis. Investment IQ will help you monitor:
                  </p>

                  <ul className="space-y-3 text-sm text-blue-200 mb-8">
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">✓</span> Why you invested
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">✓</span> What could change your mind
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="text-blue-400 font-bold">✓</span> Important company updates
                    </li>
                  </ul>

                  <button
                    onClick={() => router.push(`/login?redirect=/thesis?ticker=${ticker}`)}
                    className="w-full bg-white text-blue-900 font-extrabold py-3.5 px-4 rounded-xl hover:bg-blue-50 transition-all shadow-md cursor-pointer text-center text-sm"
                  >
                    Create Free Account →
                  </button>

                  <p className="text-center text-xs text-blue-300 mt-4">Free forever for up to 5 companies.</p>
                </div>
              ) : (
                /* STAGE 2/3 LOGGED-IN SIDEBAR: User dashboard status */
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Your {ticker} Thesis</h3>
                  
                  {hasThesis ? (
                    <div className="space-y-4">
                      <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl text-sm font-semibold flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Active Thesis Saved
                      </div>
                      <button
                        onClick={() => router.push(`/review/${ticker}`)}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                      >
                        Manage Conviction →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-500">You haven't built a thesis for {ticker} yet.</p>
                      <button
                        onClick={() => router.push(`/thesis?ticker=${ticker}`)}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
                      >
                        + Build {ticker} Thesis
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </main>
    </div>
  );
}