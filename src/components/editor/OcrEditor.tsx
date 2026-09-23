import React, { useState } from 'react';
import { Type, AlertTriangle, Loader2 } from 'lucide-react';
import { extractText } from '@/lib/ocr/ocrService';

interface OcrEditorProps {
  imageUrl: string | null;
  text: string;
  onTextChange: (text: string) => void;
}

export default function OcrEditor({ imageUrl, text, onTextChange }: OcrEditorProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtractText = async () => {
    if (!imageUrl) return;
    setIsExtracting(true);
    setError(null);
    try {
      const extractedText = await extractText(imageUrl);
      if (extractedText.trim()) {
        onTextChange(extractedText);
      } else {
        setError('No text detected. You can type it manually below.');
      }
    } catch {
      setError('Extraction failed. Please try again or type manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const isRtl = (str: string) => /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(str);
  const textDirection = isRtl(text) ? 'rtl' : 'ltr';

  if (!imageUrl) {
    return <p className="text-gray-600 text-center py-4 text-sm">Upload an image first.</p>;
  }

  return (
    <div className="w-full space-y-4">
      <div className="bg-[#d97706]/10 border border-[#d97706]/20 p-4 rounded-xl flex gap-3 items-start">
        <AlertTriangle className="w-5 h-5 text-[#d97706] flex-shrink-0 mt-0.5" />
        <p className="text-sm text-gray-300">
          OCR may contain mistakes with Quranic calligraphy. Always review the result carefully.
        </p>
      </div>

      <button
        onClick={handleExtractText}
        disabled={isExtracting}
        className="btn-secondary flex items-center gap-2 w-full justify-center py-3"
      >
        {isExtracting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Type className="w-5 h-5" />}
        {isExtracting ? 'Extracting…' : 'Extract Text from Image'}
      </button>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <textarea
        value={text}
        onChange={(e) => onTextChange(e.target.value)}
        placeholder="Extracted or manually typed text…"
        dir={textDirection}
        rows={5}
        className={`w-full p-4 bg-black/30 border border-white/10 rounded-xl text-gray-100 placeholder:text-gray-600 focus:ring-2 focus:ring-[#059669] focus:border-[#059669] outline-none text-lg resize-y ${
          textDirection === 'rtl' ? 'text-right' : 'text-left'
        }`}
      />
    </div>
  );
}
