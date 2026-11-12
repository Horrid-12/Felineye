import React, { useEffect, useState, useRef } from 'react';
import { Camera, X, Image as ImageIcon, PawPrint, Cat } from 'lucide-react';
import { AlertBanner } from '../ui/JournalPrimitives';
import { SpecimenCorners } from '../ui/JournalOrnament';

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

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

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
        <AlertBanner tone="error" className="mb-4">
          {validationError}
        </AlertBanner>
      )}

      {!selectedImage ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="Drop feline photograph here or press Enter to choose a file"
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
          className={`relative border border-dashed rounded-sm p-8 sm:p-12 text-center transition-all cursor-pointer bg-felid-surface shadow-plate group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt ${
            isDragOver
              ? 'border-felid-cobalt bg-felid-cobalt/10 shadow-plate-hover'
              : 'border-felid-border-strong hover:border-felid-cobalt/80'
          }`}
        >
          <SpecimenCorners colorClass="border-felid-cobalt/55" />

          {/* Subtle specimen plate metadata labels */}
          <div className="flex items-center justify-between text-[10px] font-mono text-felid-muted-ink uppercase tracking-wider mb-4 px-2 select-none">
            <span>Specimen Plate · Optical Input</span>
            <span>Ready for Analysis</span>
          </div>

          {/* Feline Emblem Container */}
          <div className="relative z-10 w-14 h-14 bg-felid-elevated border border-felid-border-strong rounded-sm mx-auto flex items-center justify-center text-felid-cobalt-ink mb-4 group-hover:border-felid-cobalt/60 transition-colors">
            <PawPrint className="w-7 h-7" />
          </div>

          <h3 className="relative z-10 font-display font-semibold text-xl sm:text-2xl text-felid-ink tracking-tight mb-2 flex items-center justify-center gap-2">
            <span>DROP FELINE PHOTOGRAPH HERE</span>
            <Cat className="w-5 h-5 text-felid-pomegranate-ink" />
          </h3>
          <p className="relative z-10 text-sm text-felid-muted-ink max-w-md mx-auto mb-6 leading-relaxed font-sans">
            Upload any photo of a house cat, kitten, or wild felid. The local vision model compares morphological features against the curated Felidae taxonomy.
          </p>

          <div
            className="relative z-10 flex flex-wrap items-center justify-center gap-3"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary text-xs uppercase tracking-wide font-mono"
            >
              <ImageIcon className="w-4 h-4 text-felid-cobalt-ink" />
              Choose File
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="btn-primary text-xs uppercase tracking-wide font-mono sm:hidden"
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
          </div>

          <div className="relative z-10 mt-6 text-[11px] text-felid-muted-ink font-mono tracking-wide">
            JPEG, PNG, WebP · Up to 15 MB · EXIF-sanitized in memory
          </div>
        </div>
      ) : (
        <div className="relative journal-plate overflow-hidden">
          <div className="relative max-h-[440px] flex items-center justify-center bg-felid-elevated/60 overflow-hidden p-4 sm:p-6">
            {previewUrl && (
              <div className="relative border border-felid-border-strong rounded-sm shadow-plate max-h-[400px] bg-felid-surface p-1">
                <img
                  src={previewUrl}
                  alt="Selected feline for identification"
                  className="max-h-[384px] w-auto object-contain mx-auto rounded-sm"
                />
                <SpecimenCorners colorClass="border-felid-cobalt/80" />
              </div>
            )}

            {/* Clear Button */}
            {!isLoading && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute top-3 right-3 p-2 bg-felid-surface/95 text-felid-ink hover:text-felid-pomegranate-ink border border-felid-border-strong rounded-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt"
                aria-label="Remove image"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* File info pill */}
            <div className="absolute bottom-3 left-3 px-3 py-1.5 bg-felid-surface/95 border border-felid-border-strong rounded-sm shadow-sm text-xs font-mono text-felid-ink flex items-center gap-2">
              <PawPrint className="w-3.5 h-3.5 text-felid-cobalt-ink" />
              <span className="truncate max-w-[200px] font-medium">{selectedImage.name}</span>
              <span className="text-felid-muted-ink text-[10px]">
                ({Math.round(selectedImage.size / 1024)} KB)
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
