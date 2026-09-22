// ============================================================
// Streakosaurus — Dinosaur Detail & Evolution Modal
// ============================================================

import React, { useEffect, useState } from 'react';
import { X, Award, CheckCircle2, Lock } from 'lucide-react';
import type { EvolutionStage } from '../types';
import type { AchievementWithProgress } from '../utils/achievements';
import {
  RARITY_STYLES,
  getEvolutionStageLabel,
} from '../utils/dinosaurRegistry';
import DinosaurAsset from './DinosaurAsset';

interface DinoDetailModalProps {
  achievement: AchievementWithProgress | null;
  onClose: () => void;
}

const STAGES: Array<{ id: EvolutionStage; label: string }> = [
  { id: 'egg', label: 'EGG' },
  { id: 'child', label: 'CHILD' },
  { id: 'adult', label: 'ADULT' },
  { id: 'fullyGrown', label: 'FULLY GROWN' },
];

export default function DinoDetailModal({
  achievement,
  onClose,
}: DinoDetailModalProps) {
  const [selectedStage, setSelectedStage] = useState<EvolutionStage>(
    achievement?.evolution_stage || 'adult'
  );

  // Reset stage preview when achievement changes or modal reopens
  useEffect(() => {
    if (achievement?.evolution_stage) {
      setSelectedStage(achievement.evolution_stage);
    }
  }, [achievement?.id, achievement?.evolution_stage]);

  const handleClose = () => {
    if (achievement?.evolution_stage) {
      setSelectedStage(achievement.evolution_stage);
    }
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!achievement) return null;

  const rarityStyle = RARITY_STYLES[achievement.rarity];
  const currentStage = achievement.evolution_stage;
  const currentStageIndex = STAGES.findIndex((s) => s.id === currentStage);
  const isUnlocked = achievement.earned;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-lg bg-[#191714] border border-[#2D2821] rounded-xl shadow-2xl overflow-hidden p-6 sm:p-7 text-brand-primary"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: isUnlocked
            ? '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(196,154,69,0.1)'
            : '0 20px 50px rgba(0,0,0,0.8)',
        }}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-brand-primary/40 hover:text-brand-primary transition-colors p-1.5 rounded-md hover:bg-white/5"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Top Eyebrow & Rarity */}
        <div className="flex items-center justify-between gap-3 pr-8 mb-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-brand-primary/45 tracking-wider">
              {achievement.orderNumber}
            </span>
            <span
              className="text-[10px] uppercase font-mono tracking-wider font-semibold px-2 py-0.5 rounded"
              style={{
                backgroundColor: rarityStyle.background,
                color: rarityStyle.text,
                border: `1px solid ${rarityStyle.border}`,
              }}
            >
              {achievement.rarity}
            </span>
          </div>

          {isUnlocked ? (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-mustard bg-brand-mustard/10 px-2 py-0.5 rounded border border-brand-mustard/20">
              <Award size={12} />
              EVOLVED & UNLOCKED
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-brand-primary/40 bg-white/5 px-2 py-0.5 rounded border border-brand-line">
              <Lock size={11} />
              IN PROGRESS
            </span>
          )}
        </div>

        {/* Dinosaur Name & Achievement Title */}
        <div className="mb-4">
          <h2 className="font-display text-2xl font-normal text-brand-primary tracking-tight">
            {achievement.is_discovered ? achievement.dinosaur : 'Unknown species'}
          </h2>
          <p className="text-sm text-brand-mustard font-medium mt-0.5 tracking-wide">
            {achievement.name}
          </p>
        </div>

        {/* Large Dinosaur Illustration Stage */}
        <div className="relative mb-5 p-2 flex items-center justify-center">
          <DinosaurAsset
            achievementId={achievement.id}
            speciesName={achievement.dinosaur}
            stage={selectedStage}
            isUnlocked={achievement.earned}
            isDiscovered={achievement.is_discovered}
            size="lg"
          />

          {/* Current Stage Indicator Tag */}
          <div className="absolute bottom-3 left-3 bg-[#1B1814]/90 backdrop-blur-md px-2.5 py-1 rounded border border-[#312B22] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-burnt-orange animate-pulse" />
            <span className="font-mono text-[10px] text-brand-primary/80 uppercase tracking-widest">
              STAGE: {getEvolutionStageLabel(selectedStage)}
            </span>
          </div>

          {isUnlocked && achievement.earned_at && (
            <div className="absolute top-3 left-3 bg-[#1B1814]/90 backdrop-blur-md px-2 py-0.5 rounded border border-brand-mustard/30 text-[10px] font-mono text-brand-mustard flex items-center gap-1">
              <CheckCircle2 size={11} />
              Earned {new Date(achievement.earned_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
            </div>
          )}
        </div>

        {/* Requirement & Description */}
        <div className="mb-5 p-3.5 rounded-lg bg-[#14120E] border border-[#242019]">
          <span className="text-[11px] font-mono uppercase text-brand-primary/45 tracking-wider block mb-1">
            Requirement
          </span>
          <p className="text-sm text-brand-primary/90 leading-relaxed">
            {achievement.description}
          </p>
        </div>

        {/* Progress Metric */}
        <div className="mb-5">
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-brand-primary/50 tracking-wider">PROGRESS</span>
            <span className="font-semibold text-brand-primary">
              {achievement.current_progress} / {achievement.requirement_value}{' '}
              <span className="text-brand-primary/40 font-normal">
                ({achievement.progress_percentage}%)
              </span>
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 rounded-full bg-[#231F19] overflow-hidden p-0.5 border border-[#2D2821]">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${achievement.progress_percentage}%`,
                backgroundColor: isUnlocked
                  ? '#7B8050'
                  : achievement.progress_percentage > 50
                  ? '#C49A45'
                  : '#B8623A',
              }}
            />
          </div>
        </div>

        {/* 4-Stage Evolution Stepper */}
        <div className="pt-2 border-t border-brand-line">
          <div className="text-[11px] font-mono text-brand-primary/45 tracking-widest uppercase mb-3 text-center">
            Evolution Path
          </div>

          <div className="flex items-center justify-between relative px-2">
            {/* Connecting Track */}
            <div className="absolute left-6 right-6 top-[11px] h-0.5 bg-[#2A241C] -z-0" />
            <div
              className="absolute left-6 top-[11px] h-0.5 bg-brand-burnt-orange -z-0 transition-all duration-500"
              style={{
                width: `${Math.max(0, Math.min(100, (currentStageIndex / (STAGES.length - 1)) * 100))}%`,
              }}
            />

            {STAGES.map((s, idx) => {
              const isUnlockedStage = achievement.earned || idx <= currentStageIndex;
              const isSelected = s.id === selectedStage;
              const isPassed = idx <= currentStageIndex;

              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!isUnlockedStage}
                  onClick={() => {
                    if (isUnlockedStage) {
                      setSelectedStage(s.id);
                    }
                  }}
                  className={`relative z-10 flex flex-col items-center group transition-all ${
                    isUnlockedStage ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed opacity-40'
                  }`}
                  title={isUnlockedStage ? `Preview ${s.label}` : `${s.label} (locked)`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-mono border transition-all ${
                      isSelected
                        ? 'border-brand-mustard bg-brand-burnt-orange text-white shadow-md shadow-brand-burnt-orange/30 scale-110'
                        : isPassed
                        ? 'border-brand-burnt-orange bg-[#241E17] text-brand-burnt-orange group-hover:border-brand-mustard'
                        : 'border-[#362F24] bg-[#191612] text-brand-primary/30'
                    }`}
                  >
                    {isPassed ? '●' : '○'}
                  </div>
                  <span
                    className={`text-[9px] font-mono mt-1.5 uppercase tracking-wider transition-colors ${
                      isSelected
                        ? 'text-brand-mustard font-semibold'
                        : isPassed
                        ? 'text-brand-primary/70 group-hover:text-brand-primary'
                        : 'text-brand-primary/30'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
