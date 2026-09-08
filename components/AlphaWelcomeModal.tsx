'use client';

import { useRouter } from 'next/navigation';
import { X, Sparkles } from 'lucide-react';

interface AlphaWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AlphaWelcomeModal({ isOpen, onClose }: AlphaWelcomeModalProps) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal Content */}
      <div className="bg-white rounded-3xl w-full max-w-md border border-slate-200 shadow-2xl relative z-10 flex flex-col overflow-hidden animate-[slideIn_0.2s_ease-out]">
        <div className="p-6 sm:p-8 flex flex-col items-center text-center">
          
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>

          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4">
            <Sparkles className="w-6 h-6" />
          </div>
          
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">
            Welcome to the Alpha
          </h2>
          <p className="text-sm font-medium text-slate-500 mb-8 leading-relaxed">
            Investment IQ is actively evolving. Help shape the future of autonomous thesis tracking by sharing your thoughts and checking out what we are building next.
          </p>

          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={() => {
                onClose();
                router.push('/feedback');
              }}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition-all shadow-sm shadow-blue-600/20 cursor-pointer"
            >
              View Roadmap & Give Feedback
            </button>
            <button 
              onClick={onClose}
              className="w-full py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-xl transition-all cursor-pointer"
            >
              Continue to App
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}