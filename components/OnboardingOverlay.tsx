'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingOverlayProps {
  onComplete: () => void;
  onSkip?: () => void;
}

export default function OnboardingOverlay({ onComplete }: OnboardingOverlayProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="max-w-2xl w-full bg-[#111216] border border-white/10 rounded-sm p-8 lg:p-10 shadow-2xl relative overflow-hidden"
        >
          <div className="space-y-8 relative z-10">
            <div className="space-y-6">
              <h2 className="font-serif text-3xl lg:text-4xl text-[#D4AF37]">Chasing a feeling, not a strain.</h2>
              <div className="text-sm text-white/60 leading-relaxed space-y-4 font-sans">
                <p>You’ve probably noticed this already — you can’t always find the same strain twice.</p>
                <p>Even when the name is the same, batches change. Growers change. Terpene percentages shift. THC varies. Effects drift. That’s not a flaw in cannabis. It’s just biology.</p>
                <p>So instead of asking “Do you have that one strain I liked?”, this system starts with a better question:</p>
                <p className="text-white font-medium text-lg border-l-2 border-[#D4AF37] pl-4 py-1 italic">How do you want to feel?</p>
                <p>Using real lab data from live dispensary inventory, we analyze terpene balance, cannabinoid ratios, biphasic effects, and known interactions to recreate the experience you’re looking for — even when the original strain is gone.</p>
                <p>The result isn’t a guess. It’s a calculated blend designed for consistency.</p>
              </div>
            </div>

            <div className="bg-white/5 p-6 rounded-sm border border-white/5">
              <h3 className="text-[10px] uppercase tracking-widest text-[#D4AF37] mb-4 font-bold">How you can start</h3>
              <ul className="space-y-3 text-sm text-white/80">
                <li className="flex gap-3 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  Describe the feeling you want
                </li>
                <li className="flex gap-3 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  Tell us what worked for you before
                </li>
                <li className="flex gap-3 items-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37]" />
                  Or share a product or label you enjoyed
                </li>
              </ul>
              <div className="mt-4 pt-4 border-t border-white/10 text-xs text-white/40 italic">
                Different inputs. Same goal. Reliable outcomes — even when the menu keeps changing.
              </div>
            </div>

            <button
              onClick={onComplete}
              className="w-full py-4 bg-[#D4AF37] text-black font-bold tracking-[0.2em] hover:bg-[#E5C158] transition-colors rounded-sm uppercase text-xs"
            >
              Enter System
            </button>
          </div>

          <div className="absolute top-0 right-0 w-64 h-64 bg-[#D4AF37]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
