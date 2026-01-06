'use client';

import { useEffect, useRef, useState } from 'react';
import { useDAWStore } from '@/state/useDAWStore';
import { getGridPositions, snapToGrid } from '@/utils/tempo';
import TimelineGrid from './TimelineGrid';
import TimelineRegion from './TimelineRegion';
import Waveform from './Waveform';

const PIXELS_PER_BAR = 120;
const TRACK_HEIGHT = 100;

export default function Timeline() {
  const { tracks, bpm, quantization, currentTime, isLooping, loopStart, loopEnd } = useDAWStore();
  const [viewportStart, setViewportStart] = useState(0);
  const [viewportEnd, setViewportEnd] = useState(32);
  const [zoom, setZoom] = useState(1);
  const timelineRef = useRef<HTMLDivElement>(null);
  const [draggingClip, setDraggingClip] = useState<{ trackId: string; clipId: string; offset: number } | null>(null);
  const [resizingClip, setResizingClip] = useState<{ trackId: string; clipId: string; edge: 'left' | 'right'; startX: number; startTime: number; startDuration: number } | null>(null);

  // Playhead position
  const playheadPosition = ((currentTime - viewportStart) / (viewportEnd - viewportStart)) * 100;

  const handleClipDragStart = (trackId: string, clipId: string, startX: number) => {
    const clip = tracks
      .find((t) => t.id === trackId)
      ?.clips.find((c) => c.id === clipId);
    
    if (clip) {
      const clipStartInViewport = clip.start - viewportStart;
      const offset = startX - (clipStartInViewport * PIXELS_PER_BAR * zoom);
      setDraggingClip({ trackId, clipId, offset });
    }
  };

  const handleClipDrag = (clientX: number) => {
    if (!draggingClip || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const bars = (x - draggingClip.offset) / (PIXELS_PER_BAR * zoom) + viewportStart;
    const snappedBars = snapToGrid(bars, bpm, quantization);
    
    const { updateClip } = useDAWStore.getState();
    updateClip(draggingClip.trackId, draggingClip.clipId, { start: snappedBars });
  };

  const handleClipDragEnd = () => {
    setDraggingClip(null);
  };

  const handleResizeStart = (trackId: string, clipId: string, edge: 'left' | 'right', clientX: number) => {
    const clip = tracks
      .find((t) => t.id === trackId)
      ?.clips.find((c) => c.id === clipId);
    
    if (clip) {
      setResizingClip({
        trackId,
        clipId,
        edge,
        startX: clientX,
        startTime: clip.start,
        startDuration: clip.duration,
      });
    }
  };

  const handleResize = (clientX: number) => {
    if (!resizingClip || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const deltaBars = (x - resizingClip.startX) / (PIXELS_PER_BAR * zoom);
    const snappedDelta = snapToGrid(deltaBars, bpm, quantization);
    
    const { updateClip } = useDAWStore.getState();
    
    if (resizingClip.edge === 'left') {
      const newStart = Math.max(0, resizingClip.startTime + snappedDelta);
      const newDuration = resizingClip.startDuration - snappedDelta;
      if (newDuration > 0.1) {
        updateClip(resizingClip.trackId, resizingClip.clipId, {
          start: newStart,
          duration: newDuration,
        });
      }
    } else {
      const newDuration = Math.max(0.1, resizingClip.startDuration + snappedDelta);
      updateClip(resizingClip.trackId, resizingClip.clipId, { duration: newDuration });
    }
  };

  const handleResizeEnd = () => {
    setResizingClip(null);
  };

  useEffect(() => {
    if (draggingClip) {
      const handleMouseMove = (e: MouseEvent) => handleClipDrag(e.clientX);
      const handleMouseUp = () => handleClipDragEnd();
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [draggingClip]);

  useEffect(() => {
    if (resizingClip) {
      const handleMouseMove = (e: MouseEvent) => handleResize(e.clientX);
      const handleMouseUp = () => handleResizeEnd();
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizingClip]);

  return (
    <div className="flex-1 flex flex-col bg-[#1A1A1D] overflow-hidden">
      {/* Timeline Header with Ruler */}
      <div className="flex border-b border-[#2F2F34] bg-[#202024]">
        <div className="w-64 border-r border-[#2F2F34] p-2 bg-[#1A1A1D]">
          <div className="text-xs text-gray-400 font-medium">Timeline</div>
        </div>
        <div className="flex-1 relative overflow-x-auto">
          <div
            ref={timelineRef}
            className="relative h-12"
            style={{ minWidth: `${(viewportEnd - viewportStart) * PIXELS_PER_BAR * zoom}px` }}
          >
            <TimelineGrid
              startBar={viewportStart}
              endBar={viewportEnd}
              quantization={quantization}
              bpm={bpm}
              zoom={zoom}
            />
            
            {/* Playhead */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
              style={{ left: `${playheadPosition}%` }}
            >
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-500"></div>
            </div>

            {/* Loop Region */}
            {isLooping && (
              <div
                className="absolute top-0 h-2 bg-yellow-500 bg-opacity-50 border-y border-yellow-400 z-10"
                style={{
                  left: `${((loopStart - viewportStart) / (viewportEnd - viewportStart)) * 100}%`,
                  width: `${((loopEnd - loopStart) / (viewportEnd - viewportStart)) * 100}%`,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Tracks */}
      <div className="flex-1 overflow-y-auto overflow-x-auto">
        {tracks.map((track) => (
          <div
            key={track.id}
            className="flex border-b border-[#2F2F34]"
            style={{ height: `${TRACK_HEIGHT}px`, minWidth: `${(viewportEnd - viewportStart) * PIXELS_PER_BAR * zoom}px` }}
          >
            {/* Track Label Area */}
            <div className="w-64 border-r border-[#2F2F34] p-2 bg-[#202024] flex items-center">
              <span className="text-sm text-white">{track.name}</span>
            </div>

            {/* Track Content */}
            <div className="flex-1 relative">
              <TimelineGrid
                startBar={viewportStart}
                endBar={viewportEnd}
                quantization={quantization}
                bpm={bpm}
                zoom={zoom}
                isTrackGrid={true}
              />

              {/* Clips/Regions */}
              {track.clips.map((clip) => {
                const left = ((clip.start - viewportStart) / (viewportEnd - viewportStart)) * 100;
                const width = (clip.duration / (viewportEnd - viewportStart)) * 100;
                const isAudio = !!clip.audioBuffer;
                const isMidi = track.type === 'instrument';
                
                return (
                  <TimelineRegion
                    key={clip.id}
                    clip={clip}
                    track={track}
                    left={left}
                    width={width}
                    height={TRACK_HEIGHT}
                    onDragStart={(e) => handleClipDragStart(track.id, clip.id, e.clientX)}
                    onResizeStart={(edge, e) => handleResizeStart(track.id, clip.id, edge, e.clientX)}
                    isAudio={isAudio}
                    isMidi={isMidi}
                  />
                );
              })}

              {/* Playhead */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ left: `${playheadPosition}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Zoom Controls */}
      <div className="flex items-center gap-2 p-2 bg-[#202024] border-t border-[#2F2F34]">
        <button
          onClick={() => setZoom(Math.max(0.5, zoom - 0.1))}
          className="px-2 py-1 bg-[#2F2F34] hover:bg-[#3A3A40] rounded text-xs text-white"
        >
          −
        </button>
        <span className="text-xs text-gray-400 w-20 text-center">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom(Math.min(2, zoom + 0.1))}
          className="px-2 py-1 bg-[#2F2F34] hover:bg-[#3A3A40] rounded text-xs text-white"
        >
          +
        </button>
      </div>
    </div>
  );
}
