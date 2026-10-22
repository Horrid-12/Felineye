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
        <div className="mb-4 p-3.5 rounded-xl bg-pink-950/40 border border-pink-700/60 text-pink-200 text-xs flex items-center gap-2.5">
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
          className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-felid-accent bg-felid-accent/10 shadow-pink-glow scale-[0.99]'
              : 'border-felid-border hover:border-felid-accent/60 bg-felid-surface/50 hover:bg-felid-surface/80 shadow-sm'
          }`}
        >
          {/* Feline Paw Container Icon */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-felid-surface to-felid-pine border border-felid-border-light mx-auto flex items-center justify-center text-felid-accent mb-4 shadow-sm group-hover:scale-105 transition-transform">
            <PawPrint className="w-8 h-8" />
          </div>

          <h3 className="font-display font-semibold text-lg text-felid-ivory mb-2 flex items-center justify-center gap-2">
            <span>Drop Your Feline Photo Here</span>
            <Cat className="w-4 h-4 text-felid-accent" />
          </h3>
          <p className="text-xs sm:text-sm text-felid-muted max-w-md mx-auto mb-6 leading-relaxed">
            Drag and drop a photo of your house cat, kitten, or any wild felid. The AI model will scan its facial contours, ears, and coat patterns.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-felid-surface border border-felid-border hover:border-felid-accent text-felid-ivory text-xs font-medium inline-flex items-center gap-2 transition-all hover:shadow-pink-glow"
            >
              <ImageIcon className="w-4 h-4 text-felid-accent" />
              Choose File
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-felid-surface border border-felid-border hover:border-felid-accent text-felid-ivory text-xs font-medium inline-flex items-center gap-2 transition-all sm:hidden"
            >
              <Camera className="w-4 h-4 text-felid-accent" />
              Take Cat Photo
            </button>
          </div>

          <div className="mt-6 text-[11px] text-felid-muted/70 font-mono">
            JPEG, PNG, WebP · Up to 15MB
          </div>
        </div>
      ) : (
        <div className="relative rounded-3xl overflow-hidden border border-felid-border bg-felid-surface shadow-card">
          <div className="relative max-h-[440px] flex items-center justify-center bg-black/70 overflow-hidden">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Selected feline for identification"
                className="max-h-[420px] w-auto object-contain mx-auto"
              />
            )}

            {/* Clear Button */}
            {!isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/75 hover:bg-pink-950 text-white hover:text-felid-accent border border-white/20 transition-all shadow-md focus:outline-none"
                aria-label="Remove image"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* File info pill */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-black/75 backdrop-blur-sm border border-white/10 text-xs text-felid-ivory flex items-center gap-2">
              <PawPrint className="w-3.5 h-3.5 text-felid-accent" />
              <span className="truncate max-w-[200px]">{selectedImage.name}</span>
              <span className="text-felid-muted text-[10px] font-mono">
                ({Math.round(selectedImage.size / 1024)} KB)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
