import React, { useEffect, useState } from 'react';
import {
  Sparkles,
  Lock,
  CheckCircle2,
  PawPrint,
  Cat
} from 'lucide-react';
import { CollectionMetaResponse, ActivePage } from '../types';
import { api } from '../services/api';
import { useCollectionStore } from '../store/useCollectionStore';
import { RankProgress } from '../components/collection/RankProgress';
import { BadgeItem } from '../components/collection/BadgeItem';

interface Props {
  setActivePage: (page: ActivePage) => void;
  onSelectSpecies: (slug: string) => void;
}

export const CollectionPage: React.FC<Props> = ({ setActivePage, onSelectSpecies }) => {
  const [meta, setMeta] = useState<CollectionMetaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const {
    discoveries,
    totalXp,
    discoveryCount,
    currentRank,
    nextRank,
    clearProgress,
  } = useCollectionStore();

  useEffect(() => {
    async function loadMeta() {
      try {
        setLoading(true);
        const data = await api.getCollectionMeta();
        setMeta(data);
      } catch (e) {
        console.error('Failed to load collection meta:', e);
      } finally {
        setLoading(false);
      }
    }
    loadMeta();
  }, []);

  const evaluateBadgeProgress = (badgeId: string): { count: number; unlocked: boolean } => {
    const discoveredIds = Object.keys(discoveries);

    switch (badgeId) {
      case 'first_contact': {
        const count = discoveredIds.length;
        return { count, unlocked: count >= 1 };
      }
      case 'panthera_master': {
        const pantheraList = [
          'panthera-leo',
          'panthera-tigris',
          'panthera-onca',
          'panthera-pardus',
          'panthera-uncia',
        ];
        const count = pantheraList.filter((id) => discoveries[id]).length;
        return { count, unlocked: count >= 5 };
      }
      case 'lynx_tracker': {
        const lynxList = ['lynx-lynx', 'lynx-rufus', 'lynx-canadensis', 'lynx-pardinus'];
        const count = lynxList.filter((id) => discoveries[id]).length;
        return { count, unlocked: count >= 4 };
      }
      case 'high_altitude': {
        const highAlt = ['panthera-uncia', 'otocolobus-manul', 'leopardus-jacobita'];
        const count = highAlt.filter((id) => discoveries[id]).length;
        return { count, unlocked: count >= 3 };
      }
      case 'water_master': {
        const swimmers = ['prionailurus-viverrinus', 'prionailurus-planiceps'];
        const count = swimmers.filter((id) => discoveries[id]).length;
        return { count, unlocked: count >= 2 };
      }
      case 'conservation_champion': {
        const count = discoveredIds.length;
        return { count, unlocked: count >= 6 };
      }
      case 'grand_naturalist': {
        const count = discoveredIds.length;
        return { count, unlocked: count >= 20 };
      }
      default:
        return { count: 0, unlocked: false };
    }
  };

  return (
    <div className="py-4 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono font-black text-felid-accent uppercase tracking-wider mb-2">
            <PawPrint className="w-3.5 h-3.5" />
            <span>LOCAL LOG // PRIVACY ENCRYPTED</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-felid-ivory uppercase tracking-tight">
            DISCOVERY <span className="text-felid-accent underline decoration-4 underline-offset-4">EXPEDITION</span>
          </h1>
          <p className="text-xs sm:text-sm text-felid-muted mt-1 max-w-xl font-mono leading-relaxed">
            Track logged feline discoveries, rank progression, and field achievement badges. All verified sightings are persistently cataloged in your private local journal.
          </p>
        </div>

        {discoveryCount > 0 && (
          <div>
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3.5 py-2 text-xs font-mono font-bold text-red-400 bg-[#0c0a0e] hover:bg-red-950 border-2 border-black shadow-brutal-sm brutal-press uppercase"
              >
                Reset Progress
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-[#0c0a0e] p-2 border-2 border-black text-xs font-mono shadow-brutal-sm">
                <span className="text-pink-200">Clear journal?</span>
                <button
                  onClick={() => {
                    clearProgress();
                    setShowResetConfirm(false);
                  }}
                  className="px-2.5 py-1 bg-red-600 text-white font-bold border border-black brutal-press uppercase"
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 bg-[#1d1922] text-felid-muted border border-black brutal-press uppercase"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rank Progress Bar (Promptify Inset Influence) */}
      <RankProgress
        currentRank={currentRank}
        nextRank={nextRank}
        totalXp={totalXp}
        discoveryCount={discoveryCount}
        totalSpeciesCount={meta?.species.length || 41}
      />

      {loading && (
        <div className="py-12 text-center text-felid-muted space-y-2 font-mono">
          <div className="w-8 h-8 border-2 border-felid-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase">LOADING EXPEDITION JOURNAL RECORDS...</p>
        </div>
      )}

      {/* Expedition Milestones & Badges */}
      {meta && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black">
            <h2 className="font-display font-black text-xl text-felid-ivory uppercase flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-felid-accent" />
              FIELD BADGES & MILESTONES
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {meta.badges.map((badge) => {
              const { count, unlocked } = evaluateBadgeProgress(badge.id);
              return (
                <BadgeItem
                  key={badge.id}
                  badge={badge}
                  unlocked={unlocked}
                  progressCount={count}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Discoveries Grid: Logged vs Uncataloged Silhouettes */}
      {meta && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b-2 border-black">
            <h2 className="font-display font-black text-xl text-felid-ivory uppercase flex items-center gap-2">
              <Cat className="w-5 h-5 text-felid-accent" />
              FELIDAE FIELD ROSTER
            </h2>
            <span className="text-xs font-mono font-bold text-felid-muted">
              {discoveryCount} DISCOVERED / {meta.species.length - discoveryCount} UNDOCUMENTED
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {meta.species.map((sp) => {
              const isFound = Boolean(discoveries[sp.id]);

              return (
                <div
                  key={sp.id}
                  onClick={() => onSelectSpecies(sp.id)}
                  className={`relative border-2 border-black p-2 flex flex-col items-center text-center cursor-pointer transition-all brutal-press ${
                    isFound
                      ? 'bg-[#141218] shadow-brutal-sm hover:shadow-brutal'
                      : 'bg-[#0c0a0e]/60 opacity-40 hover:opacity-75'
                  }`}
                >
                  {/* Thumbnail / Silhouette */}
                  <div className="w-full aspect-square overflow-hidden bg-black border-2 border-black relative mb-2">
                    <img
                      src={sp.thumbnail_url}
                      alt={sp.common_name}
                      className={`w-full h-full object-cover transition-all ${
                        isFound ? 'filter-none' : 'grayscale contrast-125 brightness-40'
                      }`}
                      loading="lazy"
                    />

                    {isFound ? (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-felid-accent text-black border border-black flex items-center justify-center shadow-brutal-sm font-black">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <Lock className="w-4 h-4 text-felid-muted" />
                      </div>
                    )}
                  </div>

                  <span className="font-display font-black text-xs text-felid-ivory uppercase truncate w-full">
                    {sp.common_name}
                  </span>
                  <span className="text-[10px] text-felid-muted truncate w-full font-serif italic">
                    {sp.scientific_name}
                  </span>

                  <div className="mt-1.5 pt-1.5 border-t border-[#332c3a] w-full flex items-center justify-between text-[10px] text-felid-muted font-mono font-bold">
                    <span>{sp.rarity}</span>
                    <span className="text-felid-accent">+{sp.xp_reward}XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Call to action if no discoveries */}
      {discoveryCount === 0 && (
        <div className="p-8 border-2 border-dashed border-[#332c3a] bg-[#0c0a0e] text-center space-y-4 shadow-brutal-sm">
          <p className="text-sm text-felid-ivory font-mono font-bold uppercase">YOUR EXPEDITION JOURNAL IS CURRENTLY BLANK.</p>
          <p className="text-xs text-felid-muted max-w-md mx-auto font-mono leading-relaxed">
            Take or upload a photograph of your cat, kitten, or any wild felid in the Paw Scanner to earn your first discovery badge and XP!
          </p>
          <button
            onClick={() => setActivePage('identify')}
            className="px-6 py-3 bg-felid-accent hover:bg-felid-accent-hover text-black text-xs font-mono font-black uppercase border-2 border-black shadow-brutal brutal-press inline-flex items-center gap-2"
          >
            <PawPrint className="w-4 h-4" /> Go to Paw Scanner
          </button>
        </div>
      )}
    </div>
  );
};
