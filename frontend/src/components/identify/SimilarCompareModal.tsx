import React, { useEffect, useState } from 'react';
import { X, Scale, ArrowRight } from 'lucide-react';
import { SpeciesDetail } from '../../types';
import { api } from '../../services/api';
import { ConservationBadge } from '../species/ConservationBadge';
import { LoadingState } from '../ui/JournalPrimitives';

interface Props {
  sourceSlug: string;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}

export const SimilarCompareModal: React.FC<Props> = ({
  sourceSlug,
  onClose,
  onNavigate,
}) => {
  const [sourceDetail, setSourceDetail] = useState<SpeciesDetail | null>(null);
  const [targetDetail, setTargetDetail] = useState<SpeciesDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setTargetDetail(null);
        const src = await api.getSpeciesDetail(sourceSlug);
        setSourceDetail(src);

        if (src.similar_species && src.similar_species.length > 0) {
          const targetSlug = src.similar_species[0].slug;
          const tgt = await api.getSpeciesDetail(targetSlug);
          setTargetDetail(tgt);
        }
      } catch (err) {
        console.error('Failed to load comparison data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [sourceSlug]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-felid-scrim/75 backdrop-blur-[2px] animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-felid-surface border border-felid-border-strong rounded-sm shadow-modal overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-felid-border bg-felid-elevated/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-felid-cobalt/15 border border-felid-cobalt/40 rounded-sm flex items-center justify-center text-felid-cobalt-ink">
              <Scale className="w-4 h-4" />
            </div>
            <h3
              id="compare-modal-title"
              className="font-display font-semibold text-lg sm:text-xl text-felid-ink tracking-tight"
            >
              Diagnostic Comparative Anatomy
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 bg-felid-surface text-felid-muted-ink hover:text-felid-ink border border-felid-border rounded-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <LoadingState label="Loading comparative morphology..." />
          ) : !sourceDetail ? (
            <div className="py-12 text-center text-felid-muted-ink font-mono text-xs">
              Could not load comparative taxonomy records.
            </div>
          ) : (
            <>
              {/* Key Differentiator Summary Box */}
              {sourceDetail.similar_species.length > 0 && (
                <div className="journal-inset p-4 text-xs sm:text-sm leading-relaxed space-y-1">
                  <strong className="flex items-center gap-1.5 text-felid-cobalt-ink font-mono text-[11px] font-medium uppercase tracking-wider">
                    <Scale className="w-3.5 h-3.5" /> Diagnostic Distinction
                  </strong>
                  <p className="text-felid-ink font-sans">
                    {sourceDetail.similar_species[0].differentiator}
                  </p>
                </div>
              )}

              {/* Side-by-side Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Source Species */}
                <div className="border border-felid-border rounded-sm bg-felid-elevated/40 p-4 space-y-4">
                  <div className="h-44 overflow-hidden border border-felid-border rounded-sm relative bg-felid-elevated">
                    <img
                      src={sourceDetail.image_url}
                      alt={sourceDetail.common_name}
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute top-2 right-2">
                      <ConservationBadge status={sourceDetail.conservation_status} />
                    </div>
                    <div className="absolute top-2 left-2 bg-felid-cobalt text-felid-on-cobalt font-mono font-medium text-[10px] px-2 py-0.5 rounded-sm uppercase">
                      Specimen
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-display font-semibold text-lg text-felid-ink">
                        {sourceDetail.common_name}
                      </h4>
                      <p className="text-xs italic text-felid-muted-ink font-serif">
                        {sourceDetail.scientific_name}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => onNavigate(sourceDetail.id)}
                      className="text-xs font-sans font-semibold text-felid-cobalt-ink inline-flex items-center gap-1 hover:underline shrink-0"
                    >
                      <span>Profile</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                  <div className="space-y-2.5 text-xs">
                    <div className="bg-felid-surface p-2.5 border border-felid-border rounded-sm">
                      <span className="text-felid-muted-ink font-mono text-[10px] uppercase block mb-0.5">
                        Size &amp; Weight
                      </span>
                      <span className="text-felid-ink font-mono font-medium">
                        {sourceDetail.size_and_weight || 'Not specified'}
                      </span>
                    </div>
                    <div className="bg-felid-surface p-2.5 border border-felid-border rounded-sm space-y-1.5">
                      <span className="text-felid-muted-ink font-mono text-[10px] uppercase block">
                        Key Morphology Traits
                      </span>
                      <ul className="list-disc list-inside space-y-1 text-felid-ink/90 font-sans text-xs">
                        {sourceDetail.distinguishing_characteristics.slice(0, 3).map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Column 2: Target Similar Species */}
                {targetDetail ? (
                  <div className="border border-felid-border rounded-sm bg-felid-elevated/40 p-4 space-y-4">
                    <div className="h-44 overflow-hidden border border-felid-border rounded-sm relative bg-felid-elevated">
                      <img
                        src={targetDetail.image_url}
                        alt={targetDetail.common_name}
                        className="w-full h-full object-cover object-top"
                      />
                      <div className="absolute top-2 right-2">
                        <ConservationBadge status={targetDetail.conservation_status} />
                      </div>
                      <div className="absolute top-2 left-2 bg-felid-pomegranate text-felid-on-pomegranate font-mono font-medium text-[10px] px-2 py-0.5 rounded-sm uppercase">
                        Lookalike Sibling
                      </div>
                    </div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="font-display font-semibold text-lg text-felid-ink">
                          {targetDetail.common_name}
                        </h4>
                        <p className="text-xs italic text-felid-muted-ink font-serif">
                          {targetDetail.scientific_name}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => onNavigate(targetDetail.id)}
                        className="text-xs font-sans font-semibold text-felid-cobalt-ink inline-flex items-center gap-1 hover:underline shrink-0"
                      >
                        <span>Profile</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="space-y-2.5 text-xs">
                      <div className="bg-felid-surface p-2.5 border border-felid-border rounded-sm">
                        <span className="text-felid-muted-ink font-mono text-[10px] uppercase block mb-0.5">
                          Size &amp; Weight
                        </span>
                        <span className="text-felid-ink font-mono font-medium">
                          {targetDetail.size_and_weight || 'Not specified'}
                        </span>
                      </div>
                      <div className="bg-felid-surface p-2.5 border border-felid-border rounded-sm space-y-1.5">
                        <span className="text-felid-muted-ink font-mono text-[10px] uppercase block">
                          Key Morphology Traits
                        </span>
                        <ul className="list-disc list-inside space-y-1 text-felid-ink/90 font-sans text-xs">
                          {targetDetail.distinguishing_characteristics.slice(0, 3).map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border border-dashed border-felid-border-strong rounded-sm p-8 flex items-center justify-center text-center text-xs font-mono text-felid-muted-ink bg-felid-elevated/30">
                    No secondary comparative species registered in this taxon pair.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-felid-border bg-felid-elevated/70 flex justify-end">
          <button type="button" onClick={onClose} className="btn-primary py-2 px-4 text-xs">
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
