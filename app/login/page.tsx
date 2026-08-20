'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { supabase } from '@/lib/supabase';
import { ArrowLeft } from 'lucide-react';
import Logo from '@/components/Logo';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('redirect') || '/dashboard';
  
  // ✨ NEW: Set initial tab based on the URL parameter (defaults to login)
  const [mode, setMode] = useState<'login' | 'signup'>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'login'
  );

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  // Cleans up the URL if they just logged in via OAuth
  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }, 500);
    }
  }, []);

  // ✨ NEW: Handles both Sign Up (with database logging) and Log In
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (mode === 'signup') {
        // PRO SAAS LOGGING: Create account & record terms consent in Supabase
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
      } else {
        // Standard Login
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
      
      router.push(returnUrl); 
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

const handleGoogleLogin = async () => {
    if (mode === 'signup' && !acceptedTerms) {
      // ✨ Softer, friendlier copy
      setError('Almost there! Please check the box below to accept the terms before continuing.');
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}${returnUrl}`
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] font-sans flex flex-col relative selection:bg-emerald-500/30 text-slate-300">
      
      {/* Functional & Premium Back to Home Button */}
      <nav className="w-full absolute top-0 left-0 pt-6 z-20">
        <div className="max-w-6xl mx-auto px-6">
          <button 
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white bg-[#181A1B]/80 hover:bg-[#242729] px-4 py-2.5 rounded-full border border-slate-800 shadow-sm transition-all backdrop-blur-md group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> 
            Back to Home
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow flex flex-col items-center justify-center p-6 relative z-10 mt-12 md:mt-0">
        
        {/* ✨ RETAINED: Your awesome Glass Wrapper Logo fix */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/95 px-6 py-3 rounded-2xl shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-slate-700">
            <Logo />
          </div>
        </div>

        <div className="w-full max-w-[420px] bg-[#181A1B] rounded-3xl p-8 border border-slate-800 shadow-2xl">
          
          {/* ✨ NEW: The Tab Navigation */}
          <div className="flex border-b border-slate-800 mb-8">
            <button 
              onClick={() => { setMode('login'); setError(''); }}
              className={`flex-1 pb-4 text-sm font-bold transition-colors cursor-pointer ${mode === 'login' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Log In
            </button>
            <button 
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 pb-4 text-sm font-bold transition-colors cursor-pointer ${mode === 'signup' ? 'text-emerald-400 border-b-2 border-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
              Sign Up
            </button>
          </div>

        {error && (
            <div className="mb-6 bg-amber-500/10 text-amber-400 p-3.5 rounded-xl text-sm font-medium border border-amber-500/20 text-center flex items-center justify-center gap-2 shadow-sm">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Social Auth */}
          <button 
            onClick={handleGoogleLogin}
            className="w-full py-3 mb-6 bg-[#242729] hover:bg-[#2C3032] text-white text-sm font-bold rounded-xl border border-slate-700 transition-colors flex items-center justify-center gap-3 cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.02 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-6 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
            <div className="flex-1 h-px bg-slate-800"></div>
            or email
            <div className="flex-1 h-px bg-slate-800"></div>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" 
                className="w-full bg-[#242729] border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-500"
                required
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full bg-[#242729] border border-slate-700 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-500"
                required
              />
            </div>

            {/* ✨ NEW: Only show the legal checkbox if they are creating a new account */}
            {mode === 'signup' && (
              <div className="flex items-start gap-3 pt-2 mb-2">
                <input 
                  type="checkbox" 
                  id="terms" 
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-600 bg-[#242729] text-emerald-500 focus:ring-emerald-500 focus:ring-offset-[#181A1B] cursor-pointer" 
                />
                <label htmlFor="terms" className="text-xs text-slate-400 font-medium leading-relaxed">
                  I acknowledge the Alpha disclaimer and agree to the <Link href="/terms" className="text-emerald-400 hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link>.
                </label>
              </div>
            )}

            {/* Submit Action */}
            <button 
              type="submit"
              disabled={isLoading || (mode === 'signup' && !acceptedTerms)}
              className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold rounded-xl transition-colors cursor-pointer mt-2"
            >
              {isLoading ? 'Processing...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#0F1115] flex items-center justify-center">
        <div className="text-slate-500 font-bold">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}