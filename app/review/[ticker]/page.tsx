'use client';

import { use, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ReviewScreen({ params }: { params: Promise<{ ticker: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const ticker = resolvedParams.ticker.toUpperCase();
  
  // 1. We moved the hardcoded list into a dynamic State array!
  const [trackedItems, setTrackedItems] = useState([
    {
      id: 'item-1',
      title: 'AI Infrastructure Demand',
      statusLabel: '🟢 Strengthened',
      statusColor: 'text-green-700 bg-green-50',
      description: 'Data Center revenue accelerated.'
    },
    {
      id: 'item-2',
      title: 'Competition Risk',
      statusLabel: '🟡 Unchanged',
      statusColor: 'text-yellow-700 bg-yellow-50',
      description: ''
    }
  ]);

  const [isSuggestionVisible, setIsSuggestionVisible] = useState(true);

  // 2. The function that actually adds the new item to the list
  const handleAddSuggestion = () => {
    const newItem = {
      id: 'item-3',
      title: 'Industrial Robotics',
      statusLabel: '🔵 Newly Added',
      statusColor: 'text-blue-700 bg-blue-50',
      description: `${ticker} acquired XYZ Robotics.`
    };

    // Add it to the top of the list, then hide the suggestion box
    setTrackedItems([newItem, ...trackedItems]);
    setIsSuggestionVisible(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24">
      
      {/* Top Bar Navigation */}
      <div className="max-w-2xl mx-auto px-6 py-6 flex justify-between items-center">
        <button 
          onClick={() => router.push('/dashboard')} 
          className="text-gray-500 hover:text-gray-900 text-sm font-semibold flex items-center gap-1 cursor-pointer"
        >
          ← Back to Dashboard
        </button>
      </div>

      <main className="max-w-2xl mx-auto px-6">
        
        <div className="mb-10">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">{ticker} Review Screen</h1>
          <p className="text-gray-500 font-medium text-sm">Since Your Last Review (12 days ago)</p>
        </div>

        {/* 3. We map through the dynamic state array here instead of hardcoding HTML */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-8">
          {trackedItems.map((item, index) => (
            <div key={item.id}>
              <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold text-lg text-gray-900">{item.title}</h3>
                  <span className={`flex items-center gap-1.5 font-bold text-xs px-2.5 py-1 rounded-md ${item.statusColor}`}>
                    {item.statusLabel}
                  </span>
                </div>
                {item.description && (
                  <p className="text-gray-600 text-sm font-medium">{item.description}</p>
                )}
              </div>
              {/* Add a divider unless it's the last item */}
              {index !== trackedItems.length - 1 && <hr className="border-gray-100 mb-6" />}
            </div>
          ))}
        </div>

        {/* NEW Driver Suggestion */}
        {isSuggestionVisible && (
          <div className="bg-blue-50 rounded-2xl border border-blue-200 shadow-sm p-6 mb-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-lg uppercase tracking-wider">
              NEW SUGGESTION
            </div>
            
            <h3 className="font-bold text-lg text-gray-900 mb-2 mt-2">Industrial Robotics</h3>
            <p className="text-blue-800 text-sm font-medium mb-6">
              {ticker} acquired XYZ Robotics. Would you like to add this Driver to your thesis?
            </p>
            
            <div className="flex items-center gap-3">
              {/* We trigger the new function here! */}
              <button 
                onClick={handleAddSuggestion}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-xl text-sm transition-colors cursor-pointer"
              >
                + Add
              </button>
              <button 
                onClick={() => setIsSuggestionVisible(false)}
                className="bg-white border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold py-2 px-6 rounded-xl text-sm transition-colors cursor-pointer"
              >
                Ignore
              </button>
            </div>
          </div>
        )}

        {/* Resolved Risks Section */}
        <h2 className="text-xl font-bold text-gray-900 mb-4 border-t border-gray-200 pt-8">Resolved Risks</h2>
        <p className="text-gray-500 text-xs font-medium mb-6 uppercase tracking-wider">Resolved risks are never deleted. Kept for historical context.</p>
        
        <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 opacity-75">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg text-gray-700 line-through decoration-gray-400">Supply Chain Constraints</h3>
            <span className="flex items-center gap-1.5 font-bold text-gray-600 bg-gray-200 text-xs px-2.5 py-1 rounded-md">
              ✔️ Resolved
            </span>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-2">Lead times returned to normal.</p>
          <p className="text-gray-400 text-xs font-bold">Resolved Q2 2026.</p>
        </div>

      </main>
    </div>
  );
}