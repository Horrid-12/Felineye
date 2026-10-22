import React from 'react';
import { Shield, ExternalLink, AlertTriangle, PawPrint, Cat } from 'lucide-react';
import { ActivePage } from '../../types';

interface Props {
  setActivePage: (page: ActivePage) => void;
}

export const Footer: React.FC<Props> = ({ setActivePage }) => {
  return (
    <footer className="bg-felid-pine/80 border-t border-felid-border mt-20 text-xs text-felid-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Wildlife conservation notice banner */}
        <div className="mb-10 p-4 rounded-2xl bg-felid-surface/70 border border-felid-border-light flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-pink-500/10 text-felid-accent shrink-0">
            <PawPrint className="w-5 h-5" />
          </div>
          <div className="text-xs leading-relaxed text-felid-ivory-dim">
            <strong className="text-felid-accent block text-sm font-medium mb-0.5">
              Feline Welfare & Responsible Field Protocol 🐾
            </strong>
            FelidLens is committed to protecting all feline species, from domestic strays to endangered wild cats. Exact observation coordinates are generalized to prevent illegal poaching, hunting, or disturbance of vulnerable feline habitats. Never pursue, trap, or disturb wild felids in natural sanctuaries.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1 */}
          <div className="space-y-3 md:col-span-1">
            <span className="font-display font-bold text-base text-felid-ivory tracking-wide flex items-center gap-1.5">
              <Cat className="w-4 h-4 text-felid-accent" />
              FELID<span className="text-felid-accent">LENS</span>
            </span>
            <p className="text-xs text-felid-muted leading-relaxed">
              A feline-focused wildlife identification and field discovery platform for the entire cat family (Felidae), combining neural computer vision with responsible conservation ethics.
            </p>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-felid-ivory font-mono">
              Cat Atlas
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => setActivePage('identify')} className="hover:text-felid-accent transition-colors">
                  Paw Scanner (AI Identify)
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('species')} className="hover:text-felid-accent transition-colors">
                  Felidae Species Encyclopedia
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('collection')} className="hover:text-felid-accent transition-colors">
                  Field Journal & Badges
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('observations')} className="hover:text-felid-accent transition-colors">
                  Feline Sightings Map
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-felid-ivory font-mono">
              Scientific Authorities
            </h4>
            <ul className="space-y-1.5">
              <li>
                <a
                  href="https://www.inaturalist.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-felid-accent transition-colors"
                >
                  iNaturalist Network <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.gbif.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-felid-accent transition-colors"
                >
                  GBIF Biodiversity Backbone <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.iucnredlist.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-felid-accent transition-colors"
                >
                  IUCN Red List of Threatened Species <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <button onClick={() => setActivePage('methodology')} className="hover:text-felid-accent transition-colors">
                  Model Methodology & Uncertainty
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-felid-ivory font-mono">
              Transparent AI
            </h4>
            <div className="flex items-start gap-2 text-xs">
              <Shield className="w-4 h-4 text-felid-accent shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                Evaluates prediction entropy and out-of-domain boundaries to provide honest confidence scores and prevent deceptive predictions.
              </span>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-felid-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © {new Date().getFullYear()} FelidLens. Created with care for cats and wildlife enthusiasts.
          </div>
          <div className="flex items-center gap-1 text-felid-muted">
            Feline taxonomy adhering to Kitchener et al. (IUCN Cat Specialist Group).
          </div>
        </div>
      </div>
    </footer>
  );
};
