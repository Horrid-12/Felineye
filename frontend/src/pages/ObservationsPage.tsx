import React, { useEffect, useState } from 'react';
import { MapPin, ShieldAlert, AlertTriangle, RefreshCw } from 'lucide-react';
import { ObservationItem } from '../types';
import { api } from '../services/api';
import { ObservationCard } from '../components/observations/ObservationCard';

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
      setErrorMsg(err.message || 'Failed to load wildlife observations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObservations();
  }, [limit]);

  return (
    <div className="py-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-felid-accent uppercase tracking-wider mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Field Occurrence Records</span>
          </div>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-felid-ivory tracking-tight">
            Observation <span className="text-felid-accent">Explorer</span>
          </h1>
          <p className="text-xs sm:text-sm text-felid-muted mt-1 max-w-xl">
            Verified wild felid sightings sourced from the global iNaturalist citizen science network. All coordinates are generalized to safeguard natural populations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadObservations}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-felid-surface hover:bg-felid-surface-hover text-felid-ivory text-xs font-medium border border-felid-border inline-flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-felid-accent ${loading ? 'animate-spin' : ''}`} />
            Refresh Records
          </button>
        </div>
      </div>

      {/* Prominent Ethical Protection Warning Banner */}
      <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 shrink-0">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-xs text-amber-200/90 leading-relaxed">
          <strong className="text-amber-300 font-semibold block mb-0.5">
            Wildlife Protection Protocol Active
          </strong>
          To prevent poaching and unauthorized disturbances of endangered felid breeding grounds, all exact coordinates are obscured. A historic research-grade observation does <em>not</em> imply that an animal is currently present in that area. Never track or bait wild animals.
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-sm flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Observations Grid */}
      {loading ? (
        <div className="py-24 text-center text-felid-muted space-y-3">
          <div className="w-8 h-8 rounded-full border-2 border-felid-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs font-mono">Fetching research-grade feline observations...</p>
        </div>
      ) : observations.length === 0 ? (
        <div className="py-20 text-center rounded-2xl border border-dashed border-felid-border bg-felid-surface/30 p-8 space-y-3">
          <p className="text-sm text-felid-ivory font-medium">No verified feline observations returned.</p>
          <p className="text-xs text-felid-muted">
            The external observation service may be undergoing scheduled maintenance. Please try again shortly.
          </p>
          <button
            onClick={loadObservations}
            className="px-4 py-2 rounded-lg bg-felid-pine hover:bg-felid-border text-felid-accent text-xs font-medium border border-felid-border inline-flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
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
