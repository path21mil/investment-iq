'use client'; 

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
            <h2 className="text-lg font-bold text-white mb-3">1. Information We Collect via Google Sign-In</h2>
            <p className="mb-2">When you register or log in to Investment IQ using your Google Account, we request access only to the absolute minimum information required to create your account. We collect and store:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 mb-2">
              <li><strong>Your Email Address:</strong> Used as your unique account username and for essential account-related communication.</li>
              <li><strong>Your Name:</strong> Used to identify your user profile inside your personal dashboard.</li>
            </ul>
            <p>We do not collect or access your Google profile picture, contact lists, or any other personal data from your Google account.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">2. How We Use Your Data</h2>
            <p className="mb-2">We use your data solely to operate and secure the Investment IQ platform. This includes:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400 mb-2">
              <li>Verifying your identity during log-in.</li>
              <li>Saving your personal investment thesis records and dashboard data to your private account workspace.</li>
            </ul>
            <p>We do not sell, rent, lease, or trade your personal information to third parties.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">3. Global Infrastructure and Data Transfers</h2>
            <p className="mb-2">Investment IQ relies on secure international cloud networks. By logging in via Google, you acknowledge and consent to your data being stored on these secure servers:</p>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li><strong>Database and Authentication (Supabase):</strong> Your login credentials and saved investment records are securely stored on Supabase infrastructure hosted via Amazon Web Services (AWS) in the Seoul, South Korea (ap-northeast-2) region.</li>
              <li><strong>Website Hosting and Compute (Vercel):</strong> Our website infrastructure and serverless login functions are processed via Vercel in the United States.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">4. Essential Functionality Only (No Tracking)</h2>
            <p>Investment IQ does not use advertising cookies, tracking pixels (like Meta Pixel), or behavioral analytics tools (like Google Analytics). We only use strictly necessary technical tokens (such as local browser storage) required to securely maintain your active login session. We do not track your activity across the web or build advertising profiles about you.</p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-white mb-3">5. Your Right to Deletion</h2>
            <p>You maintain total control over your data. You can request the permanent erasure of your account and all saved investment records at any time by using the delete options within your account settings or by emailing us directly.</p>
          </section>

        </div>
      </main>
    </div>
  );
}