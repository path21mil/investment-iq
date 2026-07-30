'use client';

import { useState, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  // State for Tabs: 'login' or 'signup'
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  // Status State
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-redirect if already logged in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) router.push(redirectUrl);
    };
    checkSession();
  }, [router, redirectUrl]);

  // 1. Handle Google Auth
  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        queryParams: { prompt: 'select_account' },
        redirectTo: `${window.location.origin}${redirectUrl}`,
      },
    });
  };

  // 2. Handle Email/Password Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setLoading(true);

    if (mode === 'signup') {
      // Validation for Sign Up
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        setLoading(false);
        return;
      }
      if (!agreeTerms) {
        setErrorMsg('You must agree to the Terms of Service.');
        setLoading(false);
        return;
      }

      // Execute Supabase Sign Up
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}${redirectUrl}`,
        },
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setSuccessMsg('Account created! Please check your email inbox to verify your account.');
        // Clear form
        setEmail('');
        setPassword('');
        setConfirmPassword('');
      }
    } else {
      // Execute Supabase Log In
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg('Invalid email or password.');
      } else {
        router.push(redirectUrl);
      }
    }
    setLoading(false);
  };

  return (
    <div className="bg-white py-8 px-6 shadow-xl sm:rounded-3xl sm:px-10 border border-gray-100 max-w-md w-full">
      
      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${
            mode === 'login' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Log In
        </button>
        <button
          onClick={() => { setMode('signup'); setErrorMsg(''); setSuccessMsg(''); }}
          className={`flex-1 pb-3 text-sm font-bold text-center border-b-2 transition-colors ${
            mode === 'signup' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'
          }`}
        >
          Sign Up
        </button>
      </div>

      {/* Google Sign In */}
      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer mb-6"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.14v2.6h3.49c2.04-1.89 3.21-4.67 3.21-7.75z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.6c-.99.66-2.25 1.06-3.79 1.06-2.92 0-5.39-1.97-6.27-4.62H2.12v2.68C3.96 20.47 7.69 23 12 23z" />
          <path fill="#FBBC05" d="M5.73 14.18C5.5 13.52 5.38 12.77 5.38 12s.12-1.52.35-2.18V7.14H2.12C1.4 8.58 1 10.23 1 12s.4 3.42 1.12 4.86l3.61-2.68z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.69 1 3.96 3.53 2.12 7.14l3.61 2.68C6.61 7.17 9.08 5.38 12 5.38z" />
        </svg>
        Continue with Google
      </button>

      {/* Divider */}
      <div className="relative mb-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-3 bg-white text-gray-400 font-medium">or</span>
        </div>
      </div>

      {/* Messages */}
      {errorMsg && <div className="bg-rose-50 text-rose-700 p-3 rounded-xl text-xs font-bold mb-4 text-center">{errorMsg}</div>}
      {successMsg && <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs font-bold mb-4 text-center">{successMsg}</div>}

      {/* Email / Password Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">Email</label>
          <input 
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-gray-500 mb-1">Password</label>
          <input 
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all"
          />
        </div>

        {mode === 'signup' && (
          <>
            <div>
              <label className="block text-[11px] font-bold text-gray-500 mb-1">Confirm Password</label>
              <input 
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 transition-all"
              />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                type="checkbox"
                id="terms"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                className="mt-1 border-gray-300 rounded text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="terms" className="text-xs text-gray-500 font-medium">
                I agree to the <span className="text-blue-600 hover:underline cursor-pointer">Terms of Service</span> and <span className="text-blue-600 hover:underline cursor-pointer">Privacy Policy</span>
              </label>
            </div>
          </>
        )}

        {mode === 'login' && (
          <div className="flex justify-end pt-1">
            <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700">
              Forgot password?
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-extrabold py-3 px-4 rounded-xl transition-all shadow-sm text-sm cursor-pointer mt-2"
        >
          {loading 
            ? (mode === 'login' ? 'Signing in...' : 'Creating account...') 
            : (mode === 'login' ? 'Log In' : 'Create Account')
          }
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-6 font-sans">
      <Link href="/" className="mb-8 font-extrabold text-2xl tracking-tight text-gray-900 flex items-center gap-2">
        Investment IQ
        <span className="flex gap-0.5">
          <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
          <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
        </span>
      </Link>

      <Suspense fallback={<div className="text-gray-400 font-medium animate-pulse text-sm mt-4">Loading secure login...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}