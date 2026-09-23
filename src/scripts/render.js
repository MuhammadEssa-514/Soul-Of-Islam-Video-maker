// Standalone render script — runs in its own Node.js process, NOT inside Next.js webpack.
// Called from the API route via child_process.fork().

const path = require('path');
const fs = require('fs');

async function render() {
  // Read args from environment
  const propsPath = process.env.RENDER_PROPS_PATH;
  const outputPath = process.env.RENDER_OUTPUT_PATH;

  if (!propsPath || !outputPath) {
    console.error(JSON.stringify({ error: 'Missing RENDER_PROPS_PATH or RENDER_OUTPUT_PATH' }));
    process.exit(1);
  }

  const inputProps = JSON.parse(fs.readFileSync(propsPath, 'utf-8'));

  const durationSeconds = inputProps.durationSeconds || 90;
  const fps = 30;
  const durationInFrames = durationSeconds * fps;

  try {
    const { bundle } = require('@remotion/bundler');
    const { renderMedia, selectComposition } = require('@remotion/renderer');

    console.error(JSON.stringify({ status: 'bundling' }));

    const bundleLocation = await bundle({
      entryPoint: path.join(__dirname, '..', 'remotion', 'index.ts'),
      webpackOverride: (config) => config,
    });

    console.error(JSON.stringify({ status: 'selecting_composition' }));

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id: 'SoulVideo',
      inputProps,
    });

    composition.durationInFrames = durationInFrames;
    composition.fps = fps;
    composition.width = 1080;
    composition.height = 1920;

    console.error(JSON.stringify({ status: 'rendering' }));

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress }) => {
        console.error(JSON.stringify({ status: 'progress', progress: Math.round(progress * 100) }));
      },
    });

    console.log(JSON.stringify({ success: true, outputPath }));
    process.exit(0);
  } catch (err) {
    console.error(JSON.stringify({ error: err.message || 'Rendering failed' }));
    process.exit(1);
  }
}

render();
