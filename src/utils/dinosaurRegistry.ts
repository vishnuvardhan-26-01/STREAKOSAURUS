// ============================================================
// Streakosaurus — Dinosaur Achievement Registry
// Canonical 25-Achievement & Dinosaur Evolution System
// ============================================================

import type { DinoRarity, EvolutionStage } from '../types';

export type DinoSpeciesGroup =
  | 'trex'
  | 'velociraptor'
  | 'triceratops'
  | 'carnotaurus'
  | 'stegosaurus'
  | 'brachiosaurus'
  | 'ankylosaurus'
  | 'iguanodon'
  | 'parasaurolophus'
  | 'deinonychus'
  | 'allosaurus'
  | 'spinosaurus'
  | 'pachycephalosaurus'
  | 'corythosaurus'
  | 'edmontosaurus'
  | 'ceratosaurus'
  | 'baryonyx'
  | 'giganotosaurus'
  | 'therizinosaurus'
  | 'apatosaurus'
  | 'dilophosaurus'
  | 'suchomimus'
  | 'gallimimus'
  | 'styracosaurus'
  | 'argentinosaurus'
  | 'diplodocus'
  | 'utahraptor'
  | 'archaeopteryx'
  | 'pachyrhinosaurus'
  | 'albertosaurus'
  | 'euplocephalus'
  | 'nodosaurus';

export interface DinoAchievementDef {
  id: string;
  orderNumber: string; // "01" - "25"
  name: string;
  requirementDescription: string;
  rarity: DinoRarity;
  dinosaur: string; // Species display name e.g. "Tyrannosaurus Rex"
  speciesGroup: DinoSpeciesGroup;
  speciesVariant: string;
  requirement_type: string;
  requirement_value: number;
  category: string;
  icon: string;
}

export const DINO_ACHIEVEMENTS: DinoAchievementDef[] = [
  {
    id: 'no_excuses',
    orderNumber: '01',
    name: 'No Excuses',
    requirementDescription: 'Complete every habit for 7 days.',
    rarity: 'COMMON',
    dinosaur: 'Tyrannosaurus Rex',
    speciesGroup: 'trex',
    speciesVariant: 'classic',
    requirement_type: 'perfect_week',
    requirement_value: 7,
    category: 'consistency',
    icon: '🥚',
  },
  {
    id: 'early_bird',
    orderNumber: '02',
    name: 'Early Bird',
    requirementDescription: '10 early wake-ups.',
    rarity: 'COMMON',
    dinosaur: 'Velociraptor',
    speciesGroup: 'velociraptor',
    speciesVariant: 'dawn',
    requirement_type: 'early_wake_ups',
    requirement_value: 10,
    category: 'routine',
    icon: '🌅',
  },
  {
    id: 'threepeat',
    orderNumber: '03',
    name: 'Threepeat',
    requirementDescription: '3-day streak.',
    rarity: 'COMMON',
    dinosaur: 'Triceratops',
    speciesGroup: 'triceratops',
    speciesVariant: 'tri',
    requirement_type: 'streak',
    requirement_value: 3,
    category: 'streak',
    icon: '🥉',
  },
  {
    id: 'week_warrior',
    orderNumber: '04',
    name: 'Week Warrior',
    requirementDescription: '7-day streak.',
    rarity: 'COMMON',
    dinosaur: 'Stegosaurus',
    speciesGroup: 'stegosaurus',
    speciesVariant: 'warrior',
    requirement_type: 'streak',
    requirement_value: 7,
    category: 'streak',
    icon: '⚔️',
  },
  {
    id: 'fortnight_fighter',
    orderNumber: '05',
    name: 'Fortnight Fighter',
    requirementDescription: '14-day streak.',
    rarity: 'UNCOMMON',
    dinosaur: 'Brachiosaurus',
    speciesGroup: 'brachiosaurus',
    speciesVariant: 'fighter',
    requirement_type: 'streak',
    requirement_value: 14,
    category: 'streak',
    icon: '🥊',
  },
  {
    id: 'month_master',
    orderNumber: '06',
    name: 'Month Master',
    requirementDescription: '30-day streak.',
    rarity: 'RARE',
    dinosaur: 'Ankylosaurus',
    speciesGroup: 'ankylosaurus',
    speciesVariant: 'master',
    requirement_type: 'streak',
    requirement_value: 30,
    category: 'streak',
    icon: '👑',
  },
  {
    id: 'centurion',
    orderNumber: '07',
    name: 'Centurion',
    requirementDescription: '100 total completions.',
    rarity: 'RARE',
    dinosaur: 'Allosaurus',
    speciesGroup: 'allosaurus',
    speciesVariant: 'armored',
    requirement_type: 'total_completions',
    requirement_value: 100,
    category: 'milestone',
    icon: '🏛️',
  },
  {
    id: 'brick_by_brick',
    orderNumber: '08',
    name: 'Brick by Brick',
    requirementDescription: '100 habit completions.',
    rarity: 'COMMON',
    dinosaur: 'Pachycephalosaurus',
    speciesGroup: 'pachycephalosaurus',
    speciesVariant: 'builder',
    requirement_type: 'total_completions',
    requirement_value: 100,
    category: 'milestone',
    icon: '🧱',
  },
  {
    id: 'consistent_creature',
    orderNumber: '09',
    name: 'Consistent Creature',
    requirementDescription: '80% completion for 30 days.',
    rarity: 'UNCOMMON',
    dinosaur: 'Diplodocus',
    speciesGroup: 'diplodocus',
    speciesVariant: 'creature',
    requirement_type: 'consistency',
    requirement_value: 80,
    category: 'consistency',
    icon: '🦎',
  },
  {
    id: 'growth_spurt',
    orderNumber: '10',
    name: 'Growth Spurt',
    requirementDescription: 'Increase streak by 50%.',
    rarity: 'RARE',
    dinosaur: 'Dilophosaurus',
    speciesGroup: 'dilophosaurus',
    speciesVariant: 'swift',
    requirement_type: 'streak_growth',
    requirement_value: 1,
    category: 'streak',
    icon: '⚡',
  },
  {
    id: 'focus_mode',
    orderNumber: '11',
    name: 'Focus Mode',
    requirementDescription: '50 deep-focus sessions.',
    rarity: 'UNCOMMON',
    dinosaur: 'Carnotaurus',
    speciesGroup: 'carnotaurus',
    speciesVariant: 'focus',
    requirement_type: 'focus_sessions',
    requirement_value: 50,
    category: 'focus',
    icon: '🎯',
  },
  {
    id: 'project_pioneer',
    orderNumber: '12',
    name: 'Project Pioneer',
    requirementDescription: 'Complete 5 project tasks.',
    rarity: 'RARE',
    dinosaur: 'Utahraptor',
    speciesGroup: 'utahraptor',
    speciesVariant: 'pioneer',
    requirement_type: 'project_tasks',
    requirement_value: 5,
    category: 'projects',
    icon: '🧭',
  },
  {
    id: 'idea_hatchling',
    orderNumber: '13',
    name: 'Idea Hatchling',
    requirementDescription: 'Capture 10 ideas.',
    rarity: 'COMMON',
    dinosaur: 'Archaeopteryx',
    speciesGroup: 'archaeopteryx',
    speciesVariant: 'idea',
    requirement_type: 'ideas',
    requirement_value: 10,
    category: 'ideas',
    icon: '💡',
  },
  {
    id: 'calendar_keeper',
    orderNumber: '14',
    name: 'Calendar Keeper',
    requirementDescription: 'Log habits for 30 different days.',
    rarity: 'UNCOMMON',
    dinosaur: 'Parasaurolophus',
    speciesGroup: 'parasaurolophus',
    speciesVariant: 'keeper',
    requirement_type: 'distinct_days',
    requirement_value: 30,
    category: 'consistency',
    icon: '📅',
  },
  {
    id: 'report_ranger',
    orderNumber: '15',
    name: 'Report Ranger',
    requirementDescription: 'View weekly report 10 times.',
    rarity: 'COMMON',
    dinosaur: 'Styracosaurus',
    speciesGroup: 'styracosaurus',
    speciesVariant: 'ranger',
    requirement_type: 'reports_viewed',
    requirement_value: 10,
    category: 'analytics',
    icon: '📊',
  },
  {
    id: 'dna_researcher',
    orderNumber: '16',
    name: 'DNA Researcher',
    requirementDescription: 'Unlock 10 dinosaurs.',
    rarity: 'RARE',
    dinosaur: 'Spinosaurus',
    speciesGroup: 'spinosaurus',
    speciesVariant: 'researcher',
    requirement_type: 'unlock_count_10',
    requirement_value: 10,
    category: 'meta',
    icon: '🧬',
  },
  {
    id: 'expedition_starter',
    orderNumber: '17',
    name: 'Expedition Starter',
    requirementDescription: 'Send 1 dino on an expedition.',
    rarity: 'UNCOMMON',
    dinosaur: 'Baryonyx',
    speciesGroup: 'baryonyx',
    speciesVariant: 'expedition',
    requirement_type: 'expedition',
    requirement_value: 1,
    category: 'expedition',
    icon: '🗺️',
  },
  {
    id: 'absolute_unit',
    orderNumber: '18',
    name: 'Absolute Unit',
    requirementDescription: '100-day streak.',
    rarity: 'EPIC',
    dinosaur: 'Deinonychus',
    speciesGroup: 'deinonychus',
    speciesVariant: 'unit',
    requirement_type: 'streak',
    requirement_value: 100,
    category: 'streak',
    icon: '🦖',
  },
  {
    id: 'extinction_survivor',
    orderNumber: '19',
    name: 'Extinction Survivor',
    requirementDescription: '30 consecutive days.',
    rarity: 'EPIC',
    dinosaur: 'Pachyrhinosaurus',
    speciesGroup: 'pachyrhinosaurus',
    speciesVariant: 'survivor',
    requirement_type: 'streak',
    requirement_value: 30,
    category: 'streak',
    icon: '🦕',
  },
  {
    id: 'balance_seeker',
    orderNumber: '20',
    name: 'Balance Seeker',
    requirementDescription: 'Maintain 70% across all habits for 14 days.',
    rarity: 'UNCOMMON',
    dinosaur: 'Iguanodon',
    speciesGroup: 'iguanodon',
    speciesVariant: 'balanced',
    requirement_type: 'balance_rate',
    requirement_value: 14,
    category: 'consistency',
    icon: '⚖️',
  },
  {
    id: 'night_owl',
    orderNumber: '21',
    name: 'Night Owl',
    requirementDescription: '10 late-night focus sessions.',
    rarity: 'RARE',
    dinosaur: 'Edmontosaurus',
    speciesGroup: 'edmontosaurus',
    speciesVariant: 'night',
    requirement_type: 'night_focus',
    requirement_value: 10,
    category: 'focus',
    icon: '🌙',
  },
  {
    id: 'water_break',
    orderNumber: '22',
    name: 'Water Break',
    requirementDescription: 'Log hydration 50 times.',
    rarity: 'COMMON',
    dinosaur: 'Albertosaurus',
    speciesGroup: 'albertosaurus',
    speciesVariant: 'water',
    requirement_type: 'habit_water',
    requirement_value: 50,
    category: 'habits',
    icon: '💧',
  },
  {
    id: 'move_more',
    orderNumber: '23',
    name: 'Move More',
    requirementDescription: 'Log exercise 50 times.',
    rarity: 'UNCOMMON',
    dinosaur: 'Euoplocephalus',
    speciesGroup: 'euplocephalus',
    speciesVariant: 'runner',
    requirement_type: 'habit_exercise',
    requirement_value: 50,
    category: 'habits',
    icon: '🏃',
  },
  {
    id: 'mindful_one',
    orderNumber: '24',
    name: 'Mindful One',
    requirementDescription: 'Log meditation 30 times.',
    rarity: 'RARE',
    dinosaur: 'Nodosaurus',
    speciesGroup: 'nodosaurus',
    speciesVariant: 'mindful',
    requirement_type: 'habit_meditation',
    requirement_value: 30,
    category: 'habits',
    icon: '🧘',
  },
  {
    id: 'legendary',
    orderNumber: '25',
    name: 'Legendary',
    requirementDescription: 'Unlock all other achievements.',
    rarity: 'LEGENDARY',
    dinosaur: 'Legendary Tyrannosaurus Rex',
    speciesGroup: 'trex',
    speciesVariant: 'legendary',
    requirement_type: 'all_achievements',
    requirement_value: 24,
    category: 'meta',
    icon: '👑',
  },
];

export const DINO_REGISTRY_MAP = new Map<string, DinoAchievementDef>(
  DINO_ACHIEVEMENTS.map((a) => [a.id, a])
);

/**
 * Derives the evolution stage strictly according to requirement:
 * 0–24%: EGG
 * 25–49%: CHILD
 * 50–74%: ADULT
 * 75–99%: ADULT (near fully grown)
 * 100%: FULLY GROWN
 */
export function getEvolutionStage(progressPercentage: number): EvolutionStage {
  if (progressPercentage >= 100) return 'fullyGrown';
  if (progressPercentage >= 50) return 'adult';
  if (progressPercentage >= 25) return 'child';
  return 'egg';
}

export function getEvolutionStageLabel(stage: EvolutionStage): string {
  switch (stage) {
    case 'egg':
      return 'EGG';
    case 'child':
      return 'CHILD';
    case 'adult':
      return 'ADULT';
    case 'fullyGrown':
      return 'FULLY GROWN';
  }
}

export interface RarityStyle {
  border: string;
  background: string;
  text: string;
  accent: string;
  glow: string;
}

export const RARITY_STYLES: Record<DinoRarity, RarityStyle> = {
  COMMON: {
    border: '#463E35',
    background: '#231E19',
    text: '#D5CEBF',
    accent: '#A69885',
    glow: 'rgba(166, 152, 133, 0.1)',
  },
  UNCOMMON: {
    border: '#3D4C38',
    background: '#1D261A',
    text: '#9CB48D',
    accent: '#7B8050',
    glow: 'rgba(123, 128, 80, 0.12)',
  },
  RARE: {
    border: '#2C4155',
    background: '#16232F',
    text: '#76A6D1',
    accent: '#5E7B93',
    glow: 'rgba(94, 123, 147, 0.15)',
  },
  EPIC: {
    border: '#4D335A',
    background: '#27192F',
    text: '#C498D4',
    accent: '#8B6B94',
    glow: 'rgba(139, 107, 148, 0.18)',
  },
  LEGENDARY: {
    border: '#6B4C1E',
    background: '#34220C',
    text: '#E5B650',
    accent: '#C49A45',
    glow: 'rgba(196, 154, 69, 0.22)',
  },
};
