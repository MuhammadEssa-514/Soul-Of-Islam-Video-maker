"use client";

import React from "react";
import {
  Type,
  AlignCenter,
  AlignLeft,
  AlignRight,
  MoveVertical,
  Palette,
  Sparkles,
} from "lucide-react";
import {
  StyleConfig,
  FontFamilyId,
  TextPositionId,
  TextAlignId,
} from "./StylePicker";

interface Props {
  config: StyleConfig;
  onChange: (config: StyleConfig) => void;
}

const FONT_FAMILIES: {
  id: FontFamilyId;
  name: string;
  preview: string;
  sub: string;
  fontStyle: React.CSSProperties;
}[] = [
  {
    id: "amiri",
    name: "Amiri Quranic",
    preview: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    sub: "Sacred Arabic Calligraphy",
    fontStyle: { fontFamily: '"Amiri", "Scheherazade New", serif', fontWeight: 700 },
  },
  {
    id: "sans",
    name: "Modern Sans",
    preview: "Soul of Islam",
    sub: "Clean & Contemporary",
    fontStyle: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', fontWeight: 700 },
  },
  {
    id: "playfair",
    name: "Luxury Serif",
    preview: "Noble Verse",
    sub: "Elegant & Editorial",
    fontStyle: { fontFamily: '"Playfair Display", Georgia, serif', fontWeight: 700, fontStyle: "italic" },
  },
  {
    id: "montserrat",
    name: "Viral Bold",
    preview: "IMPACT REEL",
    sub: "TikTok & Shorts Trend",
    fontStyle: { fontFamily: '"Montserrat", Arial, sans-serif', fontWeight: 900 },
  },
  {
    id: "scheherazade",
    name: "Scheherazade",
    preview: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    sub: "Traditional Islamic Naskh",
    fontStyle: { fontFamily: '"Scheherazade New", "Amiri", serif', fontWeight: 700 },
  },
];

const PRESET_COLORS = [
  { hex: "#ffffff", name: "Pure White", border: "border-white/40" },
  { hex: "#fbbf24", name: "Celestial Gold", border: "border-amber-400/40" },
  { hex: "#fef08a", name: "Champagne Amber", border: "border-yellow-200/40" },
  { hex: "#34d399", name: "Sacred Emerald", border: "border-emerald-400/40" },
  { hex: "#38bdf8", name: "Twilight Sky", border: "border-sky-400/40" },
  { hex: "#fda4af", name: "Rose Noor", border: "border-rose-300/40" },
];

const SIZE_PRESETS = [
  { label: "S (20px)", size: 20 },
  { label: "M (26px)", size: 26 },
  { label: "L (32px)", size: 32 },
  { label: "XL (40px)", size: 40 },
];

export default function TypographyPicker({ config, onChange }: Props) {
  const currentFont = config.fontFamily ?? "amiri";
  const currentSize = config.textSize ?? 26;
  const currentColor = config.textColor ?? "#ffffff";
  const currentPosition = config.textPosition ?? "center";
  const currentAlign = config.textAlign ?? "center";

  return (
    <div className="space-y-3 bg-white/[0.02] border border-white/10 rounded-2xl p-3 shadow-lg">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-1.5">
          <Type className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-xs font-bold text-white uppercase tracking-wider">
            Typography & Text Styling
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          Pro Controls
        </span>
      </div>

      {/* 1. Font Family Selector */}
      <div>
        <label className="text-[11px] font-semibold text-gray-300 block mb-1.5">
          Font Family
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {FONT_FAMILIES.map((f) => {
            const isSelected = currentFont === f.id;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => onChange({ ...config, fontFamily: f.id })}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "border-amber-500 bg-amber-500/15 text-white ring-1 ring-amber-500 shadow-sm"
                    : "border-white/10 bg-white/[0.02] text-gray-400 hover:text-white hover:border-white/20"
                }`}
              >
                <div className="text-[11px] font-bold text-white mb-0.5 truncate">
                  {f.name}
                </div>
                <div className="text-[12px] text-amber-300 truncate" style={f.fontStyle}>
                  {f.preview}
                </div>
                <div className="text-[9px] text-gray-500 truncate mt-0.5">
                  {f.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Text Size Slider & Quick Presets */}
      <div>
        <div className="flex items-center justify-between text-[11px] mb-1">
          <span className="text-gray-300 font-semibold">Text Size</span>
          <span className="text-amber-400 font-bold">{currentSize}px</span>
        </div>
        <input
          type="range"
          min="16"
          max="48"
          step="1"
          value={currentSize}
          onChange={(e) =>
            onChange({ ...config, textSize: parseInt(e.target.value) })
          }
          className="w-full accent-amber-500 h-1 bg-white/10 rounded-lg cursor-pointer mb-2"
        />
        <div className="flex items-center gap-1.5">
          {SIZE_PRESETS.map((p) => (
            <button
              key={p.size}
              type="button"
              onClick={() => onChange({ ...config, textSize: p.size })}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer ${
                currentSize === p.size
                  ? "bg-amber-500/20 text-amber-200 border-amber-500/50"
                  : "bg-white/5 text-gray-400 border-white/5 hover:bg-white/10 hover:text-white"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Text Color & Custom Color Picker */}
      <div>
        <div className="flex items-center justify-between text-[11px] mb-1.5">
          <span className="text-gray-300 font-semibold flex items-center gap-1">
            <Palette className="w-3 h-3 text-emerald-400" />
            Text Color
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className="w-3.5 h-3.5 rounded-full border border-white/30"
              style={{ backgroundColor: currentColor }}
            />
            <span className="text-[10px] text-gray-400 font-mono">
              {currentColor}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => onChange({ ...config, textColor: c.hex })}
              title={c.name}
              className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                c.border
              } ${currentColor.toLowerCase() === c.hex.toLowerCase() ? "scale-115 ring-2 ring-amber-400" : "hover:scale-105"}`}
              style={{ backgroundColor: c.hex }}
            />
          ))}

          {/* Custom Color Input */}
          <label
            title="Custom Hex Color"
            className="h-7 px-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-white/10 flex items-center gap-1.5 cursor-pointer text-[10px] text-gray-300"
          >
            <input
              type="color"
              value={currentColor}
              onChange={(e) => onChange({ ...config, textColor: e.target.value })}
              className="w-4 h-4 bg-transparent border-0 cursor-pointer p-0"
            />
            <span>Custom</span>
          </label>
        </div>
      </div>

      {/* 4. Position & Alignment Controls */}
      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-white/5">
        {/* Vertical Position */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Vertical Position
          </label>
          <div className="flex rounded-xl bg-black/40 border border-white/10 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => onChange({ ...config, textPosition: "top" })}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                currentPosition === "top"
                  ? "bg-amber-500 text-black font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Top
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, textPosition: "center" })}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                currentPosition === "center"
                  ? "bg-amber-500 text-black font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Center ★
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, textPosition: "bottom" })}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                currentPosition === "bottom"
                  ? "bg-amber-500 text-black font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Bottom
            </button>
          </div>
        </div>

        {/* Horizontal Alignment */}
        <div>
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block mb-1">
            Text Alignment
          </label>
          <div className="flex rounded-xl bg-black/40 border border-white/10 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => onChange({ ...config, textAlign: "left" })}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                currentAlign === "left"
                  ? "bg-emerald-500 text-white font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <AlignLeft className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, textAlign: "center" })}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                currentAlign === "center"
                  ? "bg-emerald-500 text-white font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <AlignCenter className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...config, textAlign: "right" })}
              className={`flex-1 py-1 rounded-lg text-[10px] font-semibold flex items-center justify-center transition-all cursor-pointer ${
                currentAlign === "right"
                  ? "bg-emerald-500 text-white font-bold"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              <AlignRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
