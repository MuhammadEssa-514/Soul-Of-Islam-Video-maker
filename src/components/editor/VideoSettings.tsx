import React from 'react';
import { VideoConfig } from '@/types/editor';

interface VideoSettingsProps {
  config: VideoConfig;
  onChange: (config: VideoConfig) => void;
}

const PRESETS = [
  { id: 'peaceful', name: 'Peaceful', desc: 'Slow zoom · Soft fade' },
  { id: 'elegant', name: 'Elegant', desc: 'Pan · Gentle zoom' },
  { id: 'minimal', name: 'Minimal', desc: 'Near-static · Clean' },
] as const;

const DURATIONS = [
  { value: 30, label: '30s' },
  { value: 90, label: '90s' },
  { value: 180, label: '3m' },
];

export default function VideoSettings({ config, onChange }: VideoSettingsProps) {
  return (
    <div className="w-full space-y-6">
      {/* Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">Animation</label>
        <div className="grid grid-cols-3 gap-3">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => onChange({ ...config, preset: p.id })}
              className={`p-4 rounded-xl border text-center transition-all ${
                config.preset === p.id
                  ? 'border-[#059669] bg-[#059669]/10 ring-1 ring-[#059669]'
                  : 'border-white/10 bg-white/[0.02] hover:border-white/20'
              }`}
            >
              <div className={`font-semibold text-sm ${config.preset === p.id ? 'text-[#059669]' : 'text-white'}`}>{p.name}</div>
              <div className="text-[11px] text-gray-500 mt-1">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">Duration</label>
        <div className="flex gap-2">
          {DURATIONS.map(d => (
            <button
              key={d.value}
              onClick={() => onChange({ ...config, durationSeconds: d.value })}
              className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                config.durationSeconds === d.value
                  ? 'bg-[#059669] text-white shadow-lg shadow-[#059669]/30'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'
              }`}
            >{d.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
