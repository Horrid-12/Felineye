import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface FilterState {
  search: string;
  subfamily: string;
  is_wild: string; // 'all' | 'wild' | 'domestic'
  conservation_status: string;
}

interface Props {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
}

export const SpeciesFilters: React.FC<Props> = ({ filters, onChange, onReset }) => {
  return (
    <div className="bg-felid-surface/60 border border-felid-border rounded-2xl p-4 sm:p-5 space-y-4 mb-8">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-felid-muted" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search by common name, scientific name (e.g., Panthera, Cougar, Sand Cat)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-felid-pine border border-felid-border focus:border-felid-accent focus:ring-1 focus:ring-felid-accent text-sm text-felid-ivory placeholder-felid-muted/70 transition-all outline-none"
        />
      </div>

      {/* Filter Options Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Subfamily Select */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-felid-muted font-mono mb-1.5">
            Subfamily
          </label>
          <select
            value={filters.subfamily}
            onChange={(e) => onChange({ subfamily: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-felid-pine border border-felid-border text-xs text-felid-ivory focus:border-felid-accent outline-none"
          >
            <option value="">All Subfamilies (Pantherinae & Felinae)</option>
            <option value="Pantherinae">Pantherinae (Big Roaring Cats)</option>
            <option value="Felinae">Felinae (Small & Medium Cats)</option>
          </select>
        </div>

        {/* Wild vs Domestic */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-felid-muted font-mono mb-1.5">
            Ecology
          </label>
          <select
            value={filters.is_wild}
            onChange={(e) => onChange({ is_wild: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-felid-pine border border-felid-border text-xs text-felid-ivory focus:border-felid-accent outline-none"
          >
            <option value="all">All Felids</option>
            <option value="wild">Wild Felids Only</option>
            <option value="domestic">Domestic Species Only</option>
          </select>
        </div>

        {/* IUCN Conservation Status */}
        <div>
          <label className="block text-[11px] uppercase tracking-wider text-felid-muted font-mono mb-1.5">
            IUCN Red List Status
          </label>
          <select
            value={filters.conservation_status}
            onChange={(e) => onChange({ conservation_status: e.target.value })}
            className="w-full px-3 py-2 rounded-lg bg-felid-pine border border-felid-border text-xs text-felid-ivory focus:border-felid-accent outline-none"
          >
            <option value="">All Conservation Tiers</option>
            <option value="CR">Critically Endangered (CR)</option>
            <option value="EN">Endangered (EN)</option>
            <option value="VU">Vulnerable (VU)</option>
            <option value="NT">Near Threatened (NT)</option>
            <option value="LC">Least Concern (LC)</option>
            <option value="DOMESTIC">Domesticated (DOMESTIC)</option>
          </select>
        </div>
      </div>

      {/* Reset action button */}
      {(filters.search || filters.subfamily || filters.is_wild !== 'all' || filters.conservation_status) && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs text-felid-muted hover:text-felid-accent transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};
