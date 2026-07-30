'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/dashboard';

  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // 1. Send OTP Code to Email
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        // Automatically redirect them back to your target page after verification
        emailRedirectTo: `${window.location.origin}${redirectUrl}`,
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
    } else {
      setStep('verify');
      setMessage('Passcode sent! Check your email inbox.');
    }
  };

  // 2. Verify the 6-digit OTP Token entered by user
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: token.trim(),
      type: 'email',
    });

    setLoading(false);

    if (error) {
      setMessage('Invalid or expired code. Please try again.');
    } else {
      router.push(redirectUrl);
    }
  };

  return (
    <div className="bg-white py-10 px-6 shadow-xl sm:rounded-3xl sm:px-12 border border-gray-100 max-w-md w-full">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">
          {step === 'request' ? 'Sign in with Email' : 'Check your email'}
        </h2>
        <p className="text-xs text-gray-500 mt-2 font-medium">
          {step === 'request' 
            ? 'Enter your email to receive a secure one-time passcode.' 
            : `We sent a temporary code to ${email}`}
        </p>
      </div>

      {message && (
        <div className={`p-3 rounded-xl text-xs font-bold mb-4 text-center ${
          step === 'verify' && !message.includes('sent') ? 'bg-rose-50 text-rose-700' : 'bg-blue-50 text-blue-700'
        }`}>
          {message}
        </div>
      )}

      {step === 'request' ? (
        <form onSubmit={handleSendOtp} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Email Address</label>
            <input 
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-sm text-sm cursor-pointer"
          >
            {loading ? 'Sending code...' : 'Send Passcode →'}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOtp} className="space-y-4">
          <div>
            <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1">Enter 6-Digit Code</label>
            <input 
              type="text"
              required
              maxLength={6}
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="123456"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-center text-lg tracking-widest font-extrabold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-extrabold py-3.5 px-4 rounded-xl transition-all shadow-sm text-sm cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Verify & Sign In ✓'}
          </button>
          <button
            type="button"
            onClick={() => setStep('request')}
            className="w-full text-center text-xs font-bold text-gray-400 hover:text-gray-600 pt-2"
          >
            ← Use a different email
          </button>
        </form>
      )}
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

      <Suspense fallback={<div className="text-gray-400 font-medium animate-pulse text-sm mt-4">Loading login...</div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}