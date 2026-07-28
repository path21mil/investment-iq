'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CompanyOverview() {
  const params = useParams();
  const router = useRouter();
  const ticker = (params.ticker as string || 'NVDA').toUpperCase();

  const [thesis, setThesis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeModal, setActiveModal] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      // 1. Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setIsLoggedIn(true);

      // 2. Fetch thesis from Supabase
      const { data } = await supabase
        .from('theses')
        .select('*')
        .eq('ticker', ticker)
        .single();

      if (data) setThesis(data);
      setIsLoading(false);
    }
    
    if (ticker) init();
  }, [ticker]);

  const reviewDate = thesis?.created_at 
    ? new Date(thesis.created_at).toLocaleDateString() 
    : 'Not yet reviewed';

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-black pb-24 relative">
      
      {/* Dynamic Top Header Navigation */}
      <nav className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center max-w-5xl mx-auto rounded-b-2xl shadow-sm mb-8">
        <button 
          onClick={() => router.push(isLoggedIn ? '/dashboard' : '/')} 
          className="text-gray-500 hover:text-gray-900 text-sm font-semibold flex items-center gap-1 cursor-pointer"
        >
          {isLoggedIn ? '← Back to Dashboard' : '← Back to Home'}
        </button>
        
        {thesis && (
          <div className="text-xs text-gray-400 font-medium">
            Last reviewed: <span className="text-gray-900 font-bold">{reviewDate}</span>
          </div>
        )}
      </nav>

      <main className="max-w-4xl mx-auto px-6">
        
        {/* Company Title Banner */}
        <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-sm mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
              {thesis?.company_name || `${ticker} Corporation`} ({ticker})
            </h1>
            <p className="text-gray-400 text-xs font-semibold mt-1 uppercase tracking-wider">
              {thesis ? 'Active Analysis' : 'Untracked Company'}
            </p>
          </div>
          
          {thesis ? (
            <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-3.5 py-1.5 rounded-full text-xs font-bold shadow-sm">
              <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
              Thesis Status: Healthy
            </div>
          ) : (
            <div className="bg-gray-100 text-gray-600 px-3.5 py-1.5 rounded-full text-xs font-bold">
              No Active Thesis
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Investment Overview</h2>

        {/* Overview Sections List */}
        <div className="space-y-6">
          
          {/* 1. Quality of Business */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-900">Quality of Business</h3>
              <span className="text-yellow-500 font-bold tracking-wider text-lg">★★★★★</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {thesis?.company_name || ticker} continues to demonstrate exceptional business quality through industry-leading growth, profitability, and cash generation.{' '}
              <button
                onClick={() => setActiveModal('quality')}
                className="text-blue-600 font-semibold hover:underline inline cursor-pointer ml-1"
              >
                See More...
              </button>
            </p>
          </div>

          {/* 2. Management & Shareholder Alignment */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-900">Management & Shareholder Alignment</h3>
              <span className="text-yellow-500 font-bold tracking-wider text-lg">★★★★☆</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Management actively drives capital return and maintains significant skin in the game through direct insider ownership.{' '}
              <button
                onClick={() => setActiveModal('management')}
                className="text-blue-600 font-semibold hover:underline inline cursor-pointer ml-1"
              >
                See More...
              </button>
            </p>
          </div>

          {/* 3. Valuation */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-bold text-gray-900">Valuation</h3>
              <span className="text-yellow-500 font-bold tracking-wider text-lg">★★★☆☆</span>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Trading at a premium relative to its historical 5-year average due to accelerated forward growth expectations.{' '}
              <button
                onClick={() => setActiveModal('valuation')}
                className="text-blue-600 font-semibold hover:underline inline cursor-pointer ml-1"
              >
                See More...
              </button>
            </p>
          </div>

        </div>

        {/* Dynamic CTA Banner */}
        <div className="mt-12 bg-gradient-to-br from-blue-900 to-indigo-950 text-white p-8 rounded-3xl shadow-xl">
          <h3 className="text-xl font-bold mb-3 tracking-tight">
            {thesis ? 'Manage your conviction.' : 'Stop following opinions. Start understanding the business.'}
          </h3>
          <p className="text-blue-200 text-sm leading-relaxed mb-6">
            {thesis 
              ? `You have an active thesis tracking ${ticker}. Update your core drivers or review monitored risks as market conditions change.`
              : "Most beginners panic sell during market dips because they forget why they bought the stock in the first place. Define your investment thesis now to stay disciplined."
            }
          </p>
          <button
            onClick={() => router.push(`/thesis?ticker=${ticker}`)}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{thesis ? '✏️' : '➕'}</span> {thesis ? `Edit / Update ${ticker} Thesis` : 'Build My Investment Thesis'}
          </button>
        </div>

      </main>

      {/* POPUP MODALS */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h3 className="text-lg font-bold text-gray-900">
                {activeModal === 'quality' && 'Quality of Business — Supporting Evidence'}
                {activeModal === 'management' && 'Management & Alignment — Supporting Evidence'}
                {activeModal === 'valuation' && 'Valuation Breakdown — Supporting Evidence'}
              </h3>
              <button
                onClick={() => setActiveModal(null)}
                className="text-gray-400 hover:text-gray-900 font-bold text-xl cursor-pointer px-2"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              {activeModal === 'quality' && (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <strong className="text-gray-900 block mb-1">Revenue Growth (+85%)</strong>
                    <p>The company is rapidly increasing the total amount of money it brings in year-over-year.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <strong className="text-gray-900 block mb-1">Gross Margin (75%)</strong>
                    <p>For every $100 in sales, the company keeps $75 before operating costs. This strongly suggests they have massive pricing power.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <strong className="text-gray-900 block mb-1">Cash Generation</strong>
                    <p>Strong free cash flow means the company has cash left over after paying its bills to reinvest, buy back stock, or survive hard times.</p>
                  </div>
                </>
              )}

              {activeModal === 'management' && (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <strong className="text-gray-900 block mb-1">Share Buybacks & Dilution</strong>
                    <p>The company is actively using its cash to buy back its own stock and retire shares. This means your piece of the ownership pie gets bigger automatically, without you having to buy more.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <strong className="text-gray-900 block mb-1">Return on Invested Capital / ROIC</strong>
                    <p>For every $100 the company invests back into its own business, it generates strong profit. This suggests management is making smart, highly profitable decisions.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <strong className="text-gray-900 block mb-1">Insider Ownership</strong>
                    <p>Key executives and board members own a significant amount of the company's stock, meaning their personal wealth is tied directly to your success as a shareholder.</p>
                  </div>
                </>
              )}

              {activeModal === 'valuation' && (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <strong className="text-gray-900 block mb-1">Forward P/E Ratio</strong>
                    <p>Investors are willing to pay a multiple for every $1 of earnings the company is expected to make next year. A higher number typically indicates high growth expectations, but adds risk if they miss targets.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <strong className="text-gray-900 block mb-1">Historical Range</strong>
                    <p>Comparing current valuation multiples against historical averages helps determine whether the stock is historically expensive or cheap.</p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <strong className="text-gray-900 block mb-1">EV/EBITDA</strong>
                    <p>This compares the total value of the entire company (including its debt) to its core cash earnings for an accurate look at pricing.</p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-6 pt-3 border-t border-gray-100 text-right">
              <button
                onClick={() => setActiveModal(null)}
                className="bg-gray-900 hover:bg-black text-white px-5 py-2 rounded-xl text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}