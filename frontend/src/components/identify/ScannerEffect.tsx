import React, { useState, useEffect } from 'react';
import { PawPrint, Sparkles } from 'lucide-react';

const FELINE_DIAGNOSTIC_STEPS = [
  'Validating image quality and dimensions...',
  'Checking feline content with an independent gate...',
  'Encoding the image with the local vision model...',
  'Comparing against Felidae species prompts...',
  'Applying wild vs domestic taxonomy rules...',
  'Checking evidence margins before accepting a species...',
];

export const ScannerEffect: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % FELINE_DIAGNOSTIC_STEPS.length);
    }, 850);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-[#0c0a0e]/70 backdrop-blur-[2px] z-20">
      {/* HUD Reticle Corners in Rose Pink */}
      <div className="flex justify-between items-start">
        <div className="w-8 h-8 border-t-3 border-l-3 border-felid-accent" />
        <div className="flex items-center gap-2 px-3 py-1 bg-black border-2 border-black shadow-brutal-sm text-[10px] uppercase font-mono font-black tracking-wider text-felid-accent">
          <PawPrint className="w-3.5 h-3.5 animate-pulse text-felid-accent" />
          <span>LOCAL MODEL INFERENCE</span>
        </div>
        <div className="w-8 h-8 border-t-3 border-r-3 border-felid-accent" />
      </div>

      {/* Moving Laser Scan Line with Pink Velvet Glow */}
      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-felid-accent to-transparent shadow-[0_0_20px_#f472b6] animate-scanline" />

      {/* Center Target Crosshair with Feline Laser Dot */}
      <div className="self-center flex items-center justify-center">
        <div className="w-24 h-24 border-2 border-felid-accent/50 border-dashed animate-pulse flex items-center justify-center">
          <div className="w-3 h-3 bg-felid-accent animate-ping shadow-[0_0_12px_#f472b6]" />
        </div>
      </div>

      {/* HUD Bottom Status Box */}
      <div className="flex justify-between items-end">
        <div className="w-8 h-8 border-b-3 border-l-3 border-felid-accent" />
        <div className="px-4 py-2 bg-black border-2 border-black text-center max-w-md shadow-brutal-sm">
          <p className="text-xs font-mono font-bold text-felid-ivory flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-felid-accent animate-pulse" />
            <span>{FELINE_DIAGNOSTIC_STEPS[stepIndex]}</span>
          </p>
        </div>
        <div className="w-8 h-8 border-b-3 border-r-3 border-felid-accent" />
      </div>
    </div>
  );
};
