import React from 'react';
import { FootprintMark } from './Brand';

interface EmptyStateProps {
  /** Emoji or short glyph; falls back to the footprint mark when omitted. */
  icon?: string;
  title: string;
  message: string;
  action?: React.ReactNode;
}

export default function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center animate-fade-in">
      {icon ? (
        <span className="text-5xl mb-4">{icon}</span>
      ) : (
        <FootprintMark size={44} />
      )}
      <h3 className="text-xl font-display text-brand-primary mb-2">{title}</h3>
      <p className="text-brand-primary/60 text-sm max-w-md mb-6">{message}</p>
      {action}
    </div>
  );
}
