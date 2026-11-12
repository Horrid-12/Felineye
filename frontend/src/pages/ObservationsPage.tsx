import React, { useEffect, useState } from 'react';
import { ShieldAlert, RefreshCw, PawPrint } from 'lucide-react';
import { ObservationItem } from '../types';
import { api } from '../services/api';
import { ObservationCard } from '../components/observations/ObservationCard';
import {
  AlertBanner,
  EmptyState,
  LoadingState,
  PageHeader,
} from '../components/ui/JournalPrimitives';

export const ObservationsPage: React.FC = () => {
  const [observations, setObservations] = useState<ObservationItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const limit = 24;

  const loadObservations = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await api.getObservations({ limit });
      setObservations(data.observations);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load feline observations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObservations();
  }, [limit]);

  return (
    <div className="py-2 space-y-6">
      <PageHeader
        kicker="Community Sightings · iNaturalist API"
        kickerIcon={<PawPrint className="w-3.5 h-3.5" />}
        title={
          <>
            Observation <span className="italic text-felid-cobalt-ink">Field Notes</span>
          </>
        }
        subtitle="Verified wild and domestic feline occurrences from citizen naturalists worldwide. All geographic coordinates are generalized to prevent illegal targeting."
        meta={
          !loading && observations.length > 0
            ? `${observations.length} obscured field records · Coordinates generalized`
            : undefined
        }
        aside={
          <button
            type="button"
            onClick={loadObservations}
            disabled={loading}
            className="btn-secondary text-xs"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-felid-cobalt-ink ${loading ? 'animate-spin' : ''}`}
            />
            <span>Refresh Records</span>
          </button>
        }
      />

      {/* Conservation Protection Protocol Banner */}
      <div className="journal-plate border-l-4 border-l-felid-pomegranate p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 bg-felid-pomegranate/15 border border-felid-pomegranate/40 rounded-sm flex items-center justify-center text-felid-pomegranate-ink shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-xs sm:text-sm text-felid-muted-ink leading-relaxed font-sans">
          <strong className="text-felid-ink font-mono font-medium block uppercase text-xs tracking-wider mb-0.5">
            Feline Protection Protocol Active
          </strong>
          To prevent poaching and unauthorized disturbances of endangered cat breeding grounds, all exact coordinates are obscured. A historic research-grade observation does <em>not</em> imply that an animal is currently present in that area. Never track or bait wild animals.
        </div>
      </div>

      {/* Error State */}
      {errorMsg && <AlertBanner tone="error">{errorMsg}</AlertBanner>}

      {/* Observations Grid */}
      {loading ? (
        <LoadingState label="Loading verified iNaturalist sightings..." className="py-20" />
      ) : observations.length === 0 ? (
        <EmptyState
          title="No feline sightings retrieved."
          description="Verify your network connection to the iNaturalist gateway or refresh to retry."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {observations.map((obs) => (
            <ObservationCard key={obs.id} observation={obs} />
          ))}
        </div>
      )}
    </div>
  );
};
