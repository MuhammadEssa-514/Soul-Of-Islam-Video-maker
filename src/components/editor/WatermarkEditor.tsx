import React, { useRef } from 'react';
import { WatermarkSettings } from '@/types/editor';
import { Upload } from 'lucide-react';

interface WatermarkEditorProps {
  settings: WatermarkSettings;
  onChange: (settings: WatermarkSettings) => void;
}

const POSITIONS = [
  { value: 'top-left', label: 'TL' },
  { value: 'top-center', label: 'TC' },
  { value: 'top-right', label: 'TR' },
  { value: 'center-left', label: 'CL' },
  { value: 'center', label: 'C' },
  { value: 'center-right', label: 'CR' },
  { value: 'bottom-left', label: 'BL' },
  { value: 'bottom-center', label: 'BC' },
  { value: 'bottom-right', label: 'BR' },
] as const;

export default function WatermarkEditor({ settings, onChange }: WatermarkEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => onChange({ ...settings, url: event.target?.result as string, enabled: true });
    reader.readAsDataURL(file);
  };

  return (
    <div className="w-full space-y-5">
      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={settings.enabled}
          onChange={(e) => onChange({ ...settings, enabled: e.target.checked })}
          className="w-5 h-5 rounded accent-[#059669] bg-black/40 border-white/20"
        />
        <span className="font-medium text-gray-300">Enable Watermark</span>
      </label>

      {settings.enabled && (
        <div className="space-y-5">
          {!settings.url ? (
            <div className="border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:border-[#059669]/50 cursor-pointer transition-colors" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Upload logo (transparent PNG)</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 bg-black/30 p-4 rounded-xl border border-white/10">
              <div className="w-14 h-14 bg-white/5 rounded-lg overflow-hidden flex items-center justify-center">
                <img src={settings.url} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
              <div className="flex-grow">
                <p className="text-sm font-medium text-white">Logo uploaded</p>
                <div className="flex gap-3 mt-1">
                  <button onClick={() => fileInputRef.current?.click()} className="text-xs text-[#059669] hover:underline">Replace</button>
                  <button onClick={() => onChange({ ...settings, url: null })} className="text-xs text-red-400 hover:underline">Remove</button>
                </div>
              </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFile} accept="image/png,image/jpeg,image/webp" className="hidden" />

          {settings.url && (
            <div className="space-y-4">
              {/* Position Grid */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Position</label>
                <div className="grid grid-cols-3 gap-1.5 max-w-[180px]">
                  {POSITIONS.map(p => (
                    <button
                      key={p.value}
                      onClick={() => onChange({ ...settings, position: p.value as any })}
                      className={`py-2 text-xs font-medium rounded-lg transition-all ${
                        settings.position === p.value
                          ? 'bg-[#059669] text-white shadow-lg shadow-[#059669]/30'
                          : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'
                      }`}
                    >{p.label}</button>
                  ))}
                </div>
              </div>

              {/* Sliders */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Opacity</span><span className="text-white font-medium">{settings.opacity}%</span>
                  </label>
                  <input type="range" min="10" max="100" value={settings.opacity} onChange={(e) => onChange({ ...settings, opacity: Number(e.target.value) })} className="w-full accent-[#059669] h-1.5 bg-white/10 rounded-full" />
                </div>
                <div>
                  <label className="flex justify-between text-sm text-gray-400 mb-1">
                    <span>Size</span><span className="text-white font-medium">{settings.scale}%</span>
                  </label>
                  <input type="range" min="20" max="200" value={settings.scale} onChange={(e) => onChange({ ...settings, scale: Number(e.target.value) })} className="w-full accent-[#059669] h-1.5 bg-white/10 rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
