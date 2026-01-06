'use client';

import { useState } from 'react';
import { useDAWStore } from '@/state/useDAWStore';
import MixerView from './MixerView';
import EffectsView from './EffectsView';
import InstrumentsView from './InstrumentsView';

type Tab = 'mixer' | 'effects' | 'instruments';

export default function SmartControls() {
  const [activeTab, setActiveTab] = useState<Tab>('mixer');
  const { selectedTrackId, tracks } = useDAWStore();
  const selectedTrack = selectedTrackId
    ? tracks.find((t) => t.id === selectedTrackId)
    : null;

  return (
    <div className="h-64 bg-[#1A1A1D] border-t border-[#2F2F34] flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-[#2F2F34] bg-[#202024]">
        <button
          onClick={() => setActiveTab('mixer')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'mixer'
              ? 'bg-[#1A1A1D] text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Mixer
        </button>
        <button
          onClick={() => setActiveTab('effects')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'effects'
              ? 'bg-[#1A1A1D] text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Effects
        </button>
        <button
          onClick={() => setActiveTab('instruments')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'instruments'
              ? 'bg-[#1A1A1D] text-white border-b-2 border-blue-500'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Instruments
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'mixer' && <MixerView />}
        {activeTab === 'effects' && selectedTrack && <EffectsView track={selectedTrack} />}
        {activeTab === 'instruments' && selectedTrack && <InstrumentsView track={selectedTrack} />}
      </div>
    </div>
  );
}


















