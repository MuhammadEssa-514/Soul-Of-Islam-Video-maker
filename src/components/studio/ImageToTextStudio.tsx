import React, { useState, useRef } from 'react';
import {
  Upload,
  Type,
  Loader2,
  Copy,
  Check,
  ArrowRight,
  FileText,
  AlertCircle,
  X,
  Sparkles,
} from 'lucide-react';
import { extractText } from '@/lib/ocr/ocrService';

interface Props {
  onUseInVideo: (extractedText: string, imageSrc?: string) => void;
}

export default function ImageToTextStudio({ onUseInVideo }: Props) {
  const [image, setImage] = useState<string | null>(null);
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setError(null);
    const r = new FileReader();
    r.onload = (e) => {
      const src = e.target?.result as string;
      setImage(src);
      // Auto-extract immediately on upload!
      runOcr(src);
    };
    r.readAsDataURL(file);
  };

  const runOcr = async (src: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await extractText(src);
      if (result && result.trim()) {
        setText(result.trim());
      } else {
        setError('No text could be detected automatically. You can edit or type below.');
      }
    } catch (err: any) {
      setError('OCR extraction failed. You can type or paste the quote manually.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Box: Image Upload & Preview */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
            1. Source Image
          </label>

          {!image ? (
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-white/15 hover:border-[#059669] rounded-2xl p-6 text-center cursor-pointer transition-all bg-white/[0.01] hover:bg-white/[0.03] min-h-[220px] flex flex-col items-center justify-center"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center mb-2 text-emerald-400">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-white">Upload Quote or Verse Image</p>
              <p className="text-[11px] text-gray-500 mt-1">Arabic calligraphy, Quran verses, Hadith cards</p>
            </div>
          ) : (
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/40 p-2 min-h-[220px] flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image}
                alt="Source for OCR"
                className="max-h-[210px] w-auto object-contain rounded-xl"
              />
              <button
                type="button"
                onClick={() => {
                  setImage(null);
                  setText('');
                }}
                className="absolute top-3 right-3 p-1.5 rounded-lg bg-black/70 hover:bg-red-500 text-gray-300 hover:text-white transition-colors"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <input
            type="file"
            ref={fileRef}
            onChange={(e) => {
              if (e.target.files?.[0]) handleFile(e.target.files[0]);
            }}
            accept="image/*"
            className="hidden"
          />

          {image && (
            <button
              type="button"
              onClick={() => runOcr(image)}
              disabled={loading}
              className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 hover:text-white transition-colors flex items-center justify-center gap-1.5 border border-white/10"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400" />}
              {loading ? 'Scanning Calligraphy…' : 'Re-scan Image (OCR)'}
            </button>
          )}
        </div>

        {/* Right Box: Extracted Text Editor */}
        <div className="space-y-2 flex flex-col">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
              2. Extracted Calligraphy / Text
            </label>
            {text && (
              <button
                type="button"
                onClick={copyToClipboard}
                className="text-[11px] font-semibold text-[#10b981] hover:text-emerald-300 flex items-center gap-1"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            )}
          </div>

          <div className="relative flex-grow flex flex-col">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                loading
                  ? 'Analyzing calligraphy and converting to text…'
                  : 'Extracted text will appear here. You can also type or paste directly.'
              }
              dir={isRtl ? 'rtl' : 'ltr'}
              className="w-full flex-grow min-h-[180px] bg-black/30 border border-white/15 rounded-2xl p-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-[#059669] resize-none leading-relaxed font-sans"
            />
            {loading && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] rounded-2xl flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6 text-[#10b981] animate-spin" />
                <span className="text-xs text-emerald-300 font-semibold">Extracting calligraphy...</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 text-[11px] text-amber-300">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-1 flex gap-2">
            <button
              type="button"
              disabled={!text.trim()}
              onClick={() => onUseInVideo(text, image || undefined)}
              className="flex-1 bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065f46] disabled:opacity-40 text-white py-2.5 px-4 rounded-xl font-bold text-xs transition-all shadow-md shadow-[#059669]/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Create Video with This Text</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
