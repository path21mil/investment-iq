'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LandingPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const ticker = searchQuery.trim().toUpperCase();
    if (!ticker) return;

    // Send everyone directly to the public company overview page
    router.push(`/company/${ticker}`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 font-sans text-gray-900 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      
      {/* Top Navigation Bar */}
      <nav className="max-w-7xl w-full mx-auto px-8 py-6 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <span className="text-xl font-extrabold tracking-tight text-gray-900">Investment IQ</span>
          <div className="flex gap-1">
            <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
            <span className="w-1.5 h-5 bg-blue-600 rounded-full"></span>
            <span className="w-1.5 h-7 bg-blue-600 rounded-full"></span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-700 hover:text-gray-900 px-4 py-2 transition-colors"
          >
            Sign up
          </Link>
          <Link
            href="/login"
            className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-blue-700 transition-colors shadow-sm"
          >
            Login
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-3xl w-full mx-auto px-6 text-center my-auto py-16">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-4">
          Understand the Business. <br />
          Build Conviction
        </h1>
        
        <p className="text-gray-500 text-base md:text-lg font-medium mb-8">
          Evaluate a business
        </p>

        {/* Search Box Form */}
        <form onSubmit={handleSearch} className="relative max-w-xl mx-auto mb-8 shadow-sm">
          <div className="relative flex items-center">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="e.g. AMD"
              className="w-full bg-white border border-gray-300 rounded-2xl py-4 pl-5 pr-12 text-gray-900 text-base placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-inner"
            />
            <button
              type="submit"
              className="absolute right-4 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </form>

        {/* Popular Searches */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-sm">
          <span className="text-gray-400 font-medium mr-1">Popular Search:</span>
          {['AMD', 'MSFT', 'AMZN'].map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => router.push(`/company/${t}`)}
              className="bg-gray-200/70 hover:bg-gray-200 text-gray-700 font-semibold px-3.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer"
            >
              {t}
            </button>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-gray-400">
        Investment IQ • Secure Your Alpha
      </footer>

    </div>
  );
}