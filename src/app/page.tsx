import Link from "next/link";
import { Play, Sparkles, Zap, Video } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center w-full">
      <div className="max-w-3xl space-y-8 relative">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-[#059669] text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          The Ultimate Islamic Video Creator
        </div>
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
          Create <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#059669] to-[#10b981]">Breathtaking</span><br />
          Islamic Videos
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Upload an image, extract text, add a stunning watermark, and generate cinematic 90-second vertical videos ready for social media.
        </p>
        
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/editor" className="btn-primary inline-flex items-center gap-2 text-lg px-8 py-4 w-full sm:w-auto justify-center">
            <Play className="w-5 h-5 fill-current" />
            Enter Studio
          </Link>
        </div>
      </div>
      
      <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full max-w-5xl">
        <div className="card hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#059669]/20 to-[#047857]/20 border border-[#059669]/30 text-[#059669] flex items-center justify-center mb-6">
            <Zap className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl mb-3 text-white">Smart Extraction</h3>
          <p className="text-gray-400 leading-relaxed">Upload any image. Our advanced engine instantly extracts Arabic and Urdu calligraphy with pinpoint accuracy.</p>
        </div>
        <div className="card hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#d97706]/20 to-[#b45309]/20 border border-[#d97706]/30 text-[#d97706] flex items-center justify-center mb-6">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl mb-3 text-white">Premium Styles</h3>
          <p className="text-gray-400 leading-relaxed">Apply cinematic Ken Burns effects, elegant text animations, and your own high-fidelity watermark in seconds.</p>
        </div>
        <div className="card hover:-translate-y-1 transition-transform duration-300">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mb-6">
            <Video className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-xl mb-3 text-white">Studio Render</h3>
          <p className="text-gray-400 leading-relaxed">Generate incredibly smooth 30fps vertical MP4 videos that are perfectly optimized for TikTok, Reels, and Shorts.</p>
        </div>
      </div>
    </div>
  );
}
