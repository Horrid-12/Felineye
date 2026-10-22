import React, { useState, useRef } from 'react';
import { UploadCloud, Camera, X, Image as ImageIcon, AlertCircle } from 'lucide-react';

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
      setValidationError('Please select a valid JPEG, PNG, or WebP image file.');
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
        <div className="mb-4 p-3 rounded-lg bg-red-950/60 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
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
          className={`relative border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer ${
            isDragOver
              ? 'border-felid-accent bg-felid-accent/5 scale-[0.99]'
              : 'border-felid-border hover:border-felid-border-light bg-felid-surface/50 hover:bg-felid-surface/80'
          }`}
        >
          <div className="w-16 h-16 rounded-2xl bg-felid-surface border border-felid-border-light mx-auto flex items-center justify-center text-felid-accent mb-4 shadow-sm group-hover:scale-105 transition-transform">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="font-display font-semibold text-lg text-felid-ivory mb-2">
            Upload a Feline Photograph
          </h3>
          <p className="text-sm text-felid-muted max-w-md mx-auto mb-6 leading-relaxed">
            Drag and drop your wildlife photo here, or browse from your device. Supports domestic cats and wild felids.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-felid-surface border border-felid-border hover:border-felid-accent text-felid-ivory text-xs font-medium inline-flex items-center gap-2 transition-colors"
            >
              <ImageIcon className="w-4 h-4 text-felid-accent" />
              Choose File
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="px-4 py-2 rounded-lg bg-felid-surface border border-felid-border hover:border-felid-accent text-felid-ivory text-xs font-medium inline-flex items-center gap-2 transition-colors sm:hidden"
            >
              <Camera className="w-4 h-4 text-felid-accent" />
              Take Photo
            </button>
          </div>

          <div className="mt-6 text-[11px] text-felid-muted/80">
            JPEG, PNG, WebP · Up to 15MB
          </div>
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-felid-border bg-felid-surface shadow-card">
          <div className="relative max-h-[420px] flex items-center justify-center bg-black/60 overflow-hidden">
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Selected feline for identification"
                className="max-h-[400px] w-auto object-contain mx-auto"
              />
            )}

            {/* Clear Button */}
            {!isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-red-950 text-white hover:text-red-300 border border-white/20 transition-all shadow-md focus:outline-none"
                aria-label="Remove image"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* File info pill */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-md bg-black/70 backdrop-blur-sm border border-white/10 text-xs text-felid-ivory flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 text-felid-accent" />
              <span className="truncate max-w-[200px]">{selectedImage.name}</span>
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
