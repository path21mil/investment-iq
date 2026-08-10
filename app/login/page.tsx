'use client';

// 1. ADDED: Import Suspense from react
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation'; 
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Mail, Lock } from 'lucide-react';

// 2. RENAME: Changed from "export default function Login()" to "function LoginContent()"
function LoginContent() {
  const router = useRouter();
  
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // THIS CLEANS UP THE URL IF THEY JUST LOGGED IN VIA OAUTH
  useEffect(() => {
    if (window.location.hash) {
      setTimeout(() => {
        window.history.replaceState(null, '', window.location.pathname);
      }, 500);
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      
      router.push(returnUrl); 
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
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
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col relative selection:bg-blue-100">
      
     {/* Functional & Premium Back to Home Button */}
      <nav className="w-full absolute top-0 left-0 pt-6 z-20">
        <div className="max-w-6xl mx-auto px-6">
          <button 
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 bg-white/60 hover:bg-white px-4 py-2.5 rounded-full border border-slate-200/60 hover:border-slate-300 shadow-sm hover:shadow-md transition-all backdrop-blur-md group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" /> 
            Back to Home
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-6 relative z-10 mt-12 md:mt-0">
        <div className="w-full max-w-[420px] flex flex-col items-center">
          
          {/* Logo & Header */}
          <div className="text-center mb-8">
            <div className="font-extrabold text-2xl tracking-tight text-slate-900 flex items-center justify-center gap-2 mb-6">
              Investment IQ
              <span className="flex gap-0.5">
                <span className="w-1 h-3 bg-blue-600 rounded-full"></span>
                <span className="w-1 h-4.5 bg-blue-600 rounded-full"></span>
                <span className="w-1 h-6 bg-blue-600 rounded-full"></span>
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">Welcome back</h1>
            <p className="text-slate-500 font-medium text-sm">Sign in to access your conviction portfolio</p>
          </div>

          {/* Login Card */}
          <div className="w-full bg-white rounded-3xl p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            
            {error && (
              <div className="mb-6 bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-bold border border-rose-100/50 text-center">
                {error}
              </div>
            )}

            <button 
              onClick={handleGoogleLogin}
              className="w-full bg-white border border-slate-200/80 hover:bg-slate-50 hover:border-slate-300 text-slate-700 font-bold py-3.5 rounded-xl flex items-center justify-center gap-3 transition-all shadow-sm mb-6 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 15.02 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="h-px bg-slate-100 flex-1"></div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or continue with email</span>
              <div className="h-px bg-slate-100 flex-1"></div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="h-4 w-4" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder-slate-400"
                    required
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1.5 px-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest">Password</label>
                  <a href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors">Forgot Password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50/50 border border-slate-200/80 rounded-xl pl-10 pr-4 py-3.5 text-sm font-medium text-slate-900 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all placeholder-slate-400"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-[0_4px_14px_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgb(0,0,0,0.15)] disabled:opacity-70 disabled:cursor-not-allowed mt-2 cursor-pointer"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm font-medium text-slate-500 mt-8">
              Don't have an account? <Link href="/login" className="text-blue-600 font-bold hover:text-blue-800 transition-colors cursor-pointer">Sign up for free</Link>
            </p>
          </div>

          <div className="mt-8 flex justify-center gap-6 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3"/> Bank-grade Security</span>
            <span className="flex items-center gap-1.5"><Lock className="w-3 h-3"/> Data Encrypted</span>
          </div>

        </div>
      </main>
    </div>
  );
}

// 3. ADDED: The new default export that wraps the content in Suspense
export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-bold">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}