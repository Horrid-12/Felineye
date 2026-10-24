import React, { useEffect, useState } from 'react';
import { ShieldAlert, AlertTriangle, RefreshCw, PawPrint } from 'lucide-react';
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
      setErrorMsg(err.message || 'Failed to load feline observations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadObservations();
  }, [limit]);

  return (
    <div className="py-4 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b-2 border-black">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono font-black text-felid-accent uppercase tracking-wider mb-2">
            <PawPrint className="w-3.5 h-3.5" />
            <span>COMMUNITY SIGHTINGS // INATURALIST API</span>
          </div>
          <h1 className="font-display font-black text-3xl sm:text-5xl text-felid-ivory uppercase tracking-tight">
            OBSERVATION <span className="text-felid-accent underline decoration-4 underline-offset-4">EXPLORER</span>
          </h1>
          <p className="text-xs sm:text-sm text-felid-muted mt-1 max-w-xl font-mono leading-relaxed">
            Verified wild and domestic feline occurrences from citizen naturalists worldwide. All geographic coordinates are generalized to prevent illegal targeting.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadObservations}
            disabled={loading}
            className="px-5 py-2.5 bg-[#1d1922] hover:bg-[#26222d] text-felid-ivory text-xs font-mono font-bold uppercase border-2 border-black shadow-brutal-sm brutal-press inline-flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-felid-accent ${loading ? 'animate-spin' : ''}`} />
            Refresh Records
          </button>
        </div>
      </div>

      {/* Prominent Ethical Protection Warning Banner */}
      <div className="p-5 bg-[#0c0a0e] border-2 border-black shadow-brutal flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="w-10 h-10 bg-felid-accent border-2 border-black flex items-center justify-center text-black font-black shrink-0 shadow-brutal-sm">
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="text-xs text-felid-ivory-dim leading-relaxed font-mono">
          <strong className="text-felid-accent font-black block uppercase text-sm mb-0.5">
            FELINE PROTECTION PROTOCOL ACTIVE
          </strong>
          To prevent poaching and unauthorized disturbances of endangered cat breeding grounds, all exact coordinates are obscured. A historic research-grade observation does <em>not</em> imply that an animal is currently present in that area. Never track or bait wild animals.
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="p-4 bg-red-950/70 border-2 border-black shadow-brutal text-pink-200 text-xs font-mono flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-felid-accent shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Observations Grid */}
      {loading ? (
        <div className="py-20 text-center text-felid-muted space-y-3 font-mono">
          <div className="w-8 h-8 border-2 border-felid-accent border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase">LOADING VERIFIED INATURALIST SIGHTINGS...</p>
        </div>
      ) : observations.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-[#332c3a] bg-[#0c0a0e] p-8 space-y-2 shadow-brutal-sm font-mono">
          <p className="text-sm text-felid-ivory font-bold uppercase">NO FELINE SIGHTINGS RETRIEVED.</p>
          <p className="text-xs text-felid-muted">Verify your network connection to the iNaturalist gateway.</p>
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
