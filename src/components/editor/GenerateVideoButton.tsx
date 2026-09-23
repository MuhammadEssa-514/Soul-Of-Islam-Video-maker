import React, { useState } from 'react';
import { Download, Loader2, AlertCircle, CheckCircle2, Film } from 'lucide-react';

export default function GenerateVideoButton({ payload }: { payload: any }) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setStatus('generating');
    setProgress(0);
    setError(null);
    setDownloadUrl(null);

    // Simulate progress while waiting for API
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) { clearInterval(progressInterval); return 90; }
        return prev + Math.random() * 8;
      });
    }, 1500);

    try {
      const res = await fetch('/api/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      clearInterval(progressInterval);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Rendering failed.');

      setProgress(100);
      setDownloadUrl(data.url);
      setStatus('done');
    } catch (err: any) {
      clearInterval(progressInterval);
      setError(err.message);
      setStatus('error');
    }
  };

  return (
    <div className="space-y-4 w-full">
      {/* Generate Button */}
      {status === 'idle' && (
        <button
          onClick={handleGenerate}
          disabled={!payload.imageUrl}
          className="w-full bg-gradient-to-r from-[#059669] to-[#047857] text-white px-6 py-4 rounded-2xl font-bold text-lg hover:from-[#047857] hover:to-[#065f46] transition-all focus:ring-2 focus:ring-[#d97706] focus:outline-none shadow-xl shadow-[#059669]/20 flex items-center justify-center gap-3 disabled:opacity-40"
        >
          <Film className="w-6 h-6" />
          Generate Video
        </button>
      )}

      {/* Generating */}
      {status === 'generating' && (
        <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-[#059669] animate-spin" />
            <div>
              <p className="font-semibold text-white">Generating your video…</p>
              <p className="text-xs text-gray-500">This may take 1–3 minutes depending on duration.</p>
            </div>
          </div>
          <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-[#059669] to-[#10b981] h-full rounded-full transition-all duration-1000" style={{ width: `${Math.min(progress, 100)}%` }} />
          </div>
          <p className="text-xs text-gray-500 text-right">{Math.round(progress)}%</p>
        </div>
      )}

      {/* Done */}
      {status === 'done' && downloadUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-[#059669]/10 border border-[#059669]/20 rounded-2xl p-4">
            <CheckCircle2 className="w-6 h-6 text-[#059669]" />
            <p className="font-semibold text-white">Video generated successfully!</p>
          </div>
          <a href={downloadUrl} download="soul-of-islam-video.mp4" className="w-full bg-gradient-to-r from-[#059669] to-[#047857] text-white px-6 py-4 rounded-2xl font-bold text-lg hover:from-[#047857] hover:to-[#065f46] transition-all shadow-xl shadow-[#059669]/20 flex items-center justify-center gap-3">
            <Download className="w-6 h-6" />
            Download MP4
          </a>
          <button onClick={() => setStatus('idle')} className="w-full btn-secondary py-3 text-sm">Generate Another</button>
        </div>
      )}

      {/* Error */}
      {status === 'error' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">Generation failed</p>
              <p className="text-sm text-gray-400 mt-1">{error}</p>
            </div>
          </div>
          <button onClick={() => setStatus('idle')} className="w-full btn-secondary py-3 text-sm">Try Again</button>
        </div>
      )}
    </div>
  );
}
