import React from 'react';
import { Shield, ExternalLink, Cat } from 'lucide-react';
import { ActivePage } from '../../types';

interface Props {
  setActivePage: (page: ActivePage) => void;
}

export const Footer: React.FC<Props> = ({ setActivePage }) => {
  return (
    <footer className="bg-[#141218] border-t-2 border-black mt-20 text-xs text-felid-muted">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <span className="font-display font-black text-lg text-felid-ivory uppercase tracking-tight flex items-center gap-2">
              <Cat className="w-5 h-5 text-felid-accent" />
              FELINE<span className="text-felid-accent">EYE</span>
            </span>
            <p className="text-xs text-felid-muted leading-relaxed font-mono">
              Wildlife identification and field discovery platform for the family Felidae, combining neural computer vision with responsible conservation ethics.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-felid-ivory font-mono">
              Cat Atlas & Tools
            </h4>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <button onClick={() => setActivePage('identify')} className="hover:text-felid-accent transition-colors">
                  &gt; Paw Scanner (AI Identify)
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('species')} className="hover:text-felid-accent transition-colors">
                  &gt; Felidae Species Encyclopedia
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('collection')} className="hover:text-felid-accent transition-colors">
                  &gt; Field Journal & Badges
                </button>
              </li>
              <li>
                <button onClick={() => setActivePage('observations')} className="hover:text-felid-accent transition-colors">
                  &gt; Feline Sightings Map
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Scientific Authorities */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-felid-ivory font-mono">
              Scientific Authorities
            </h4>
            <ul className="space-y-2 font-mono text-xs">
              <li>
                <a
                  href="https://www.inaturalist.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-felid-accent transition-colors"
                >
                  &gt; iNaturalist Network <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.gbif.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-felid-accent transition-colors"
                >
                  &gt; GBIF Backbone <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.iucnredlist.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 hover:text-felid-accent transition-colors"
                >
                  &gt; IUCN Red List <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <button onClick={() => setActivePage('methodology')} className="hover:text-felid-accent transition-colors">
                  &gt; Model Methodology
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Transparent AI & Attribution */}
          <div className="space-y-2">
            <h4 className="text-xs font-black uppercase tracking-wider text-felid-ivory font-mono">
              Transparent AI
            </h4>
            <div className="flex items-start gap-2 text-xs font-mono">
              <Shield className="w-4 h-4 text-felid-accent shrink-0 mt-0.5" />
              <span className="leading-relaxed text-felid-muted">
                Runs BioCLIP zero-shot ranking behind an independent feline content gate. Scores are
                visual similarities, not calibrated probabilities, and weak or conflicting evidence
                is reported as an abstention instead of a guess.
              </span>
            </div>
            <div className="pt-2 text-[10px] text-felid-muted font-mono">
              Based on the original architecture of <strong className="text-felid-accent">BirdLens</strong> by sdprojects12.
            </div>
          </div>
        </div>

        <div className="pt-8 border-t-2 border-black flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono">
          <div>
            &copy; {new Date().getFullYear()} Felineye. Created with care for cats and wildlife conservationists.
          </div>
          <div className="flex items-center gap-1 text-felid-muted">
            Taxonomy: Kitchener et al. (IUCN Cat Specialist Group Revised Taxonomy).
          </div>
        </div>
      </div>
    </footer>
  );
};
