// ============================================================
// Streakosaurus — Dinosaur Asset Loader
// Pure Image-Asset Pipeline for Dino World
// ============================================================

import React from 'react';
import type { EvolutionStage } from '../types';

interface DinosaurAssetProps {
  achievementId: string;
  speciesName?: string;
  stage: EvolutionStage;
  isUnlocked: boolean;
  isDiscovered: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// Vite eager asset glob mapping all external dinosaur artwork files.
// Layer-illustrated SVG specimens and raster fallbacks share this lookup.
const dinoAssetMap = import.meta.glob<{ default: string }>(
  '../assets/dinos/*/*.{webp,png,jpg,jpeg,svg}',
  { eager: true }
);

function getStageFilename(stage: EvolutionStage): string {
  switch (stage) {
    case 'egg':
      return 'egg';
    case 'child':
      return 'juvenile';
    case 'adult':
      return 'adult';
    case 'fullyGrown':
      return 'grown';
    default:
      return 'grown';
  }
}

export default function DinosaurAsset({
  achievementId,
  speciesName,
  stage,
  isUnlocked,
  isDiscovered,
  className = '',
  size = 'md',
}: DinosaurAssetProps) {
  const heightClass = size === 'lg' ? 'h-52' : size === 'sm' ? 'h-24' : 'h-32';
  const slug = (achievementId || '').toLowerCase().replace(/_/g, '-');
  const stageFilename = getStageFilename(stage);

  // Look up asset path across all supported artwork formats
  const candidateKeys = [
    `../assets/dinos/${slug}/${stageFilename}.webp`,
    `../assets/dinos/${slug}/${stageFilename}.png`,
    `../assets/dinos/${slug}/${stageFilename}.jpg`,
    `../assets/dinos/${slug}/${stageFilename}.jpeg`,
    `../assets/dinos/${slug}/${stageFilename}.svg`,
  ];

  let assetSrc: string | null = null;
  for (const key of candidateKeys) {
    if (dinoAssetMap[key]?.default) {
      assetSrc = dinoAssetMap[key].default;
      break;
    }
  }

  // Active/unlocked visual state:
  // If the achievement is earned, discovered, or has evolved past egg (or is an active specimen),
  // display at full clarity with no artificial darkening or grayscale.
  const isArtUnlocked = isUnlocked || isDiscovered || stage !== 'egg';

  // -----------------------------------------------------------
  // 1. ASSET EXISTS: RENDER ACTUAL IMAGE (NO RECTANGLE, TRANSPARENT)
  // -----------------------------------------------------------
  if (assetSrc) {
    return (
      <div
        className={`relative w-full ${heightClass} flex items-end justify-center ${className}`}
      >
        <img
          key={assetSrc}
          src={assetSrc}
          alt={speciesName || slug}
          className={`w-full h-full object-contain object-bottom pointer-events-none transition-all duration-300 select-none ${!isArtUnlocked
              ? 'opacity-35 grayscale contrast-75 brightness-50'
              : 'opacity-100'
            }`}
          loading="lazy"
        />

        {/* Locked Subtle Overlay for unstarted eggs */}
        {!isArtUnlocked && (
          <div className="absolute inset-0 bg-[#0C0B09]/40 pointer-events-none" />
        )}
      </div>
    );
  }

  // -----------------------------------------------------------
  // 2. MISSING ASSET: HONEST TEMPORARY NEUTRAL PLACEHOLDER
  // Clearly marked, NO fake SVGs, NO generic clip art.
  // -----------------------------------------------------------
  return (
    <div
      className={`relative w-full ${heightClass} flex flex-col items-center justify-center border border-dashed border-[#2B251E] bg-[#14120E] rounded-md px-2 text-center select-none ${className}`}
    >
      <span className="font-mono text-[9px] uppercase tracking-widest text-brand-mustard/60 mb-0.5">
        SPECIMEN ASSET PENDING
      </span>
      <span className="font-mono text-[8px] text-brand-primary/30 truncate max-w-full">
        {slug}/{stageFilename}.webp
      </span>
    </div>
  );
}
