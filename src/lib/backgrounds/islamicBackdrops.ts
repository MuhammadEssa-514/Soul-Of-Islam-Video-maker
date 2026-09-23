// Generates instant high-resolution 1080x1920 backdrops for Text-to-Video mode

export interface BackdropPreset {
  id: string;
  name: string;
  gradient: string;
  previewBg: string;
}

export const BACKDROP_PRESETS: BackdropPreset[] = [
  {
    id: 'midnight-mosque',
    name: 'Midnight Sacred',
    gradient: 'linear-gradient(180deg, #020617 0%, #0f172a 60%, #030712 100%)',
    previewBg: 'bg-gradient-to-b from-[#020617] via-[#0f172a] to-[#030712]',
  },
  {
    id: 'sacred-emerald',
    name: 'Emerald Sanctuary',
    gradient: 'linear-gradient(180deg, #022c22 0%, #064e3b 50%, #022c22 100%)',
    previewBg: 'bg-gradient-to-b from-[#022c22] via-[#064e3b] to-[#022c22]',
  },
  {
    id: 'golden-noir',
    name: 'Golden Kaaba Noir',
    gradient: 'linear-gradient(180deg, #09090b 0%, #18181b 50%, #09090b 100%)',
    previewBg: 'bg-gradient-to-b from-[#09090b] via-[#18181b] to-[#09090b]',
  },
  {
    id: 'charcoal-grey',
    name: 'Spiritual Charcoal Grey',
    gradient: 'linear-gradient(180deg, #18181b 0%, #27272a 50%, #09090b 100%)',
    previewBg: 'bg-gradient-to-b from-[#18181b] via-[#27272a] to-[#09090b]',
  },
  {
    id: 'antique-parchment',
    name: 'Antique Manuscript',
    gradient: 'linear-gradient(180deg, #1c1917 0%, #292524 50%, #0c0a09 100%)',
    previewBg: 'bg-gradient-to-b from-[#1c1917] via-[#292524] to-[#0c0a09]',
  },
];

export function createBackdropDataUrl(presetId: string): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const preset = BACKDROP_PRESETS.find((p) => p.id === presetId) || BACKDROP_PRESETS[0];

  const grad = ctx.createLinearGradient(0, 0, 0, 1920);
  switch (preset.id) {
    case 'sacred-emerald':
      grad.addColorStop(0, '#022c22');
      grad.addColorStop(0.5, '#064e3b');
      grad.addColorStop(1, '#021812');
      break;
    case 'golden-noir':
      grad.addColorStop(0, '#050505');
      grad.addColorStop(0.5, '#121214');
      grad.addColorStop(1, '#050505');
      break;
    case 'charcoal-grey':
      grad.addColorStop(0, '#18181b');
      grad.addColorStop(0.5, '#27272a');
      grad.addColorStop(1, '#09090b');
      break;
    case 'antique-parchment':
      grad.addColorStop(0, '#1c1917');
      grad.addColorStop(0.5, '#292524');
      grad.addColorStop(1, '#0c0a09');
      break;
    case 'midnight-mosque':
    default:
      grad.addColorStop(0, '#020617');
      grad.addColorStop(0.5, '#0f172a');
      grad.addColorStop(1, '#020617');
      break;
  }

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1080, 1920);

  // Subtle decorative geometric framing
  ctx.strokeStyle = 'rgba(217, 119, 6, 0.2)';
  ctx.lineWidth = 2;
  ctx.strokeRect(40, 40, 1000, 1840);

  return canvas.toDataURL('image/jpeg', 0.9);
}
