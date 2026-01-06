'use client';

import { Track } from '@/types/daw';
import SynthControls from './SynthControls';
import DrumControls from './DrumControls';

export default function InstrumentsView({ track }: { track: Track }) {
  if (track.type !== 'instrument') {
    return (
      <div className="p-4 text-gray-400">
        Select an instrument track to view controls.
      </div>
    );
  }

  if (track.instrumentType === 'drumMachine') {
    return <DrumControls track={track} />;
  }

  return <SynthControls track={track} />;
}


















