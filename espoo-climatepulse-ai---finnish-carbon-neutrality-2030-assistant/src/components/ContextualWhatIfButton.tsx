import React from 'react';
import { Sparkles } from 'lucide-react';

interface ContextualWhatIfButtonProps {
  onClick: () => void;
  label?: string;
  variant?: 'primary' | 'secondary' | 'subtle' | 'pill';
  size?: 'sm' | 'md' | 'xs';
  isFinnish?: boolean;
  className?: string;
}

export const ContextualWhatIfButton: React.FC<ContextualWhatIfButtonProps> = ({
  onClick,
  label,
  variant = 'secondary',
  size = 'sm',
  isFinnish = false,
  className = '',
}) => {
  const displayLabel = label || (isFinnish ? '[🔮 Mitä jos?]' : '[🔮 What if?]');

  const baseStyles = 'inline-flex items-center gap-1.5 font-bold transition rounded-xl cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-purple-400';

  const sizeStyles = {
    xs: 'px-2.5 py-1 text-[11px]',
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2 text-xs sm:text-sm',
  }[size];

  const variantStyles = {
    primary: 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs',
    secondary: 'bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-xs',
    subtle: 'bg-white/80 hover:bg-white text-purple-950 border border-purple-200/80 shadow-xs backdrop-blur-xs',
    pill: 'rounded-full bg-purple-50 hover:bg-purple-100 text-purple-900 border border-purple-200 shadow-xs',
  }[variant];

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`${baseStyles} ${sizeStyles} ${variantStyles} ${className}`}
    >
      <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
      <span>{displayLabel}</span>
    </button>
  );
};
