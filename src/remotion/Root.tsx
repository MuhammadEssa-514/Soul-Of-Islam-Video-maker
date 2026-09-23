import React from 'react';
import { Composition } from 'remotion';
import { SoulVideo, SoulVideoProps } from './compositions/SoulVideo';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="SoulVideo"
        component={SoulVideo as React.FC<any>}
        durationInFrames={30 * 90}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{
          imageUrl: null,
          text: '',
          watermark: null,
          audio: null,
          preset: 'peaceful',
          durationSeconds: 90,
        } as SoulVideoProps}
      />
    </>
  );
};
