'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function FeedbackPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-24 selection:bg-blue-200">
      
      {/* NAVIGATION */}
      <nav className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 h-16 flex items-center">
        <div className="max-w-3xl w-full mx-auto px-6">
          <button 
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-12 space-y-12">
        
        {/* HEADER / INTRO */}
        <div className="space-y-6">
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            🚀 Investment IQ — Product Roadmap & Feedback
          </h1>
          <div className="text-[15px] leading-relaxed text-slate-600 space-y-4">
            <p>I’m building Investment IQ to help long-term investors understand businesses, build their investment thesis, remember why they invested, and track what changes over time.</p>
            <p>I’m still in the early stage, so this page is not a finished business plan. I want to share what I’m building, where the product is going, and most importantly, get honest feedback before I lock in too many decisions.</p>
            <p className="font-bold text-slate-900 bg-blue-50 p-3 rounded-lg border border-blue-100 inline-block">
              Please tell me what you think — even if you think the idea is bad.
            </p>
          </div>
        </div>

        {/* WHY I'M BUILDING THIS */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-extrabold mb-4">💡 Why I’m Building This</h2>
          <div className="text-[15px] leading-relaxed text-slate-600 space-y-4">
            <p>It’s easy to watch a stock price every day. A stock drops 5% and suddenly you start questioning everything. But the better question is:</p>
            <blockquote className="border-l-4 border-blue-500 pl-4 italic font-medium text-slate-800 text-lg my-6">
              "Did something actually change about the business or the reason I bought it?"
            </blockquote>
            <p>Investment IQ is built around that idea. Instead of only watching the stock price, you build a clear investment thesis and keep checking it as new information comes in.</p>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-extrabold mb-6">🧠 How Investment IQ Works</h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">1. Understand the Business</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed">Before investing, understand the company, its strengths, risks, management, valuation, and what really matters to the business.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-1">2. Build Your Investment Thesis</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed">Choose the conviction drivers and key risks that explain why you want to own the stock. You can edit the AI-generated thesis before saving it, so the final thesis is yours.</p>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 mb-2">3. Track What Changes</h3>
              <p className="text-[14px] text-slate-600 leading-relaxed mb-3">Investment IQ looks at new information and shows you what has changed since you created your thesis. You can see:</p>
              <ul className="list-disc pl-5 text-[14px] text-slate-600 space-y-1 mb-4">
                <li>What changed?</li>
                <li>Which part of my thesis does it affect?</li>
                <li>Is my thesis strengthening, holding, or weakening?</li>
              </ul>
              <p className="text-[14px] font-medium text-slate-800 bg-slate-50 p-3 rounded-lg">
                The goal is not to tell you what to buy or sell. The goal is to help you test your own conviction over time.
              </p>
            </div>
          </div>
        </section>

        {/* THE LOOP */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center">
          <h2 className="text-xl font-extrabold mb-8 text-left">🔄 The Investment IQ Loop</h2>
          <div className="inline-flex flex-col items-center space-y-3 font-bold text-sm text-blue-900">
            <div className="bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 w-64">Understand the business</div>
            <div className="text-slate-400">↓</div>
            <div className="bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 w-64">Build your thesis</div>
            <div className="text-slate-400">↓</div>
            <div className="bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 w-64">Record why you invested</div>
            <div className="text-slate-400">↓</div>
            <div className="bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 w-64">Monitor new evidence</div>
            <div className="text-slate-400">↓</div>
            <div className="bg-blue-50 px-6 py-3 rounded-xl border border-blue-100 w-64">See what changed</div>
            <div className="text-slate-400">↓</div>
            <div className="bg-emerald-50 px-6 py-3 rounded-xl border border-emerald-200 w-64 text-emerald-800">Know whether your thesis is strengthening or weakening</div>
          </div>
        </section>

        {/* CURRENT ALPHA */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-extrabold mb-4">🟢 Current Alpha</h2>
          <p className="text-[14px] text-slate-600 mb-4">Investment IQ is currently in the alpha stage. The current version focuses on:</p>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[14px] text-slate-700 font-medium mb-8">
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Company research</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Portfolio and watchlist tracking</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Recent market and news developments</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> AI-generated What Changed analysis</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> AI-generated drivers and key risks</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> User editing and approval of thesis</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Thesis status monitoring</li>
            <li className="flex items-center gap-2"><span className="text-emerald-500">✓</span> Shareable investment cards for X</li>
          </ul>
          
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <h3 className="font-bold text-amber-900 mb-1">Alpha Limit (5 Companies)</h3>
            <p className="text-[13px] text-amber-800 leading-relaxed">Each user can currently track up to 5 companies. This limit is intentional while I test the product, improve the AI analysis, and learn how people actually use it.</p>
          </div>
        </section>

        {/* ROADMAP */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-extrabold mb-6">🗺️ Product Roadmap</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Phase 1 — Alpha / Core Product
              </h3>
              <p className="text-[13px] text-slate-500 italic mb-2">Currently live and testing.</p>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span> Phase 2 — Better Evidence
              </h3>
              <p className="text-[14px] text-slate-600 mb-3">The current system starts with recent market and news information. Over time, I want Investment IQ to use much stronger sources, including:</p>
              <ul className="list-disc pl-5 text-[14px] text-slate-600 space-y-1 mb-4">
                <li>SEC filings / EDGAR (10-Q and 10-K)</li>
                <li>Earnings call transcripts</li>
                <li>Management commentary</li>
                <li>Deeper financial data and disclosures</li>
              </ul>
              <p className="text-[14px] font-bold text-slate-800 bg-slate-50 p-3 rounded-lg inline-block">
                The goal is simple: Better evidence → better thesis monitoring.
              </p>
            </div>

            <div className="border-t border-slate-100 pt-6">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Phase 3 — Public Launch
              </h3>
              <p className="text-[14px] text-slate-600 mb-3">Potential future features (subject to alpha feedback):</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[14px] text-slate-600 list-inside list-disc">
                <li>Larger portfolio limits</li>
                <li>Automated thesis monitoring</li>
                <li>Alerts for important thesis changes</li>
                <li>Deeper company research</li>
                <li>Advanced portfolio insights</li>
                <li>Thesis history over time</li>
                <li>Community sharing features</li>
              </ul>
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
          <h2 className="text-xl font-extrabold mb-4">💰 Pricing — I’m Still Testing This</h2>
          <p className="text-[14px] text-slate-600 mb-6">I have not finalized pricing yet. These are only early ideas I’m testing. I want to understand what investors actually value before locking anything in.</p>
          
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-y border-slate-200">
                  <th className="py-3 px-4 font-bold text-sm text-slate-900">Plan</th>
                  <th className="py-3 px-4 font-bold text-sm text-slate-900">Possible Price</th>
                  <th className="py-3 px-4 font-bold text-sm text-slate-900">Possible Features</th>
                </tr>
              </thead>
              <tbody className="text-[14px] text-slate-600">
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-bold text-slate-900">Free</td>
                  <td className="py-3 px-4">$0</td>
                  <td className="py-3 px-4">Track a few companies</td>
                </tr>
                <tr className="border-b border-slate-100">
                  <td className="py-3 px-4 font-bold text-blue-600">Investor</td>
                  <td className="py-3 px-4">~$10/month</td>
                  <td className="py-3 px-4">More companies + ongoing thesis monitoring</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-bold text-purple-600">Pro</td>
                  <td className="py-3 px-4">~$30/month</td>
                  <td className="py-3 px-4">Deeper research + SEC filings + earnings analysis</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* WHO IT'S FOR / NOT FOR */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-extrabold mb-4">🎯 Who I’m Building For</h2>
            <p className="text-[13px] text-slate-600 mb-4">Investment IQ is mainly for long-term investors who:</p>
            <ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-2">
              <li>Want to understand businesses, not just stock prices</li>
              <li>Have a reason for owning a stock but don't always write it down</li>
              <li>Don't have time to follow every company update</li>
              <li>Want a structured way to track their conviction</li>
              <li>Want to know when something important actually changes</li>
              <li>Want AI to help with research without letting AI make the investment decision</li>
            </ul>
          </section>

          <section className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm">
            <h2 className="text-lg font-extrabold mb-4">🚫 What It Is NOT</h2>
            <p className="text-[13px] text-slate-600 mb-4">Investment IQ is not designed to tell you what stocks to buy or sell. It is not meant to replace your judgment.</p>
            <p className="text-[13px] font-bold text-slate-900 mb-2">You decide:</p>
            <ul className="list-disc pl-5 text-[13px] text-slate-700 space-y-2 mb-4">
              <li>What you believe.</li>
              <li>Why you invested.</li>
              <li>What matters to you.</li>
            </ul>
            <p className="text-[13px] text-slate-600 italic">Investment IQ helps you monitor whether the evidence is supporting or challenging those beliefs.</p>
          </section>
        </div>

      {/* FEEDBACK BUTTON INSTEAD OF IFRAME */}
        <section className="bg-[#0F172A] rounded-3xl p-8 md:p-12 text-center text-white shadow-xl">
          <h2 className="text-2xl font-extrabold mb-4">💬 I Want Brutal Feedback</h2>
          <p className="text-[15px] text-slate-300 max-w-2xl mx-auto mb-8 leading-relaxed">
            I don't want people to tell me: "Looks great!" I want to know what is wrong, confusing, missing, expensive, unnecessary, or not useful.
          </p>
          
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLScXxrhG_0as2jsAHhuasTPGsE9upg7qZyA1QSgQSbfsVYKZzQ/viewform?usp=dialog" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-2xl transition-all shadow-lg shadow-blue-600/30 text-base"
          >
            Open Feedback Form (Takes 2 mins) →
          </a>
          
          <p className="text-xs text-slate-400 mt-4">
            Opens securely in a new tab so you can share your thoughts directly with the founder.
          </p>
        </section>

        {/* FOOTER */}
        <div className="text-center pb-12">
          <h2 className="text-xl font-extrabold mb-4">🙏 Be Honest</h2>
          <p className="text-[14px] text-slate-600 max-w-xl mx-auto leading-relaxed mb-6">
            Investment IQ is being built in public. You don't need to be a developer or finance professional to give feedback. If something doesn't make sense, tell me. If you think a feature is useless, tell me. I would rather change the product now than build the wrong thing for a year.
          </p>
          <p className="font-bold text-slate-900">Thank you for taking the time to look at Investment IQ. 💙</p>
        </div>

      </main>
    </div>
  );
}