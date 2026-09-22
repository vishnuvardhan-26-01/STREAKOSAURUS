import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export default function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className={`relative bg-brand-surface border border-brand-warm-brown/30 rounded-xl shadow-2xl w-full ${sizeClasses[size]} mx-4 animate-scale-in`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-warm-brown/20">
            <h2 className="text-lg font-display text-brand-primary">{title}</h2>
            <button onClick={onClose} className="text-brand-primary/50 hover:text-brand-primary transition-colors">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="px-6 py-4 max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
