'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2, Building2 } from 'lucide-react';

export default function SmartSearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 1) {
        setIsLoading(true);
        try {
          const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
          const data = await res.json();
          
          setSearchResults(data.result || []);
          setIsOpen(true);
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
    setQuery('');
    setIsOpen(false);
    router.push(`/company/${symbol.toUpperCase()}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      handleSelect(searchResults[0].symbol);
    } else if (query.trim()) {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        const data = await res.json();
        if (data.result && data.result.length > 0) {
          handleSelect(data.result[0].symbol);
        } else {
          handleSelect(query.trim());
        }
      } catch (err) {
        handleSelect(query.trim());
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-xs sm:max-w-sm z-[999]">
      <form onSubmit={handleSubmit} className="relative flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length > 1) setIsOpen(true);
          }}
          onFocus={() => {
            if (searchResults.length > 0) setIsOpen(true);
          }}
          placeholder="Search ticker or company (e.g. Apple, NVDA)..."
          className="w-full bg-slate-100 focus:bg-white text-xs font-bold py-2.5 pl-9 pr-8 rounded-xl border border-transparent focus:border-blue-500 focus:outline-none transition-all shadow-sm"
        />
        {isLoading && <Loader2 className="w-3.5 h-3.5 text-blue-600 animate-spin absolute right-3" />}
      </form>

      {/* AUTOCOMPLETE DROPDOWN WITH HIGH Z-INDEX */}
      {isOpen && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden z-[9999]">
          <div className="p-1 space-y-0.5">
            {searchResults.map((item) => (
              <button
                key={item.symbol}
                type="button"
                onClick={() => handleSelect(item.symbol)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center gap-2.5 truncate mr-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200/60 group-hover:bg-blue-100/50">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-800 truncate group-hover:text-blue-900">
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