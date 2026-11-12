import React from 'react';
import { Shield, ExternalLink } from 'lucide-react';
import { ActivePage } from '../../types';
import { FelineyeEmblem } from '../ui/JournalOrnament';

interface Props {
  setActivePage: (page: ActivePage) => void;
}

export const Footer: React.FC<Props> = ({ setActivePage }) => {
  return (
    <footer className="bg-felid-surface border-t border-felid-border mt-20 text-xs text-felid-muted-ink">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Col 1: Brand & Mission */}
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <FelineyeEmblem className="w-7 h-7 shrink-0" />
              <span className="font-display font-semibold text-lg text-felid-ink tracking-tight">
                Felin<span className="italic text-felid-pomegranate-ink">eye</span>
              </span>
            </div>
            <p className="text-xs text-felid-muted-ink leading-relaxed font-sans">
              Wildlife identification and field discovery platform for the family Felidae, pairing local computer vision with conservation-first field ethics.
            </p>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono font-medium uppercase tracking-wider text-felid-ink">
              Cat Atlas &amp; Tools
            </h4>
            <ul className="space-y-2 font-sans text-xs">
              <li>
                <button
                  type="button"
                  onClick={() => setActivePage('identify')}
                  className="hover:text-felid-cobalt-ink transition-colors text-left"
                >
                  Paw Scanner (AI Identify)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePage('species')}
                  className="hover:text-felid-cobalt-ink transition-colors text-left"
                >
                  Felidae Species Encyclopedia
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePage('collection')}
                  className="hover:text-felid-cobalt-ink transition-colors text-left"
                >
                  Field Journal &amp; Badges
                </button>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePage('observations')}
                  className="hover:text-felid-cobalt-ink transition-colors text-left"
                >
                  Feline Sightings Explorer
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Scientific Authorities */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono font-medium uppercase tracking-wider text-felid-ink">
              Scientific Authorities
            </h4>
            <ul className="space-y-2 font-sans text-xs">
              <li>
                <a
                  href="https://www.inaturalist.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-felid-cobalt-ink transition-colors"
                >
                  <span>iNaturalist Network</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.gbif.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-felid-cobalt-ink transition-colors"
                >
                  <span>GBIF Backbone</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a
                  href="https://www.iucnredlist.org"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 hover:text-felid-cobalt-ink transition-colors"
                >
                  <span>IUCN Red List</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={() => setActivePage('methodology')}
                  className="hover:text-felid-cobalt-ink transition-colors text-left"
                >
                  Model Methodology
                </button>
              </li>
            </ul>
          </div>

          {/* Col 4: Transparent AI & Attribution */}
          <div className="space-y-2.5">
            <h4 className="text-[11px] font-mono font-medium uppercase tracking-wider text-felid-ink">
              Transparent AI
            </h4>
            <div className="flex items-start gap-2 text-xs font-sans">
              <Shield className="w-4 h-4 text-felid-cobalt-ink shrink-0 mt-0.5" />
              <span className="leading-relaxed text-felid-muted-ink">
                Runs BioCLIP zero-shot ranking behind an independent feline content gate. Scores are
                visual similarities, not calibrated probabilities, and weak or conflicting evidence
                is reported as an abstention instead of a guess.
              </span>
            </div>
            <div className="pt-1 text-[11px] text-felid-muted-ink font-mono">
              Based on the original architecture of{' '}
              <strong className="text-felid-cobalt-ink font-medium">BirdLens</strong> by sdprojects12.
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-felid-border flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] font-mono text-felid-muted-ink">
          <div>
            &copy; {new Date().getFullYear()} Felineye. Created with care for cats and wildlife conservationists.
          </div>
          <div>
            Taxonomy: Kitchener et al. (IUCN Cat Specialist Group Revised Taxonomy).
          </div>
        </div>
      </div>
    </footer>
  );
};
