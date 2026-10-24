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
      <div className="relative w-full max-w-4xl bg-[#141218] border-2 border-black shadow-brutal-lg overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-black bg-[#1d1922]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-felid-accent border-2 border-black flex items-center justify-center text-black font-black text-xs shadow-brutal-sm">
              <Scale className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h3 className="font-display font-black text-lg text-felid-ivory uppercase tracking-tight">
              DIAGNOSTIC COMPARATIVE ANATOMY
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-black text-white hover:text-felid-accent border-2 border-black shadow-brutal-sm brutal-press font-mono text-sm"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {loading ? (
            <div className="py-16 text-center text-felid-muted font-mono">
              <div className="w-8 h-8 border-2 border-felid-accent border-t-transparent animate-spin mx-auto mb-3" />
              LOADING COMPARATIVE MORPHOLOGY...
            </div>
          ) : !sourceDetail ? (
            <div className="py-12 text-center text-felid-muted font-mono">
              Could not load comparative taxonomy records.
            </div>
          ) : (
            <>
              {/* Key Differentiator Summary Box */}
              {sourceDetail.similar_species.length > 0 && (
                <div className="p-4 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs leading-relaxed">
                  <strong className="block text-felid-accent font-mono font-black uppercase mb-1 flex items-center gap-1.5">
                    <Scale className="w-4 h-4" /> DIAGNOSTIC DISTINCTION:
                  </strong>
                  <span className="text-felid-ivory-dim font-sans text-sm">
                    {sourceDetail.similar_species[0].differentiator}
                  </span>
                </div>
              )}

              {/* Side-by-side Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Column 1: Source Species */}
                <div className="border-2 border-black bg-[#1d1922] p-4 space-y-4 shadow-brutal-sm">
                  <div className="h-44 overflow-hidden border-2 border-black relative bg-[#0c0a0e]">
                    <img
                      src={sourceDetail.image_url}
                      alt={sourceDetail.common_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2">
                      <ConservationBadge status={sourceDetail.conservation_status} />
                    </div>
                    <div className="absolute top-2 left-2 bg-felid-accent text-black font-mono font-black text-[9px] px-1.5 py-0.5 border border-black">
                      SPECIMEN
                    </div>
                  </div>
                  <div>
                    <h4 className="font-display font-black text-lg text-felid-ivory uppercase">
                      {sourceDetail.common_name}
                    </h4>
                    <p className="text-xs italic text-felid-muted font-serif">
                      {sourceDetail.scientific_name}
                    </p>
                  </div>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="bg-[#0c0a0e] p-2 border border-[#332c3a]">
                      <span className="text-felid-muted text-[10px] uppercase block">Size & Weight:</span>
                      <span className="text-felid-ivory font-bold">{sourceDetail.size_and_weight || 'Not specified'}</span>
                    </div>
                    <div className="bg-[#0c0a0e] p-2 border border-[#332c3a] space-y-1">
                      <span className="text-felid-muted text-[10px] uppercase block">Key Morphology Traits:</span>
                      <ul className="list-disc list-inside space-y-1 text-felid-ivory-dim font-sans text-xs">
                        {sourceDetail.distinguishing_characteristics.slice(0, 3).map((c, i) => (
                          <li key={i}>{c}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Column 2: Target Similar Species */}
                {targetDetail ? (
                  <div className="border-2 border-black bg-[#1d1922] p-4 space-y-4 shadow-brutal-sm">
                    <div className="h-44 overflow-hidden border-2 border-black relative bg-[#0c0a0e]">
                      <img
                        src={targetDetail.image_url}
                        alt={targetDetail.common_name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <ConservationBadge status={targetDetail.conservation_status} />
                      </div>
                      <div className="absolute top-2 left-2 bg-[#fb7185] text-black font-mono font-black text-[9px] px-1.5 py-0.5 border border-black">
                        LOOKALIKE SIBLING
                      </div>
                    </div>
                    <div>
                      <h4 className="font-display font-black text-lg text-felid-ivory uppercase">
                        {targetDetail.common_name}
                      </h4>
                      <p className="text-xs italic text-felid-muted font-serif">
                        {targetDetail.scientific_name}
                      </p>
                    </div>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="bg-[#0c0a0e] p-2 border border-[#332c3a]">
                        <span className="text-felid-muted text-[10px] uppercase block">Size & Weight:</span>
                        <span className="text-felid-ivory font-bold">{targetDetail.size_and_weight || 'Not specified'}</span>
                      </div>
                      <div className="bg-[#0c0a0e] p-2 border border-[#332c3a] space-y-1">
                        <span className="text-felid-muted text-[10px] uppercase block">Key Morphology Traits:</span>
                        <ul className="list-disc list-inside space-y-1 text-felid-ivory-dim font-sans text-xs">
                          {targetDetail.distinguishing_characteristics.slice(0, 3).map((c, i) => (
                            <li key={i}>{c}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-[#332c3a] p-8 flex items-center justify-center text-center text-xs font-mono text-felid-muted bg-[#0c0a0e]">
                    No secondary comparative species registered in this taxon pair.
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t-2 border-black bg-[#1d1922] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-felid-accent hover:bg-felid-accent-hover text-black text-xs font-mono font-black border-2 border-black shadow-brutal-sm brutal-press uppercase"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
