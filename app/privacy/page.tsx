'use client'; // ✨ Added this because useRouter is a client-side hook
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function PrivacyPage() {
    const router = useRouter();
    
  return (
    <div className="min-h-screen bg-[#0F1115] font-sans text-slate-300 selection:bg-emerald-500/30">
      
      <nav className="w-full pt-6 px-6 max-w-3xl mx-auto">
        <button 
          onClick={() => router.back()} 
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-12 pb-24">
        <h1 className="text-3xl font-extrabold text-white mb-2">Privacy Policy</h1>
        <p className="mb-10 text-sm font-medium text-emerald-500">Last updated: August 2026</p>
        
        <div className="space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-lg font-bold text-white mb-3">1. Information We Collect</h2>
            <p>When you register for an Investment IQ account, we collect necessary personal information, including your email address and authentication details. If you use third-party logins (like Google), we receive basic profile information governed by their privacy standards.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. How We Use Your Data</h2>
            <p>We use your data solely to provide, secure, and maintain the Investment IQ platform. This includes managing your authentication session via Supabase and saving your personal investment thesis records to our database.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Data Storage & Third Parties</h2>
            <p>We do not sell your personal data. We utilize secure, industry-standard third-party providers (such as Supabase for database management and authentication) to store your data safely. You may request the deletion of your account and associated data at any time.</p>
          </section>
        </div>
      </main>
    </div>
  );
}