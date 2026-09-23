import React from 'react';
import {
  Sparkles,
  Sun,
  Flame,
  Star,
  Film,
  Eye,
  Type,
  Palette,
  CircleDot,
  Zap,
  ArrowDownUp,
  MoveHorizontal,
  FlameKindling,
} from 'lucide-react';

export type VideoStyleId =
  | 'golden-dust'
  | 'celestial-stars'
  | 'heavenly-rays'
  | 'emerald-embers'
  | 'light-leak-aura'
  | 'sacred-breathe'
  | 'ken-burns'
  | 'reel-vintage';

export type ColorFilterId =
  | 'original'
  | 'moody-grey'
  | 'midnight-dark'
  | 'vintage-parchment'
  | 'emerald-twilight';

export type TextAnimationId =
  | 'converge'
  | 'cascade'
  | 'pop-kinetic'
  | 'typewriter'
  | 'fade'
  | 'float';

export interface StyleConfig {
  videoStyle: VideoStyleId;
  colorFilter: ColorFilterId;
  imageFit: 'fit' | 'fill';
  textAnimation: TextAnimationId;
  showOverlay: boolean;
  accentColor: string;
}

interface Props {
  config: StyleConfig;
  onChange: (config: StyleConfig) => void;
}

const MOTION_STYLES: {
  id: VideoStyleId;
  name: string;
  desc: string;
  icon: any;
  tag: string;
  highlight?: boolean;
}[] = [
  {
    id: 'golden-dust',
    name: 'Divine Golden Dust',
    desc: 'Sacred glowing light motes & golden floating embers',
    icon: Sparkles,
    tag: 'Top Pick ★',
    highlight: true,
  },
  {
    id: 'celestial-stars',
    name: 'Celestial Noor & Stars',
    desc: 'Twinkling holy stars & radiant diamond light flares',
    icon: Star,
    tag: 'New Divine',
    highlight: true,
  },
  {
    id: 'heavenly-rays',
    name: 'Heavenly God Rays',
    desc: 'Volumetric luminous sunbeams streaming from above',
    icon: Sun,
    tag: 'Dramatic',
    highlight: true,
  },
  {
    id: 'emerald-embers',
    name: 'Sacred Emerald Embers',
    desc: 'Glowing Islamic emerald & warm gold spiritual embers',
    icon: Flame,
    tag: 'Spiritual',
    highlight: true,
  },
  {
    id: 'light-leak-aura',
    name: 'Warm Light Leak Aura',
    desc: 'Aesthetic glowing lens flares & soft atmospheric sweep',
    icon: FlameKindling,
    tag: 'Cinematic',
    highlight: true,
  },
  {
    id: 'sacred-breathe',
    name: 'Spiritual Halo Pulse',
    desc: 'Meditative breathing scale with golden radiant halo',
    icon: CircleDot,
    tag: 'Emotional',
  },
  {
    id: 'ken-burns',
    name: 'Cinematic Ken Burns',
    desc: 'Majestic slow camera zoom with dark edge vignette',
    icon: Film,
    tag: 'Classic',
  },
  {
    id: 'reel-vintage',
    name: 'Vintage Reel Grain',
    desc: 'CapCut-style film grain & micro camera motion',
    icon: Eye,
    tag: 'Trendy',
  },
];

const COLOR_FILTERS: {
  id: ColorFilterId;
  name: string;
  desc: string;
  previewBg: string;
}[] = [
  {
    id: 'original',
    name: 'Original Colors',
    desc: 'Natural colors of your uploaded images',
    previewBg: 'bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600',
  },
  {
    id: 'moody-grey',
    name: 'Spiritual Grey / B&W',
    desc: 'Charcoal monochrome with glowing white & gold text',
    previewBg: 'bg-gradient-to-r from-gray-900 via-gray-600 to-gray-200',
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Dark Noir',
    desc: 'Deep shadowed darkness with illuminated verse focus',
    previewBg: 'bg-gradient-to-r from-black via-zinc-900 to-zinc-700',
  },
  {
    id: 'vintage-parchment',
    name: 'Antique Sepia',
    desc: 'Warm aged parchment reminiscent of ancient manuscripts',
    previewBg: 'bg-gradient-to-r from-amber-950 via-amber-700 to-amber-300',
  },
  {
    id: 'emerald-twilight',
    name: 'Emerald Twilight',
    desc: 'Deep holy Islamic emerald green tone',
    previewBg: 'bg-gradient-to-r from-emerald-950 via-emerald-800 to-emerald-400',
  },
];

const TEXT_ANIMATIONS: {
  id: TextAnimationId;
  name: string;
  desc: string;
  icon: any;
  badge: string;
}[] = [
  {
    id: 'converge',
    name: 'Left & Right Converge',
    desc: 'Lines glide from left & right, meeting in center',
    icon: MoveHorizontal,
    badge: 'Popular',
  },
  {
    id: 'cascade',
    name: 'Heavenly Fall from Top',
    desc: 'Words descend smoothly from top into position',
    icon: ArrowDownUp,
    badge: 'Divine',
  },
  {
    id: 'pop-kinetic',
    name: 'Kinetic Word Pop',
    desc: 'Words pop dynamically in sync with recitation',
    icon: Zap,
    badge: 'TikTok Trend',
  },
  {
    id: 'typewriter',
    name: 'Classic Typewriter',
    desc: 'Character-by-character with blinking gold cursor',
    icon: Type,
    badge: 'Classic',
  },
  {
    id: 'fade',
    name: 'Luminous Glow',
    desc: 'Smooth radiant glow fade-in with light aura',
    icon: Sparkles,
    badge: 'Soft',
  },
  {
    id: 'float',
    name: 'Ascending Lift',
    desc: 'Gently floats upwards from bottom into clarity',
    icon: ArrowDownUp,
    badge: 'Smooth',
  },
];

export default function StylePicker({ config, onChange }: Props) {
  return (
    <div className="space-y-5">
      {/* Visual Animation & Particle Effects */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
            Divine Particles & Visual Effects
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">8 Visual Styles</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {MOTION_STYLES.map((s) => {
            const Icon = s.icon;
            const isSelected = config.videoStyle === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ ...config, videoStyle: s.id })}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#059669] bg-[#059669]/15 shadow-lg shadow-[#059669]/15 ring-1 ring-[#059669]'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-1.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-[#059669] text-white shadow-md' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected
                        ? 'bg-[#059669]/25 text-[#10b981]'
                        : s.highlight
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'bg-white/5 text-gray-500'
                    }`}
                  >
                    {s.tag}
                  </span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">{s.name}</h4>
                  <p className="text-[11px] text-gray-400 leading-snug">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kinetic Multi-Directional Text Animation Styles */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-[#d97706]" />
            Text Direction & Motion (Left, Right, Top, Kinetic)
          </span>
          <span className="text-[10px] text-amber-400 font-bold">Kinetic Styles</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {TEXT_ANIMATIONS.map((t) => {
            const isSelected = config.textAnimation === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ ...config, textAnimation: t.id })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#d97706] bg-[#d97706]/15 text-white ring-1 ring-[#d97706] shadow-sm'
                    : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-400' : 'text-gray-500'}`} />
                  <span className={`text-[9px] px-1.5 py-0.5 rounded ${isSelected ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-white/5 text-gray-500'}`}>
                    {t.badge}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mb-0.5">{t.name}</div>
                <div className="text-[10px] text-gray-500 line-clamp-1">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Filter / Mood (Grey, Dark, Sepia, Emerald) */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#059669]" />
          Color Mood & Filter (Grey, Dark, Natural)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {COLOR_FILTERS.map((f) => {
            const isSelected = config.colorFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ ...config, colorFilter: f.id })}
                className={`p-2.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#059669] bg-[#059669]/15 text-white ring-1 ring-[#059669]'
                    : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <div className={`w-full h-1.5 rounded-full mb-2 ${f.previewBg}`} />
                <div className="text-xs font-bold text-white mb-0.5">{f.name}</div>
                <div className="text-[10px] text-gray-500 line-clamp-1">{f.desc}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
