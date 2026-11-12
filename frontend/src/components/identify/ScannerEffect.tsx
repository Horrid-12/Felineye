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
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-felid-surface/75 backdrop-blur-[2px] z-20 rounded-sm">
      {/* Optical Reticle Corners in Royal Cobalt */}
      <div className="flex justify-between items-start">
        <div className="w-7 h-7 border-t-2 border-l-2 border-felid-cobalt-line" />
        <div className="flex items-center gap-2 px-3 py-1 bg-felid-surface border border-felid-border-strong rounded-sm shadow-sm text-[10px] uppercase font-mono font-medium tracking-wider text-felid-cobalt-ink">
          <PawPrint className="w-3.5 h-3.5 animate-pulse text-felid-cobalt-ink" />
          <span>Local Model Inference</span>
        </div>
        <div className="w-7 h-7 border-t-2 border-r-2 border-felid-cobalt-line" />
      </div>

      {/* Moving Optical Scan Line in Royal Cobalt */}
      <div className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-felid-cobalt-line to-transparent animate-scanline" />

      {/* Center Reticle */}
      <div className="self-center flex items-center justify-center">
        <div className="w-24 h-24 border border-felid-cobalt-line/65 border-dashed rounded-sm flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-felid-pomegranate-line animate-pulse" />
        </div>
      </div>

      {/* Bottom Status Box */}
      <div className="flex justify-between items-end">
        <div className="w-7 h-7 border-b-2 border-l-2 border-felid-cobalt-line" />
        <div className="px-4 py-2 bg-felid-surface border border-felid-border-strong rounded-sm text-center max-w-md shadow-plate">
          <p className="text-xs font-mono text-felid-ink flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-felid-highlight-ink shrink-0" />
            <span>{FELINE_DIAGNOSTIC_STEPS[stepIndex]}</span>
          </p>
        </div>
        <div className="w-7 h-7 border-b-2 border-r-2 border-felid-cobalt-line" />
      </div>
    </div>
  );
};
