import React, { useRef, useState } from 'react';
import { AudioSettings } from '@/types/editor';
import { Upload, Music, Flame, Play, Pause, Check } from 'lucide-react';

interface AudioEditorProps {
  settings: AudioSettings;
  onChange: (settings: AudioSettings) => void;
}

const TRENDING_TRACKS = [
  { id: 'nasheed-1', name: 'Ambient Peaceful Nasheed', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
  { id: 'nasheed-2', name: 'Emotional Background', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
  { id: 'quran-bg', name: 'Soft Rain & Ambient', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
];

export default function AudioEditor({ settings, onChange }: AudioEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      onChange({ ...settings, url: event.target?.result as string, enabled: true });
      stopPreview();
    };
    reader.readAsDataURL(file);
  };

  const togglePreview = (id: string, url: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      audioRef.current?.pause();
      const audio = new Audio(url);
      audio.play();
      audio.onended = () => setPlayingId(null);
      audioRef.current = audio;
      setPlayingId(id);
    }
  };

  const stopPreview = () => { audioRef.current?.pause(); setPlayingId(null); };

  const selectTrack = (url: string) => {
    onChange({ ...settings, url, enabled: true });
    stopPreview();
  };

  return (
    <div className="w-full space-y-5">
      <label className="flex items-center gap-3 cursor-pointer">
        <input type="checkbox" checked={settings.enabled} onChange={(e) => { onChange({ ...settings, enabled: e.target.checked }); if (!e.target.checked) stopPreview(); }} className="w-5 h-5 rounded accent-[#059669] bg-black/40 border-white/20" />
        <span className="font-medium text-gray-300">Background Audio</span>
      </label>

      {settings.enabled && (
        <div className="space-y-5">
          {!settings.url ? (
            <>
              {/* Trending */}
              <div className="rounded-xl border border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/5 flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span className="font-semibold text-sm text-white">Trending Sounds</span>
                </div>
                {TRENDING_TRACKS.map((track, i) => {
                  const isPlaying = playingId === track.id;
                  return (
                    <div key={track.id} className={`flex items-center gap-3 px-4 py-3 ${i < TRENDING_TRACKS.length - 1 ? 'border-b border-white/5' : ''} hover:bg-white/[0.02] transition-colors`}>
                      <button onClick={() => togglePreview(track.id, track.url)} className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isPlaying ? 'bg-[#059669] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`} aria-label={isPlaying ? "Pause" : "Preview"}>
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                      </button>
                      <span className="flex-grow text-sm text-gray-300 font-medium">{track.name}</span>
                      <button onClick={() => selectTrack(track.url)} className="text-xs font-semibold text-[#059669] bg-[#059669]/10 hover:bg-[#059669]/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                        <Check className="w-3 h-3" /> Use
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
                <div className="relative flex justify-center"><span className="px-3 text-xs text-gray-600 bg-[#030712]">or upload your own</span></div>
              </div>

              <button onClick={() => fileInputRef.current?.click()} className="w-full border border-dashed border-white/10 rounded-xl p-5 text-center hover:border-[#059669]/50 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-gray-600 mx-auto mb-1" />
                <p className="text-sm text-gray-400">Browse MP3 / WAV</p>
              </button>
            </>
          ) : (
            <div className="flex items-center gap-3 bg-[#059669]/10 p-4 rounded-xl border border-[#059669]/20">
              <div className="w-10 h-10 bg-[#059669]/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Music className="w-5 h-5 text-[#059669]" />
              </div>
              <div className="flex-grow min-w-0">
                <p className="text-sm font-semibold text-white">Audio ready</p>
              </div>
              <button onClick={() => onChange({ ...settings, url: null })} className="text-xs text-gray-400 hover:text-red-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg transition-colors">Change</button>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFile} accept="audio/mpeg,audio/wav,audio/m4a" className="hidden" />

          {settings.url && (
            <div>
              <label className="flex justify-between text-sm text-gray-400 mb-2"><span>Volume</span><span className="text-white font-medium">{settings.volume}%</span></label>
              <input type="range" min="0" max="100" value={settings.volume} onChange={(e) => onChange({ ...settings, volume: Number(e.target.value) })} className="w-full accent-[#059669] h-1.5 bg-white/10 rounded-full" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
