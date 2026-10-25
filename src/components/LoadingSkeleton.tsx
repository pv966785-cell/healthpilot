import React from 'react';

interface SkeletonProps {
  type: 'doctor' | 'lab' | 'medicine' | 'order';
  count?: number;
  isDarkMode?: boolean;
}

export const ListSkeleton: React.FC<SkeletonProps> = ({ type, count = 3, isDarkMode = false }) => {
  const bgClass = isDarkMode ? 'bg-slate-800/80 border-slate-700/60' : 'bg-white border-slate-200/80';
  const pulseClass = isDarkMode ? 'bg-slate-700/60' : 'bg-slate-200';

  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, idx) => {
        if (type === 'doctor') {
          return (
            <div key={idx} className={`p-4 rounded-3xl border ${bgClass} shadow-xs animate-pulse flex items-center gap-3.5`}>
              <div className={`w-14 h-14 rounded-2xl ${pulseClass} shrink-0`} />
              <div className="flex-1 space-y-2 min-w-0">
                <div className={`h-4 w-36 rounded ${pulseClass}`} />
                <div className={`h-3 w-24 rounded ${pulseClass}`} />
                <div className={`h-3 w-48 rounded ${pulseClass}`} />
              </div>
              <div className={`h-8 w-20 rounded-xl ${pulseClass} shrink-0`} />
            </div>
          );
        }

        if (type === 'lab') {
          return (
            <div key={idx} className={`p-4 rounded-3xl border ${bgClass} shadow-xs animate-pulse space-y-3`}>
              <div className="flex items-center justify-between">
                <div className={`h-4 w-40 rounded ${pulseClass}`} />
                <div className={`h-4 w-16 rounded ${pulseClass}`} />
              </div>
              <div className={`h-3 w-56 rounded ${pulseClass}`} />
              <div className="flex items-center justify-between pt-2">
                <div className={`h-3 w-28 rounded ${pulseClass}`} />
                <div className={`h-8 w-24 rounded-xl ${pulseClass}`} />
              </div>
            </div>
          );
        }

        if (type === 'medicine') {
          return (
            <div key={idx} className={`p-4 rounded-3xl border ${bgClass} shadow-xs animate-pulse flex items-center justify-between gap-3`}>
              <div className="space-y-2 flex-1">
                <div className={`h-4 w-32 rounded ${pulseClass}`} />
                <div className={`h-3 w-24 rounded ${pulseClass}`} />
                <div className={`h-4 w-20 rounded ${pulseClass}`} />
              </div>
              <div className={`h-9 w-24 rounded-xl ${pulseClass} shrink-0`} />
            </div>
          );
        }

        // order / appointment
        return (
          <div key={idx} className={`p-4 rounded-3xl border ${bgClass} shadow-xs animate-pulse space-y-2.5`}>
            <div className="flex items-center justify-between">
              <div className={`h-4 w-32 rounded ${pulseClass}`} />
              <div className={`h-4 w-16 rounded ${pulseClass}`} />
            </div>
            <div className={`h-3 w-48 rounded ${pulseClass}`} />
            <div className={`h-8 w-full rounded-xl ${pulseClass} mt-2`} />
          </div>
        );
      })}
    </div>
  );
};
