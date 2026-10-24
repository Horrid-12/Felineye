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
    <div className="bg-[#141218] border-2 border-black p-5 space-y-4 mb-8 shadow-brutal">
      
      {/* Quick Lineage Pills (Komi Store Platform Pills Influence) */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-[#332c3a]">
        <span className="text-[10px] font-mono font-black text-felid-accent uppercase tracking-wider mr-1">
          FILTER CHIPS:
        </span>
        <button
          type="button"
          onClick={() => onChange({ subfamily: '', is_wild: 'all', conservation_status: '' })}
          className={`px-3 py-1 text-xs font-mono font-bold border-2 border-black brutal-press ${
            !filters.subfamily && filters.is_wild === 'all' && !filters.conservation_status
              ? 'bg-felid-accent text-black shadow-brutal-sm'
              : 'bg-[#1d1922] text-felid-ivory hover:bg-[#26222d] shadow-brutal-sm'
          }`}
        >
          ALL TAXA
        </button>

        <button
          type="button"
          onClick={() => onChange({ subfamily: 'Pantherinae' })}
          className={`px-3 py-1 text-xs font-mono font-bold border-2 border-black brutal-press ${
            filters.subfamily === 'Pantherinae'
              ? 'bg-felid-accent text-black shadow-brutal-sm'
              : 'bg-[#1d1922] text-felid-ivory hover:bg-[#26222d] shadow-brutal-sm'
          }`}
        >
          PANTHERINAE
        </button>

        <button
          type="button"
          onClick={() => onChange({ subfamily: 'Felinae' })}
          className={`px-3 py-1 text-xs font-mono font-bold border-2 border-black brutal-press ${
            filters.subfamily === 'Felinae'
              ? 'bg-felid-accent text-black shadow-brutal-sm'
              : 'bg-[#1d1922] text-felid-ivory hover:bg-[#26222d] shadow-brutal-sm'
          }`}
        >
          FELINAE
        </button>

        <button
          type="button"
          onClick={() => onChange({ is_wild: 'domestic' })}
          className={`px-3 py-1 text-xs font-mono font-bold border-2 border-black brutal-press ${
            filters.is_wild === 'domestic'
              ? 'bg-felid-accent text-black shadow-brutal-sm'
              : 'bg-[#1d1922] text-felid-ivory hover:bg-[#26222d] shadow-brutal-sm'
          }`}
        >
          DOMESTIC
        </button>

        <button
          type="button"
          onClick={() => onChange({ conservation_status: 'EN' })}
          className={`px-3 py-1 text-xs font-mono font-bold border-2 border-black brutal-press ${
            filters.conservation_status === 'EN'
              ? 'bg-[#fb7185] text-black shadow-brutal-sm'
              : 'bg-[#1d1922] text-felid-ivory hover:bg-[#26222d] shadow-brutal-sm'
          }`}
        >
          ENDANGERED
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-felid-accent" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="SEARCH FELINE TAXONOMY (e.g. Cougar, Lynx, Bengal, Leopard)..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm focus:border-felid-accent text-xs font-mono font-bold text-felid-ivory placeholder-felid-muted/70 transition-all outline-none"
        />
      </div>

      {/* Detailed Select Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
        {/* Subfamily Select */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-felid-muted font-mono mb-1 font-bold">
            Taxonomic Subfamily
          </label>
          <select
            value={filters.subfamily}
            onChange={(e) => onChange({ subfamily: e.target.value })}
            className="w-full px-3 py-2 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono text-felid-ivory focus:border-felid-accent outline-none"
          >
            <option value="">All Felid Subfamilies</option>
            <option value="Pantherinae">Pantherinae (Big Roaring Cats)</option>
            <option value="Felinae">Felinae (Purring & Small-Medium Cats)</option>
          </select>
        </div>

        {/* Wild vs Domestic */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-felid-muted font-mono mb-1 font-bold">
            Ecology & Habitat
          </label>
          <select
            value={filters.is_wild}
            onChange={(e) => onChange({ is_wild: e.target.value })}
            className="w-full px-3 py-2 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono text-felid-ivory focus:border-felid-accent outline-none"
          >
            <option value="all">All Felids</option>
            <option value="wild">Wild Felids Only</option>
            <option value="domestic">Domestic Companions Only</option>
          </select>
        </div>

        {/* IUCN Conservation Status */}
        <div>
          <label className="block text-[10px] uppercase tracking-wider text-felid-muted font-mono mb-1 font-bold">
            IUCN Red List Status
          </label>
          <select
            value={filters.conservation_status}
            onChange={(e) => onChange({ conservation_status: e.target.value })}
            className="w-full px-3 py-2 bg-[#0c0a0e] border-2 border-black shadow-brutal-sm text-xs font-mono text-felid-ivory focus:border-felid-accent outline-none"
          >
            <option value="">All Conservation Statuses</option>
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
            className="inline-flex items-center gap-1.5 text-xs font-mono font-bold text-felid-accent hover:underline uppercase"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset all filters
          </button>
        </div>
      )}
    </div>
  );
};
