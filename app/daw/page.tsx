// Temporarily disabled - DAW component has import path issues
// import DAW from '@/src/components/DAW/DAW';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Kiwi Garage Band - Browser-Based DAW',
  description: 'A browser-based digital audio workstation with multi-track recording, virtual instruments, effects, and robust tempo control.',
  openGraph: {
    title: 'Kiwi Garage Band - Browser-Based DAW',
    description: 'A browser-based digital audio workstation with multi-track recording, virtual instruments, effects, and robust tempo control.',
    images: ['/images/kiwi-garage-band-logo.png'],
  },
};

export default function DAWPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-offwhite">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-charcoal mb-4">DAW Page</h1>
        <p className="text-charcoal/80">This page is temporarily unavailable.</p>
      </div>
    </div>
  );
}

