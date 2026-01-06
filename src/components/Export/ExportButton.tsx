'use client';

import { useState } from 'react';
import { useDAWStore } from '@/state/useDAWStore';
import { audioEngine } from '@/audio/engine';
import { barsToSeconds } from '@/utils/tempo';

export default function ExportButton() {
  const { tracks, bpm } = useDAWStore();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    if (tracks.length === 0) {
      alert('No tracks to export');
      return;
    }

    setIsExporting(true);

    try {
      // Calculate project duration (find the longest clip)
      let maxEnd = 0;
      tracks.forEach((track) => {
        track.clips.forEach((clip) => {
          const clipEnd = clip.start + clip.duration;
          if (clipEnd > maxEnd) {
            maxEnd = clipEnd;
          }
        });
      });

      // Add a bit of padding
      const durationInBars = maxEnd + 4;
      const durationInSeconds = barsToSeconds(durationInBars, bpm);

      // Export to WAV
      const blob = await audioEngine.exportToWAV(durationInSeconds);

      // Download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kiwi-garage-band-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setIsExporting(false);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting || tracks.length === 0}
      className="px-3 py-1.5 bg-[#2F2F34] hover:bg-[#3A3A40] rounded text-sm text-white transition-colors disabled:opacity-50"
    >
      {isExporting ? 'Exporting...' : '📥 Export'}
    </button>
  );
}

