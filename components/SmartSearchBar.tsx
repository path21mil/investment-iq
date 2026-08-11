'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Building2, AlertCircle } from 'lucide-react';

interface SmartSearchBarProps {
  variant?: 'header' | 'hero';
}

export default function SmartSearchBar({ variant = 'header' }: SmartSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  const isHero = variant === 'hero';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Live Autocomplete
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          const rawResults = data.result || [];
          
          // Deduplication: Remove any duplicate tickers returned by API
          const uniqueResults = rawResults.filter((item: any, index: number, self: any[]) =>
            index === self.findIndex((t) => t.symbol === item.symbol)
          );

          setSearchResults(uniqueResults);
          setIsOpen(uniqueResults.length > 0);
          
          if (uniqueResults.length > 0) setErrorMessage('');
        } catch (err) {
          console.error("Search fetch error:", err);
        } finally {
          setIsLoading(false);
        }
      } else {
        setSearchResults([]);
        setIsOpen(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (symbol: string) => {
    setIsNavigating(true);
    setIsOpen(false);
    setErrorMessage('');
    router.push(`/company/${symbol.toUpperCase()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    const cleanQuery = query.trim();

    if (!cleanQuery) return;

    if (searchResults.length > 0) {
      handleSelect(searchResults[0].symbol);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(cleanQuery)}`);
      const data = await res.json();
      const results = data.result || [];

      if (results.length > 0) {
        handleSelect(results[0].symbol);
      } else {
        setErrorMessage(`No company found for "${cleanQuery}". Check spelling or try a symbol like AAPL or NVDA.`);
        setIsLoading(false);
      }
    } catch (err) {
      setErrorMessage(`Could not verify "${cleanQuery}". Please try again.`);
      setIsLoading(false);
    }
  };

  const showSpinner = isLoading || isNavigating;

  return (
    <div ref={wrapperRef} className={`relative w-full z-[999] ${isHero ? 'max-w-2xl mx-auto' : 'max-w-xs sm:max-w-sm'}`}>
      <form onSubmit={handleSubmit} className="relative flex items-center w-full">
        <Search className={`absolute pointer-events-none text-slate-400 ${isHero ? 'w-5 h-5 left-5' : 'w-4 h-4 left-3'}`} />
        
        <input
          type="text"
          value={query}
          disabled={isNavigating}
          onChange={(e) => {
            setQuery(e.target.value);
            setErrorMessage(''); 
            if (e.target.value.trim().length > 1) setIsOpen(true);
          }}
          onFocus={() => {
            if (searchResults.length > 0) setIsOpen(true);
          }}
          placeholder={isHero ? "Search ticker or company (e.g. Apple, NVDA)..." : "Search..."}
          className={`w-full focus:outline-none transition-all shadow-sm ${
            errorMessage ? 'border-red-500 focus:border-red-500 ring-2 ring-red-100' : ''
          } ${
            isHero 
              ? 'bg-white text-slate-900 border-slate-200 focus:border-blue-500 py-4 pl-14 pr-[150px] rounded-2xl text-base border-2' 
              : 'bg-slate-100 focus:bg-white border-transparent focus:border-blue-500 text-xs font-bold py-2.5 pl-9 pr-8 rounded-xl border'
          }`}
        />

        {isHero && (
          <button 
            type="submit" 
            disabled={showSpinner}
            className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white text-sm font-bold px-6 rounded-xl hover:bg-slate-800 transition-colors flex items-center justify-center disabled:opacity-80 cursor-pointer"
          >
            {showSpinner ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Start Research'}
          </button>
        )}

        {!isHero && showSpinner && (
          <Loader2 className="animate-spin absolute right-3 w-3.5 h-3.5 text-blue-600" />
        )}
      </form>

      {errorMessage && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200/80 rounded-xl flex items-center gap-2.5 text-red-700 text-xs font-bold shadow-sm animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {isOpen && searchResults.length > 0 && !isNavigating && (
        <div className={`absolute left-0 right-0 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-[9999] ${isHero ? 'mt-3' : 'mt-2 top-full'}`}>
          <div className="p-1 space-y-0.5">
            {searchResults.map((item, idx) => (
              <button
                key={`${item.symbol}-${idx}`}
                type="button"
                onClick={() => handleSelect(item.symbol)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate mr-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 group-hover:bg-blue-100/50">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
                  </div>
                  <span className={`${isHero ? 'text-sm' : 'text-xs'} font-bold text-slate-800 truncate group-hover:text-blue-900`}>
                    {item.description}
                  </span>
                </div>
                <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-1 rounded-md border border-slate-200 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                  {item.symbol}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}