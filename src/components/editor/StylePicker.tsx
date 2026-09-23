import React, { useRef } from 'react';
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
  Waves,
  Sunrise,
  Trees,
  Wind,
  CloudRain,
  Video,
  Upload,
  Sliders,
  SlidersHorizontal,
  Activity,
  Award,
  Check,
  X,
} from 'lucide-react';

export type VideoStyleId =
  | 'ocean-waves'
  | 'rising-sun'
  | 'tree-leaves'
  | 'desert-dunes'
  | 'sacred-rain'
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
  // Professional & Unique Method 2 Features:
  customVideoUrl?: string | null;
  backdropDim?: number;          // 0 to 0.8
  showSurahBadge?: boolean;      // Top floating surah/ayah badge
  surahBadgeText?: string;       // e.g. "Holy Quran • Sacred Reflection"
  showAudioVisualizer?: boolean; // TikTok/reels dancing audio bars
  showSacredFrame?: boolean;     // Gold arabesque sacred borders
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
    id: 'ocean-waves',
    name: 'Rolling Ocean Sea',
    desc: 'Deep flowing waves with moonlight water reflections',
    icon: Waves,
    tag: 'Nature ★',
    highlight: true,
  },
  {
    id: 'rising-sun',
    name: 'Rising Sun Dawn',
    desc: 'Golden sun rising on horizon with radiant morning rays',
    icon: Sunrise,
    tag: 'Nature ★',
    highlight: true,
  },
  {
    id: 'tree-leaves',
    name: 'Swaying Trees & Leaves',
    desc: 'Organic canopy with leaves fluttering in sacred breeze',
    icon: Trees,
    tag: 'Nature ★',
    highlight: true,
  },
  {
    id: 'desert-dunes',
    name: 'Golden Desert Dunes',
    desc: 'Majestic rippling dunes with blowing golden sand mist',
    icon: Wind,
    tag: 'Nature ★',
    highlight: true,
  },
  {
    id: 'sacred-rain',
    name: 'Serene Rain on Glass',
    desc: 'Tranquil droplets trickling down with light glimmers',
    icon: CloudRain,
    tag: 'Nature ★',
    highlight: true,
  },
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
    desc: 'Natural colors of your uploaded images & scenery',
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
  const videoInputRef = useRef<HTMLInputElement | null>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({
      ...config,
      customVideoUrl: url,
    });
  };

  const clearCustomVideo = () => {
    if (config.customVideoUrl && config.customVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(config.customVideoUrl);
    }
    onChange({
      ...config,
      customVideoUrl: null,
    });
    if (videoInputRef.current) {
      videoInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Method 2: Real Background Video Loop Upload */}
      <div className="bg-gradient-to-r from-[#059669]/15 via-[#047857]/10 to-[#d97706]/15 border border-emerald-500/30 rounded-2xl p-2.5">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Video className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-white">Method 2: Cinematic Video Loop</span>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/30">
            Real Motion
          </span>
        </div>
        <p className="text-[10px] text-gray-400 mb-2">
          Upload any MP4/WebM drone clip, ocean wave, or nature video to play as the live looping backdrop.
        </p>

        <input
          ref={videoInputRef}
          type="file"
          accept="video/mp4,video/webm"
          onChange={handleVideoUpload}
          className="hidden"
        />

        {config.customVideoUrl ? (
          <div className="flex items-center justify-between bg-black/50 border border-emerald-500/40 rounded-xl px-2.5 py-1.5">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-300">Custom Video Active</span>
            </div>
            <button
              type="button"
              onClick={clearCustomVideo}
              className="text-[10px] bg-red-500/20 hover:bg-red-500/30 text-red-300 px-2 py-0.5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3 h-3" />
              Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="w-full bg-white/5 hover:bg-white/10 border border-white/10 hover:border-emerald-500/40 text-gray-300 hover:text-white py-1.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-400" />
            <span>Upload Real Video Loop (.mp4 / .webm)</span>
          </button>
        )}
      </div>

      {/* Visual Animation & Particle Effects */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#d97706]" />
            Nature Scenery & Motion Styles
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">13 Styles Available</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[190px] overflow-y-auto pr-1 scrollbar-thin">
          {MOTION_STYLES.map((s) => {
            const Icon = s.icon;
            const isSelected = config.videoStyle === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onChange({ ...config, videoStyle: s.id })}
                className={`p-2 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-[#059669] bg-[#059669]/15 shadow-lg shadow-[#059669]/15 ring-1 ring-[#059669]'
                    : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05] hover:border-white/20'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div
                    className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                      isSelected ? 'bg-[#059669] text-white shadow-md' : 'bg-white/5 text-gray-400'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                  </div>
                  <span
                    className={`text-[8px] font-bold px-1.5 py-0.2 rounded-full ${
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
                  <h4 className="text-[11px] font-bold text-white mb-0.2">{s.name}</h4>
                  <p className="text-[9.5px] text-gray-400 leading-snug line-clamp-1">{s.desc}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Kinetic Multi-Directional Text Animation Styles */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Type className="w-3.5 h-3.5 text-[#d97706]" />
            Text Direction & Motion
          </span>
          <span className="text-[10px] text-amber-400 font-bold">Kinetic Styles</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {TEXT_ANIMATIONS.map((t) => {
            const isSelected = config.textAnimation === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onChange({ ...config, textAnimation: t.id })}
                className={`p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#d97706] bg-[#d97706]/15 text-white ring-1 ring-[#d97706] shadow-sm'
                    : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <Icon className={`w-3 h-3 ${isSelected ? 'text-amber-400' : 'text-gray-500'}`} />
                  <span className={`text-[8px] px-1 py-0.2 rounded ${isSelected ? 'bg-amber-500/20 text-amber-300 font-bold' : 'bg-white/5 text-gray-500'}`}>
                    {t.badge}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-white mb-0.2">{t.name}</div>
                <div className="text-[9px] text-gray-500 line-clamp-1">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Filter / Mood (Grey, Dark, Sepia, Emerald) */}
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-[#059669]" />
          Color Mood & Filter
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {COLOR_FILTERS.map((f) => {
            const isSelected = config.colorFilter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ ...config, colorFilter: f.id })}
                className={`p-2 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#059669] bg-[#059669]/15 text-white ring-1 ring-[#059669]'
                    : 'border-white/10 bg-white/[0.02] text-gray-400 hover:text-white hover:border-white/20'
                }`}
              >
                <div className={`w-full h-1 rounded-full mb-1 ${f.previewBg}`} />
                <div className="text-[11px] font-bold text-white mb-0.2">{f.name}</div>
                <div className="text-[9px] text-gray-500 line-clamp-1">{f.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Professional & Unique Video Enhancements */}
      <div className="pt-2 border-t border-white/10 space-y-2.5">
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-[#d97706]" />
          Professional Reel Enhancements
        </label>

        {/* Backdrop Darkness Slider */}
        <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-300 font-medium">Backdrop Dimming (Text Contrast)</span>
            <span className="text-amber-400 font-bold text-[11px]">
              {Math.round((config.backdropDim ?? 0.38) * 100)}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="0.8"
            step="0.05"
            value={config.backdropDim ?? 0.38}
            onChange={(e) => onChange({ ...config, backdropDim: parseFloat(e.target.value) })}
            className="w-full accent-amber-500 h-1 bg-white/10 rounded-lg cursor-pointer"
          />
        </div>

        {/* Floating Surah Badge & Audio Visualizer Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {/* Surah Citation Badge */}
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 space-y-1.5">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
                <Award className="w-3 h-3 text-amber-400" />
                Surah Citation Badge
              </span>
              <input
                type="checkbox"
                checked={config.showSurahBadge ?? true}
                onChange={(e) => onChange({ ...config, showSurahBadge: e.target.checked })}
                className="accent-amber-500 rounded cursor-pointer"
              />
            </label>
            {config.showSurahBadge !== false && (
              <input
                type="text"
                value={config.surahBadgeText ?? '✨ Holy Quran • Sacred Reflection'}
                onChange={(e) => onChange({ ...config, surahBadgeText: e.target.value })}
                placeholder="e.g. Surah Ar-Rahman • 55:13"
                className="w-full bg-black/40 border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white focus:outline-none focus:border-amber-500"
              />
            )}
          </div>

          {/* TikTok Audio Visualizer Bars */}
          <div className="bg-white/[0.03] border border-white/5 rounded-xl p-2 flex flex-col justify-between">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
                <Activity className="w-3 h-3 text-emerald-400" />
                TikTok Audio Equalizer
              </span>
              <input
                type="checkbox"
                checked={config.showAudioVisualizer ?? true}
                onChange={(e) => onChange({ ...config, showAudioVisualizer: e.target.checked })}
                className="accent-emerald-500 rounded cursor-pointer"
              />
            </label>
            <p className="text-[9px] text-gray-500 mt-1">
              Dancing audio frequency bars at bottom of video
            </p>
          </div>
        </div>

        {/* Sacred Islamic Gold Frame */}
        <label className="flex items-center justify-between bg-white/[0.03] border border-white/5 rounded-xl p-2 cursor-pointer">
          <span className="text-xs text-gray-300 font-medium flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Sacred Arabesque Gold Border Frame
          </span>
          <input
            type="checkbox"
            checked={config.showSacredFrame ?? true}
            onChange={(e) => onChange({ ...config, showSacredFrame: e.target.checked })}
            className="accent-amber-500 rounded cursor-pointer"
          />
        </label>
      </div>
    </div>
  );
}
