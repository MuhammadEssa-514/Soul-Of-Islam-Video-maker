import React, { useRef } from 'react';
import { ShieldCheck, Image as ImageIcon, Type, Upload, X } from 'lucide-react';

export type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'bottom-center';

export interface WatermarkConfig {
  enabled: boolean;
  type: 'text' | 'image';
  text: string;
  imageUrl: string | null;
  position: WatermarkPosition;
  opacity: number; // 0.1 to 1.0
}

interface Props {
  config: WatermarkConfig;
  onChange: (config: WatermarkConfig) => void;
}

const POSITIONS: { id: WatermarkPosition; label: string }[] = [
  { id: 'top-left', label: 'Top Left' },
  { id: 'top-right', label: 'Top Right' },
  { id: 'bottom-left', label: 'Bottom Left' },
  { id: 'bottom-center', label: 'Bottom Center' },
  { id: 'bottom-right', label: 'Bottom Right' },
];

export default function WatermarkPicker({ config, onChange }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange({
        ...config,
        enabled: true,
        type: 'image',
        imageUrl: ev.target?.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      {/* Enable Toggle Header */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/10">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className={`w-5 h-5 ${config.enabled ? 'text-[#059669]' : 'text-gray-500'}`} />
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Channel Watermark / Logo</h4>
            <p className="text-[11px] text-gray-400">Add brand protection to your reels & TikToks</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onChange({ ...config, enabled: !config.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
            config.enabled ? 'bg-[#059669]' : 'bg-white/10'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              config.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {config.enabled && (
        <div className="space-y-4 p-4 rounded-xl bg-black/20 border border-white/10 animate-in fade-in duration-200">
          {/* Watermark Type Selector */}
          <div className="flex rounded-lg bg-white/5 p-1 border border-white/10">
            <button
              type="button"
              onClick={() => onChange({ ...config, type: 'text' })}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                config.type === 'text' ? 'bg-[#059669] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <Type className="w-3.5 h-3.5" /> Text Handle (@channel)
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, type: 'image' })}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                config.type === 'image' ? 'bg-[#059669] text-white shadow-sm' : 'text-gray-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" /> Logo / Image
            </button>
          </div>

          {/* Text Input */}
          {config.type === 'text' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Watermark Text</label>
              <input
                type="text"
                value={config.text}
                onChange={(e) => onChange({ ...config, text: e.target.value })}
                placeholder="@SoulOfIslamOfficial"
                className="w-full bg-black/40 border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#059669]"
              />
            </div>
          )}

          {/* Image Upload */}
          {config.type === 'image' && (
            <div>
              <label className="text-xs text-gray-400 block mb-1.5">Upload Logo (PNG with transparent background)</label>
              {config.imageUrl ? (
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/5 border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={config.imageUrl} alt="Watermark" className="w-10 h-10 object-contain rounded bg-black/30 p-1" />
                  <span className="text-xs text-gray-300 flex-grow truncate">Custom logo loaded</span>
                  <button
                    type="button"
                    onClick={() => onChange({ ...config, imageUrl: null })}
                    className="p-1 rounded-lg hover:bg-white/10 text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full border border-dashed border-white/20 hover:border-[#059669] rounded-xl p-3.5 text-center transition-colors bg-white/[0.02] flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-300">Choose PNG Logo</span>
                </button>
              )}
              <input type="file" ref={fileRef} onChange={handleImageUpload} accept="image/png,image/webp,image/jpeg" className="hidden" />
            </div>
          )}

          {/* Position Selector */}
          <div>
            <label className="text-xs text-gray-400 block mb-1.5">Position on Video</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {POSITIONS.map((pos) => (
                <button
                  key={pos.id}
                  type="button"
                  onClick={() => onChange({ ...config, position: pos.id })}
                  className={`py-1.5 px-2 text-[11px] font-medium rounded-lg border text-center transition-all ${
                    config.position === pos.id
                      ? 'border-[#059669] bg-[#059669]/15 text-[#10b981]'
                      : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white'
                  }`}
                >
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Opacity Slider */}
          <div>
            <div className="flex justify-between items-center text-xs text-gray-400 mb-1">
              <span>Watermark Opacity</span>
              <span className="font-bold text-white">{Math.round(config.opacity * 100)}%</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={config.opacity}
              onChange={(e) => onChange({ ...config, opacity: parseFloat(e.target.value) })}
              className="w-full accent-[#059669]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
