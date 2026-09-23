"use client";

import { useState, useEffect } from "react";
import {
  FileText,
  Video,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Music,
  Clock,
  ShieldCheck,
  Type,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import ImageUploader from "@/components/editor/ImageUploader";
import TextEditor from "@/components/editor/TextEditor";
import AudioPicker from "@/components/editor/AudioPicker";
import DurationPicker from "@/components/editor/DurationPicker";
import StylePicker, { StyleConfig } from "@/components/editor/StylePicker";
import WatermarkPicker, { WatermarkConfig } from "@/components/editor/WatermarkPicker";
import VideoPreview from "@/components/editor/VideoPreview";
import VideoGenerator from "@/components/editor/VideoGenerator";
import ImageToTextStudio from "@/components/studio/ImageToTextStudio";
import { BACKDROP_PRESETS, createBackdropDataUrl } from "@/lib/backgrounds/islamicBackdrops";

type StudioMode = "ocr" | "text-to-video" | "image-to-video";

export default function EditorPage() {
  const [mode, setMode] = useState<StudioMode>("image-to-video");

  // State
  const [images, setImages] = useState<string[]>([]);
  const [text, setText] = useState<string>("Bismillah ir-Rahman ir-Rahim\nIn the name of Allah, the Most Gracious, the Most Merciful");
  const [duration, setDuration] = useState<number>(30);
  const [audioUrl, setAudioUrl] = useState<string | null>("/audio/nasheed-1.mp3");

  // Text-to-Video default backdrop preset
  const [selectedBackdropId, setSelectedBackdropId] = useState<string>("midnight-mosque");

  const [styleConfig, setStyleConfig] = useState<StyleConfig>({
    videoStyle: "golden-dust",
    colorFilter: "original",
    imageFit: "fit",
    textAnimation: "converge",
    showOverlay: true,
    accentColor: "#d97706",
  });

  const [watermarkConfig, setWatermarkConfig] = useState<WatermarkConfig>({
    enabled: true,
    type: "text",
    text: "@SoulOfIslam",
    imageUrl: null,
    position: "bottom-center",
    opacity: 0.75,
  });

  // Collapsible accordion panels for compact view
  const [activePanel, setActivePanel] = useState<"media" | "style" | "audio" | "branding">("media");

  // When switching to Text to Video, if no images exist, generate the default backdrop
  useEffect(() => {
    if (mode === "text-to-video" && images.length === 0) {
      const backdropUrl = createBackdropDataUrl(selectedBackdropId);
      if (backdropUrl) setImages([backdropUrl]);
    }
  }, [mode, selectedBackdropId, images.length]);

  const handleBackdropChange = (presetId: string) => {
    setSelectedBackdropId(presetId);
    const backdropUrl = createBackdropDataUrl(presetId);
    if (backdropUrl) {
      setImages([backdropUrl]);
    }
  };

  const handleOcrTransfer = (extractedText: string, imageSrc?: string) => {
    setText(extractedText);
    if (imageSrc) {
      setImages([imageSrc]);
      setMode("image-to-video");
    } else {
      setMode("text-to-video");
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 py-2">
      {/* 3-Option Top Studio Navigation Menu */}
      <div className="bg-[#0b101b]/90 backdrop-blur-xl border border-white/10 rounded-2xl p-1.5 shadow-xl flex items-center justify-between gap-1">
        <button
          type="button"
          onClick={() => setMode("ocr")}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            mode === "ocr"
              ? "bg-[#059669] text-white shadow-lg shadow-[#059669]/25 scale-[1.01]"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>1. Image to Text (OCR)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMode("text-to-video");
            if (images.length === 0) {
              const bg = createBackdropDataUrl(selectedBackdropId);
              if (bg) setImages([bg]);
            }
          }}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            mode === "text-to-video"
              ? "bg-gradient-to-r from-[#d97706] to-[#b45309] text-white shadow-lg shadow-[#d97706]/25 scale-[1.01]"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>2. Text to Video</span>
        </button>

        <button
          type="button"
          onClick={() => setMode("image-to-video")}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
            mode === "image-to-video"
              ? "bg-[#059669] text-white shadow-lg shadow-[#059669]/25 scale-[1.01]"
              : "text-gray-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>3. Image to Video</span>
        </button>
      </div>

      {/* MODE 1: IMAGE TO TEXT OCR */}
      {mode === "ocr" && (
        <div className="card p-5 border border-white/10 shadow-2xl animate-in fade-in duration-200">
          <div className="mb-3">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#10b981]" />
              Image to Text (Calligraphy & Verse OCR Scanner)
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Upload any quote image or verse calligraphy to instantly extract Arabic or English text.
            </p>
          </div>
          <ImageToTextStudio onUseInVideo={handleOcrTransfer} />
        </div>
      )}

      {/* MODES 2 & 3: COMPACT 2-COLUMN STUDIO LAYOUT (FITS ON ONE SCREEN) */}
      {(mode === "text-to-video" || mode === "image-to-video") && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT COLUMN: Compact Settings & Tool Panels (7 Cols) */}
          <div className="lg:col-span-7 space-y-2.5">
            {/* Panel 1: Content & Source (Text or Images) */}
            <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 backdrop-blur-md overflow-hidden shadow-lg">
              <button
                type="button"
                onClick={() => setActivePanel(activePanel === "media" ? "style" : "media")}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-[#059669]/20 text-[#10b981] flex items-center justify-center text-[10px] font-bold">
                    1
                  </span>
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    {mode === "text-to-video" ? "Quote Text & Backdrop" : "Quote Images & Sequence"}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">
                    {mode === "text-to-video" ? "Edit text" : `${images.length} slide(s)`}
                  </span>
                  {activePanel === "media" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {activePanel === "media" && (
                <div className="p-3.5 space-y-3">
                  {mode === "image-to-video" ? (
                    <div className="space-y-3">
                      <ImageUploader
                        images={images}
                        onImagesChange={setImages}
                        fitMode={styleConfig.imageFit}
                        onFitModeChange={(mode) => setStyleConfig({ ...styleConfig, imageFit: mode })}
                      />
                      <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1">
                          Overlay Text (Optional - Appears with kinetic animation)
                        </label>
                        <textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Type or paste verse text to animate over the video..."
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-[#059669] resize-none h-16"
                        />
                      </div>
                    </div>
                  ) : (
                    /* Text to Video Mode */
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1">
                          Verse / Hadith / Quote Text
                        </label>
                        <textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Enter your quote or verse text here..."
                          className="w-full bg-black/40 border border-white/15 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#d97706] resize-none h-24 leading-relaxed font-sans"
                        />
                      </div>

                      {/* Curated Islamic Backdrop Selector */}
                      <div>
                        <label className="text-xs font-semibold text-gray-300 block mb-1.5">
                          Islamic Sacred Backdrop Theme
                        </label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                          {BACKDROP_PRESETS.map((bp) => (
                            <button
                              key={bp.id}
                              type="button"
                              onClick={() => handleBackdropChange(bp.id)}
                              className={`p-1.5 rounded-xl border text-center transition-all ${
                                selectedBackdropId === bp.id
                                  ? "border-[#d97706] bg-[#d97706]/15 text-white ring-1 ring-[#d97706]"
                                  : "border-white/10 bg-white/[0.02] text-gray-400 hover:text-white"
                              }`}
                            >
                              <div className={`w-full h-8 rounded-lg mb-1 ${bp.previewBg} border border-white/10`} />
                              <span className="text-[10px] font-bold block truncate">{bp.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Panel 2: Visual Style, Particles & Kinetic Motion */}
            <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 backdrop-blur-md overflow-hidden shadow-lg">
              <button
                type="button"
                onClick={() => setActivePanel(activePanel === "style" ? "audio" : "style")}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-[#d97706]/20 text-amber-400 flex items-center justify-center text-[10px] font-bold">
                    2
                  </span>
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Divine Particles, Kinetic Text & Mood
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    {styleConfig.videoStyle}
                  </span>
                  {activePanel === "style" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {activePanel === "style" && (
                <div className="p-3.5">
                  <StylePicker config={styleConfig} onChange={setStyleConfig} />
                </div>
              )}
            </div>

            {/* Panel 3: Trending TikTok Arabic Sounds */}
            <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 backdrop-blur-md overflow-hidden shadow-lg">
              <button
                type="button"
                onClick={() => setActivePanel(activePanel === "audio" ? "branding" : "audio")}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center text-[10px] font-bold">
                    3
                  </span>
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    TikTok Arabic Trending Music
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">
                    {audioUrl ? "Sound selected ✓" : "None"}
                  </span>
                  {activePanel === "audio" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {activePanel === "audio" && (
                <div className="p-3.5">
                  <AudioPicker audioUrl={audioUrl} onSelect={setAudioUrl} />
                </div>
              )}
            </div>

            {/* Panel 4: Duration & Watermark */}
            <div className="rounded-2xl border border-white/10 bg-[#0f172a]/70 backdrop-blur-md overflow-hidden shadow-lg">
              <button
                type="button"
                onClick={() => setActivePanel(activePanel === "branding" ? "media" : "branding")}
                className="w-full px-4 py-2.5 flex items-center justify-between text-left hover:bg-white/[0.02] transition-colors border-b border-white/5"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                    4
                  </span>
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    Duration & Channel Watermark
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-400">{duration}s</span>
                  {activePanel === "branding" ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {activePanel === "branding" && (
                <div className="p-3.5 space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1.5">
                      Video Length
                    </label>
                    <DurationPicker value={duration} onChange={setDuration} />
                  </div>
                  <div>
                    <WatermarkPicker config={watermarkConfig} onChange={setWatermarkConfig} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Sticky Real-Time Live Preview & Instant Action (5 Cols) */}
          <div className="lg:col-span-5 sticky top-20 space-y-3">
            <div className="card p-3 border border-white/15 bg-[#0f172a]/90 backdrop-blur-xl shadow-2xl">
              <div className="flex items-center justify-between mb-2 px-1">
                <span className="text-xs font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Live Studio Player
                </span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-bold px-2 py-0.5 rounded-full">
                  9:16 Vertical
                </span>
              </div>

              {/* Real-Time Interactive Canvas Player */}
              <VideoPreview
                images={images}
                text={text}
                duration={duration}
                audioUrl={audioUrl}
                styleConfig={styleConfig}
                watermarkConfig={watermarkConfig}
              />

              {/* One-Click Video Generator right below the preview */}
              <div className="pt-2">
                <VideoGenerator
                  images={images}
                  text={text}
                  duration={duration}
                  audioUrl={audioUrl}
                  styleConfig={styleConfig}
                  watermarkConfig={watermarkConfig}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
