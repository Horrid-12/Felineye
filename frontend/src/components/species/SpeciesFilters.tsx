import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

interface FilterState {
  search: string;
  subfamily: string;
  category: string; // '' | 'wild_species' | 'domestic_species'
  conservation_status: string;
}

interface Props {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
}

export const SpeciesFilters: React.FC<Props> = ({ filters, onChange, onReset }) => {
  const allActive = !filters.subfamily && !filters.category && !filters.conservation_status;

  const chipClass = (active: boolean, tone: 'cobalt' | 'pomegranate' = 'cobalt') => {
    if (!active) {
      return 'px-3 py-1.5 text-xs font-sans font-medium rounded-sm border border-felid-border bg-felid-elevated/60 text-felid-ink hover:bg-felid-hover hover:border-felid-border-strong transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt';
    }
    if (tone === 'pomegranate') {
      return 'px-3 py-1.5 text-xs font-sans font-semibold rounded-sm border border-felid-pomegranate bg-felid-pomegranate text-felid-on-pomegranate transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-pomegranate';
    }
    return 'px-3 py-1.5 text-xs font-sans font-semibold rounded-sm border border-felid-cobalt bg-felid-cobalt text-felid-on-cobalt transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt';
  };

  return (
    <div className="journal-plate p-4 space-y-3.5 mb-5">
      {/* Quick category and lineage pills */}
      <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-felid-border">
        <span className="text-[11px] font-mono font-medium text-felid-muted-ink uppercase tracking-wider mr-1">
          Index Filters:
        </span>

        <button
          type="button"
          onClick={() => onChange({ subfamily: '', category: '', conservation_status: '' })}
          className={chipClass(allActive)}
        >
          All Species
        </button>

        <button
          type="button"
          onClick={() => onChange({ category: 'wild_species', subfamily: '', conservation_status: '' })}
          className={chipClass(filters.category === 'wild_species')}
        >
          Wild Species
        </button>

        <button
          type="button"
          onClick={() => onChange({ category: 'domestic_species', subfamily: '', conservation_status: '' })}
          className={chipClass(filters.category === 'domestic_species')}
        >
          Domestic Cats
        </button>

        <button
          type="button"
          onClick={() => onChange({ subfamily: 'Pantherinae', category: '', conservation_status: '' })}
          className={chipClass(filters.subfamily === 'Pantherinae')}
        >
          Pantherinae
        </button>

        <button
          type="button"
          onClick={() => onChange({ subfamily: 'Felinae', category: '', conservation_status: '' })}
          className={chipClass(filters.subfamily === 'Felinae')}
        >
          Felinae
        </button>

        <button
          type="button"
          onClick={() => onChange({ conservation_status: 'EN', subfamily: '', category: '' })}
          className={chipClass(filters.conservation_status === 'EN', 'pomegranate')}
        >
          Endangered
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-felid-cobalt-ink pointer-events-none" />
        <input
          type="text"
          value={filters.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Search species by common name, binomial, genus, or lineage (e.g. Cougar, Lynx, Panthera)..."
          aria-label="Search feline species"
          className="journal-input pl-10 pr-4 py-2.5"
        />
      </div>

      {/* Detailed Select Filter Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-0.5">
        <div>
          <label
            htmlFor="atlas-filter-subfamily"
            className="block text-[10px] uppercase tracking-wider text-felid-muted-ink font-mono mb-1.5 font-medium"
          >
            Taxonomic Subfamily
          </label>
          <select
            id="atlas-filter-subfamily"
            value={filters.subfamily}
            onChange={(e) => onChange({ subfamily: e.target.value })}
            className="journal-select w-full"
          >
            <option value="">All Felid Subfamilies</option>
            <option value="Pantherinae">Pantherinae (Big Roaring Cats)</option>
            <option value="Felinae">Felinae (Purring &amp; Small-Medium Cats)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="atlas-filter-category"
            className="block text-[10px] uppercase tracking-wider text-felid-muted-ink font-mono mb-1.5 font-medium"
          >
            Catalogue Category
          </label>
          <select
            id="atlas-filter-category"
            value={filters.category}
            onChange={(e) => onChange({ category: e.target.value })}
            className="journal-select w-full"
          >
            <option value="">All Species</option>
            <option value="wild_species">Wild Species Only</option>
            <option value="domestic_species">Domestic Cats (species &amp; breeds)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="atlas-filter-conservation"
            className="block text-[10px] uppercase tracking-wider text-felid-muted-ink font-mono mb-1.5 font-medium"
          >
            IUCN Red List Status
          </label>
          <select
            id="atlas-filter-conservation"
            value={filters.conservation_status}
            onChange={(e) => onChange({ conservation_status: e.target.value })}
            className="journal-select w-full"
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
      {(filters.search || filters.subfamily || filters.category || filters.conservation_status) && (
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 text-xs font-sans font-semibold text-felid-cobalt-ink hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset all filters</span>
          </button>
        </div>
      )}
    </div>
  );
};
