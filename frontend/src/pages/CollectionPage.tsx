import React, { useEffect, useState } from 'react';
import { Sparkles, Lock, CheckCircle2, PawPrint, Cat } from 'lucide-react';
import { CollectionMetaResponse, CatalogMeta, ActivePage } from '../types';
import { api } from '../services/api';
import { useCollectionStore } from '../store/useCollectionStore';
import { RankProgress } from '../components/collection/RankProgress';
import { BadgeItem } from '../components/collection/BadgeItem';
import { EmptyState, LoadingState, PageHeader } from '../components/ui/JournalPrimitives';
import { BotanicalRule } from '../components/ui/JournalOrnament';

interface Props {
  setActivePage: (page: ActivePage) => void;
  onSelectSpecies: (slug: string) => void;
}

export const CollectionPage: React.FC<Props> = ({ setActivePage, onSelectSpecies }) => {
  const [meta, setMeta] = useState<CollectionMetaResponse | null>(null);
  const [catalogMeta, setCatalogMeta] = useState<CatalogMeta | null>(null);
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
        const [data, counts] = await Promise.all([
          api.getCollectionMeta(),
          api.getCatalogMeta().catch(() => null),
        ]);
        setMeta(data);
        setCatalogMeta(counts);
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
    <div className="py-2 space-y-8">
      <PageHeader
        kicker="Private Local Log · Browser Storage"
        kickerIcon={<PawPrint className="w-3.5 h-3.5" />}
        title={
          <>
            Field <span className="italic text-felid-pomegranate-ink">Journal</span>
          </>
        }
        subtitle="Track logged feline discoveries, naturalist rank progression, and milestone seals. Verified sightings are cataloged persistently in your private local journal."
        aside={
          discoveryCount > 0 ? (
            !showResetConfirm ? (
              <button
                type="button"
                onClick={() => setShowResetConfirm(true)}
                className="px-3.5 py-2 text-xs font-mono font-medium text-felid-pomegranate-ink bg-felid-surface hover:bg-felid-pomegranate/10 border border-felid-pomegranate/45 rounded-sm transition-colors uppercase"
              >
                Reset Progress
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-felid-surface p-2 border border-felid-pomegranate/60 rounded-sm text-xs font-mono">
                <span className="text-felid-ink">Clear journal?</span>
                <button
                  type="button"
                  onClick={() => {
                    clearProgress();
                    setShowResetConfirm(false);
                  }}
                  className="px-2.5 py-1 bg-felid-pomegranate text-felid-on-pomegranate font-medium rounded-sm uppercase"
                >
                  Yes, reset
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 bg-felid-elevated hover:bg-felid-hover text-felid-ink border border-felid-border-strong rounded-sm uppercase transition-colors"
                >
                  Cancel
                </button>
              </div>
            )
          ) : undefined
        }
      />

      {/* Rank Progress */}
      <RankProgress
        currentRank={currentRank}
        nextRank={nextRank}
        totalXp={totalXp}
        discoveryCount={discoveryCount}
        totalSpeciesCount={meta?.species.length ?? 0}
      />

      {meta && (
        <section className="grid grid-cols-1 sm:grid-cols-3 journal-plate divide-y sm:divide-y-0 sm:divide-x divide-felid-border">
          {(
            [
              {
                label: 'Wild Species Logged',
                value: meta.species.filter((s) => s.category === 'wild_species' && discoveries[s.id]).length,
                total: meta.species.filter((s) => s.category === 'wild_species').length,
                tone: 'text-felid-cobalt-ink',
              },
              {
                label: 'Domestic Cat Logged',
                value: meta.species.filter((s) => s.category === 'domestic_species' && discoveries[s.id]).length,
                total: meta.species.filter((s) => s.category === 'domestic_species').length,
                tone: 'text-felid-pomegranate-ink',
              },
              {
                label: 'CFA Breeds Catalogued',
                value: catalogMeta?.breed_count ?? 0,
                tone: 'text-felid-highlight-ink',
              },
            ] as { label: string; value: number; total?: number; tone: string }[]
          ).map((stat) => (
            <div key={stat.label} className="p-4 text-center">
              <span className={`block font-mono font-medium text-xl ${stat.tone}`}>
                {stat.value}
                {stat.total !== undefined && (
                  <span className="text-felid-muted-ink text-xs font-normal"> / {stat.total}</span>
                )}
              </span>
              <span className="text-[10px] uppercase tracking-wider text-felid-muted-ink font-mono">
                {stat.label}
              </span>
            </div>
          ))}
        </section>
      )}

      {loading && <LoadingState label="Loading expedition journal records..." className="py-12" />}

      {/* Expedition Milestones & Badges */}
      {meta && (
        <section className="space-y-4">
          <div className="flex items-center justify-between pb-2.5 border-b border-felid-border">
            <h2 className="font-display font-semibold text-xl text-felid-ink flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-felid-highlight-ink" />
              <span>Field Badges &amp; Milestones</span>
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

      <BotanicalRule />

      {/* Discoveries Grid: Logged vs Uncataloged Silhouettes */}
      {meta && (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-felid-border">
            <h2 className="font-display font-semibold text-xl text-felid-ink flex items-center gap-2">
              <Cat className="w-5 h-5 text-felid-cobalt-ink" />
              <span>Felidae Field Roster</span>
            </h2>
            <span className="text-xs font-mono text-felid-muted-ink">
              {discoveryCount} discovered · {Math.max(0, meta.species.length - discoveryCount)} undocumented
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
            {meta.species.map((sp) => {
              const isFound = Boolean(discoveries[sp.id]);

              return (
                <div
                  key={sp.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectSpecies(sp.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectSpecies(sp.id);
                    }
                  }}
                  className={`relative border rounded-sm p-2.5 flex flex-col items-center text-center cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt ${
                    isFound
                      ? 'bg-felid-surface border-felid-highlight/55 shadow-plate hover:border-felid-cobalt/65'
                      : 'bg-felid-elevated/40 border-felid-border opacity-60 hover:opacity-90'
                  }`}
                >
                  {/* Thumbnail / Silhouette */}
                  <div className="w-full aspect-square overflow-hidden bg-felid-elevated border border-felid-border rounded-sm relative mb-2">
                    <img
                      src={sp.thumbnail_url}
                      alt={sp.common_name}
                      className={`w-full h-full object-cover object-top transition-all ${
                        isFound ? 'filter-none' : 'grayscale contrast-125 opacity-55'
                      }`}
                      loading="lazy"
                    />

                    {isFound ? (
                      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-felid-cobalt text-felid-on-cobalt rounded-sm flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-felid-photo-scrim/35">
                        <Lock className="w-4 h-4 text-felid-photo-ink/90" />
                      </div>
                    )}
                  </div>

                  <span className="font-display font-semibold text-xs text-felid-ink truncate w-full">
                    {sp.common_name}
                  </span>
                  <span className="text-[11px] text-felid-muted-ink truncate w-full font-serif italic">
                    {sp.scientific_name}
                  </span>
                  <span
                    className={`text-[9px] font-mono uppercase tracking-wider mt-0.5 ${
                      sp.category === 'domestic_species'
                        ? 'text-felid-pomegranate-ink'
                        : 'text-felid-cobalt-ink'
                    }`}
                  >
                    {sp.category === 'domestic_species' ? 'Domestic' : 'Wild'}
                  </span>

                  <div className="mt-1.5 pt-1.5 border-t border-felid-border w-full flex items-center justify-between text-[10px] text-felid-muted-ink font-mono">
                    <span>{sp.rarity}</span>
                    <span className="text-felid-highlight-ink font-medium">+{sp.xp_reward}XP</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Call to action if no discoveries */}
      {discoveryCount === 0 && (
        <EmptyState
          title="Your Field Journal is currently blank."
          description="Take or upload a photograph of your cat, kitten, or any wild felid in the Paw Scanner to record your first species and earn discovery XP."
          action={
            <button
              type="button"
              onClick={() => setActivePage('identify')}
              className="btn-primary text-xs"
            >
              <PawPrint className="w-4 h-4" />
              <span>Go to Paw Scanner</span>
            </button>
          }
        />
      )}
    </div>
  );
};
