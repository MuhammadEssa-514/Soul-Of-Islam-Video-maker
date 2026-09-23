import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';

export const maxDuration = 300;

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { imageUrl, text, watermark, videoConfig, audio } = payload;

    if (!imageUrl) {
      return NextResponse.json({ error: 'No image provided.' }, { status: 400 });
    }

    const durationSeconds = videoConfig?.durationSeconds || 90;
    const videoId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const outputDir = path.join(process.cwd(), 'public', 'out');
    const outputPath = path.join(outputDir, `${videoId}.mp4`);
    const propsPath = path.join(outputDir, `${videoId}.json`);

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const inputProps = {
      imageUrl,
      text: text || '',
      watermark: watermark || null,
      audio: audio || null,
      preset: videoConfig?.preset || 'peaceful',
      durationSeconds,
    };
    fs.writeFileSync(propsPath, JSON.stringify(inputProps));

    const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'render.js');

    // Use exec with env vars to avoid Turbopack trying to resolve the script as a module
    const command = `node "${scriptPath}"`;

    const result = await new Promise<string>((resolve, reject) => {
      exec(
        command,
        {
          env: {
            ...process.env,
            RENDER_PROPS_PATH: propsPath,
            RENDER_OUTPUT_PATH: outputPath,
          },
          maxBuffer: 50 * 1024 * 1024,
          timeout: 5 * 60 * 1000,
          cwd: process.cwd(),
        },
        (error, stdout, stderr) => {
          try { fs.unlinkSync(propsPath); } catch {}

          if (error) {
            // Try to extract a useful error message from stderr
            let msg = 'Rendering failed.';
            try {
              const lines = stderr.split('\n').filter(Boolean);
              for (const line of lines) {
                const parsed = JSON.parse(line);
                if (parsed.error) { msg = parsed.error; break; }
              }
            } catch {}
            reject(new Error(msg));
          } else {
            resolve(stdout);
          }
        }
      );
    });

    if (!fs.existsSync(outputPath)) {
      throw new Error('Video file was not created.');
    }

    return NextResponse.json({ url: `/out/${videoId}.mp4` });
  } catch (err: any) {
    console.error('Render error:', err);
    return NextResponse.json(
      { error: `Video generation failed. ${err?.message || 'Please try with a smaller image or shorter duration.'}` },
      { status: 500 }
    );
  }
}
