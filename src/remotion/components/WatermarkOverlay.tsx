import React from 'react';
import { Img } from 'remotion';

interface WatermarkOverlayProps {
  settings: any;
}

export const WatermarkOverlay: React.FC<WatermarkOverlayProps> = ({ settings }) => {
  const getPositionStyles = () => {
    const margin = '60px';
    switch (settings.position) {
      case 'top-left': return { top: margin, left: margin };
      case 'top-center': return { top: margin, left: '50%', transform: 'translateX(-50%)' };
      case 'top-right': return { top: margin, right: margin };
      case 'center-left': return { top: '50%', left: margin, transform: 'translateY(-50%)' };
      case 'center': return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' };
      case 'center-right': return { top: '50%', right: margin, transform: 'translateY(-50%)' };
      case 'bottom-left': return { bottom: margin, left: margin };
      case 'bottom-center': return { bottom: margin, left: '50%', transform: 'translateX(-50%)' };
      case 'bottom-right': return { bottom: margin, right: margin };
      default: return { bottom: margin, right: margin };
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        ...getPositionStyles(),
        opacity: settings.opacity / 100,
        width: `${settings.scale * 2}px`, // basic scaling logic
        maxWidth: '400px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Img
        src={settings.url}
        style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
      />
    </div>
  );
};
