import React from 'react';
import { DataFreshness } from '../data/schemas/commonSchema';
import { Wifi, Clock, Server } from 'lucide-react';

interface DataFreshnessBadgeProps {
  freshness: DataFreshness;
  lastUpdated?: string;
  sourceName?: string;
  className?: string;
}

export const DataFreshnessBadge: React.FC<DataFreshnessBadgeProps> = ({
  freshness,
  lastUpdated,
  sourceName,
  className = '',
}) => {
  let badgeStyle = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
  let icon = <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />;
  let label = 'Live';

  if (freshness === 'cached') {
    badgeStyle = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    icon = <Clock className="w-3 h-3 text-amber-400" />;
    label = 'Cached';
  } else if (freshness === 'demo') {
    badgeStyle = 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    icon = <Server className="w-3 h-3 text-blue-400" />;
    label = 'Demo Baseline';
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${badgeStyle} ${className}`}
      title={sourceName ? `Source: ${sourceName} (${lastUpdated || 'recent'})` : undefined}
    >
      {icon}
      <span>{label}</span>
      {lastUpdated && <span className="opacity-75 font-mono text-[10px]">({lastUpdated})</span>}
    </div>
  );
};
