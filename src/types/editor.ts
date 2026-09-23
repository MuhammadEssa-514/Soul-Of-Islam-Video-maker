export interface WatermarkSettings {
  enabled: boolean;
  url: string | null;
  position: 'top-left' | 'top-center' | 'top-right' | 'center-left' | 'center' | 'center-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
  opacity: number;
  scale: number;
}

export const defaultWatermarkSettings: WatermarkSettings = {
  enabled: true,
  url: null,
  position: 'bottom-right',
  opacity: 80,
  scale: 100,
};

export interface VideoConfig {
  preset: 'peaceful' | 'elegant' | 'minimal';
  durationSeconds: number; // 30, 90, 180
}

export const defaultVideoConfig: VideoConfig = {
  preset: 'peaceful',
  durationSeconds: 90,
};

export interface AudioSettings {
  enabled: boolean;
  url: string | null;
  volume: number;
}

export const defaultAudioSettings: AudioSettings = {
  enabled: false,
  url: null,
  volume: 50,
};
