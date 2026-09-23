import { createWorker } from 'tesseract.js';

export async function extractText(imageUrl: string, languages: string = 'ara+urd+eng'): Promise<string> {
  const worker = await createWorker(languages);
  try {
    const { data: { text } } = await worker.recognize(imageUrl);
    return text;
  } finally {
    await worker.terminate();
  }
}
