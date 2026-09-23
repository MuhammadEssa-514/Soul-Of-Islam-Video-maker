import React, { useState, useCallback } from 'react';
import { Film, Download, Loader2, AlertCircle, CheckCircle2, RefreshCw, Volume2 } from 'lucide-react';
import { StyleConfig } from './StylePicker';
import { WatermarkConfig } from './WatermarkPicker';

interface Props {
  images: string[];
  text: string;
  duration: number;
  audioUrl: string | null;
  styleConfig: StyleConfig;
  watermarkConfig: WatermarkConfig;
}

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  opacity: number;
  wobbleSpeed: number;
  wobbleAmp: number;
  phase: number;
}

export default function VideoGenerator({
  images,
  text,
  duration,
  audioUrl,
  styleConfig,
  watermarkConfig,
}: Props) {
  const [status, setStatus] = useState<'idle' | 'generating' | 'done' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasAudioAttached, setHasAudioAttached] = useState(false);
  const [fileSizeMb, setFileSizeMb] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!images || images.length === 0) return;
    setStatus('generating');
    setProgress(0);
    setError(null);
    setDownloadUrl(null);
    setHasAudioAttached(false);

    // 1. Immediately create & resume AudioContext synchronously in gesture context
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    try {
      // 2. Load all images and watermark image in parallel
      const imgPromises = images.map((src) => loadImage(src));
      const watermarkImgPromise =
        watermarkConfig.enabled && watermarkConfig.type === 'image' && watermarkConfig.imageUrl
          ? loadImage(watermarkConfig.imageUrl)
          : Promise.resolve(null);

      let bgVideoElem: HTMLVideoElement | null = null;
      if (styleConfig.customVideoUrl) {
        bgVideoElem = document.createElement('video');
        bgVideoElem.crossOrigin = 'anonymous';
        bgVideoElem.muted = true;
        bgVideoElem.src = styleConfig.customVideoUrl;
        await new Promise<void>((resolve) => {
          if (!bgVideoElem) return resolve();
          bgVideoElem.onloadeddata = () => resolve();
          bgVideoElem.onerror = () => resolve();
          setTimeout(resolve, 3000);
        });
      }

      const [loadedImgs, watermarkImg] = await Promise.all([
        Promise.all(imgPromises),
        watermarkImgPromise,
      ]);

      // 3. Canvas setup — 1080x1920 (9:16 vertical reels/TikTok format)
      const W = 1080;
      const H = 1920;
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d', { alpha: false })!;

      const fps = 30;
      const totalFrames = Math.max(1, Math.floor(duration * fps));

      // 4. Setup Audio Destination & Pipeline
      let audioSource: AudioBufferSourceNode | null = null;
      let audioDest: MediaStreamAudioDestinationNode | null = null;
      let audioConnected = false;

      if (audioUrl) {
        try {
          audioDest = audioCtx.createMediaStreamDestination();

          let audioBuffer: AudioBuffer;
          if (audioUrl.startsWith('data:')) {
            const base64 = audioUrl.split(',')[1];
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
              bytes[i] = binary.charCodeAt(i);
            }
            audioBuffer = await audioCtx.decodeAudioData(bytes.buffer);
          } else {
            const resp = await fetch(audioUrl);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const arrayBuf = await resp.arrayBuffer();
            audioBuffer = await audioCtx.decodeAudioData(arrayBuf);
          }

          audioSource = audioCtx.createBufferSource();
          audioSource.buffer = audioBuffer;
          audioSource.loop = true;

          const gainNode = audioCtx.createGain();
          gainNode.gain.value = 1.0;
          audioSource.connect(gainNode);
          gainNode.connect(audioDest);

          audioConnected = true;
          setHasAudioAttached(true);
        } catch (audioErr) {
          console.warn('Audio initialization warning:', audioErr);
        }
      }

      // 5. Create combined MediaStream with Video AND Audio tracks
      const canvasStream = canvas.captureStream(fps);
      const mediaTracks: MediaStreamTrack[] = [...canvasStream.getVideoTracks()];

      if (audioDest && audioConnected) {
        const audioTracks = audioDest.stream.getAudioTracks();
        if (audioTracks.length > 0) {
          mediaTracks.push(audioTracks[0]);
        }
      }

      const combinedStream = new MediaStream(mediaTracks);

      // 6. Select MIME type that reliably preserves Opus audio track
      const mimeCandidates = [
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm;codecs=h264,opus',
        'video/webm',
      ];
      const selectedMime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'video/webm';

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 6_500_000,
        audioBitsPerSecond: 192_000,
      });

      const chunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      const recordingPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: selectedMime }));
        };
      });

      // Start audio FIRST, then start recorder
      if (audioSource) {
        try {
          audioSource.start(0);
        } catch (e) {
          console.warn('Audio start error:', e);
        }
      }
      recorder.start(1000);

      // 7. Setup Particles
      const particles: Particle[] = [];
      for (let p = 0; p < 65; p++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          radius: Math.random() * 4.5 + 1.8,
          speed: Math.random() * 1.5 + 0.6,
          opacity: Math.random() * 0.75 + 0.25,
          wobbleSpeed: Math.random() * 0.05 + 0.02,
          wobbleAmp: Math.random() * 32 + 10,
          phase: Math.random() * Math.PI * 2,
        });
      }

      const N = loadedImgs.length;
      const segmentDur = duration / N;
      const crossfadeWindow = Math.min(1.2, segmentDur * 0.25);
      const frameDelay = 1000 / fps;

      // 7b. Pre-load all Google Fonts into canvas before rendering
      // Canvas ONLY uses fonts loaded via document.fonts.load()
      try {
        await Promise.all([
          document.fonts.load('700 52px "Amiri"'),
          document.fonts.load('700 52px "Scheherazade New"'),
          document.fonts.load('600 52px "Playfair Display"'),
          document.fonts.load('900 52px "Montserrat"'),
          document.fonts.ready,
        ]);
      } catch {
        // Non-fatal — continue with fallback fonts
      }

      // 8. Frame Render Loop
      for (let frame = 0; frame < totalFrames; frame++) {
        const timeSec = (frame / totalFrames) * duration;
        const t = frame / totalFrames;

        // 1. Base Dark Backdrop
        ctx.fillStyle = '#060a10';
        ctx.fillRect(0, 0, W, H);

        const hasImages = loadedImgs.length > 0;

        // 2. Custom Video Backdrop (Method 2)
        if (bgVideoElem && bgVideoElem.readyState >= 2) {
          bgVideoElem.currentTime = timeSec % (bgVideoElem.duration || 10);
          const scale = Math.max(W / bgVideoElem.videoWidth, H / bgVideoElem.videoHeight);
          const vW = bgVideoElem.videoWidth * scale;
          const vH = bgVideoElem.videoHeight * scale;
          const vX = (W - vW) / 2;
          const vY = (H - vH) / 2;
          ctx.save();
          applyVideoFilter(ctx, styleConfig.colorFilter);
          ctx.drawImage(bgVideoElem, vX, vY, vW, vH);
          ctx.restore();
        } else if (!hasImages || styleConfig.imageFit === 'fit') {
          // 3. Nature Motion Background if no custom video & (no images or images fitted)
          renderNatureBackdrop1080(ctx, W, H, styleConfig.videoStyle, t, frame);
        }

        // 4. Foreground Images (Multi-image crossfade)
        if (hasImages) {
          const currentIdx = Math.min(N - 1, Math.floor(timeSec / segmentDur));
          const nextIdx = (currentIdx + 1) % N;
          const segLocalSec = timeSec - currentIdx * segmentDur;
          const timeUntilEnd = segmentDur - segLocalSec;
          const isTransitioning = N > 1 && timeUntilEnd < crossfadeWindow;
          const transitionAlpha = isTransitioning ? 1 - timeUntilEnd / crossfadeWindow : 0;

          renderSingleImage(ctx, loadedImgs[currentIdx], W, H, t, frame, styleConfig, 1.0);

          if (isTransitioning && loadedImgs[nextIdx]) {
            renderSingleImage(ctx, loadedImgs[nextIdx], W, H, t, frame, styleConfig, transitionAlpha);
          }
        }

        // 5. Cinematic Backdrop Dimming (Text Contrast Control)
        const dimAlpha = styleConfig.backdropDim ?? 0.38;
        if (dimAlpha > 0) {
          ctx.fillStyle = `rgba(0, 0, 0, ${dimAlpha})`;
          ctx.fillRect(0, 0, W, H);
        }

        // 6. Cinematic Vignette
        const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.35, W / 2, H / 2, W * 0.9);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.65)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);

        // 7. Particle / Nature Atmospheric Effects
        renderParticleEffect(ctx, W, H, styleConfig.videoStyle, t, frame, particles);

        // 8. Sacred Arabesque Gold Border Frame
        if (styleConfig.showSacredFrame !== false) {
          renderSacredFrame1080(ctx, W, H);
        }

        // 9. Sacred Floating Surah Citation Badge
        if (styleConfig.showSurahBadge !== false && styleConfig.surahBadgeText) {
          renderSurahBadge1080(ctx, styleConfig.surahBadgeText, W, H);
        }

        // 10. Multi-Directional Kinetic Text Animation
        if (text) {
          renderKineticText(ctx, text, W, H, t, frame, styleConfig.textAnimation, styleConfig);
        }

        // 11. Live Dancing TikTok Audio Equalizer Bars
        if (styleConfig.showAudioVisualizer !== false) {
          renderAudioVisualizer1080(ctx, W, H, t, frame);
        }

        // 12. Watermark
        if (watermarkConfig.enabled) {
          renderWatermark(ctx, W, H, watermarkConfig, watermarkImg);
        }

        setProgress(Math.round((frame / totalFrames) * 100));

        await new Promise((resolve) => setTimeout(resolve, frameDelay));
      }

      // 9. Stop recording & finalize
      recorder.stop();
      if (audioSource) {
        try {
          audioSource.stop();
        } catch {}
      }
      try {
        await audioCtx.close();
      } catch {}

      const finalBlob = await recordingPromise;
      const sizeMb = (finalBlob.size / (1024 * 1024)).toFixed(1);
      setFileSizeMb(sizeMb);

      const objectUrl = URL.createObjectURL(finalBlob);
      setDownloadUrl(objectUrl);
      setProgress(100);
      setStatus('done');
    } catch (err: any) {
      console.error('Video generation error:', err);
      try {
        await audioCtx.close();
      } catch {}
      setError(err?.message || 'An error occurred during video generation.');
      setStatus('error');
    }
  }, [images, text, duration, audioUrl, styleConfig, watermarkConfig]);

  if (status === 'generating') {
    return (
      <div className="space-y-4 p-5 rounded-2xl bg-white/[0.03] border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#059669]/20 flex items-center justify-center flex-shrink-0">
            <Loader2 className="w-5 h-5 text-[#10b981] animate-spin" />
          </div>
          <div>
            <p className="font-bold text-white text-base">Rendering Studio Video…</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Encoding 1080×1920 (9:16) with {images.length} slide{images.length > 1 ? 's' : ''} & audio. Keep this tab open.
            </p>
          </div>
        </div>

        <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className="bg-gradient-to-r from-[#059669] via-[#10b981] to-[#d97706] h-full rounded-full transition-all duration-300 shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="flex justify-between items-center text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#10b981]" />
            {hasAudioAttached ? 'Audio Track Recording Active' : 'Rendering Frames...'}
          </span>
          <span className="font-bold text-[#10b981] text-sm">{progress}%</span>
        </div>
      </div>
    );
  }

  if (status === 'done' && downloadUrl) {
    return (
      <div className="space-y-4 p-5 rounded-2xl bg-white/[0.03] border border-emerald-500/30 shadow-xl">
        <div className="flex items-center gap-2 text-[#10b981] text-sm font-semibold mb-1">
          <CheckCircle2 className="w-4 h-4" />
          <span>Video Successfully Generated!</span>
          {hasAudioAttached && (
            <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full ml-auto flex items-center gap-1 font-bold">
              <Volume2 className="w-3 h-3" /> Music Included
            </span>
          )}
        </div>

        {/* Video Player Preview */}
        <div className="rounded-xl overflow-hidden border border-white/15 bg-black max-w-[280px] mx-auto aspect-[9/16] shadow-2xl relative">
          <video
            src={downloadUrl}
            controls
            autoPlay
            loop
            playsInline
            className="w-full h-full object-contain"
          />
        </div>

        <div className="text-center text-xs text-gray-400">
          Size: {fileSizeMb} MB • 1080×1920 (9:16) • {images.length} Image{images.length > 1 ? 's' : ''} • Ready for TikTok, Reels & Shorts
        </div>

        {/* Primary Download Button */}
        <a
          href={downloadUrl}
          download={`soul-of-islam-${Date.now()}.webm`}
          className="w-full bg-gradient-to-r from-[#059669] to-[#047857] hover:from-[#047857] hover:to-[#065f46] text-white px-6 py-4 rounded-xl font-bold text-base transition-all shadow-xl shadow-[#059669]/25 flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" /> Download Video (With Music)
        </a>

        {/* MP4 filename download */}
        <a
          href={downloadUrl}
          download={`soul-of-islam-${Date.now()}.mp4`}
          className="w-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white px-4 py-2.5 rounded-xl font-medium text-xs transition-colors flex items-center justify-center gap-1.5 border border-white/10"
        >
          <Download className="w-3.5 h-3.5" /> Download as .MP4 file
        </a>

        <button
          type="button"
          onClick={() => {
            setStatus('idle');
            setDownloadUrl(null);
          }}
          className="w-full py-2.5 text-xs text-gray-400 hover:text-white bg-transparent hover:bg-white/5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Create Another Video
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="space-y-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-bold text-red-300">Generation Failed</h4>
            <p className="text-xs text-gray-300 mt-1">{error}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="w-full bg-white/10 hover:bg-white/20 text-white py-2 rounded-lg text-xs font-semibold transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={generate}
      disabled={(!images || images.length === 0) && !text && !styleConfig.customVideoUrl}
      className="w-full bg-gradient-to-r from-[#059669] via-[#047857] to-[#d97706] hover:opacity-95 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all focus:ring-2 focus:ring-[#d97706] focus:outline-none shadow-xl shadow-[#059669]/25 flex items-center justify-center gap-3 disabled:opacity-40 cursor-pointer"
    >
      <Film className="w-6 h-6" />
      {images && images.length > 0
        ? `Generate Studio Reel (${images.length} Image${images.length > 1 ? 's' : ''})`
        : styleConfig.customVideoUrl
        ? 'Generate Studio Reel (Video Loop)'
        : 'Generate Studio Reel (Nature Backdrop)'}
    </button>
  );
}

// ==========================================
// RENDERERS & ANIMATION LOGIC
// ==========================================

function renderSingleImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number,
  t: number,
  frame: number,
  styleConfig: StyleConfig,
  alpha: number
) {
  if (!img) return;

  ctx.save();
  ctx.globalAlpha = alpha;

  let scale = 1.0;
  let offsetX = 0;
  let offsetY = 0;

  switch (styleConfig.videoStyle) {
    case 'ken-burns':
      scale = 1.0 + t * 0.18;
      offsetX = (t - 0.5) * 40;
      offsetY = (t - 0.5) * 30;
      break;
    case 'sacred-breathe':
      scale = 1.04 + Math.sin(t * Math.PI * 4) * 0.04;
      break;
    case 'reel-vintage':
      scale = 1.08;
      offsetX = Math.sin(frame * 0.2) * 2;
      offsetY = Math.cos(frame * 0.15) * 2;
      break;
    case 'golden-dust':
    case 'celestial-stars':
    case 'heavenly-rays':
    case 'emerald-embers':
    case 'light-leak-aura':
    default:
      scale = 1.0 + t * 0.1;
      break;
  }

  // 1. Color Filter
  switch (styleConfig.colorFilter) {
    case 'moody-grey':
      ctx.filter = 'grayscale(100%) contrast(120%) brightness(0.85)';
      break;
    case 'midnight-dark':
      ctx.filter = 'brightness(0.55) contrast(135%) saturate(80%)';
      break;
    case 'vintage-parchment':
      ctx.filter = 'sepia(75%) contrast(110%) brightness(0.88)';
      break;
    case 'emerald-twilight':
      ctx.filter = 'hue-rotate(65deg) contrast(115%) brightness(0.82)';
      break;
    case 'original':
    default:
      ctx.filter = 'none';
      break;
  }

  // 2. Full Height & Width Preservation
  if (styleConfig.imageFit === 'fit') {
    const bgScale = Math.max(W / img.width, H / img.height) * 1.08;
    const bgW = img.width * bgScale;
    const bgH = img.height * bgScale;
    const bgX = (W - bgW) / 2;
    const bgY = (H - bgH) / 2;

    ctx.save();
    ctx.filter = `${ctx.filter} blur(28px) brightness(0.4)`;
    ctx.drawImage(img, bgX, bgY, bgW, bgH);
    ctx.restore();

    const targetScale = Math.min((W - 70) / img.width, (H - 240) / img.height) * scale;
    const fgW = img.width * targetScale;
    const fgH = img.height * targetScale;
    const fgX = (W - fgW) / 2 + offsetX;
    const fgY = (H - fgH) / 2 + offsetY;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 40;
    ctx.shadowOffsetY = 12;
    ctx.drawImage(img, fgX, fgY, fgW, fgH);
    ctx.restore();
  } else {
    const coverScale = Math.max(W / img.width, H / img.height) * scale;
    const drawW = img.width * coverScale;
    const drawH = img.height * coverScale;
    const drawX = (W - drawW) / 2 + offsetX;
    const drawY = (H - drawH) / 2 + offsetY;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  ctx.restore();
}

function renderParticleEffect(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  style: string,
  t: number,
  frame: number,
  particles: Particle[]
) {
  // 1. Rolling Ocean Sea Waves
  if (style === 'ocean-waves') {
    ctx.save();
    const horizonY = H * 0.52;

    // Multi-layered rolling ocean sea waves
    for (let wave = 0; wave < 4; wave++) {
      ctx.beginPath();
      const waveBaseY = horizonY + wave * (H * 0.13);
      ctx.moveTo(0, H);
      ctx.lineTo(0, waveBaseY);

      for (let x = 0; x <= W; x += 25) {
        const waveH = 16 + wave * 14;
        const speed = (wave + 1) * 0.04;
        const freq = 0.004 - wave * 0.0005;
        const y =
          waveBaseY +
          Math.sin(x * freq + frame * speed) * waveH +
          Math.cos(x * 0.002 + frame * speed * 0.5) * (waveH * 0.4);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, waveBaseY - 30, 0, H);
      if (wave === 0) {
        waveGrad.addColorStop(0, 'rgba(8, 48, 68, 0.85)');
        waveGrad.addColorStop(1, 'rgba(3, 20, 32, 0.95)');
      } else if (wave === 1) {
        waveGrad.addColorStop(0, 'rgba(6, 78, 99, 0.8)');
        waveGrad.addColorStop(1, 'rgba(2, 40, 58, 0.9)');
      } else if (wave === 2) {
        waveGrad.addColorStop(0, 'rgba(13, 110, 130, 0.75)');
        waveGrad.addColorStop(1, 'rgba(4, 55, 75, 0.9)');
      } else {
        waveGrad.addColorStop(0, 'rgba(20, 140, 155, 0.7)');
        waveGrad.addColorStop(1, 'rgba(4, 60, 80, 0.95)');
      }
      ctx.fillStyle = waveGrad;
      ctx.fill();

      // Translucent foam crest
      ctx.strokeStyle = `rgba(220, 252, 231, ${0.35 + wave * 0.1})`;
      ctx.lineWidth = 4;
      ctx.stroke();
    }

    // Shimmering water light reflections
    for (let s = 0; s < 22; s++) {
      const sx = (s * 55 + Math.sin(frame * 0.05 + s) * 70) % W;
      const sy = horizonY + 50 + (s * 45) % (H * 0.4);
      const sw = 36 + Math.sin(frame * 0.1 + s) * 25;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.fillRect(sx, sy, Math.max(10, sw), 4);
    }
    ctx.restore();
  }

  // 2. Rising Sun Dawn
  if (style === 'rising-sun') {
    ctx.save();
    const horizonY = H * 0.65;
    const sunY = horizonY - t * (H * 0.28) + 40;
    const sunX = W / 2;
    const sunRadius = 90;

    // Expanding morning sky warm radial wash
    const skyWash = ctx.createRadialGradient(sunX, sunY, 20, sunX, sunY, W * 0.9);
    skyWash.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
    skyWash.addColorStop(0.3, 'rgba(245, 158, 11, 0.2)');
    skyWash.addColorStop(0.7, 'rgba(225, 29, 72, 0.1)');
    skyWash.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = skyWash;
    ctx.fillRect(0, 0, W, H);

    // Radiant sunbeams streaming from the rising sun
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI + Math.sin(frame * 0.01) * 0.08;
      const rayLen = W * 0.85;
      const rx = sunX + Math.cos(angle - Math.PI) * rayLen;
      const ry = sunY + Math.sin(angle - Math.PI) * rayLen;

      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(rx - 60, ry);
      ctx.lineTo(rx + 60, ry);
      ctx.closePath();
      const rayAlpha = 0.08 + Math.sin(frame * 0.03 + r) * 0.04;
      ctx.fillStyle = `rgba(254, 240, 138, ${rayAlpha})`;
      ctx.fill();
    }

    // Glowing Golden Sun Orb
    const sunGlow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunRadius * 2.2);
    sunGlow.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    sunGlow.addColorStop(0.4, 'rgba(251, 191, 36, 0.85)');
    sunGlow.addColorStop(0.8, 'rgba(245, 158, 11, 0.3)');
    sunGlow.addColorStop(1, 'rgba(245, 158, 11, 0)');
    ctx.fillStyle = sunGlow;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunRadius * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Mountain/horizon silhouette
    ctx.fillStyle = 'rgba(5, 5, 10, 0.75)';
    ctx.beginPath();
    ctx.moveTo(0, H);
    ctx.lineTo(0, horizonY + 20);
    ctx.quadraticCurveTo(W * 0.3, horizonY - 50, W * 0.5, horizonY + 10);
    ctx.quadraticCurveTo(W * 0.75, horizonY - 40, W, horizonY + 30);
    ctx.lineTo(W, H);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // 3. Swaying Trees & Healing Leaves
  if (style === 'tree-leaves') {
    ctx.save();
    // Leafy canopy branches framing top corners
    ctx.fillStyle = 'rgba(10, 25, 15, 0.65)';
    ctx.beginPath();
    ctx.arc(-40, -40, 280, 0, Math.PI * 2);
    ctx.arc(140, 40, 200, 0, Math.PI * 2);
    ctx.arc(300, 0, 140, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(W + 40, -40, 280, 0, Math.PI * 2);
    ctx.arc(W - 140, 40, 200, 0, Math.PI * 2);
    ctx.arc(W - 300, 0, 140, 0, Math.PI * 2);
    ctx.fill();

    // Fluttering leaves drifting in breeze
    for (let l = 0; l < 32; l++) {
      const speed = 1.0 + (l % 4) * 0.4;
      const curY = (l * 75 + frame * speed) % (H + 80) - 40;
      const wobbleX = (l * 78 + Math.sin(frame * 0.04 + l) * 70) % W;
      const angle = Math.sin(frame * 0.05 + l * 0.7) * 0.8 + 0.3;
      const leafSize = 22 + (l % 3) * 10;

      ctx.save();
      ctx.translate(wobbleX, curY);
      ctx.rotate(angle);

      const isGolden = l % 3 === 0;
      ctx.fillStyle = isGolden ? 'rgba(251, 191, 36, 0.75)' : 'rgba(52, 211, 153, 0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 0, leafSize, leafSize * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isGolden ? 'rgba(217, 119, 6, 0.9)' : 'rgba(5, 150, 105, 0.8)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-leafSize, 0);
      ctx.lineTo(leafSize, 0);
      ctx.stroke();

      ctx.restore();
    }

    // Gentle sunbeam filtering through canopy
    const sunFilter = ctx.createLinearGradient(0, 0, W, H * 0.7);
    sunFilter.addColorStop(0, 'rgba(251, 191, 36, 0.12)');
    sunFilter.addColorStop(0.5, 'rgba(52, 211, 153, 0.05)');
    sunFilter.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = sunFilter;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 4. Golden Desert Dunes & Sand Mist
  if (style === 'desert-dunes') {
    ctx.save();
    const horizonY = H * 0.55;
    for (let d = 0; d < 3; d++) {
      ctx.beginPath();
      const duneBase = horizonY + d * (H * 0.14);
      ctx.moveTo(0, H);
      ctx.lineTo(0, duneBase);
      for (let x = 0; x <= W; x += 30) {
        const y = duneBase + Math.sin(x * 0.003 + d * 1.5) * (36 + d * 20);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      const duneGrad = ctx.createLinearGradient(0, duneBase - 40, 0, H);
      if (d === 0) {
        duneGrad.addColorStop(0, 'rgba(180, 83, 9, 0.85)');
        duneGrad.addColorStop(1, 'rgba(69, 26, 3, 0.95)');
      } else if (d === 1) {
        duneGrad.addColorStop(0, 'rgba(217, 119, 6, 0.8)');
        duneGrad.addColorStop(1, 'rgba(120, 53, 15, 0.9)');
      } else {
        duneGrad.addColorStop(0, 'rgba(245, 158, 11, 0.75)');
        duneGrad.addColorStop(1, 'rgba(146, 64, 14, 0.95)');
      }
      ctx.fillStyle = duneGrad;
      ctx.fill();
    }
    // Drifting golden sand grains
    for (let s = 0; s < 45; s++) {
      const sx = (s * 45 + frame * (3.5 + (s % 3))) % (W + 40) - 20;
      const sy = horizonY + (s * 32) % (H * 0.42);
      ctx.fillStyle = `rgba(253, 230, 138, ${0.4 + (s % 4) * 0.15})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 2.2 + (s % 2) * 1.2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Serene Rain on Sacred Glass
  if (style === 'sacred-rain') {
    ctx.save();
    // Rain streaks
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)';
    ctx.lineWidth = 2;
    for (let r = 0; r < 50; r++) {
      const rx = (r * 35 + (r % 5) * 14) % W;
      const ry = (r * 55 + frame * (12 + (r % 4) * 4)) % (H + 60) - 30;
      const len = 32 + (r % 3) * 20;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 5, ry + len);
      ctx.stroke();
    }
    // Trickling glass beads
    for (let b = 0; b < 8; b++) {
      const bx = (b * 160 + 60) % (W - 80);
      const by = (frame * (1.2 + b * 0.3) + b * 240) % (H * 0.8) + H * 0.1;
      const dropGlow = ctx.createRadialGradient(bx, by, 0, bx, by, 12);
      dropGlow.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      dropGlow.addColorStop(0.6, 'rgba(147, 197, 253, 0.4)');
      dropGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = dropGlow;
      ctx.beginPath();
      ctx.arc(bx, by, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 6. Divine Golden Dust
  if (style === 'golden-dust') {
    ctx.save();
    for (const p of particles) {
      const curY = (p.y - frame * p.speed) % H;
      const drawYPos = curY < 0 ? curY + H : curY;
      const wobbleX = p.x + Math.sin(frame * p.wobbleSpeed + p.phase) * p.wobbleAmp;

      const glow = ctx.createRadialGradient(wobbleX, drawYPos, 0, wobbleX, drawYPos, p.radius * 3.5);
      glow.addColorStop(0, `rgba(251, 191, 36, ${p.opacity})`);
      glow.addColorStop(0.4, `rgba(217, 119, 6, ${p.opacity * 0.5})`);
      glow.addColorStop(1, 'rgba(217, 119, 6, 0)');

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(wobbleX, drawYPos, p.radius * 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * 0.9})`;
      ctx.beginPath();
      ctx.arc(wobbleX, drawYPos, p.radius * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 2. Celestial Noor & Twinkling Stars
  if (style === 'celestial-stars') {
    ctx.save();
    for (const p of particles) {
      const curY = (p.y + frame * (p.speed * 0.5)) % H;
      const drawYPos = curY;
      const wobbleX = p.x + Math.sin(frame * 0.03 + p.phase) * 15;
      const twinkle = 0.3 + Math.abs(Math.sin(frame * 0.08 + p.phase)) * 0.7;

      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * twinkle})`;
      const r = p.radius * 2.2;

      ctx.beginPath();
      ctx.moveTo(wobbleX, drawYPos - r * 2.5);
      ctx.lineTo(wobbleX + r * 0.6, drawYPos);
      ctx.lineTo(wobbleX, drawYPos + r * 2.5);
      ctx.lineTo(wobbleX - r * 0.6, drawYPos);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(wobbleX - r * 2.5, drawYPos);
      ctx.lineTo(wobbleX, drawYPos + r * 0.6);
      ctx.lineTo(wobbleX + r * 2.5, drawYPos);
      ctx.lineTo(wobbleX - r * 0.6, drawYPos);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  // 3. Heavenly God Rays
  if (style === 'heavenly-rays') {
    ctx.save();
    const rayAngle = -0.35;
    ctx.translate(W * 0.2, 0);
    ctx.rotate(rayAngle);

    for (let r = 0; r < 5; r++) {
      const rayWidth = 80 + r * 40;
      const rayX = r * 180 + Math.sin(frame * 0.02 + r) * 35;
      const rayAlpha = 0.08 + Math.sin(frame * 0.03 + r * 1.5) * 0.04;

      const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + rayWidth, H * 1.4);
      rayGrad.addColorStop(0, `rgba(251, 191, 36, ${rayAlpha * 1.8})`);
      rayGrad.addColorStop(0.5, `rgba(255, 255, 255, ${rayAlpha})`);
      rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = rayGrad;
      ctx.fillRect(rayX, -150, rayWidth, H * 1.6);
    }
    ctx.restore();
  }

  // 4. Sacred Emerald Embers
  if (style === 'emerald-embers') {
    ctx.save();
    for (const p of particles) {
      const curY = (p.y - frame * (p.speed * 1.3)) % H;
      const drawYPos = curY < 0 ? curY + H : curY;
      const wobbleX = p.x + Math.sin(frame * p.wobbleSpeed + p.phase) * p.wobbleAmp;

      const isGreen = p.radius > 2.8;
      const glow = ctx.createRadialGradient(wobbleX, drawYPos, 0, wobbleX, drawYPos, p.radius * 4);
      if (isGreen) {
        glow.addColorStop(0, `rgba(16, 185, 129, ${p.opacity})`);
        glow.addColorStop(0.5, `rgba(5, 150, 105, ${p.opacity * 0.5})`);
      } else {
        glow.addColorStop(0, `rgba(251, 191, 36, ${p.opacity})`);
        glow.addColorStop(0.5, `rgba(217, 119, 6, ${p.opacity * 0.5})`);
      }
      glow.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(wobbleX, drawYPos, p.radius * 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Warm Light Leak Aura
  if (style === 'light-leak-aura') {
    ctx.save();
    const leakX = W * 0.3 + Math.sin(frame * 0.02) * W * 0.25;
    const leakY = H * 0.2 + Math.cos(frame * 0.015) * H * 0.15;
    const leakGrad = ctx.createRadialGradient(leakX, leakY, 20, leakX, leakY, 600);
    leakGrad.addColorStop(0, 'rgba(251, 191, 36, 0.25)');
    leakGrad.addColorStop(0.4, 'rgba(244, 63, 94, 0.12)');
    leakGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = leakGrad;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 6. Spiritual Halo Pulse
  if (style === 'sacred-breathe') {
    ctx.save();
    const pulseIntensity = 0.16 + Math.sin(t * Math.PI * 4) * 0.08;
    const aura = ctx.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, 500);
    aura.addColorStop(0, `rgba(217, 119, 6, ${pulseIntensity})`);
    aura.addColorStop(0.5, `rgba(5, 150, 105, ${pulseIntensity * 0.5})`);
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 7. Reel Vintage Grain
  if (style === 'reel-vintage') {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (let g = 0; g < 400; g++) {
      ctx.fillRect(Math.random() * W, Math.random() * H, Math.random() * 3 + 1, Math.random() * 3 + 1);
    }
    ctx.restore();
  }
}

// Font family → CSS font-family string mapping
function getFontStack(fontFamily?: string): string {
  switch (fontFamily) {
    case 'amiri':        return '"Amiri", "Scheherazade New", serif';
    case 'scheherazade': return '"Scheherazade New", "Amiri", serif';
    case 'playfair':     return '"Playfair Display", Georgia, serif';
    case 'montserrat':   return '"Montserrat", Arial, sans-serif';
    case 'sans':         return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    default:             return '"Amiri", "Scheherazade New", serif';
  }
}

// Kinetic Multi-Directional Text Animation Renderer
function renderKineticText(
  ctx: CanvasRenderingContext2D,
  text: string,
  W: number,
  H: number,
  t: number,
  frame: number,
  animation: string,
  styleConfig?: StyleConfig
) {
  ctx.save();
  const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);

  // --- Typography from StyleConfig (scale from 540->1080 preview to 1080 export = x2) ---
  const previewFontSize = styleConfig?.textSize ?? 26;
  const fontSize = Math.round(previewFontSize * 2); // scale up for 1080p
  const lineHeight = Math.round(fontSize * 1.55);
  const textColor = styleConfig?.textColor ?? '#ffffff';
  const fontStack = getFontStack(styleConfig?.fontFamily);
  const fontWeight = styleConfig?.fontFamily === 'montserrat' ? '900' : '700';
  const textAlignPref = styleConfig?.textAlign ?? 'center';
  const textPosition = styleConfig?.textPosition ?? 'center';

  const canvasAlign = isRtl ? 'right' : (textAlignPref as CanvasTextAlign);
  ctx.textAlign = canvasAlign;
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.font = `${fontWeight} ${fontSize}px ${fontStack}`;

  const lines = wrapText(ctx, text, W - 180, fontSize);
  const totalTextH = lines.length * lineHeight;

  // Vertical position
  let startY: number;
  if (textPosition === 'top') {
    startY = 160;
  } else if (textPosition === 'bottom') {
    startY = H - totalTextH - 160;
  } else {
    startY = (H - totalTextH) / 2 + Math.round(fontSize * 0.4);
  }

  // X position based on alignment
  const getX = () => {
    if (isRtl) return W - 90;
    if (canvasAlign === 'left') return 90;
    if (canvasAlign === 'right') return W - 90;
    return W / 2;
  };

  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 14;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 4;

  // 1. Converge (Left & Right Alternating Slide)
  if (animation === 'converge') {
    for (let i = 0; i < lines.length; i++) {
      const lineProgress = Math.min(1, Math.max(0, (t * 1.5 - i * 0.12) / 0.3));
      const ease = 1 - Math.pow(1 - lineProgress, 3);
      const isFromLeft = i % 2 === 0;
      const targetX = getX();
      const startX = isFromLeft ? targetX - 320 : targetX + 320;
      const curX = startX + (targetX - startX) * ease;

      ctx.globalAlpha = lineProgress;
      ctx.fillStyle = textColor;
      if (lineProgress > 0) {
        ctx.fillText(lines[i], curX, startY + i * lineHeight);
      }
    }
  }

  // 2. Cascade (Heavenly Descend from Top)
  else if (animation === 'cascade') {
    for (let i = 0; i < lines.length; i++) {
      const lineProgress = Math.min(1, Math.max(0, (t * 1.5 - i * 0.14) / 0.32));
      const ease = 1 - Math.pow(1 - lineProgress, 3);
      const targetY = startY + i * lineHeight;
      const curY = targetY - 120 * (1 - ease);

      ctx.globalAlpha = lineProgress;
      ctx.fillStyle = textColor;
      if (lineProgress > 0) {
        ctx.fillText(lines[i], getX(), curY);
      }
    }
  }

  // 3. Kinetic Word Pop
  else if (animation === 'pop-kinetic') {
    const allWords = text.replace(/\n/g, ' ').split(' ').filter(Boolean);
    const totalWords = allWords.length;
    const activeWordIdx = Math.floor(t * 1.4 * totalWords);

    let wordIdx = 0;
    for (let i = 0; i < lines.length; i++) {
      const lineWords = lines[i].split(' ');
      const y = startY + i * lineHeight;

      const lineStartWord = wordIdx;
      const lineEndWord = wordIdx + lineWords.length;
      wordIdx = lineEndWord;

      if (activeWordIdx >= lineStartWord) {
        const visibleLine = lineWords
          .slice(0, Math.max(0, activeWordIdx - lineStartWord + 1))
          .join(' ');

        ctx.fillStyle = textColor;
        ctx.fillText(visibleLine, getX(), y);

        if (activeWordIdx >= lineStartWord && activeWordIdx < lineEndWord) {
          ctx.shadowColor = '#d97706';
          ctx.shadowBlur = 20;
        }
      }
    }
  }

  // 4. Classic Typewriter with Gold Cursor
  else if (animation === 'typewriter') {
    const charsToShow = Math.floor(t * 1.5 * text.length);
    let charCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineStart = charCount;
      const lineEnd = charCount + line.length;
      const y = startY + i * lineHeight;

      if (charsToShow >= lineEnd) {
        ctx.fillStyle = textColor;
        ctx.fillText(line, getX(), y);
      } else if (charsToShow > lineStart) {
        const visible = line.substring(0, charsToShow - lineStart);
        ctx.fillStyle = textColor;
        ctx.fillText(visible, getX(), y);

        if (Math.floor(frame / 12) % 2 === 0) {
          const metrics = ctx.measureText(visible);
          const cursorX = isRtl ? getX() - metrics.width - 6 : getX() + metrics.width / 2 + 6;
          ctx.fillStyle = '#d97706';
          ctx.shadowColor = '#d97706';
          ctx.shadowBlur = 12;
          ctx.fillRect(cursorX, y - fontSize + 6, 4, fontSize);
        }
      }
      charCount = lineEnd + 1;
    }
  }

  // 5. Luminous Glow
  else if (animation === 'fade') {
    for (let i = 0; i < lines.length; i++) {
      const lineProgress = Math.min(1, Math.max(0, (t * 1.6 - i * 0.15) / 0.3));
      const y = startY + i * lineHeight;

      ctx.globalAlpha = lineProgress;
      ctx.fillStyle = textColor;
      if (lineProgress > 0) {
        ctx.fillText(lines[i], getX(), y);
      }
    }
  }

  // 6. Ascending Float
  else if (animation === 'float') {
    for (let i = 0; i < lines.length; i++) {
      const lineProgress = Math.min(1, Math.max(0, (t * 1.5 - i * 0.12) / 0.35));
      const lift = (1 - lineProgress) * 35;
      const y = startY + i * lineHeight + lift;

      ctx.globalAlpha = lineProgress;
      ctx.fillStyle = textColor;
      if (lineProgress > 0) {
        ctx.fillText(lines[i], getX(), y);
      }
    }
  }

  ctx.restore();
}

function renderWatermark(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  config: WatermarkConfig,
  watermarkImg: HTMLImageElement | null
) {
  ctx.save();
  ctx.globalAlpha = config.opacity;

  let posX = W / 2;
  let posY = H - 80;
  let align: CanvasTextAlign = 'center';

  switch (config.position) {
    case 'top-left':
      posX = 70;
      posY = 100;
      align = 'left';
      break;
    case 'top-right':
      posX = W - 70;
      posY = 100;
      align = 'right';
      break;
    case 'bottom-left':
      posX = 70;
      posY = H - 80;
      align = 'left';
      break;
    case 'bottom-right':
      posX = W - 70;
      posY = H - 80;
      align = 'right';
      break;
    case 'bottom-center':
    default:
      posX = W / 2;
      posY = H - 80;
      align = 'center';
      break;
  }

  if (config.type === 'image' && watermarkImg) {
    const targetW = 140;
    const targetH = (targetW / watermarkImg.width) * watermarkImg.height;
    let drawX = posX - targetW / 2;
    if (align === 'left') drawX = posX;
    if (align === 'right') drawX = posX - targetW;
    ctx.drawImage(watermarkImg, drawX, posY - targetH / 2, targetW, targetH);
  } else if (config.text) {
    ctx.font = '600 28px sans-serif';
    ctx.textAlign = align;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 10;
    ctx.fillText(config.text, posX, posY);
  }
  ctx.restore();
}

function renderCinematicBorders(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  const margin = 36;
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(margin, margin, W - margin * 2, H - margin * 2);

  const cornerSize = 24;
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.7)';
  ctx.lineWidth = 2.5;

  ctx.beginPath();
  ctx.moveTo(margin, margin + cornerSize);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin + cornerSize, margin);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(W - margin - cornerSize, margin);
  ctx.lineTo(W - margin, margin);
  ctx.lineTo(W - margin, margin + cornerSize);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(margin, H - margin - cornerSize);
  ctx.lineTo(margin, H - margin);
  ctx.lineTo(margin + cornerSize, H - margin);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(W - margin - cornerSize, H - margin);
  ctx.lineTo(W - margin, H - margin);
  ctx.lineTo(W - margin, H - margin - cornerSize);
  ctx.stroke();

  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image.'));
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  ctx.font = `700 ${fontSize}px sans-serif`;
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.split(' ');
    let current = '';
    for (const word of words) {
      const test = current ? current + ' ' + word : word;
      if (ctx.measureText(test).width > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = test;
      }
    }
    if (current) lines.push(current);
  }
  return lines;
}

function applyVideoFilter(ctx: CanvasRenderingContext2D, filter: string) {
  switch (filter) {
    case 'moody-grey':
      ctx.filter = 'grayscale(100%) contrast(120%) brightness(0.85)';
      break;
    case 'midnight-dark':
      ctx.filter = 'brightness(0.55) contrast(135%) saturate(80%)';
      break;
    case 'vintage-parchment':
      ctx.filter = 'sepia(75%) contrast(110%) brightness(0.88)';
      break;
    case 'emerald-twilight':
      ctx.filter = 'hue-rotate(65deg) contrast(115%) brightness(0.82)';
      break;
    default:
      ctx.filter = 'none';
      break;
  }
}

function renderNatureBackdrop1080(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  style: string,
  t: number,
  frame: number
) {
  ctx.save();

  if (style === 'ocean-waves') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#020b14');
    sky.addColorStop(0.5, '#051f33');
    sky.addColorStop(0.75, '#072e48');
    sky.addColorStop(1, '#041726');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    const moonAura = ctx.createRadialGradient(W / 2, H * 0.48, 10, W / 2, H * 0.48, W * 0.6);
    moonAura.addColorStop(0, 'rgba(186, 230, 253, 0.25)');
    moonAura.addColorStop(0.5, 'rgba(56, 189, 248, 0.08)');
    moonAura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = moonAura;
    ctx.fillRect(0, 0, W, H);
  } else if (style === 'rising-sun') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0b0f19');
    sky.addColorStop(0.35, '#1e1b4b');
    sky.addColorStop(0.65, '#831843');
    sky.addColorStop(0.85, '#ea580c');
    sky.addColorStop(1, '#ca8a04');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
  } else if (style === 'tree-leaves') {
    const forest = ctx.createLinearGradient(0, 0, 0, H);
    forest.addColorStop(0, '#03140a');
    forest.addColorStop(0.4, '#062915');
    forest.addColorStop(0.8, '#041d0e');
    forest.addColorStop(1, '#020c06');
    ctx.fillStyle = forest;
    ctx.fillRect(0, 0, W, H);
  } else if (style === 'desert-dunes') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0f0c29');
    sky.addColorStop(0.4, '#302b63');
    sky.addColorStop(0.65, '#8b4513');
    sky.addColorStop(1, '#d97706');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
  } else if (style === 'sacred-rain') {
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, '#0a0f18');
    sky.addColorStop(0.5, '#131c2b');
    sky.addColorStop(1, '#080d14');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);
  } else {
    const sacredBg = ctx.createRadialGradient(W / 2, H * 0.45, 20, W / 2, H * 0.45, W * 0.9);
    sacredBg.addColorStop(0, '#101726');
    sacredBg.addColorStop(0.6, '#080d16');
    sacredBg.addColorStop(1, '#04070c');
    ctx.fillStyle = sacredBg;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

function renderSurahBadge1080(
  ctx: CanvasRenderingContext2D,
  text: string,
  W: number,
  H: number
) {
  ctx.save();
  const badgeH = 52;
  const paddingX = 28;
  ctx.font = '700 22px sans-serif';
  const textWidth = ctx.measureText(text).width;
  const badgeW = Math.min(W - 80, textWidth + paddingX * 2);
  const badgeX = (W - badgeW) / 2;
  const badgeY = 64;

  ctx.fillStyle = 'rgba(6, 10, 16, 0.82)';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 26);
  ctx.fill();

  ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.shadowColor = 'rgba(251, 191, 36, 0.45)';
  ctx.shadowBlur = 16;
  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, badgeY + badgeH / 2);
  ctx.restore();
}

function renderAudioVisualizer1080(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  frame: number
) {
  ctx.save();
  const numBars = 18;
  const barW = 7;
  const gap = 7;
  const totalW = numBars * barW + (numBars - 1) * gap;
  const startX = (W - totalW) / 2;
  const baseY = H - 170;

  for (let i = 0; i < numBars; i++) {
    const freq1 = Math.sin(frame * 0.16 + i * 0.45);
    const freq2 = Math.cos(frame * 0.28 + i * 0.3);
    const mag = Math.abs(freq1 * 0.65 + freq2 * 0.35);
    const barH = 10 + mag * 44;
    const x = startX + i * (barW + gap);
    const y = baseY - barH;

    const barGrad = ctx.createLinearGradient(0, y, 0, baseY);
    barGrad.addColorStop(0, '#fef08a');
    barGrad.addColorStop(0.4, '#d97706');
    barGrad.addColorStop(1, '#059669');

    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 4);
    ctx.fill();
  }
  ctx.restore();
}

function renderSacredFrame1080(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  const m1 = 24;
  const m2 = 36;

  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
  ctx.lineWidth = 2;
  ctx.strokeRect(m1, m1, W - m1 * 2, H - m1 * 2);

  ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(m2, m2, W - m2 * 2, H - m2 * 2);

  const corners = [
    [m1, m1],
    [W - m1, m1],
    [m1, H - m1],
    [W - m1, H - m1],
  ];

  ctx.fillStyle = '#fbbf24';
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx + 8, cy);
    ctx.lineTo(cx, cy + 8);
    ctx.lineTo(cx - 8, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
