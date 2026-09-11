'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { X, Eye, EyeOff } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

function AuthModalContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const authType = searchParams.get('auth'); 
  const isOpen = !!authType;

  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // 1. Sync tab state with URL parameter
  useEffect(() => {
    if (authType === 'signup') setActiveTab('signup');
    if (authType === 'login') setActiveTab('login');
    setError('');
  }, [authType]);

 // 2. ✨ NEW: Global Auth Listener to clean up ugly OAuth URLs
  useEffect(() => {
    // 1. Instantly wipe the ugly hash from the URL the second the page loads
    if (typeof window !== 'undefined' && window.location.hash.includes('access_token')) {
      window.history.replaceState(null, '', window.location.pathname);
    }

    // 2. Listen for auth changes to update the UI
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const closeModal = () => {
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('auth');
    const newUrl = pathname + (newParams.toString() ? `?${newParams.toString()}` : '');
    router.replace(newUrl, { scroll: false });
    
    setTimeout(() => {
      setEmail('');
      setPassword('');
      setError('');
      setAcceptedTerms(false);
    }, 200);
  };
const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (activeTab === 'signup') {
        if (!acceptedTerms) {
          throw new Error("Please accept the Terms of Service to create an account.");
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              terms_accepted: true,
              terms_version: '2026-08'
            }
          }
        });
        if (signUpError) throw signUpError;
        
        // If sign up requires email confirmation, let them know
        setError('Check your email to confirm your account!');
        return; 
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        
        // ✨ FIX 1: Explicitly wait for the session cookie to be written to the browser
        await supabase.auth.getSession();
      }
      
      
      // Pull the sticky note if it exists, otherwise default to dashboard
      const redirectTarget = sessionStorage.getItem('postAuthRedirect') || '/dashboard';
      sessionStorage.removeItem('postAuthRedirect'); // Clean it up so it doesn't fire again later

      // DO NOT call closeModal() here. A hard redirect unmounts the page anyway.
      window.location.href = redirectTarget;
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

 const handleGoogleLogin = async () => {
    if (activeTab === 'signup' && !acceptedTerms) {
      setError('Almost there! Please check the box below to accept the terms before continuing.');
      return;
    }

    try {
      // Pull the sticky note if it exists, otherwise default to dashboard
      const redirectTarget = sessionStorage.getItem('postAuthRedirect') || '/dashboard';
      sessionStorage.removeItem('postAuthRedirect');

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${redirectTarget}`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#0F172A]/80 backdrop-blur-sm transition-opacity" 
        onClick={closeModal}
      />
      
      <div 
        className="relative w-full max-w-[420px] bg-[#161B22] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[slideIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          onClick={closeModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex border-b border-slate-800 mt-2">
          <button 
            onClick={() => { setActiveTab('login'); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'login' 
                ? 'text-white border-emerald-500' 
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            Log In
          </button>
          <button 
            onClick={() => { setActiveTab('signup'); setError(''); }}
            className={`flex-1 py-4 text-sm font-bold transition-colors border-b-2 ${
              activeTab === 'signup' 
                ? 'text-white border-emerald-500' 
                : 'text-slate-400 border-transparent hover:text-slate-300'
            }`}
          >
            Sign Up
          </button>
        </div>

        <div className="p-6 md:p-8">
          
          {error && (
            <div className={`mb-6 p-3 rounded-xl text-xs font-medium border flex items-start gap-2 shadow-sm ${
              error.includes('Check your email') 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <button 
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-[#21262D] hover:bg-[#30363D] text-white font-bold py-3 rounded-lg border border-slate-700 transition-colors mb-6"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px bg-slate-800 flex-1"></div>
            <span className="text-xs font-medium text-slate-500 uppercase tracking-widest">or</span>
            <div className="h-px bg-slate-800 flex-1"></div>
          </div>

          <form className="space-y-4" onSubmit={handleAuth}>
            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                Email
              </label>
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-[#0D1117] border border-slate-800 text-white placeholder-slate-600 rounded-lg py-3 px-4 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-[14px]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0D1117] border border-slate-800 text-white placeholder-slate-600 rounded-lg py-3 pl-4 pr-10 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-[14px]"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {activeTab === 'signup' && (
              <div className="pt-2 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-0.5">
                    <input 
                      type="checkbox" 
                      className="peer sr-only" 
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                    />
                    <div className="w-4 h-4 rounded-sm border border-slate-600 bg-[#0D1117] peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-colors"></div>
                    <svg className="absolute w-3 h-3 text-white left-0.5 top-0.5 opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <span className="text-[11px] text-slate-400 group-hover:text-slate-300 leading-tight">
                    I agree to the <Link href="/terms" onClick={closeModal} className="text-emerald-500 hover:underline">Terms of Service</Link> and <Link href="/privacy" onClick={closeModal} className="text-emerald-500 hover:underline">Privacy Policy</Link>
                  </span>
                </label>
              </div>
            )}

            <button 
              type="submit"
              disabled={isLoading || (activeTab === 'signup' && !acceptedTerms)}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-extrabold py-3.5 rounded-lg transition-colors mt-6 text-[14px]"
            >
              {isLoading ? 'Processing...' : activeTab === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}

export function GlobalAuthModal() {
  return (
    <Suspense fallback={null}>
      <AuthModalContent />
    </Suspense>
  );
}