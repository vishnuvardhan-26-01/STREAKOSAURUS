import React from 'react';

/**
 * Temporary branded wordmark for Streakosaurus.
 *
 * The mark is a simple footprint — three toes over a pad — drawn inline so it
 * can be replaced by a final logo asset without touching call sites. Swap the
 * <FootprintMark /> internals (or its callers' usage) when the real logo lands.
 */

export function FootprintMark({ size = 28 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
    >
      {/* three toes */}
      <ellipse cx="9.5" cy="9" rx="3.1" ry="4.2" fill="#B8623A" />
      <ellipse cx="16" cy="6.6" rx="3.3" ry="4.6" fill="#C49A45" />
      <ellipse cx="22.5" cy="9" rx="3.1" ry="4.2" fill="#B8623A" />
      {/* pad */}
      <path
        d="M16 13.5c-4.2 0-7.5 3.6-7.5 7.4 0 3.4 2.4 5.6 7.5 5.6s7.5-2.2 7.5-5.6c0-3.8-3.3-7.4-7.5-7.4Z"
        fill="#7B8050"
      />
      {/* two small toe marks */}
      <ellipse cx="6" cy="15.5" rx="1.5" ry="2.2" fill="#6F513A" />
      <ellipse cx="26" cy="15.5" rx="1.5" ry="2.2" fill="#6F513A" />
    </svg>
  );
}

interface BrandProps {
  size?: 'sm' | 'md';
  className?: string;
}

export default function Brand({ size = 'md', className = '' }: BrandProps) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <FootprintMark size={size === 'sm' ? 20 : 26} />
      <div className="leading-none">
        <div
          className={`font-display text-brand-primary tracking-tight ${
            size === 'sm' ? 'text-sm' : 'text-lg'
          }`}
        >
          Streakosaurus
        </div>
        <div className="text-[9px] text-brand-primary/35 tracking-widest2 uppercase mt-1">
          Extinct excuses
        </div>
      </div>
    </div>
  );
}