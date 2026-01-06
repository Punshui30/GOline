'use client';

interface KioskLockOverlayProps {
  onContinue: () => void;
  onReset: () => void;
}

export default function KioskLockOverlay({ onContinue, onReset }: KioskLockOverlayProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-8 max-w-md w-full shadow-xl">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Are you still here?</h2>
        <p className="text-gray-700 mb-6">
          For your privacy, we've paused your session. You can continue where you left off or start over.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={onContinue}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            Continue
          </button>
          <button
            onClick={onReset}
            className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Start Over
          </button>
        </div>
      </div>
    </div>
  );
}















