import React, { useState } from 'react';
import { BookOpen, MapPin, Menu, X, ClipboardCheck } from 'lucide-react';
import { ActivePage } from '../../types';
import { useCollectionStore } from '../../store/useCollectionStore';
import { FelineyeEmblem } from '../ui/JournalOrnament';
import { ThemeToggle } from '../ui/ThemeToggle';

interface Props {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export const Navbar: React.FC<Props> = ({ activePage, setActivePage }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalXp, currentRank, discoveryCount } = useCollectionStore();

  const navItems: { id: ActivePage; label: string; icon: React.ReactNode }[] = [
    { id: 'species', label: 'Species Atlas', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'dataset-review', label: 'Dataset Review', icon: <ClipboardCheck className="w-3.5 h-3.5" /> },
    { id: 'observations', label: 'Observations', icon: <MapPin className="w-3.5 h-3.5" /> },
  ];

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo?.({ top: 0, behavior: 'auto' });
  };

  return (
    <header className="sticky top-0 z-40 bg-felid-surface/95 backdrop-blur-sm border-b border-felid-border">
      {/* Subtle 2px Cobalt, Burnished Gold & Pomegranate folio binding rule */}
      <div className="h-[2px] w-full bg-gradient-to-r from-felid-cobalt via-felid-highlight/80 to-felid-pomegranate" />

      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-14">
          {/* Editorial Brand Wordmark */}
          <button
            type="button"
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt rounded-sm px-1 -ml-1 py-1"
          >
            <FelineyeEmblem className="w-9 h-9 shrink-0 transition-transform duration-200 group-hover:scale-[1.03]" />
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-display font-semibold text-lg sm:text-xl text-felid-ink tracking-tight leading-none">
                  Felin<span className="italic text-felid-pomegranate-ink">eye</span>
                </span>
                <span
                  aria-hidden="true"
                  className="hidden sm:inline-block w-1 h-1 rounded-full bg-felid-highlight self-center"
                />
              </div>
              <span className="block whitespace-nowrap text-[9px] sm:text-[10px] uppercase tracking-[0.08em] sm:tracking-[0.14em] text-felid-muted-ink font-mono mt-0.5">
                Felidae Field Journal
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive =
                activePage === item.id ||
                (item.id === 'species' && activePage === 'species-detail');
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-sans font-medium rounded-sm border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt ${
                    isActive
                      ? 'bg-felid-cobalt/15 text-felid-cobalt-ink border-felid-cobalt/45'
                      : 'bg-transparent text-felid-muted-ink hover:text-felid-ink hover:bg-felid-elevated/65 border-transparent'
                  }`}
                >
                  <span className={isActive ? 'text-felid-cobalt-ink' : 'text-felid-muted-ink'}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute inset-x-2 -bottom-px h-[2px] bg-felid-pomegranate rounded-full"
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Controls: Theme Toggle + Understated Naturalist Rank Capsule */}
          <div className="hidden md:flex items-center gap-2.5">
            <ThemeToggle compact />

            <button
              type="button"
              onClick={() => handleNavClick('collection')}
              className={`hidden lg:flex items-center gap-2.5 px-3 py-1.5 rounded-sm border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt ${
                activePage === 'collection'
                  ? 'bg-felid-highlight/15 border-felid-highlight/60'
                  : 'bg-felid-elevated/65 border-felid-border hover:border-felid-highlight/50 hover:bg-felid-elevated'
              }`}
              title={`${discoveryCount} species discovered. ${totalXp} XP accumulated.`}
            >
              <span
                className="w-2 h-2 rounded-full bg-felid-highlight shrink-0"
                aria-hidden="true"
              />
              <div className="leading-tight">
                <span className="text-[9px] text-felid-muted-ink block uppercase tracking-wider font-mono">
                  {currentRank.title}
                </span>
                <span className="text-felid-ink font-mono font-medium text-xs">
                  <span className="text-felid-highlight-ink">{totalXp} XP</span>
                  <span className="text-felid-muted-ink"> · </span>
                  <span className="text-felid-cobalt-ink">{discoveryCount} logged</span>
                </span>
              </div>
            </button>
          </div>

          {/* Mobile Controls */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle compact />
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border border-felid-border bg-felid-surface hover:bg-felid-elevated text-felid-ink rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-felid-cobalt"
              aria-label="Toggle Navigation"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-felid-surface border-t border-felid-border px-4 pt-3 pb-5 space-y-2 shadow-plate">
          {navItems.map((item) => {
            const isActive =
              activePage === item.id ||
              (item.id === 'species' && activePage === 'species-detail');
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavClick(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-sans font-medium rounded-sm border transition-colors ${
                  isActive
                    ? 'bg-felid-cobalt/15 text-felid-cobalt-ink border-felid-cobalt/45'
                    : 'bg-felid-elevated/40 text-felid-ink border-felid-border hover:bg-felid-elevated'
                }`}
              >
                <span className={isActive ? 'text-felid-cobalt-ink' : 'text-felid-muted-ink'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          <div className="pt-2 mt-2 border-t border-felid-border flex flex-col gap-3">
            <button
              type="button"
              onClick={() => handleNavClick('collection')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-sm border text-xs font-mono ${
                activePage === 'collection'
                  ? 'bg-felid-highlight/15 border-felid-highlight/60 text-felid-ink'
                  : 'bg-felid-elevated/50 border-felid-border text-felid-muted-ink'
              }`}
              title={`${discoveryCount} species discovered. ${totalXp} XP accumulated.`}
            >
              <span>
                Journal · <strong className="text-felid-ink">{currentRank.title}</strong>
              </span>
              <span className="text-felid-highlight-ink font-medium">{totalXp} XP</span>
            </button>

            <div className="flex items-center justify-between gap-3 px-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-felid-muted-ink">
                Appearance
              </span>
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
