import React, { useRef, useState } from 'react';
import { Play, Pause, Check, Upload, Music, Flame, Sparkles, Volume2 } from 'lucide-react';

interface Props {
  audioUrl: string | null;
  onSelect: (url: string | null) => void;
}

export interface AudioTrack {
  id: string;
  name: string;
  category: string;
  durationText: string;
  url: string;
}

export const TRENDING_ARABIC_TRACKS: AudioTrack[] = [
  { id: '1', name: 'Viral Nasheed (Slowed & Reverb)', category: 'TikTok Trending', durationText: '0:45', url: '/audio/nasheed-1.mp3' },
  { id: '2', name: 'Emotional Arabic Vocal Ahat', category: 'Heartfelt', durationText: '0:55', url: '/audio/nasheed-2.mp3' },
  { id: '3', name: 'Deep Spiritual Reflection', category: 'Soulful', durationText: '1:10', url: '/audio/nasheed-3.mp3' },
  { id: '4', name: 'Peaceful Morning Dhikr Tone', category: 'Peaceful', durationText: '1:02', url: '/audio/nasheed-4.mp3' },
  { id: '5', name: 'Cinematic Heartfelt Melody', category: 'Cinematic', durationText: '1:45', url: '/audio/nasheed-5.mp3' },
  { id: '6', name: 'Calm Quranic Ambient Sound', category: 'Meditative', durationText: '0:22', url: '/audio/nasheed-6.mp3' },
  { id: '7', name: 'TikTok Trending Arabic Flow', category: 'Viral Beat', durationText: '1:00', url: '/audio/nasheed-7.mp3' },
  { id: '8', name: 'Sacred Harmony & Calm', category: 'Atmospheric', durationText: '0:35', url: '/audio/nasheed-8.mp3' },
  { id: '9', name: 'Soulful Medina Vibes', category: 'Devotional', durationText: '0:46', url: '/audio/nasheed-9.mp3' },
  { id: '10', name: 'Ethereal Islamic Echoes', category: 'Echoes', durationText: '1:20', url: '/audio/nasheed-10.mp3' },
];

export default function AudioPicker({ audioUrl, onSelect }: Props) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [customName, setCustomName] = useState<string | null>(null);

  const toggle = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const a = new Audio(url);
    a.play().catch((err) => console.warn('Audio preview play error:', err));
    a.onended = () => setPlayingId(null);
    audioRef.current = a;
    setPlayingId(id);
  };

  const select = (track: AudioTrack) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingId(null);
    setCustomName(track.name);
    onSelect(track.url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = (ev) => {
      const res = ev.target?.result as string;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setPlayingId(null);
      setCustomName(f.name);
      onSelect(res);
    };
    r.readAsDataURL(f);
  };

  const activeTrack = TRENDING_ARABIC_TRACKS.find((t) => t.url === audioUrl);
  const displayName = customName || activeTrack?.name || 'Custom Audio Track';

  if (audioUrl) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-3 bg-gradient-to-r from-[#059669]/15 to-[#10b981]/10 p-3 rounded-xl border border-[#059669]/30 shadow-sm">
          <div className="w-8 h-8 bg-[#059669]/20 rounded-full flex items-center justify-center flex-shrink-0 text-[#10b981]">
            <Music className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex-grow min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider text-[#10b981] bg-[#059669]/20 px-1.5 py-0.2 rounded">
                Active Music Track
              </span>
              <Volume2 className="w-3 h-3 text-[#10b981]" />
            </div>
            <p className="text-xs font-bold text-white truncate mt-0.5">{displayName}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => toggle('active', audioUrl)}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              title="Test audio"
            >
              {playingId === 'active' ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                if (audioRef.current) audioRef.current.pause();
                setPlayingId(null);
                setCustomName(null);
                onSelect(null);
              }}
              className="text-[11px] text-gray-400 hover:text-red-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg transition-colors"
            >
              Change
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 10 Trending Sounds list */}
      <div className="rounded-xl border border-white/10 overflow-hidden bg-black/30">
        <div className="px-3 py-2 border-b border-white/10 bg-white/[0.02] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-bold text-[11px] text-white uppercase tracking-wider">
              10 TikTok Arabic Trending Sounds
            </span>
          </div>
          <span className="text-[10px] text-gray-400 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5 text-[#10b981]" /> Click play to preview
          </span>
        </div>

        <div className="divide-y divide-white/5 max-h-[220px] overflow-y-auto scrollbar-thin">
          {TRENDING_ARABIC_TRACKS.map((t) => {
            const isPlaying = playingId === t.id;
            return (
              <div
                key={t.id}
                className="flex items-center gap-2.5 px-3 py-2 hover:bg-white/[0.04] transition-colors group"
              >
                {/* Play/Pause Button */}
                <button
                  type="button"
                  onClick={() => toggle(t.id, t.url)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all shadow-sm ${
                    isPlaying
                      ? 'bg-[#059669] text-white scale-105 shadow-[#059669]/50 animate-pulse'
                      : 'bg-white/10 text-gray-300 hover:bg-white/20 hover:text-white'
                  }`}
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 ml-0.5" />}
                </button>

                {/* Track Details */}
                <div className="flex-grow min-w-0 cursor-pointer" onClick={() => select(t)}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-white truncate group-hover:text-[#10b981] transition-colors">
                      {t.name}
                    </span>
                    <span className="text-[8px] px-1 py-0.2 rounded bg-white/5 text-gray-400 flex-shrink-0">
                      {t.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-gray-500">{t.durationText}</span>
                    {isPlaying && (
                      <div className="flex items-end gap-0.5 h-2.5 ml-1">
                        <span className="w-0.5 h-full bg-[#10b981] rounded-full animate-bounce" />
                        <span className="w-0.5 h-2/3 bg-[#10b981] rounded-full animate-bounce [animation-delay:150ms]" />
                        <span className="w-0.5 h-full bg-[#10b981] rounded-full animate-bounce [animation-delay:300ms]" />
                        <span className="w-0.5 h-1/2 bg-[#10b981] rounded-full animate-bounce [animation-delay:450ms]" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Add button */}
                <button
                  type="button"
                  onClick={() => select(t)}
                  className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors border border-emerald-500/20"
                >
                  <Check className="w-3 h-3" /> Add
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Upload own */}
      <button
        type="button"
        onClick={() => fileRef.current?.click()}
        className="w-full border border-dashed border-white/15 hover:border-[#059669] rounded-xl p-2.5 text-center transition-colors bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer flex items-center justify-center gap-2 group"
      >
        <Upload className="w-3.5 h-3.5 text-gray-400 group-hover:text-[#10b981] transition-colors" />
        <span className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors">
          Or Upload Custom MP3 / Nasheed
        </span>
      </button>
      <input
        type="file"
        ref={fileRef}
        onChange={handleFile}
        accept="audio/*,.mp3,.wav,.m4a,.aac,.ogg"
        className="hidden"
      />
    </div>
  );
}
