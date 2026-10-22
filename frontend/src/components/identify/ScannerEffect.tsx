import React, { useState, useEffect } from 'react';
import { PawPrint, Sparkles } from 'lucide-react';

const FELINE_DIAGNOSTIC_STEPS = [
  'Detecting feline whisker & muzzle geometry...',
  'Scanning ear tufts & cranial profile...',
  'Mapping rosette, stripe, or tabby topology...',
  'Tracing feline pupil aperture & eye symmetry...',
  'Evaluating Shannon entropy & species ranks...',
  'Calibrating feline confidence distribution...',
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
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 bg-felid-dark/50 backdrop-blur-[2px]">
      {/* HUD Reticle Corners in Rose Pink */}
      <div className="flex justify-between items-start">
        <div className="w-6 h-6 border-t-2 border-l-2 border-felid-accent rounded-tl" />
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/80 border border-felid-accent/40 text-[10px] uppercase font-mono tracking-wider text-felid-accent shadow-pink-glow">
          <PawPrint className="w-3 h-3 animate-pulse text-felid-accent" />
          <span>Feline Neural Scan</span>
        </div>
        <div className="w-6 h-6 border-t-2 border-r-2 border-felid-accent rounded-tr" />
      </div>

      {/* Moving Laser Scan Line with Pink Velvet Glow */}
      <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-felid-accent to-transparent shadow-[0_0_20px_#f472b6] animate-scanline" />

      {/* Center Target Crosshair with Playful Feline Laser Dot */}
      <div className="self-center flex items-center justify-center">
        <div className="w-20 h-20 rounded-full border border-felid-accent/40 border-dashed animate-pulse flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-felid-accent animate-ping shadow-[0_0_10px_#f472b6]" />
        </div>
      </div>

      {/* HUD Bottom Status */}
      <div className="flex justify-between items-end">
        <div className="w-6 h-6 border-b-2 border-l-2 border-felid-accent rounded-bl" />
        <div className="px-3.5 py-1.5 rounded-xl bg-black/85 border border-felid-border text-center max-w-sm shadow-card">
          <p className="text-xs font-mono text-felid-ivory flex items-center justify-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-felid-accent animate-pulse" />
            <span>{FELINE_DIAGNOSTIC_STEPS[stepIndex]}</span>
          </p>
        </div>
        <div className="w-6 h-6 border-b-2 border-r-2 border-felid-accent rounded-br" />
      </div>
    </div>
  );
};
