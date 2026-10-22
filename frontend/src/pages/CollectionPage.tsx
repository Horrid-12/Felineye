import React, { useEffect, useState } from 'react';
import {
  Award,
  Sparkles,
  Lock,
  Eye,
  CheckCircle2
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

  // Compute badge unlock progress
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
        if (!meta) return { count: 0, unlocked: false };
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
    <div className="py-6 space-y-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-felid-accent uppercase tracking-wider mb-1">
            <Award className="w-3.5 h-3.5" />
            <span>Field Naturalist Journal</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-felid-ivory tracking-tight">
            Discovery <span className="text-felid-accent">Expedition</span>
          </h1>
          <p className="text-xs sm:text-sm text-felid-muted mt-1 max-w-xl">
            Track your feline discoveries, rank progression, and field badges. Identified felids are permanently cataloged in your private local expedition log.
          </p>
        </div>

        {discoveryCount > 0 && (
          <div>
            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="px-3 py-1.5 rounded-lg text-xs text-felid-muted hover:text-red-400 hover:bg-red-950/40 border border-transparent hover:border-red-900/40 transition-colors"
              >
                Reset Progress
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-red-950/60 p-2 rounded-lg border border-red-800 text-xs">
                <span className="text-red-200">Clear journal?</span>
                <button
                  onClick={() => {
                    clearProgress();
                    setShowResetConfirm(false);
                  }}
                  className="px-2 py-0.5 rounded bg-red-800 text-white font-medium"
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2 py-0.5 rounded bg-felid-surface text-felid-muted"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Rank Progress Bar */}
      <RankProgress
        currentRank={currentRank}
        nextRank={nextRank}
        totalXp={totalXp}
        discoveryCount={discoveryCount}
        totalSpeciesCount={meta?.species.length || 37}
      />

      {loading && (
        <div className="py-12 text-center text-felid-muted space-y-2">
          <div className="w-8 h-8 rounded-full border-2 border-felid-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono">Loading field journal records...</p>
        </div>
      )}

      {/* Expedition Milestones & Badges */}
      {meta && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-felid-ivory flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-felid-accent" />
              Field Badges & Milestones
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
          <div className="flex items-center justify-between">
            <h2 className="font-display font-bold text-xl text-felid-ivory">
              Felidae Field Roster
            </h2>
            <span className="text-xs font-mono text-felid-muted">
              {discoveryCount} Discovered / {meta.species.length - discoveryCount} Undocumented
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {meta.species.map((sp) => {
              const isFound = Boolean(discoveries[sp.id]);

              return (
                <div
                  key={sp.id}
                  onClick={() => onSelectSpecies(sp.id)}
                  className={`relative rounded-xl overflow-hidden border p-2 flex flex-col items-center text-center cursor-pointer transition-all ${
                    isFound
                      ? 'bg-felid-surface border-felid-accent/50 shadow-sm hover:scale-[1.02]'
                      : 'bg-felid-surface/20 border-felid-border/50 opacity-50 hover:opacity-80'
                  }`}
                >
                  {/* Thumbnail / Silhouette */}
                  <div className="w-full aspect-square rounded-lg overflow-hidden bg-black relative mb-2">
                    <img
                      src={sp.thumbnail_url}
                      alt={sp.common_name}
                      className={`w-full h-full object-cover transition-all ${
                        isFound ? 'filter-none' : 'grayscale contrast-125 brightness-50'
                      }`}
                      loading="lazy"
                    />

                    {isFound ? (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-felid-accent text-black flex items-center justify-center shadow">
                        <CheckCircle2 className="w-3 h-3" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                        <Lock className="w-4 h-4 text-felid-muted/70" />
                      </div>
                    )}
                  </div>

                  <span className="font-display font-bold text-xs text-felid-ivory truncate w-full">
                    {sp.common_name}
                  </span>
                  <span className="text-[10px] text-felid-muted truncate w-full font-serif italic">
                    {sp.scientific_name}
                  </span>

                  <div className="mt-1.5 pt-1.5 border-t border-felid-border/40 w-full flex items-center justify-between text-[10px] text-felid-muted font-mono">
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
        <div className="p-8 rounded-2xl border border-dashed border-felid-border bg-felid-surface/30 text-center space-y-3">
          <p className="text-sm text-felid-ivory font-medium">Your expedition journal is currently blank.</p>
          <p className="text-xs text-felid-muted max-w-md mx-auto">
            Take or upload a photograph of your domestic cat or a wild feline in the AI Identifier to earn your first discovery badge and XP!
          </p>
          <button
            onClick={() => setActivePage('identify')}
            className="px-4 py-2 rounded-lg bg-felid-accent hover:bg-felid-accent-hover text-black text-xs font-semibold inline-flex items-center gap-2 transition-colors"
          >
            <Eye className="w-4 h-4" /> Go to AI Identifier
          </button>
        </div>
      )}
    </div>
  );
};
