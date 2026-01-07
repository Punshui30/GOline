'use client';

interface UsageProtocolProps {
  onClose: () => void;
}

export default function UsageProtocol({ onClose }: UsageProtocolProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-2xl w-full mx-4 bg-zinc-900 border border-zinc-800 p-8 lg:p-12 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
          aria-label="Close"
        >
          <span className="text-2xl">×</span>
        </button>

        <h2 className="font-serif text-3xl lg:text-4xl font-light text-white mb-6">Usage Protocol</h2>
        
        <div className="space-y-8 text-zinc-300">
          <div>
            <h3 className="text-base font-sans font-medium text-white mb-3">How to Use Your Blend</h3>
            <p className="text-sm font-sans leading-relaxed text-zinc-400">
              This is a blended formulation where all components are mixed together. You'll consume the entire blend as one product, not in separate layers or stages.
            </p>
          </div>

          <div>
            <h3 className="text-base font-sans font-medium text-white mb-3">Dose Pacing</h3>
            <ul className="text-sm font-sans leading-relaxed space-y-2 list-disc list-inside text-zinc-400">
              <li>Start with a small amount to gauge your response</li>
              <li>Wait 15-30 minutes before considering additional consumption</li>
              <li>Effects may take time to fully develop - be patient</li>
              <li>Keep track of how much you've consumed to avoid overconsumption</li>
            </ul>
          </div>

          <div>
            <h3 className="text-base font-sans font-medium text-white mb-3">What to Expect</h3>
            <p className="text-sm font-sans leading-relaxed text-zinc-400">
              The effects of this blend will develop gradually as all components work together. The experience should feel balanced and cohesive, with effects that complement each other rather than competing. If you feel any discomfort, reduce your consumption and wait before taking more.
            </p>
          </div>

          <div>
            <h3 className="text-base font-sans font-medium text-white mb-3">Important Notes</h3>
            <ul className="text-sm font-sans leading-relaxed space-y-2 list-disc list-inside text-zinc-400">
              <li>This is a single blended product - all components are mixed together</li>
              <li>Do not attempt to separate or consume components individually</li>
              <li>Store in a cool, dry place away from light</li>
              <li>Consult with your dispensary if you have questions about dosage</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-zinc-800">
          <button
            onClick={onClose}
            className="px-6 py-3 border border-[#C5A065] text-[#C5A065] text-xs font-sans uppercase tracking-widest hover:bg-[#C5A065] hover:text-black active:bg-[#B89555] transition-all duration-200 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

