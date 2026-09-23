import React from 'react';
import { Img, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';

interface AnimatedImageProps {
  imageUrl: string;
  preset: string;
}

export const AnimatedImage: React.FC<AnimatedImageProps> = ({ imageUrl, preset }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  let scale = 1;
  let opacity = 1;
  let translateX = 0;

  if (preset === 'peaceful') {
    scale = interpolate(frame, [0, durationInFrames], [1, 1.15]);
  } else if (preset === 'elegant') {
    scale = interpolate(frame, [0, durationInFrames], [1.1, 1.2]);
    translateX = interpolate(frame, [0, durationInFrames], [0, 50]);
  } else if (preset === 'minimal') {
    scale = interpolate(frame, [0, durationInFrames], [1, 1.05]);
  }

  return (
    <Img
      src={imageUrl}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${scale}) translateX(${translateX}px)`,
        opacity,
      }}
    />
  );
};
