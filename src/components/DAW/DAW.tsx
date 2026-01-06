'use client';

import { useEffect } from 'react';
import { audioEngine } from '@/audio/engine';
import TopBar from '@/components/TopBar/TopBar';
import TrackSidebar from '@/components/TrackSidebar/TrackSidebar';
import Timeline from '@/components/Timeline/Timeline';
import SmartControls from '@/components/SmartControls/SmartControls';
import ExportButton from '@/components/Export/ExportButton';

export default function DAW() {
  // Initialize audio engine on mount
  useEffect(() => {
    // Audio context must be started by user interaction
    // We'll initialize it when user clicks play
  }, []);

  return (
    <div className="flex flex-col h-screen bg-[#1A1A1D] text-white overflow-hidden">
      {/* Top Bar - Logo and Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2F2F34] bg-[#1A1A1D]">
        <div className="flex items-center gap-4">
          <img 
            src="/images/kiwi-garage-band-logo.png" 
            alt="Kiwi Garage Band" 
            className="h-16 w-auto object-contain drop-shadow-lg"
          />
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-white">Kiwi Garage Band</h1>
            <p className="text-xs text-gray-400">Browser-Based Digital Audio Workstation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton />
        </div>
      </div>
      <TopBar />

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Tracks */}
        <TrackSidebar />

        {/* Center - Timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Timeline />
        </div>
      </div>

      {/* Bottom Panel - Smart Controls */}
      <SmartControls />
    </div>
  );
}
