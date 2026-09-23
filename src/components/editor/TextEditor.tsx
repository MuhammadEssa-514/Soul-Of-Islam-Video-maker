import React, { useState } from 'react';
import { Type, Loader2, AlertTriangle } from 'lucide-react';
import { extractText } from '@/lib/ocr/ocrService';

interface Props {
  image: string | null;
  text: string;
  onTextChange: (t: string) => void;
}

export default function TextEditor({ image, text, onTextChange }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const extract = async () => {
    if (!image) return;
    setLoading(true); setError(null);
    try {
      const t = await extractText(image);
      if (t.trim()) onTextChange(t);
      else setError('No text detected. Type it manually.');
    } catch { setError('Extraction failed. Type manually.'); }
    finally { setLoading(false); }
  };

  const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);

  return (
    <div className="space-y-3">
      <div className="bg-[#d97706]/10 border border-[#d97706]/20 p-3 rounded-xl flex gap-2 items-start">
        <AlertTriangle className="w-4 h-4 text-[#d97706] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400">OCR may have mistakes. Always review the text.</p>
      </div>

      <button onClick={extract} disabled={loading || !image} className="btn-secondary w-full flex items-center justify-center gap-2 py-2.5 text-sm">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Type className="w-4 h-4" />}
        {loading ? 'Extracting…' : 'Extract Text from Image'}
      </button>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Type or paste your verse / quote here…"
        dir={isRtl ? 'rtl' : 'ltr'}
        rows={4}
        className={`w-full p-3 bg-black/30 border border-white/10 rounded-xl text-gray-100 placeholder:text-gray-600 focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none text-base resize-y ${isRtl ? 'text-right' : 'text-left'}`}
      />
    </div>
  );
}
