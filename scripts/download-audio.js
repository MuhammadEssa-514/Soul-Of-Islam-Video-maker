const fs = require('fs');
const path = require('path');
const https = require('https');

const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

const tracks = [
  { id: '1', file: 'Background Nasheed 1.mp3', out: 'nasheed-1.mp3', title: 'Viral Nasheed Slowed & Reverb' },
  { id: '2', file: 'Background Nasheed 2.mp3', out: 'nasheed-2.mp3', title: 'Emotional Arabic Vocal Ahat' },
  { id: '3', file: 'Background Nasheed 10.mp3', out: 'nasheed-3.mp3', title: 'Deep Spiritual Reflection' },
  { id: '4', file: 'Background Nasheed 11.mp3', out: 'nasheed-4.mp3', title: 'Peaceful Morning Dhikr Tone' },
  { id: '5', file: 'Background Nasheed 12.mp3', out: 'nasheed-5.mp3', title: 'Cinematic Heartfelt Melody' },
  { id: '6', file: 'Background Nasheed 15.mp3', out: 'nasheed-6.mp3', title: 'Calm Quranic Ambient Sound' },
  { id: '7', file: 'Background Nasheed 16.mp3', out: 'nasheed-7.mp3', title: 'TikTok Trending Arabic Flow' },
  { id: '8', file: 'Background Nasheed 17.mp3', out: 'nasheed-8.mp3', title: 'Sacred Harmony & Calm' },
  { id: '9', file: 'Background Nasheed 18.mp3', out: 'nasheed-9.mp3', title: 'Soulful Medina Vibes' },
  { id: '10', file: 'Background Nasheed 19.mp3', out: 'nasheed-10.mp3', title: 'Ethereal Islamic Echoes' },
];

function download(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}: status ${res.statusCode}`));
      }
      const fileStream = fs.createWriteStream(dest);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve();
      });
      fileStream.on('error', reject);
    }).on('error', reject);
  });
}

async function main() {
  console.log('Downloading 10 Arabic TikTok Trending Nasheeds...');
  for (const t of tracks) {
    const url = `https://archive.org/download/background-nasheed-collection/${encodeURIComponent(t.file)}`;
    const dest = path.join(audioDir, t.out);
    try {
      console.log(`Downloading ${t.title} -> ${t.out}...`);
      await download(url, dest);
      const stat = fs.statSync(dest);
      console.log(`✓ Saved ${t.out} (${stat.size} bytes)`);
    } catch (err) {
      console.error(`Failed ${t.out}:`, err.message);
    }
  }
  console.log('Done downloading tracks!');
}

main();
