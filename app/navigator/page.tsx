'use client';

import { useRouter } from 'next/navigation';

const QUICK_SUGGESTIONS = [
  "I don't have food",
  "My card doesn't work",
  "I got a letter I don't understand",
  "I need medical coverage",
  "I don't know where to start",
];

export default function NavigatorHome() {
  const router = useRouter();

  const handleStart = (initialText?: string) => {
    if (initialText) {
      // Store in sessionStorage to pass to chat
      sessionStorage.setItem('initialMessage', initialText);
    }
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-normal text-gray-900">
            What's wrong right now?
          </h1>
          <p className="text-lg text-gray-600">
            You can type or speak in your own words.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={() => handleStart()}
            className="w-full max-w-md mx-auto px-8 py-4 bg-blue-600 text-white text-lg font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Get Started
          </button>
        </div>

        <div className="pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">Or choose a common issue:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl mx-auto">
            {QUICK_SUGGESTIONS.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleStart(suggestion)}
                className="px-6 py-3 bg-white border border-gray-300 text-gray-700 text-base rounded-lg hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-left"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>

      <footer className="mt-auto w-full py-4 px-4 text-center border-t border-gray-200 bg-white">
        <p className="text-sm text-gray-600">For your privacy, this clears itself automatically.</p>
      </footer>
    </div>
  );
}















