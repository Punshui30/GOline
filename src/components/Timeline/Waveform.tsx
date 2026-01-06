'use client';

import { useEffect, useRef } from 'react';

interface WaveformProps {
  audioBuffer: AudioBuffer;
  width: number;
  height: number;
}

export default function Waveform({ audioBuffer, width, height }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = width;
    canvas.height = height;

    // Draw waveform with neon green/cyan color
    const channelData = audioBuffer.getChannelData(0);
    const samplesPerPixel = Math.floor(channelData.length / width);
    
    ctx.fillStyle = '#00FF88';
    ctx.strokeStyle = '#00FFFF';
    ctx.lineWidth = 1;

    for (let x = 0; x < width; x++) {
      const start = Math.floor(x * samplesPerPixel);
      const end = Math.floor((x + 1) * samplesPerPixel);
      
      let min = 0;
      let max = 0;
      
      for (let i = start; i < end && i < channelData.length; i++) {
        const sample = channelData[i];
        if (sample < min) min = sample;
        if (sample > max) max = sample;
      }
      
      const yMin = (1 + min) * (height / 2);
      const yMax = (1 + max) * (height / 2);
      
      ctx.beginPath();
      ctx.moveTo(x, yMin);
      ctx.lineTo(x, yMax);
      ctx.stroke();
    }
  }, [audioBuffer, width, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
    />
  );
}


















