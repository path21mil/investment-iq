'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

// 1. We put the actual login logic inside a child component
function LoginContent() {
  const searchParams = useSearchParams();
  
  // Grab the redirect URL from the browser, or default to the dashboard
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // Forces the user to choose their account (professional standard)
        queryParams: { prompt: 'select_account' },
        // Tells Supabase exactly where to send them after Google verifies them
        redirectTo: `${window.location.origin}${redirectUrl}`,
      },
    });
  };

  return (
    <div className="bg-white py-10 px-6 shadow-xl sm:rounded-3xl sm:px-12 border border-gray-100 max-w-md w-full">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          Welcome back
        </h2>
        <p className="text-sm text-gray-500 mt-2 font-medium">
          Sign in to manage your conviction portfolio.
        </p>
      </div>

      <button
        onClick={handleGoogleSignIn}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:text-gray-900 transition-all cursor-pointer"
      >
        {/* Google 'G' Logo SVG */}
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.31-1.03 2.41-2.16 3.14v2.6h3.49c2.04-1.89 3.21-4.67 3.21-7.75z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.49-2.6c-.99.66-2.25 1.06-3.79 1.06-2.92 0-5.39-1.97-6.27-4.62H2.12v2.68C3.96 20.47 7.69 23 12 23z" />
          <path fill="#FBBC05" d="M5.73 14.18C5.5 13.52 5.38 12.77 5.38 12s.12-1.52.35-2.18V7.14H2.12C1.4 8.58 1 10.23 1 12s.4 3.42 1.12 4.86l3.61-2.68z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.69 1 3.96 3.53 2.12 7.14l3.61 2.68C6.61 7.17 9.08 5.38 12 5.38z" />
        </svg>
        Continue with Google
      </button>
    </div>
  );
}

// 2. The Main Page Component wraps the child in a Suspense boundary
export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-6 font-sans">
      
      {/* Brand Header */}
      <Link href="/" className="mb-8 font-extrabold text-2xl tracking-tight text-gray-900 flex items-center gap-2">
        Investment IQ
        <span className="flex gap-0.5">
          <span className="w-1 h-2.5 bg-blue-600 rounded-full"></span>
          <span className="w-1.5 h-4 bg-blue-600 rounded-full"></span>
          <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
        </span>
      </Link>

      {/* Suspense is required by Next.js when using useSearchParams() */}
      <Suspense fallback={<div className="text-gray-400 font-medium animate-pulse text-sm mt-4">Loading secure login...</div>}>
        <LoginContent />
      </Suspense>

    </div>
  );
}