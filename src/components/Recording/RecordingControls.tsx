'use client';

import { useState } from 'react';
import { useDAWStore } from '@/state/useDAWStore';
import { audioEngine } from '@/audio/engine';

export default function RecordingControls() {
  const { isRecording, setRecording, addClip, selectedTrackId, tracks } = useDAWStore();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStartRecording = async () => {
    try {
      await audioEngine.startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert('Failed to start recording. Please check microphone permissions.');
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsProcessing(true);
      const blob = await audioEngine.stopRecording();
      
      // Convert blob to AudioBuffer
      const arrayBuffer = await blob.arrayBuffer();
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      // Find selected track or first audio track
      const targetTrack = selectedTrackId
        ? tracks.find((t) => t.id === selectedTrackId && t.type === 'audio')
        : tracks.find((t) => t.type === 'audio');
      
      if (!targetTrack) {
        alert('Please select an audio track to record into.');
        setIsProcessing(false);
        return;
      }
      
      // Get current playback position for clip start
      const currentTime = useDAWStore.getState().currentTime;
      const duration = audioBuffer.duration;
      const durationInBars = (duration / 60) * (useDAWStore.getState().bpm / 4); // Approximate
      
      // Add clip to track
      addClip(targetTrack.id, {
        id: `clip-${Date.now()}`,
        start: currentTime,
        duration: durationInBars,
        audioBuffer,
        name: `Recording ${new Date().toLocaleTimeString()}`,
      });
      
      setIsProcessing(false);
    } catch (error) {
      console.error('Failed to stop recording:', error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          onClick={handleStartRecording}
          disabled={isProcessing}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors disabled:opacity-50"
        >
          ⏺ Record
        </button>
      ) : (
        <button
          onClick={handleStopRecording}
          disabled={isProcessing}
          className="px-4 py-2 bg-red-700 hover:bg-red-800 rounded transition-colors disabled:opacity-50"
        >
          ⏹ Stop Recording
        </button>
      )}
      {isProcessing && <span className="text-sm text-gray-400">Processing...</span>}
    </div>
  );
}


















