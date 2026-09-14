'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { supabase } from '@/lib/supabase';

export function UpdatesDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [updates, setUpdates] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'All' | 'Unread'>('All');
  const [readIds, setReadIds] = useState<string[]>([]);

  // Load read notification IDs from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('read_notification_ids');
    if (saved) {
      try {
        setReadIds(JSON.parse(saved));
      } catch {
        setReadIds([]);
      }
    }
  }, []);

  // Fetch updates when the drawer opens
  useEffect(() => {
    async function fetchUpdates() {
      if (!isOpen) return;

      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        const { data, error } = await supabase
          .from('notification_jobs')
          .select(`
            id,
            created_at,
            ai_analysis,
            theses ( ticker )
          `)
          .eq('user_id', session.user.id)
          .eq('status', 'completed')
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && data) {
          setUpdates(data);
        }
      }
      setLoading(false);
    }

    fetchUpdates();
  }, [isOpen]);

  // Mark an item as read
  const markAsRead = (id: string) => {
    if (!readIds.includes(id)) {
      const next = [...readIds, id];
      setReadIds(next);
      localStorage.setItem('read_notification_ids', JSON.stringify(next));
    }
    setIsOpen(false);
  };

  // Helper for relative timestamps
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Filter items based on the active tab
  const unreadCount = updates.filter((u) => !readIds.includes(u.id)).length;
  const filteredUpdates = updates.filter((u) => {
    if (filter === 'Unread') return !readIds.includes(u.id);
    return true;
  });

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger className="relative inline-flex items-center justify-center h-10 w-10 rounded-md hover:bg-slate-100 transition-colors cursor-pointer">
        <Bell className="h-5 w-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 flex h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
        )}
      </SheetTrigger>

      <SheetContent className="w-full sm:w-[440px] flex flex-col p-0 bg-white overflow-x-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <SheetHeader className="text-left">
            <SheetTitle className="text-xl font-extrabold text-slate-900 leading-tight">
              Updates
            </SheetTitle>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              All recent activity
            </p>
          </SheetHeader>

          {/* All | Unread Filter */}
          <div className="flex items-center gap-1.5 mt-4 p-1 bg-slate-100 rounded-lg w-fit">
            <button
              onClick={() => setFilter('All')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'All'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('Unread')}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                filter === 'Unread'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Unread
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>
          </div>
        </div>

        {/* Updates Feed */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3 bg-slate-50/50">
          {loading ? (
            <p className="text-xs text-slate-400 font-medium py-4 text-center">Loading updates...</p>
          ) : filteredUpdates.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm font-semibold text-slate-700">No updates to show</p>
              <p className="text-xs text-slate-400 mt-1">
                {filter === 'Unread' ? "You're all caught up." : 'Recent portfolio events will appear here.'}
              </p>
            </div>
          ) : (
            filteredUpdates.map((update) => {
              const ticker = update.theses?.ticker || 'Holding';
              const analysis = update.ai_analysis || {};
              const isIntact = analysis.thesis_impact?.includes('Supporting');
              const isUnread = !readIds.includes(update.id);

              const statusTitle = isIntact ? 'Thesis Intact' : 'Watch Point';
              const indicator = isIntact ? '🟢' : '🟡';
              const summaryText = analysis.what_changed || analysis.why_it_matters || 'New financial disclosures were evaluated.';

              return (
                <Link
                  href={`/thesis/${ticker}?highlight=latest`}
                  key={update.id}
                  onClick={() => markAsRead(update.id)}
                  className={`block p-4 rounded-xl border transition-all hover:border-slate-300 ${
                    isUnread
                      ? 'bg-white border-slate-200 shadow-sm'
                      : 'bg-slate-50/70 border-slate-100 opacity-80 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs leading-none">{indicator}</span>
                      <span className="font-bold text-sm text-slate-900">
                        {ticker} — {statusTitle}
                      </span>
                      {isUnread && (
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">
                      {formatTime(update.created_at)}
                    </span>
                  </div>

                  <p className="text-[13px] text-slate-600 leading-relaxed pl-4 font-normal">
                    {summaryText}
                  </p>
                </Link>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}