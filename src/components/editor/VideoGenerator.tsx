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

      // 8. Frame Render Loop
      for (let frame = 0; frame < totalFrames; frame++) {
        const timeSec = (frame / totalFrames) * duration;
        const t = frame / totalFrames;

        ctx.fillStyle = '#080808';
        ctx.fillRect(0, 0, W, H);

        // Multi-image sequence handling
        const currentIdx = Math.min(N - 1, Math.floor(timeSec / segmentDur));
        const nextIdx = (currentIdx + 1) % N;
        const segLocalSec = timeSec - currentIdx * segmentDur;
        const timeUntilEnd = segmentDur - segLocalSec;
        const isTransitioning = N > 1 && timeUntilEnd < crossfadeWindow;
        const transitionAlpha = isTransitioning ? 1 - timeUntilEnd / crossfadeWindow : 0;

        // Render Current Image
        renderSingleImage(ctx, loadedImgs[currentIdx], W, H, t, frame, styleConfig, 1.0);

        // Crossfade Next Image if transitioning
        if (isTransitioning && loadedImgs[nextIdx]) {
          renderSingleImage(ctx, loadedImgs[nextIdx], W, H, t, frame, styleConfig, transitionAlpha);
        }

        // Dark atmosphere & edge vignette
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, W, H);

        const vignette = ctx.createRadialGradient(W / 2, H / 2, W * 0.4, W / 2, H / 2, W * 0.88);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, 'rgba(0, 0, 0, 0.6)');
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, W, H);

        // Render Particle / Light Effect
        renderParticleEffect(ctx, W, H, styleConfig.videoStyle, t, frame, particles);

        // Render Animated Kinetic Text
        if (text) {
          renderKineticText(ctx, text, W, H, t, frame, styleConfig.textAnimation);
        }

        // Render Watermark
        if (watermarkConfig.enabled) {
          renderWatermark(ctx, W, H, watermarkConfig, watermarkImg);
        }

        // Render Cinematic Border Ornaments
        renderCinematicBorders(ctx, W, H);

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
      disabled={!images || images.length === 0}
      className="w-full bg-gradient-to-r from-[#059669] via-[#047857] to-[#d97706] hover:opacity-95 text-white px-6 py-4 rounded-2xl font-bold text-lg transition-all focus:ring-2 focus:ring-[#d97706] focus:outline-none shadow-xl shadow-[#059669]/25 flex items-center justify-center gap-3 disabled:opacity-40 cursor-pointer"
    >
      <Film className="w-6 h-6" />
      Generate Studio Video ({images.length} Image{images.length > 1 ? 's' : ''})
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
  // 1. Divine Golden Dust
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

// Kinetic Multi-Directional Text Animation Renderer
function renderKineticText(
  ctx: CanvasRenderingContext2D,
  text: string,
  W: number,
  H: number,
  t: number,
  frame: number,
  animation: string
) {
  ctx.save();
  const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);
  const fontSize = 52;
  const lineHeight = 80;
  ctx.textAlign = isRtl ? 'right' : 'center';
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.font = `700 ${fontSize}px "Amiri", "Scheherazade New", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

  const lines = wrapText(ctx, text, W - 180, fontSize);
  const totalTextH = lines.length * lineHeight;
  const startY = (H - totalTextH) / 2 + 40;

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
      const targetX = isRtl ? W - 100 : W / 2;
      const startX = isFromLeft ? targetX - 320 : targetX + 320;
      const curX = startX + (targetX - startX) * ease;

      ctx.globalAlpha = lineProgress;
      ctx.fillStyle = '#ffffff';
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
      const x = isRtl ? W - 100 : W / 2;

      ctx.globalAlpha = lineProgress;
      ctx.fillStyle = '#ffffff';
      if (lineProgress > 0) {
        ctx.fillText(lines[i], x, curY);
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
      const x = isRtl ? W - 100 : W / 2;

      const lineStartWord = wordIdx;
      const lineEndWord = wordIdx + lineWords.length;
      wordIdx = lineEndWord;

      if (activeWordIdx >= lineStartWord) {
        const visibleLine = lineWords
          .slice(0, Math.max(0, activeWordIdx - lineStartWord + 1))
          .join(' ');

        ctx.fillStyle = '#ffffff';
        ctx.fillText(visibleLine, x, y);

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
      const x = isRtl ? W - 100 : W / 2;

      if (charsToShow >= lineEnd) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(line, x, y);
      } else if (charsToShow > lineStart) {
        const visible = line.substring(0, charsToShow - lineStart);
        ctx.fillStyle = '#ffffff';
        ctx.fillText(visible, x, y);

        if (Math.floor(frame / 12) % 2 === 0) {
          const metrics = ctx.measureText(visible);
          const cursorX = isRtl ? x - metrics.width - 6 : x + metrics.width / 2 + 6;
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
      const x = isRtl ? W - 100 : W / 2;

      ctx.globalAlpha = lineProgress;
      ctx.fillStyle = '#ffffff';
      if (lineProgress > 0) {
        ctx.fillText(lines[i], x, y);
      }
    }
  }

  // 6. Ascending Float
  else if (animation === 'float') {
    for (let i = 0; i < lines.length; i++) {
      const lineProgress = Math.min(1, Math.max(0, (t * 1.5 - i * 0.12) / 0.35));
      const lift = (1 - lineProgress) * 35;
      const y = startY + i * lineHeight + lift;
      const x = isRtl ? W - 100 : W / 2;

      ctx.globalAlpha = lineProgress;
      ctx.fillStyle = '#ffffff';
      if (lineProgress > 0) {
        ctx.fillText(lines[i], x, y);
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
