import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX } from 'lucide-react';
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
  isStar?: boolean;
}

export default function VideoPreview({
  images,
  text,
  duration,
  audioUrl,
  styleConfig,
  watermarkConfig,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Loaded images cache
  const loadedImgsRef = useRef<HTMLImageElement[]>([]);
  const watermarkImgRef = useRef<HTMLImageElement | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  // Force-load all Google Fonts into the browser so canvas can use them.
  // The Canvas API ONLY sees fonts that have been explicitly loaded via
  // document.fonts.load() — @import alone is not enough for canvas.
  useEffect(() => {
    const FONTS_TO_LOAD = [
      '700 16px "Amiri"',
      '700 16px "Scheherazade New"',
      '600 16px "Playfair Display"',
      '700 16px "Montserrat"',
    ];
    Promise.all(FONTS_TO_LOAD.map((f) => document.fonts.load(f)))
      .then(() => {
        setFontsReady(true);
      })
      .catch(() => {
        // Still mark ready so preview renders even if a font failed
        setFontsReady(true);
      });
  }, []);

  // Particles
  const particlesRef = useRef<Particle[]>([]);

  // Initialize particles once
  useEffect(() => {
    const pts: Particle[] = [];
    for (let p = 0; p < 50; p++) {
      pts.push({
        x: Math.random() * 540,
        y: Math.random() * 960,
        radius: Math.random() * 2.8 + 1.2,
        speed: Math.random() * 1.2 + 0.5,
        opacity: Math.random() * 0.7 + 0.3,
        wobbleSpeed: Math.random() * 0.05 + 0.02,
        wobbleAmp: Math.random() * 20 + 8,
        phase: Math.random() * Math.PI * 2,
        isStar: Math.random() > 0.5,
      });
    }
    particlesRef.current = pts;
  }, []);

  // Pre-load all images
  useEffect(() => {
    if (!images || images.length === 0) {
      loadedImgsRef.current = [];
      return;
    }
    const promises = images.map((src) => {
      return new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => resolve(img);
        img.src = src;
      });
    });

    Promise.all(promises).then((imgs) => {
      loadedImgsRef.current = imgs;
      renderFrame(currentTime);
    });
  }, [images]);

  // Pre-load watermark logo
  useEffect(() => {
    if (!watermarkConfig.imageUrl) {
      watermarkImgRef.current = null;
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      watermarkImgRef.current = img;
      renderFrame(currentTime);
    };
    img.src = watermarkConfig.imageUrl;
  }, [watermarkConfig.imageUrl]);

  // Custom Video Backdrop Setup
  useEffect(() => {
    if (!styleConfig.customVideoUrl) {
      if (bgVideoRef.current) {
        bgVideoRef.current.pause();
        bgVideoRef.current.src = '';
        bgVideoRef.current = null;
      }
      renderFrame(currentTime);
      return;
    }
    const vid = document.createElement('video');
    vid.crossOrigin = 'anonymous';
    vid.muted = true;
    vid.loop = true;
    vid.playsInline = true;
    vid.src = styleConfig.customVideoUrl;
    vid.onloadeddata = () => {
      if (isPlaying) {
        vid.play().catch(() => {});
      }
      renderFrame(currentTime);
    };
    bgVideoRef.current = vid;
    return () => {
      vid.pause();
      vid.src = '';
    };
  }, [styleConfig.customVideoUrl]);

  // Audio setup
  useEffect(() => {
    if (audioUrl) {
      const a = new Audio(audioUrl);
      a.loop = true;
      audioRef.current = a;
    } else {
      audioRef.current = null;
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [audioUrl]);

  // Render a specific frame on preview canvas (W=540, H=960)
  const renderFrame = useCallback(
    (timeSec: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const W = canvas.width;
      const H = canvas.height;
      const t = Math.min(1, Math.max(0, duration > 0 ? timeSec / duration : 0));
      const frameNum = Math.floor(timeSec * 30);

      // 1. Base Dark Backdrop
      ctx.fillStyle = '#060a10';
      ctx.fillRect(0, 0, W, H);

      const imgs = loadedImgsRef.current;
      const hasImages = imgs.length > 0;

      // 2. Custom Video Backdrop (Method 2)
      if (styleConfig.customVideoUrl && bgVideoRef.current && bgVideoRef.current.readyState >= 2) {
        const vid = bgVideoRef.current;
        const scale = Math.max(W / vid.videoWidth, H / vid.videoHeight);
        const vW = vid.videoWidth * scale;
        const vH = vid.videoHeight * scale;
        const vX = (W - vW) / 2;
        const vY = (H - vH) / 2;
        ctx.save();
        applyPreviewFilter(ctx, styleConfig.colorFilter);
        ctx.drawImage(vid, vX, vY, vW, vH);
        ctx.restore();
      } else if (!hasImages || styleConfig.imageFit === 'fit') {
        // 3. Procedural Nature Motion Background if no custom video & (no images or images fitted)
        renderNatureBackdrop(ctx, W, H, styleConfig.videoStyle, t, frameNum);
      }

      // 4. Foreground Images (Multi-image crossfade)
      if (hasImages) {
        const N = imgs.length;
        const segmentDur = duration / N;
        const currentIdx = Math.min(N - 1, Math.floor(timeSec / segmentDur));
        const nextIdx = (currentIdx + 1) % N;
        const segLocalSec = timeSec - currentIdx * segmentDur;

        // Crossfade window: last 1.2s of each segment
        const crossfadeWindow = Math.min(1.2, segmentDur * 0.25);
        const timeUntilEnd = segmentDur - segLocalSec;
        const isTransitioning = N > 1 && timeUntilEnd < crossfadeWindow;
        const transitionAlpha = isTransitioning ? 1 - timeUntilEnd / crossfadeWindow : 0;

        drawSingleImage(ctx, imgs[currentIdx], W, H, t, frameNum, styleConfig, 1.0);

        if (isTransitioning && imgs[nextIdx]) {
          drawSingleImage(ctx, imgs[nextIdx], W, H, t, frameNum, styleConfig, transitionAlpha);
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
      renderEffectPreview(ctx, W, H, styleConfig.videoStyle, t, frameNum, particlesRef.current);

      // 8. Sacred Arabesque Gold Border Frame
      if (styleConfig.showSacredFrame !== false) {
        renderSacredFrame(ctx, W, H);
      }

      // 9. Sacred Floating Surah Citation Badge
      if (styleConfig.showSurahBadge !== false && styleConfig.surahBadgeText) {
        renderSurahBadge(ctx, styleConfig.surahBadgeText, W, H);
      }

      // 10. Multi-Directional Kinetic Text Animation
      if (text) {
        renderKineticText(ctx, text, W, H, t, frameNum, styleConfig.textAnimation, styleConfig);
      }

      // 11. Live Dancing TikTok Audio Equalizer Bars
      if (styleConfig.showAudioVisualizer !== false) {
        renderAudioVisualizer(ctx, W, H, t, frameNum);
      }

      // 12. Watermark
      if (watermarkConfig.enabled) {
        renderWatermarkPreview(ctx, W, H, watermarkConfig, watermarkImgRef.current);
      }
    },
    [duration, styleConfig, text, watermarkConfig]
  );

  // Play Loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (bgVideoRef.current) bgVideoRef.current.pause();
      return;
    }

    if (audioRef.current) {
      audioRef.current.currentTime = currentTime % (audioRef.current.duration || 10);
      audioRef.current.muted = isMuted;
      audioRef.current.play().catch(() => {});
    }

    if (bgVideoRef.current) {
      if (bgVideoRef.current.duration) {
        bgVideoRef.current.currentTime = currentTime % bgVideoRef.current.duration;
      }
      bgVideoRef.current.play().catch(() => {});
    }

    startTimeRef.current = performance.now() - currentTime * 1000;

    const tick = (now: number) => {
      const elapsedSec = (now - (startTimeRef.current || now)) / 1000;
      if (elapsedSec >= duration) {
        startTimeRef.current = now;
        setCurrentTime(0);
        renderFrame(0);
        if (audioRef.current) audioRef.current.currentTime = 0;
        if (bgVideoRef.current) bgVideoRef.current.currentTime = 0;
      } else {
        setCurrentTime(elapsedSec);
        renderFrame(elapsedSec);
      }
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioRef.current) audioRef.current.pause();
      if (bgVideoRef.current) bgVideoRef.current.pause();
    };
  }, [isPlaying, isMuted, duration, renderFrame]);

  // Re-render when config or fonts change
  useEffect(() => {
    renderFrame(currentTime);
  }, [currentTime, styleConfig, watermarkConfig, text, renderFrame, fontsReady]);

  const togglePlay = () => setIsPlaying(!isPlaying);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setCurrentTime(val);
    if (audioRef.current) {
      audioRef.current.currentTime = val % (audioRef.current.duration || 10);
    }
    if (bgVideoRef.current && bgVideoRef.current.duration) {
      bgVideoRef.current.currentTime = val % bgVideoRef.current.duration;
    }
    renderFrame(val);
  };

  return (
    <div className="space-y-3">
      {/* Hidden font primers — forces browser to download Google Fonts so Canvas can use them */}
      <span aria-hidden className="absolute opacity-0 pointer-events-none select-none" style={{ fontFamily: '"Amiri"', fontWeight: 700, fontSize: 1 }}>.</span>
      <span aria-hidden className="absolute opacity-0 pointer-events-none select-none" style={{ fontFamily: '"Scheherazade New"', fontWeight: 700, fontSize: 1 }}>.</span>
      <span aria-hidden className="absolute opacity-0 pointer-events-none select-none" style={{ fontFamily: '"Playfair Display"', fontWeight: 600, fontSize: 1 }}>.</span>
      <span aria-hidden className="absolute opacity-0 pointer-events-none select-none" style={{ fontFamily: '"Montserrat"', fontWeight: 900, fontSize: 1 }}>.</span>
      {/* Live Preview Screen */}
      <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black max-w-[280px] mx-auto aspect-[9/16] shadow-2xl group">
        <canvas
          ref={canvasRef}
          width={540}
          height={960}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
        />

        {!isPlaying && (
          <div
            onClick={togglePlay}
            className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-opacity group-hover:bg-black/30"
          >
            <div className="w-14 h-14 rounded-full bg-gradient-to-r from-[#059669] to-[#047857] flex items-center justify-center text-white shadow-xl shadow-[#059669]/40 transform group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 ml-1" />
            </div>
            <span className="text-xs font-bold text-white mt-3 tracking-wide bg-black/60 px-3 py-1 rounded-full border border-white/10">
              Click to Play Preview & Sound
            </span>
          </div>
        )}

        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-white">
          <span className={`w-2 h-2 rounded-full ${isPlaying ? 'bg-red-500 animate-ping' : 'bg-[#10b981]'}`} />
          <span className="font-semibold">{isPlaying ? 'Playing Preview' : 'Interactive Preview'}</span>
        </div>

        {audioUrl && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsMuted(!isMuted);
              if (audioRef.current) audioRef.current.muted = !isMuted;
            }}
            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md flex items-center justify-center text-white border border-white/10"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
          </button>
        )}
      </div>

      {/* Scrubbing & Controls Bar */}
      <div className="max-w-[340px] mx-auto space-y-2 bg-white/[0.02] p-3 rounded-xl border border-white/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={togglePlay}
            className="w-8 h-8 rounded-lg bg-[#059669] text-white flex items-center justify-center hover:bg-[#047857] transition-colors flex-shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentTime(0);
              if (audioRef.current) audioRef.current.currentTime = 0;
              renderFrame(0);
            }}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 flex items-center justify-center transition-colors flex-shrink-0"
            title="Reset to 0s"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min={0}
            max={duration}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="flex-grow accent-[#059669] h-1.5 rounded-lg cursor-pointer"
          />

          <span className="text-[11px] font-mono text-gray-400 min-w-[38px] text-right">
            {Math.floor(currentTime)}s / {duration}s
          </span>
        </div>
      </div>
    </div>
  );
}

// Single Image Drawer with Motion & Color Filter
function drawSingleImage(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  W: number,
  H: number,
  t: number,
  frameNum: number,
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
      scale = 1.0 + t * 0.16;
      offsetX = (t - 0.5) * 20;
      offsetY = (t - 0.5) * 15;
      break;
    case 'sacred-breathe':
      scale = 1.03 + Math.sin(t * Math.PI * 4) * 0.03;
      break;
    case 'reel-vintage':
      scale = 1.06;
      offsetX = Math.sin(frameNum * 0.2) * 1.5;
      offsetY = Math.cos(frameNum * 0.15) * 1.5;
      break;
    case 'golden-dust':
    case 'celestial-stars':
    case 'heavenly-rays':
    case 'emerald-embers':
    case 'light-leak-aura':
    default:
      scale = 1.0 + t * 0.08;
      break;
  }

  // Color Filter
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

  if (styleConfig.imageFit === 'fit') {
    // Backdrop blur filling 9:16
    const bgScale = Math.max(W / img.width, H / img.height) * 1.08;
    const bgW = img.width * bgScale;
    const bgH = img.height * bgScale;
    const bgX = (W - bgW) / 2;
    const bgY = (H - bgH) / 2;

    ctx.save();
    ctx.filter = `${ctx.filter} blur(16px) brightness(0.4)`;
    ctx.drawImage(img, bgX, bgY, bgW, bgH);
    ctx.restore();

    // Full foreground image without cropping any edges
    const targetScale = Math.min((W - 36) / img.width, (H - 120) / img.height) * scale;
    const fgW = img.width * targetScale;
    const fgH = img.height * targetScale;
    const fgX = (W - fgW) / 2 + offsetX;
    const fgY = (H - fgH) / 2 + offsetY;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 6;
    ctx.drawImage(img, fgX, fgY, fgW, fgH);
    ctx.restore();
  } else {
    // Fill mode
    const coverScale = Math.max(W / img.width, H / img.height) * scale;
    const drawW = img.width * coverScale;
    const drawH = img.height * coverScale;
    const drawX = (W - drawW) / 2 + offsetX;
    const drawY = (H - drawH) / 2 + offsetY;
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
  }

  ctx.restore();
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

// Multi-Directional & Kinetic Text Animation Renderer
function renderKineticText(
  ctx: CanvasRenderingContext2D,
  text: string,
  W: number,
  H: number,
  t: number,
  frameNum: number,
  animation: string,
  styleConfig?: import('./StylePicker').StyleConfig
) {
  ctx.save();
  const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);

  // --- Typography from StyleConfig ---
  const fontSize = styleConfig?.textSize ?? 26;
  const lineHeight = Math.round(fontSize * 1.55);
  const textColor = styleConfig?.textColor ?? '#ffffff';
  const fontStack = getFontStack(styleConfig?.fontFamily);
  const fontWeight = styleConfig?.fontFamily === 'montserrat' ? '900' : '700';
  const textAlignPref = styleConfig?.textAlign ?? 'center';
  const textPosition = styleConfig?.textPosition ?? 'center';

  // Resolve canvas textAlign: RTL text always right, else use user preference
  const canvasAlign = isRtl ? 'right' : (textAlignPref as CanvasTextAlign);
  ctx.textAlign = canvasAlign;
  ctx.direction = isRtl ? 'rtl' : 'ltr';
  ctx.font = `${fontWeight} ${fontSize}px ${fontStack}`;

  const lines = wrapLines(ctx, text, W - 90, fontSize);
  const totalTextH = lines.length * lineHeight;

  // Vertical position
  let startY: number;
  if (textPosition === 'top') {
    startY = 80;
  } else if (textPosition === 'bottom') {
    startY = H - totalTextH - 80;
  } else {
    // center
    startY = (H - totalTextH) / 2 + Math.round(fontSize * 0.4);
  }

  // X position based on alignment
  const getX = () => {
    if (isRtl) return W - 45;
    if (canvasAlign === 'left') return 45;
    if (canvasAlign === 'right') return W - 45;
    return W / 2;
  };

  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;

  // 1. Converge (Left & Right Alternating Slide)
  if (animation === 'converge') {
    for (let i = 0; i < lines.length; i++) {
      const lineProgress = Math.min(1, Math.max(0, (t * 1.5 - i * 0.12) / 0.3));
      const ease = 1 - Math.pow(1 - lineProgress, 3);
      const isFromLeft = i % 2 === 0;
      const targetX = getX();
      const startX = isFromLeft ? targetX - 160 : targetX + 160;
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
      const curY = targetY - 60 * (1 - ease);

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
          ctx.shadowBlur = 16;
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

        if (Math.floor(frameNum / 12) % 2 === 0) {
          const metrics = ctx.measureText(visible);
          const cursorX = isRtl ? getX() - metrics.width - 4 : getX() + metrics.width / 2 + 4;
          ctx.fillStyle = '#d97706';
          ctx.fillRect(cursorX, y - fontSize + 4, 3, fontSize);
        }
      }
      charCount = lineEnd + 1;
    }
  }

  // 5. Luminous Glow Fade
  else if (animation === 'fade') {
    for (let i = 0; i < lines.length; i++) {
      const lineProgress = Math.min(1, Math.max(0, (t * 1.6 - i * 0.15) / 0.3));
      const y = startY + i * lineHeight;
      ctx.globalAlpha = lineProgress;
      ctx.fillStyle = textColor;
      if (lineProgress > 0) ctx.fillText(lines[i], getX(), y);
    }
  }

  // 6. Ascending Float
  else if (animation === 'float') {
    for (let i = 0; i < lines.length; i++) {
      const lineProgress = Math.min(1, Math.max(0, (t * 1.5 - i * 0.12) / 0.35));
      const lift = (1 - lineProgress) * 20;
      const y = startY + i * lineHeight + lift;
      ctx.globalAlpha = lineProgress;
      ctx.fillStyle = textColor;
      if (lineProgress > 0) ctx.fillText(lines[i], getX(), y);
    }
  }

  ctx.restore();
}

function renderEffectPreview(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  style: string,
  t: number,
  frameNum: number,
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

      for (let x = 0; x <= W; x += 15) {
        const waveH = 8 + wave * 7;
        const speed = (wave + 1) * 0.04;
        const freq = 0.008 - wave * 0.001;
        const y =
          waveBaseY +
          Math.sin(x * freq + frameNum * speed) * waveH +
          Math.cos(x * 0.004 + frameNum * speed * 0.5) * (waveH * 0.4);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();

      const waveGrad = ctx.createLinearGradient(0, waveBaseY - 15, 0, H);
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
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Shimmering water light reflections
    for (let s = 0; s < 18; s++) {
      const sx = (s * 33 + Math.sin(frameNum * 0.05 + s) * 40) % W;
      const sy = horizonY + 25 + (s * 25) % (H * 0.4);
      const sw = 18 + Math.sin(frameNum * 0.1 + s) * 14;
      ctx.fillStyle = 'rgba(251, 191, 36, 0.25)';
      ctx.fillRect(sx, sy, Math.max(5, sw), 2);
    }
    ctx.restore();
  }

  // 2. Rising Sun Dawn
  if (style === 'rising-sun') {
    ctx.save();
    const horizonY = H * 0.65;
    const sunY = horizonY - t * (H * 0.28) + 20;
    const sunX = W / 2;
    const sunRadius = 45;

    // Expanding morning sky warm radial wash
    const skyWash = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, W * 0.9);
    skyWash.addColorStop(0, 'rgba(251, 191, 36, 0.35)');
    skyWash.addColorStop(0.3, 'rgba(245, 158, 11, 0.2)');
    skyWash.addColorStop(0.7, 'rgba(225, 29, 72, 0.1)');
    skyWash.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = skyWash;
    ctx.fillRect(0, 0, W, H);

    // Radiant sunbeams streaming from the rising sun
    for (let r = 0; r < 8; r++) {
      const angle = (r / 8) * Math.PI + Math.sin(frameNum * 0.01) * 0.08;
      const rayLen = W * 0.85;
      const rx = sunX + Math.cos(angle - Math.PI) * rayLen;
      const ry = sunY + Math.sin(angle - Math.PI) * rayLen;

      ctx.beginPath();
      ctx.moveTo(sunX, sunY);
      ctx.lineTo(rx - 30, ry);
      ctx.lineTo(rx + 30, ry);
      ctx.closePath();
      const rayAlpha = 0.08 + Math.sin(frameNum * 0.03 + r) * 0.04;
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
    ctx.lineTo(0, horizonY + 10);
    ctx.quadraticCurveTo(W * 0.3, horizonY - 25, W * 0.5, horizonY + 5);
    ctx.quadraticCurveTo(W * 0.75, horizonY - 20, W, horizonY + 15);
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
    ctx.arc(-20, -20, 140, 0, Math.PI * 2);
    ctx.arc(70, 20, 100, 0, Math.PI * 2);
    ctx.arc(150, 0, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(W + 20, -20, 140, 0, Math.PI * 2);
    ctx.arc(W - 70, 20, 100, 0, Math.PI * 2);
    ctx.arc(W - 150, 0, 70, 0, Math.PI * 2);
    ctx.fill();

    // Fluttering leaves drifting in breeze
    for (let l = 0; l < 28; l++) {
      const speed = 1.0 + (l % 4) * 0.4;
      const curY = (l * 38 + frameNum * speed) % (H + 40) - 20;
      const wobbleX = (l * 40 + Math.sin(frameNum * 0.04 + l) * 35) % W;
      const angle = Math.sin(frameNum * 0.05 + l * 0.7) * 0.8 + 0.3;
      const leafSize = 11 + (l % 3) * 5;

      ctx.save();
      ctx.translate(wobbleX, curY);
      ctx.rotate(angle);

      const isGolden = l % 3 === 0;
      ctx.fillStyle = isGolden ? 'rgba(251, 191, 36, 0.75)' : 'rgba(52, 211, 153, 0.7)';
      ctx.beginPath();
      ctx.ellipse(0, 0, leafSize, leafSize * 0.45, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = isGolden ? 'rgba(217, 119, 6, 0.9)' : 'rgba(5, 150, 105, 0.8)';
      ctx.lineWidth = 1;
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
      for (let x = 0; x <= W; x += 20) {
        const y = duneBase + Math.sin(x * 0.006 + d * 1.5) * (18 + d * 10);
        ctx.lineTo(x, y);
      }
      ctx.lineTo(W, H);
      ctx.closePath();
      const duneGrad = ctx.createLinearGradient(0, duneBase - 20, 0, H);
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
    for (let s = 0; s < 30; s++) {
      const sx = (s * 25 + frameNum * (2.0 + (s % 3))) % (W + 20) - 10;
      const sy = horizonY + (s * 18) % (H * 0.42);
      ctx.fillStyle = `rgba(253, 230, 138, ${0.4 + (s % 4) * 0.15})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 1.2 + (s % 2) * 0.8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 5. Serene Rain on Sacred Glass
  if (style === 'sacred-rain') {
    ctx.save();
    // Rain streaks
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.28)';
    ctx.lineWidth = 1;
    for (let r = 0; r < 36; r++) {
      const rx = (r * 19 + (r % 5) * 7) % W;
      const ry = (r * 31 + frameNum * (7 + (r % 4) * 2)) % (H + 40) - 20;
      const len = 18 + (r % 3) * 12;
      ctx.beginPath();
      ctx.moveTo(rx, ry);
      ctx.lineTo(rx - 3, ry + len);
      ctx.stroke();
    }
    // Trickling glass beads
    for (let b = 0; b < 6; b++) {
      const bx = (b * 88 + 40) % (W - 40);
      const by = (frameNum * (0.6 + b * 0.2) + b * 140) % (H * 0.8) + H * 0.1;
      const dropGlow = ctx.createRadialGradient(bx, by, 0, bx, by, 6);
      dropGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
      dropGlow.addColorStop(0.6, 'rgba(147, 197, 253, 0.4)');
      dropGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = dropGlow;
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 6. Divine Golden Dust
  if (style === 'golden-dust') {
    ctx.save();
    for (const p of particles) {
      const curY = (p.y - frameNum * p.speed) % H;
      const drawYPos = curY < 0 ? curY + H : curY;
      const wobbleX = p.x + Math.sin(frameNum * p.wobbleSpeed + p.phase) * p.wobbleAmp;

      const glow = ctx.createRadialGradient(wobbleX, drawYPos, 0, wobbleX, drawYPos, p.radius * 3.5);
      glow.addColorStop(0, `rgba(251, 191, 36, ${p.opacity})`);
      glow.addColorStop(0.5, `rgba(217, 119, 6, ${p.opacity * 0.5})`);
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
      const curY = (p.y + frameNum * (p.speed * 0.5)) % H;
      const drawYPos = curY;
      const wobbleX = p.x + Math.sin(frameNum * 0.03 + p.phase) * 10;
      const twinkle = 0.3 + Math.abs(Math.sin(frameNum * 0.08 + p.phase)) * 0.7;

      ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity * twinkle})`;
      const r = p.radius * 1.5;

      ctx.beginPath();
      ctx.moveTo(wobbleX, drawYPos - r * 2);
      ctx.lineTo(wobbleX + r * 0.5, drawYPos);
      ctx.lineTo(wobbleX, drawYPos + r * 2);
      ctx.lineTo(wobbleX - r * 0.5, drawYPos);
      ctx.closePath();
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(wobbleX - r * 2, drawYPos);
      ctx.lineTo(wobbleX, drawYPos + r * 0.5);
      ctx.lineTo(wobbleX + r * 2, drawYPos);
      ctx.lineTo(wobbleX - r * 0.5, drawYPos);
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
      const rayWidth = 40 + r * 25;
      const rayX = (r * 90 + Math.sin(frameNum * 0.02 + r) * 20);
      const rayAlpha = 0.08 + Math.sin(frameNum * 0.03 + r * 1.5) * 0.04;

      const rayGrad = ctx.createLinearGradient(rayX, 0, rayX + rayWidth, H * 1.4);
      rayGrad.addColorStop(0, `rgba(251, 191, 36, ${rayAlpha * 1.8})`);
      rayGrad.addColorStop(0.5, `rgba(255, 255, 255, ${rayAlpha})`);
      rayGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');

      ctx.fillStyle = rayGrad;
      ctx.fillRect(rayX, -100, rayWidth, H * 1.6);
    }
    ctx.restore();
  }

  // 4. Sacred Emerald Embers
  if (style === 'emerald-embers') {
    ctx.save();
    for (const p of particles) {
      const curY = (p.y - frameNum * (p.speed * 1.3)) % H;
      const drawYPos = curY < 0 ? curY + H : curY;
      const wobbleX = p.x + Math.sin(frameNum * p.wobbleSpeed + p.phase) * p.wobbleAmp;

      const isGreen = p.radius > 2.0;
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
    const leakX = W * 0.3 + Math.sin(frameNum * 0.02) * W * 0.25;
    const leakY = H * 0.2 + Math.cos(frameNum * 0.015) * H * 0.15;
    const leakGrad = ctx.createRadialGradient(leakX, leakY, 10, leakX, leakY, 320);
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
    const aura = ctx.createRadialGradient(W / 2, H / 2, 20, W / 2, H / 2, 260);
    aura.addColorStop(0, `rgba(217, 119, 6, ${pulseIntensity})`);
    aura.addColorStop(0.6, `rgba(5, 150, 105, ${pulseIntensity * 0.4})`);
    aura.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }

  // 7. Reel Vintage Grain
  if (style === 'reel-vintage') {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.035)';
    for (let g = 0; g < 150; g++) {
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
    ctx.restore();
  }
}

function renderWatermarkPreview(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  config: WatermarkConfig,
  watermarkImg: HTMLImageElement | null
) {
  ctx.save();
  ctx.globalAlpha = config.opacity;

  let posX = W / 2;
  let posY = H - 35;
  let align: CanvasTextAlign = 'center';

  switch (config.position) {
    case 'top-left':
      posX = 30;
      posY = 45;
      align = 'left';
      break;
    case 'top-right':
      posX = W - 30;
      posY = 45;
      align = 'right';
      break;
    case 'bottom-left':
      posX = 30;
      posY = H - 35;
      align = 'left';
      break;
    case 'bottom-right':
      posX = W - 30;
      posY = H - 35;
      align = 'right';
      break;
    case 'bottom-center':
    default:
      posX = W / 2;
      posY = H - 35;
      align = 'center';
      break;
  }

  if (config.type === 'image' && watermarkImg) {
    const targetW = 60;
    const targetH = (targetW / watermarkImg.width) * watermarkImg.height;
    let drawX = posX - targetW / 2;
    if (align === 'left') drawX = posX;
    if (align === 'right') drawX = posX - targetW;
    ctx.drawImage(watermarkImg, drawX, posY - targetH / 2, targetW, targetH);
  } else if (config.text) {
    ctx.font = '600 13px sans-serif';
    ctx.textAlign = align;
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.fillText(config.text, posX, posY);
  }
  ctx.restore();
}

function wrapLines(
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

function applyPreviewFilter(ctx: CanvasRenderingContext2D, filter: string) {
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

function renderNatureBackdrop(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  style: string,
  t: number,
  frameNum: number
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

    const moonAura = ctx.createRadialGradient(W / 2, H * 0.48, 5, W / 2, H * 0.48, W * 0.6);
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
    const sacredBg = ctx.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, W * 0.9);
    sacredBg.addColorStop(0, '#101726');
    sacredBg.addColorStop(0.6, '#080d16');
    sacredBg.addColorStop(1, '#04070c');
    ctx.fillStyle = sacredBg;
    ctx.fillRect(0, 0, W, H);
  }

  ctx.restore();
}

function renderSurahBadge(
  ctx: CanvasRenderingContext2D,
  text: string,
  W: number,
  H: number
) {
  ctx.save();
  const badgeH = 26;
  const paddingX = 14;
  ctx.font = '700 11px sans-serif';
  const textWidth = ctx.measureText(text).width;
  const badgeW = Math.min(W - 40, textWidth + paddingX * 2);
  const badgeX = (W - badgeW) / 2;
  const badgeY = 32;

  // Frosted dark pill background
  ctx.fillStyle = 'rgba(6, 10, 16, 0.82)';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 13);
  ctx.fill();

  // Sacred gold border
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.55)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Subtle gold inner glow
  ctx.shadowColor = 'rgba(251, 191, 36, 0.4)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#fef08a';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, W / 2, badgeY + badgeH / 2);
  ctx.restore();
}

function renderAudioVisualizer(
  ctx: CanvasRenderingContext2D,
  W: number,
  H: number,
  t: number,
  frameNum: number
) {
  ctx.save();
  const numBars = 18;
  const barW = 3.5;
  const gap = 3.5;
  const totalW = numBars * barW + (numBars - 1) * gap;
  const startX = (W - totalW) / 2;
  const baseY = H - 85;

  for (let i = 0; i < numBars; i++) {
    const freq1 = Math.sin(frameNum * 0.16 + i * 0.45);
    const freq2 = Math.cos(frameNum * 0.28 + i * 0.3);
    const mag = Math.abs(freq1 * 0.65 + freq2 * 0.35);
    const barH = 5 + mag * 22;
    const x = startX + i * (barW + gap);
    const y = baseY - barH;

    const barGrad = ctx.createLinearGradient(0, y, 0, baseY);
    barGrad.addColorStop(0, '#fef08a');
    barGrad.addColorStop(0.4, '#d97706');
    barGrad.addColorStop(1, '#059669');

    ctx.fillStyle = barGrad;
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 2);
    ctx.fill();
  }
  ctx.restore();
}

function renderSacredFrame(ctx: CanvasRenderingContext2D, W: number, H: number) {
  ctx.save();
  const m1 = 12;
  const m2 = 18;

  // Outer thin gold border
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.45)';
  ctx.lineWidth = 1;
  ctx.strokeRect(m1, m1, W - m1 * 2, H - m1 * 2);

  // Inner faint border
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
  ctx.lineWidth = 0.8;
  ctx.strokeRect(m2, m2, W - m2 * 2, H - m2 * 2);

  // 4 Luxury Arabesque / Diamond Corner Accents
  const corners = [
    [m1, m1],
    [W - m1, m1],
    [m1, H - m1],
    [W - m1, H - m1],
  ];

  ctx.fillStyle = '#fbbf24';
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 4);
    ctx.lineTo(cx + 4, cy);
    ctx.lineTo(cx, cy + 4);
    ctx.lineTo(cx - 4, cy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}
