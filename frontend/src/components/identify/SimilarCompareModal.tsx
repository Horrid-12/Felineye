import React, { useEffect, useState } from 'react';
import { X, Scale, PawPrint } from 'lucide-react';
import { SpeciesDetail } from '../../types';
import { api } from '../../services/api';
import { ConservationBadge } from '../species/ConservationBadge';

interface Props {
  sourceSlug: string;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}

export const SimilarCompareModal: React.FC<Props> = ({ sourceSlug, onClose, onNavigate }) => {
  const [sourceDetail, setSourceDetail] = useState<SpeciesDetail | null>(null);
  const [targetDetail, setTargetDetail] = useState<SpeciesDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-felid-surface border border-felid-border rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-felid-border bg-felid-pine/80">
          <div className="flex items-center gap-2">
            <PawPrint className="w-5 h-5 text-felid-accent" />
            <h3 className="font-display font-bold text-lg text-felid-ivory">
              Feline Morphological Comparison
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-felid-muted hover:text-white hover:bg-felid-surface border border-transparent hover:border-felid-border"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center text-felid-muted">
              <div className="w-8 h-8 rounded-full border-2 border-felid-accent border-t-transparent animate-spin mx-auto mb-3" />
              Loading comparative feline morphology...
            </div>
          ) : !sourceDetail ? (
            <div className="py-12 text-center text-felid-muted">
              Could not load comparison records.
            </div>
          ) : (
            <>
              {/* Key Differentiator Summary in Pink Quartz */}
              {sourceDetail.similar_species.length > 0 && (
                <div className="p-4 rounded-2xl bg-pink-950/25 border border-pink-800/40 text-xs text-pink-200 leading-relaxed shadow-sm">
                  <strong className="block text-felid-accent font-semibold mb-1 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" /> Diagnostic Distinction:
                  </strong>
                  {sourceDetail.similar_species[0].differentiator}
                </div>
              )}

              {/* Side-by-side Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Source Species */}
                <div className="rounded-2xl border border-felid-border bg-felid-pine/60 p-4 space-y-4">
                  <div className="h-44 rounded-xl overflow-hidden border border-felid-border relative">
                    <img
                      src={sourceDetail.image_url}
                      alt={sourceDetail.common_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <ConservationBadge status={sourceDetail.conservation_status} />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-base text-felid-ivory">
                      {sourceDetail.common_name}
                    </h4>
                    <p className="text-xs italic text-felid-muted font-serif">
                      {sourceDetail.scientific_name}
                    </p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="text-felid-muted block">Size & Weight:</span>
                      <span className="text-felid-ivory">{sourceDetail.size_and_weight || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-felid-muted block">Key Traits:</span>
                      <ul className="list-disc list-inside space-y-1 text-felid-ivory-dim mt-1">
                        {sourceDetail.distinguishing_characteristics.slice(0, 3).map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Column 2: Target Similar Species */}
                {targetDetail ? (
                  <div className="rounded-2xl border border-felid-border bg-felid-pine/60 p-4 space-y-4">
                    <div className="h-44 rounded-xl overflow-hidden border border-felid-border relative">
                      <img
                        src={targetDetail.image_url}
                        alt={targetDetail.common_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <ConservationBadge status={targetDetail.conservation_status} />
                      </div>
                    </div>
                    <div>
                      <h4 className="font-display font-bold text-base text-felid-ivory">
                        {targetDetail.common_name}
                      </h4>
                      <p className="text-xs italic text-felid-muted font-serif">
                        {targetDetail.scientific_name}
                      </p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-felid-muted block">Size & Weight:</span>
                        <span className="text-felid-ivory">{targetDetail.size_and_weight || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-felid-muted block">Key Traits:</span>
                        <ul className="list-disc list-inside space-y-1 text-felid-ivory-dim mt-1">
                          {targetDetail.distinguishing_characteristics.slice(0, 3).map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-felid-border p-8 flex items-center justify-center text-center text-xs text-felid-muted">
                    No secondary comparative species registered in this taxon pair.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-felid-border bg-felid-pine/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-felid-surface hover:bg-felid-surface-hover border border-felid-border text-xs font-medium text-felid-ivory transition-colors"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
