import React from 'react';

interface MetricCardProps {
  id?: string;
  title: string;
  value: number;
  icon: React.ReactNode;
  colorClass: string;
  subtext: string;
}

export default function MetricCard({
  id,
  title,
  value,
  icon,
  colorClass,
  subtext,
}: MetricCardProps) {
  return (
    <div
      id={id || `metric-${title.toLowerCase().replace(/\s+/g, '-')}`}
      className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between"
    >
      <div className="flex flex-col">
        <span className="text-slate-500 text-sm font-medium">
          {title}
        </span>
        <span className="text-3xl font-bold mt-1 text-slate-900 font-display">
          {value}
        </span>
        <span className="text-xs text-slate-400 mt-1.5">{subtext}</span>
      </div>
      <div className={`p-3 rounded-xl ${colorClass}`}>
        {icon}
      </div>
    </div>
  );
}
