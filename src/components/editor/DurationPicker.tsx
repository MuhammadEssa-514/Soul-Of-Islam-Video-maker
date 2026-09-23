import React from 'react';

interface Props {
  value: number;
  onChange: (v: number) => void;
}

const OPTIONS = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '1m' },
  { value: 90, label: '90s' },
  { value: 120, label: '2m' },
  { value: 180, label: '3m' },
];

export default function DurationPicker({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            value === o.value
              ? 'bg-[#059669] text-white shadow-lg shadow-[#059669]/30'
              : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
          }`}
        >{o.label}</button>
      ))}
    </div>
  );
}
