import React, { useState, useRef } from 'react';
import { Camera, X, Image as ImageIcon, AlertCircle, PawPrint, Cat } from 'lucide-react';

interface Props {
  onImageSelected: (file: File) => void;
  selectedImage: File | null;
  onClear: () => void;
  isLoading: boolean;
}

const MAX_SIZE_MB = 15;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export const ImageDropzone: React.FC<Props> = ({
  onImageSelected,
  selectedImage,
  onClear,
  isLoading,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    setValidationError(null);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setValidationError('Please select a valid feline photograph in JPEG, PNG, or WebP format.');
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setValidationError(`Image exceeds the ${MAX_SIZE_MB}MB size limit.`);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    onImageSelected(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (isLoading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleClear = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setValidationError(null);
    onClear();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="w-full">
      {/* Hidden Inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        disabled={isLoading}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        disabled={isLoading}
      />

      {validationError && (
        <div className="mb-4 p-3.5 bg-red-950/60 border-2 border-black shadow-brutal-sm text-pink-200 text-xs flex items-center gap-2.5 font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 text-felid-accent" />
          <span>{validationError}</span>
        </div>
      )}

      {!selectedImage ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed p-8 sm:p-12 text-center transition-all cursor-pointer bg-[#0c0a0e] shadow-brutal group ${
            isDragOver
              ? 'border-felid-accent bg-felid-accent/10 shadow-brutal-lg scale-[0.99]'
              : 'border-felid-accent/60 hover:border-felid-accent'
          }`}
        >
          {/* Viewfinder Optical Brackets */}
          <div className="absolute top-2.5 left-2.5 text-felid-accent font-mono font-black text-xs select-none">
            + [CAM_OPTIC_01]
          </div>
          <div className="absolute top-2.5 right-2.5 text-felid-accent font-mono font-black text-xs select-none">
            VIEWFINDER // READY +
          </div>
          <div className="absolute bottom-2.5 left-2.5 text-felid-muted font-mono text-[10px] select-none">
            ISO: AUTO // MATRIX 1080P
          </div>
          <div className="absolute bottom-2.5 right-2.5 text-felid-muted font-mono text-[10px] select-none">
            GATE: SHANNON_H
          </div>

          {/* Central Target Crosshair decal */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
            <div className="w-56 h-56 border border-felid-accent flex items-center justify-center">
              <div className="w-20 h-20 border-t border-b border-felid-accent"></div>
            </div>
          </div>

          {/* Feline Paw Container Icon */}
          <div className="relative z-10 w-16 h-16 bg-[#141218] border-2 border-black shadow-brutal-sm mx-auto flex items-center justify-center text-felid-accent mb-4 group-hover:scale-105 transition-transform">
            <PawPrint className="w-8 h-8" />
          </div>

          <h3 className="relative z-10 font-display font-black text-xl text-felid-ivory uppercase tracking-tight mb-2 flex items-center justify-center gap-2">
            <span>DROP FELINE PHOTOGRAPH HERE</span>
            <Cat className="w-5 h-5 text-felid-accent" />
          </h3>
          <p className="relative z-10 text-xs sm:text-sm text-felid-muted max-w-md mx-auto mb-6 leading-relaxed">
            Upload any photo of a house cat, kitten, or wild felid. The neural vision model extracts morphological markers, ear tufts, and rosette topology.
          </p>

          <div className="relative z-10 flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-[#1d1922] hover:bg-[#26222d] border-2 border-black shadow-brutal-sm text-felid-ivory text-xs font-mono font-bold inline-flex items-center gap-2 brutal-press"
            >
              <ImageIcon className="w-4 h-4 text-felid-accent" />
              CHOOSE FILE
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-5 py-2.5 bg-felid-accent hover:bg-felid-accent-hover border-2 border-black shadow-brutal-sm text-black text-xs font-mono font-black inline-flex items-center gap-2 sm:hidden brutal-press"
            >
              <Camera className="w-4 h-4" />
              TAKE PHOTO
            </button>
          </div>

          <div className="relative z-10 mt-6 text-[11px] text-felid-muted font-mono">
            JPEG, PNG, WebP // UP TO 15MB // EXIF-SAFE
          </div>
        </div>
      ) : (
        <div className="relative border-2 border-black bg-[#0c0a0e] shadow-brutal">
          <div className="relative max-h-[440px] flex items-center justify-center bg-[#0c0a0e] overflow-hidden p-4">
            {previewUrl && (
              <div className="relative border-2 border-black shadow-brutal-sm max-h-[400px]">
                <img
                  src={previewUrl}
                  alt="Selected feline for identification"
                  className="max-h-[390px] w-auto object-contain mx-auto"
                />
                {/* Optical Reticle Overlays */}
                <div className="absolute top-2 left-2 text-[#f472b6] font-mono font-black text-xs pointer-events-none">+</div>
                <div className="absolute top-2 right-2 text-[#f472b6] font-mono font-black text-xs pointer-events-none">+</div>
                <div className="absolute bottom-2 left-2 text-[#f472b6] font-mono font-black text-xs pointer-events-none">+</div>
                <div className="absolute bottom-2 right-2 text-[#f472b6] font-mono font-black text-xs pointer-events-none">+</div>
              </div>
            )}

            {/* Clear Button */}
            {!isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-3 right-3 p-2 bg-black text-white hover:text-felid-accent border-2 border-black shadow-brutal-sm brutal-press focus:outline-none"
                aria-label="Remove image"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* File info pill (Promptify Inset Influence) */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-[#141218] border-2 border-black shadow-brutal-sm text-xs font-mono text-felid-ivory flex items-center gap-2">
              <PawPrint className="w-3.5 h-3.5 text-felid-accent" />
              <span className="truncate max-w-[200px] font-bold">{selectedImage.name}</span>
              <span className="text-felid-muted text-[10px]">
                ({Math.round(selectedImage.size / 1024)} KB)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
