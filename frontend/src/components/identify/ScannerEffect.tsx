import React, { useState, useEffect } from 'react';
import { Sparkles, Scan } from 'lucide-react';

const DIAGNOSTIC_STEPS = [
  'Inspecting image integrity and color channels...',
  'Scanning feline morphological boundaries...',
  'Evaluating cranial contours and ear orientation...',
  'Extracting rosette and coat pattern features...',
  'Calculating Shannon entropy & candidate ranks...',
  'Finalizing calibrated confidence distribution...',
];

export const ScannerEffect: React.FC = () => {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % DIAGNOSTIC_STEPS.length);
    }, 900);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-felid-dark/40 backdrop-blur-[2px]">
      {/* HUD Reticle Corners */}
      <div className="flex justify-between items-start">
        <div className="w-6 h-6 border-t-2 border-l-2 border-felid-accent" />
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-black/75 border border-felid-accent/40 text-[10px] uppercase font-mono tracking-wider text-felid-accent">
          <Scan className="w-3 h-3 animate-spin" />
          <span>Neural Scan Active</span>
        </div>
        <div className="w-6 h-6 border-t-2 border-r-2 border-felid-accent" />
      </div>

      {/* Moving Laser Scan Line */}
      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-felid-accent to-transparent shadow-[0_0_15px_#e5a93b] animate-scanline" />

      {/* Center Target Crosshair */}
      <div className="self-center flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border border-felid-accent/30 border-dashed animate-pulse flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-felid-accent animate-ping" />
        </div>
      </div>

      {/* HUD Bottom Status */}
      <div className="flex justify-between items-end">
        <div className="w-6 h-6 border-b-2 border-l-2 border-felid-accent" />
        <div className="px-3 py-1.5 rounded-lg bg-black/85 border border-felid-border text-center max-w-sm">
          <p className="text-xs font-mono text-felid-ivory flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-felid-accent animate-pulse" />
            <span>{DIAGNOSTIC_STEPS[stepIndex]}</span>
          </p>
        </div>
        <div className="w-6 h-6 border-b-2 border-r-2 border-felid-accent" />
      </div>
    </div>
  );
};
