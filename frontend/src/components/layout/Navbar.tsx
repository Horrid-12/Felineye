import React, { useState } from 'react';
import { Cat, PawPrint, BookOpen, Award, MapPin, Info, Menu, X, Sparkles } from 'lucide-react';
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
    { id: 'home', label: 'Cat Haven', icon: <Cat className="w-3.5 h-3.5" /> },
    { id: 'identify', label: 'Paw Scanner', icon: <PawPrint className="w-3.5 h-3.5" /> },
    { id: 'species', label: 'Species Atlas', icon: <BookOpen className="w-3.5 h-3.5" /> },
    { id: 'collection', label: 'Expedition Log', icon: <Award className="w-3.5 h-3.5" /> },
    { id: 'observations', label: 'Observations', icon: <MapPin className="w-3.5 h-3.5" /> },
    { id: 'methodology', label: 'Methodology', icon: <Info className="w-3.5 h-3.5" /> },
  ];

  const handleNavClick = (page: ActivePage) => {
    setActivePage(page);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="sticky top-0 z-40 bg-[#141218] border-b-2 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo with Chunky Brutalist Badge */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-3 text-left focus:outline-none group brutal-press"
          >
            <div className="w-9 h-9 bg-felid-accent border-2 border-black shadow-brutal-sm flex items-center justify-center text-black font-black text-lg transition-transform group-hover:scale-105">
              🐾
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-black text-lg text-felid-ivory tracking-tight">
                  FELID<span className="text-felid-accent">LENS</span>
                </span>
                <span className="bg-black text-felid-accent text-[9px] font-mono font-black px-1.5 py-0.2 border border-felid-border">
                  NEO
                </span>
              </div>
              <span className="block text-[9px] uppercase tracking-widest text-felid-muted font-mono -mt-0.5">
                Felidae Field Guide // BirdLens
              </span>
            </div>
          </button>

          {/* Desktop Navigation (Tactile Neo-Brutalist Badges) */}
          <nav className="hidden md:flex items-center gap-1.5">
            {navItems.map((item) => {
              const isActive = activePage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold tracking-wide border-2 border-black brutal-press transition-all ${
                    isActive
                      ? 'bg-felid-accent text-black shadow-brutal-sm'
                      : 'bg-[#1d1922] text-felid-ivory hover:bg-[#26222d] shadow-brutal-sm'
                  }`}
                >
                  <span className={isActive ? 'text-black' : 'text-felid-accent'}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Promptify-Style Discovery Rank Capsule & Quick Action */}
          <div className="hidden lg:flex items-center gap-3">
            <button
              onClick={() => handleNavClick('collection')}
              className="flex items-center bg-[#0c0a0e] border-2 border-black p-1 px-3 shadow-brutal-sm text-xs font-mono brutal-press"
              title={`${discoveryCount} species discovered. ${totalXp} XP accumulated.`}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 mr-2.5 animate-pulse" />
              <div className="text-left">
                <span className="text-[9px] text-felid-muted block leading-none uppercase">
                  RANK // {currentRank.title}
                </span>
                <span className="text-felid-ivory font-bold text-xs">
                  {totalXp} XP <span className="text-felid-accent">· {discoveryCount} Discovered</span>
                </span>
              </div>
            </button>

            <button
              onClick={() => handleNavClick('identify')}
              className="bg-felid-accent hover:bg-felid-accent-hover text-black font-mono font-black text-xs px-3.5 py-2 border-2 border-black shadow-brutal-sm brutal-press flex items-center gap-1.5"
            >
              <PawPrint className="w-3.5 h-3.5" />
              <span>SCAN</span>
            </button>
          </div>

          {/* Mobile menu trigger */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 border-2 border-black bg-[#1d1922] text-felid-ivory shadow-brutal-sm focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#141218] border-b-2 border-black px-4 pt-3 pb-5 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm font-mono font-bold border-2 border-black shadow-brutal-sm ${
                activePage === item.id
                  ? 'bg-felid-accent text-black'
                  : 'bg-[#1d1922] text-felid-ivory hover:bg-[#26222d]'
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
          <div className="pt-2 border-t-2 border-black flex items-center justify-between text-xs font-mono">
            <span className="text-felid-muted">Status: <strong className="text-felid-accent">{currentRank.title}</strong></span>
            <span className="text-felid-accent font-bold">{totalXp} XP</span>
          </div>
        </div>
      )}
    </header>
  );
};
