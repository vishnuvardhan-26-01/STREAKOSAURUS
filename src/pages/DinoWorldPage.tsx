// ============================================================
// Streakosaurus — Dino World (Achievement & Dinosaur Evolution)
// ============================================================

import React, { useEffect, useState, useMemo } from 'react';
import { Search, ChevronDown, Award, Sparkles } from 'lucide-react';
import { useStore } from '../store';
import type { DinoRarity } from '../types';
import type { AchievementWithProgress } from '../utils/achievements';
import {
  RARITY_STYLES,
  getEvolutionStageLabel,
} from '../utils/dinosaurRegistry';
import DinosaurAsset from '../components/DinosaurAsset';
import DinoDetailModal from '../components/DinoDetailModal';

type FilterTab = 'all' | 'unlocked' | 'locked';
type SortOption = 'default' | 'progress_desc' | 'progress_asc' | 'rarity' | 'name';

export default function DinoWorldPage() {
  const { achievements, loadAchievements } = useStore();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [selectedDino, setSelectedDino] = useState<AchievementWithProgress | null>(null);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const earnedCount = useMemo(
    () => achievements.filter((a) => a.earned).length,
    [achievements]
  );
  const lockedCount = achievements.length - earnedCount;

  // Filter and sort
  const filteredAchievements = useMemo(() => {
    return achievements
      .filter((a) => {
        // Tab filter
        if (activeTab === 'unlocked' && !a.earned) return false;
        if (activeTab === 'locked' && a.earned) return false;

        // Rarity filter
        if (selectedRarity !== 'all' && a.rarity !== selectedRarity) return false;

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = a.name.toLowerCase().includes(q);
          const matchDino = a.dinosaur.toLowerCase().includes(q);
          const matchReq = a.description.toLowerCase().includes(q);
          const matchOrder = a.orderNumber.includes(q);
          if (!matchName && !matchDino && !matchReq && !matchOrder) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'progress_desc':
            return b.progress_percentage - a.progress_percentage;
          case 'progress_asc':
            return a.progress_percentage - b.progress_percentage;
          case 'rarity': {
            const weights: Record<DinoRarity, number> = {
              LEGENDARY: 5,
              EPIC: 4,
              RARE: 3,
              UNCOMMON: 2,
              COMMON: 1,
            };
            return weights[b.rarity] - weights[a.rarity];
          }
          case 'name':
            return a.name.localeCompare(b.name);
          case 'default':
          default:
            return parseInt(a.orderNumber, 10) - parseInt(b.orderNumber, 10);
        }
      });
  }, [achievements, activeTab, selectedRarity, searchQuery, sortBy]);

  return (
    <div className="min-h-full px-6 py-7 lg:px-10 lg:py-8 max-w-[1600px] mx-auto animate-fade-in flex flex-col justify-between">
      <div>
        {/* ==================================================== */}
        {/* TOP MASTHEAD / HEADER                                */}
        {/* ==================================================== */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 mb-6 border-b border-brand-line">
          {/* Left Title & Subtitle */}
          <div className="flex items-center gap-4">
            {/* Geometric Mountain Glyph */}
            <div className="w-10 h-10 shrink-0 flex items-center justify-center rounded-lg bg-[#201C17] border border-[#312B22]">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-brand-mustard" fill="none" stroke="currentColor">
                <path
                  d="M3 20 L 9 9 L 14 17 L 17 12 L 21 20 Z"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div>
              <h1 className="font-display text-2xl lg:text-3xl font-medium tracking-tight text-[#FAF6ED]">
                DINO WORLD
              </h1>
              <p className="font-mono text-[10px] lg:text-[11px] text-brand-primary/45 tracking-[0.2em] uppercase mt-0.5">
                UNLOCK ACHIEVEMENTS. HATCH DINOSAURS. EVOLVE YOUR DISCIPLINE.
              </p>
            </div>
          </div>

          {/* Middle Editorial Quote */}
          <div className="hidden xl:flex items-center gap-3 px-4 py-2 rounded-lg bg-[#181512]/60 border border-[#28231C]">
            <span className="font-serif italic text-sm text-brand-primary/50">
              “Discipline breeds legends.”
            </span>
            {/* Mountain & Sun Mini Icon */}
            <div className="w-6 h-6 flex items-center justify-center opacity-70">
              <svg viewBox="0 0 20 20" className="w-5 h-5">
                <circle cx="14" cy="6" r="3.5" fill="#B8623A" />
                <path d="M2 17 L 8 8 L 14 17 Z" fill="#3D3428" />
                <path d="M10 17 L 14 11 L 18 17 Z" fill="#2E271E" />
              </svg>
            </div>
          </div>

          {/* Right Counter */}
          <div className="flex flex-col items-start md:items-end justify-center shrink-0">
            <span className="font-mono text-[10px] text-brand-primary/40 uppercase tracking-[0.2em]">
              25 ACHIEVEMENTS
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-display text-base lg:text-lg font-medium text-[#FAF6ED]">
                {earnedCount} / 25 UNLOCKED
              </span>
            </div>
            {/* Dynamic Progress Bar */}
            <div className="w-36 h-1 rounded-full bg-[#231E18] overflow-hidden mt-1.5 border border-[#2E2820]">
              <div
                className="h-full rounded-full bg-brand-mustard transition-all duration-500"
                style={{
                  width: `${achievements.length > 0 ? (earnedCount / achievements.length) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </header>

        {/* ==================================================== */}
        {/* CONTROLS & FILTER BAR                                */}
        {/* ==================================================== */}
        <div className="flex flex-wrap items-center justify-between gap-3.5 mb-6">
          {/* Segmented Filter Pills */}
          <div className="inline-flex items-center p-1 rounded-lg bg-[#181512] border border-[#2B251E]">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${activeTab === 'all'
                  ? 'bg-[#26211A] text-[#FAF6ED] shadow-sm border border-[#3A3328]'
                  : 'text-brand-primary/45 hover:text-brand-primary/80'
                }`}
            >
              ALL ({achievements.length})
            </button>
            <button
              onClick={() => setActiveTab('unlocked')}
              className={`px-3.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${activeTab === 'unlocked'
                  ? 'bg-[#26211A] text-[#FAF6ED] shadow-sm border border-[#3A3328]'
                  : 'text-brand-primary/45 hover:text-brand-primary/80'
                }`}
            >
              UNLOCKED ({earnedCount})
            </button>
            <button
              onClick={() => setActiveTab('locked')}
              className={`px-3.5 py-1 rounded-md text-xs font-mono font-medium transition-all ${activeTab === 'locked'
                  ? 'bg-[#26211A] text-[#FAF6ED] shadow-sm border border-[#3A3328]'
                  : 'text-brand-primary/45 hover:text-brand-primary/80'
                }`}
            >
              LOCKED ({lockedCount})
            </button>
          </div>

          {/* Search, Rarity & Sort */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search
                size={13}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-primary/40 pointer-events-none"
              />
              <input
                type="text"
                placeholder="Search dinosaurs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 w-44 md:w-56 bg-[#181512] border border-[#2B251E] rounded-lg text-xs text-brand-primary placeholder:text-brand-primary/30 focus:outline-none focus:border-brand-mustard/60 transition-colors"
              />
            </div>

            {/* Rarity Select */}
            <div className="relative">
              <select
                value={selectedRarity}
                onChange={(e) => setSelectedRarity(e.target.value)}
                className="appearance-none pl-3 pr-7 py-1.5 bg-[#181512] border border-[#2B251E] rounded-lg text-xs text-brand-primary/80 focus:outline-none focus:border-brand-mustard/60 cursor-pointer"
              >
                <option value="all">All Rarities</option>
                <option value="COMMON">Common</option>
                <option value="UNCOMMON">Uncommon</option>
                <option value="RARE">Rare</option>
                <option value="EPIC">Epic</option>
                <option value="LEGENDARY">Legendary</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-primary/40 pointer-events-none"
              />
            </div>

            {/* Sort Select */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className="appearance-none pl-3 pr-7 py-1.5 bg-[#181512] border border-[#2B251E] rounded-lg text-xs text-brand-primary/80 focus:outline-none focus:border-brand-mustard/60 cursor-pointer"
              >
                <option value="default">Sort: Default</option>
                <option value="progress_desc">Progress: High to Low</option>
                <option value="progress_asc">Progress: Low to High</option>
                <option value="rarity">Rarity</option>
                <option value="name">Name: A-Z</option>
              </select>
              <ChevronDown
                size={12}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-primary/40 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* 25-ACHIEVEMENT RESPONSIVE GRID                       */}
        {/* ==================================================== */}
        {filteredAchievements.length === 0 ? (
          <div className="py-20 text-center rounded-xl bg-[#181512]/50 border border-[#26211B]">
            <p className="font-serif italic text-brand-primary/40 text-sm">
              No dinosaurs match the current filters.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
            {filteredAchievements.map((item) => {
              const rarityStyle = RARITY_STYLES[item.rarity];
              const isUnlocked = item.earned;

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedDino(item)}
                  className={`group relative flex flex-col justify-between rounded-lg p-3 transition-all duration-200 cursor-pointer border ${isUnlocked
                      ? 'bg-[#1A1713] border-[#3E3529] hover:border-brand-mustard/50 shadow-sm'
                      : 'bg-[#181613] border-[#27231D] hover:border-[#3A3327] opacity-95 hover:opacity-100'
                    }`}
                  style={{
                    boxShadow: isUnlocked
                      ? '0 4px 14px rgba(0,0,0,0.4), 0 0 15px rgba(196,154,69,0.04)'
                      : '0 4px 12px rgba(0,0,0,0.3)',
                  }}
                >
                  {/* Card Header */}
                  <div>
                    <div className="flex items-start justify-between gap-1.5 mb-1">
                      <div className="flex items-baseline gap-1.5 min-w-0 pr-1">
                        <span className="font-mono text-xs font-semibold text-brand-primary/45 shrink-0">
                          {item.orderNumber}
                        </span>
                        <h3 className="font-display text-[13px] font-medium text-[#FAF6ED] truncate tracking-tight">
                          {item.name}
                        </h3>
                      </div>

                      {/* Rarity Badge */}
                      <span
                        className="shrink-0 text-[9px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded tracking-wider"
                        style={{
                          backgroundColor: rarityStyle.background,
                          color: rarityStyle.text,
                          border: `1px solid ${rarityStyle.border}`,
                        }}
                      >
                        {item.rarity}
                      </span>
                    </div>

                    {/* Requirement Description */}
                    <p className="text-[10px] text-brand-primary/50 line-clamp-1 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  {/* Dinosaur Illustration */}
                  <div className="my-1.5 flex items-center justify-center">
                    <DinosaurAsset
                      achievementId={item.id}
                      speciesName={item.dinosaur}
                      stage={item.evolution_stage}
                      isUnlocked={item.earned}
                      isDiscovered={item.is_discovered}
                      size="md"
                    />
                  </div>

                  {/* Card Footer: Progress Bar & Status */}
                  <div className="mt-1">
                    {/* Progress Track */}
                    <div className="flex items-center justify-between gap-2 mb-1 text-[10px] font-mono">
                      <span
                        className={`uppercase tracking-wider ${isUnlocked
                            ? 'text-brand-mustard font-semibold'
                            : 'text-brand-primary/40'
                          }`}
                      >
                        {isUnlocked
                          ? 'FULLY GROWN'
                          : getEvolutionStageLabel(item.evolution_stage)}
                      </span>

                      <span className="text-brand-primary/70">
                        {item.current_progress} / {item.requirement_value}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-1 rounded-full bg-[#231F19] overflow-hidden border border-[#2B2620]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${item.progress_percentage}%`,
                          backgroundColor: isUnlocked
                            ? '#7B8050'
                            : item.progress_percentage > 50
                              ? '#C49A45'
                              : '#B8623A',
                        }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ==================================================== */}
      {/* FOOTER EMBLEM                                        */}
      {/* ==================================================== */}
      <footer className="mt-12 pt-6 border-t border-brand-line/60 flex items-center justify-between">
        <div className="font-mono text-[10px] tracking-[0.25em] text-brand-primary/30 uppercase">
          TRACK HABITS. UNLOCK DINOSAURS. BECOME MORE.
        </div>

        <div className="flex items-center gap-2 text-brand-primary/30 font-mono text-[10px] tracking-widest uppercase">
          <span>DINO WORLD</span>
          <svg viewBox="0 0 20 20" className="w-3.5 h-3.5 text-brand-mustard/60" fill="currentColor">
            <polygon points="10,2 19,18 1,18" />
          </svg>
        </div>
      </footer>

      {/* ==================================================== */}
      {/* DETAIL MODAL                                         */}
      {/* ==================================================== */}
      <DinoDetailModal
        achievement={selectedDino}
        onClose={() => setSelectedDino(null)}
      />
    </div>
  );
}