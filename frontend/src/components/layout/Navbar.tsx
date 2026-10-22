import React, { useState } from 'react';
import { Cat, PawPrint, Eye, BookOpen, Award, MapPin, Info, Menu, X, Sparkles } from 'lucide-react';
import { ActivePage } from '../../types';
import { useCollectionStore } from '../../store/useCollectionStore';

interface Props {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
}

export const Navbar: React.FC<Props> = ({ activePage, setActivePage }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalXp, currentRank, discoveryCount } = useCollectionStore();

  const navItems: { id: ActivePage; label: string; icon: React.ReactNode }[] = [
    { id: 'home', label: 'Cat Haven', icon: <Cat className="w-4 h-4" /> },
    { id: 'identify', label: 'Paw Scanner', icon: <PawPrint className="w-4 h-4" /> },
    { id: 'species', label: 'Species Atlas', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'collection', label: 'Expedition Log', icon: <Award className="w-4 h-4" /> },
    { id: 'observations', label: 'Observations', icon: <MapPin className="w-4 h-4" /> },
    { id: 'methodology', label: 'Methodology', icon: <Info className="w-4 h-4" /> },
  ];

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-50 bg-felid-dark/90 backdrop-blur-md border-b border-felid-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with Feline Ears / Cat Icon */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-felid-surface to-felid-pine border border-felid-border-light flex items-center justify-center text-felid-accent group-hover:border-felid-accent group-hover:shadow-pink-glow transition-all">
              <Cat className="w-5 h-5 transition-transform group-hover:scale-110" />
            </div>
            <div>
              <span className="font-display font-bold text-lg text-felid-ivory tracking-wide flex items-center gap-1.5">
                FELID<span className="text-felid-accent">LENS</span>
                <span className="text-xs opacity-75">🐾</span>
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-felid-muted font-mono">
                Feline Discovery & Field Guide
              </span>
            </div>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-felid-surface text-felid-accent border border-felid-border shadow-sm shadow-felid-accent/10 font-semibold'
                      : 'text-felid-muted hover:text-felid-ivory hover:bg-felid-surface/50'
                  }`}
                >
                  <span className={isActive ? 'text-felid-accent' : 'opacity-70'}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Discovery Rank Badge & XP Widget */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => handleNavClick('collection')}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-felid-surface/90 border border-felid-border hover:border-felid-accent/60 transition-all text-xs hover:shadow-pink-glow"
              title={`${discoveryCount} species discovered. ${totalXp} XP accumulated.`}
            >
              <div className="w-5 h-5 rounded-full bg-felid-accent/20 flex items-center justify-center text-felid-accent">
                <PawPrint className="w-3 h-3" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-felid-ivory block leading-tight">
                  {currentRank.title}
                </span>
                <span className="text-[10px] text-felid-accent block leading-tight font-mono">
                  {totalXp} XP · {discoveryCount} Discovered
                </span>
              </div>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-felid-muted hover:text-felid-ivory hover:bg-felid-surface focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-felid-pine border-b border-felid-border px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                activePage === item.id
                  ? 'bg-felid-surface text-felid-accent border border-felid-border'
                  : 'text-felid-muted hover:text-felid-ivory hover:bg-felid-surface/50'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t border-felid-border/50">
            <div className="px-3 py-2 flex items-center justify-between text-xs text-felid-muted">
              <span>Status: <strong className="text-felid-accent">{currentRank.title}</strong></span>
              <span className="font-mono text-felid-accent">{totalXp} XP</span>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
