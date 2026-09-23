import Link from "next/link";
import {
  Play,
  Sparkles,
  FileText,
  Type,
  ImageIcon,
  ArrowRight,
  ShieldCheck,
  Music,
  Flame,
  CheckCircle2,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[78vh] text-center w-full py-6">
      {/* Hero Badge */}
      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[#10b981] text-xs font-bold mb-4 shadow-sm">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        Studio 2.0 • The Ultimate Islamic Video Creator
      </div>

      {/* Main Title */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight max-w-4xl text-white">
        Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#059669] via-[#10b981] to-[#d97706]">Breathtaking</span> Islamic Videos
      </h1>

      <p className="text-sm sm:text-base text-gray-400 max-w-2xl mx-auto mt-4 leading-relaxed">
        Designed for TikTok, Instagram Reels, and YouTube Shorts. Extract calligraphy text, pick divine particle styles, mix trending Arabic nasheeds, and generate in seconds.
      </p>

      {/* Direct CTA */}
      <div className="mt-8 flex items-center justify-center gap-3">
        <Link
          href="/editor"
          className="bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065f46] text-white px-8 py-3.5 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-[#059669]/25 flex items-center gap-2"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch Full Studio</span>
        </Link>
      </div>

      {/* 3 Dedicated Systems / Modes Cards */}
      <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-5 text-left w-full max-w-5xl">
        {/* Mode 1 */}
        <Link
          href="/editor?mode=ocr"
          className="card p-5 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <FileText className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            Mode 1
          </span>
          <h3 className="font-bold text-lg text-white mb-2 group-hover:text-emerald-400 transition-colors">
            Image to Text (OCR)
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Upload quote images or calligraphy photos to automatically extract clean Arabic & English text with 1-click transfer to video maker.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Open OCR Scanner</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Mode 2 */}
        <Link
          href="/editor?mode=text-to-video"
          className="card p-5 hover:border-amber-500/40 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/25 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Type className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block mb-1">
            Mode 2
          </span>
          <h3 className="font-bold text-lg text-white mb-2 group-hover:text-amber-400 transition-colors">
            Text to Video
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Enter your verse or Hadith, pick from curated sacred Islamic backdrops, apply kinetic word animations, and add viral TikTok nasheeds.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-amber-400 group-hover:translate-x-1 transition-transform">
            <span>Create from Text</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>

        {/* Mode 3 */}
        <Link
          href="/editor?mode=image-to-video"
          className="card p-5 hover:border-emerald-500/40 hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ImageIcon className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block mb-1">
            Mode 3
          </span>
          <h3 className="font-bold text-lg text-white mb-2 group-hover:text-emerald-400 transition-colors">
            Image to Video
          </h3>
          <p className="text-xs text-gray-400 leading-relaxed mb-4">
            Upload 1 or multiple quote images with full height & width preservation, smooth multi-slide crossfades, and divine golden particles.
          </p>
          <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Create from Images</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </Link>
      </div>

      {/* Feature Highlights Banner */}
      <div className="mt-12 max-w-4xl w-full border border-white/10 rounded-2xl bg-white/[0.01] p-4 flex flex-wrap items-center justify-around gap-4 text-xs text-gray-400">
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> 1080×1920 9:16 Vertical Export
        </span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-400" /> Divine Golden Dust & Particles
        </span>
        <span className="flex items-center gap-1.5">
          <Music className="w-4 h-4 text-rose-400" /> 10 TikTok Trending Nasheeds
        </span>
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-400" /> Custom Logo Watermark
        </span>
      </div>
    </div>
  );
}
