import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';

interface TextOverlayProps {
  text: string;
  preset: string;
}

export const TextOverlay: React.FC<TextOverlayProps> = ({ text, preset }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const isRtl = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/.test(text);

  let opacity = 1;
  let translateY = 0;

  if (preset === 'peaceful') {
    opacity = interpolate(frame, [0, fps * 2], [0, 1], { extrapolateRight: 'clamp' });
    translateY = interpolate(frame, [0, fps * 2], [20, 0], { extrapolateRight: 'clamp' });
  } else if (preset === 'elegant') {
    opacity = interpolate(frame, [0, fps * 3], [0, 1], { extrapolateRight: 'clamp' });
    translateY = spring({ frame, fps, config: { damping: 200 } }) * 20 - 20;
  } else if (preset === 'minimal') {
    opacity = interpolate(frame, [0, fps], [0, 1], { extrapolateRight: 'clamp' });
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px',
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(8px)',
          padding: '40px',
          borderRadius: '20px',
          color: 'white',
          fontSize: '48px',
          lineHeight: 1.6,
          textAlign: 'center',
          direction: isRtl ? 'rtl' : 'ltr',
          maxWidth: '100%',
          fontFamily: 'sans-serif',
          whiteSpace: 'pre-wrap',
        }}
      >
        {text}
      </div>
    </div>
  );
};
