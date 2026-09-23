import React from 'react';
import { AbsoluteFill, Audio, Sequence, useVideoConfig } from 'remotion';
import { AnimatedImage } from '../components/AnimatedImage';
import { TextOverlay } from '../components/TextOverlay';
import { WatermarkOverlay } from '../components/WatermarkOverlay';

export interface SoulVideoProps {
  imageUrl: string | null;
  text: string;
  watermark: any;
  audio: any;
  preset: string;
  durationSeconds: number;
}

export const SoulVideo: React.FC<SoulVideoProps> = ({
  imageUrl,
  text,
  watermark,
  audio,
  preset,
}) => {
  const { fps } = useVideoConfig();

  if (!imageUrl) return <AbsoluteFill style={{ backgroundColor: '#1a1a1a' }} />;

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000', overflow: 'hidden' }}>
      <AnimatedImage imageUrl={imageUrl} preset={preset} />
      
      {text && (
        <Sequence from={fps * 1}>
          <TextOverlay text={text} preset={preset} />
        </Sequence>
      )}

      {watermark?.enabled && watermark?.url && (
        <WatermarkOverlay settings={watermark} />
      )}

      {audio?.enabled && audio?.url && (
        <Audio src={audio.url} volume={audio.volume / 100} />
      )}
    </AbsoluteFill>
  );
};
