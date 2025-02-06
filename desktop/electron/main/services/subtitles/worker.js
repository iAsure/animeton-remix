import { parentPort } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';

async function parseMkvMetadata(filePath) {
  if (!fs.existsSync(filePath)) {
    log.error('File not found:', filePath);
    throw new Error('File not found: ' + path.basename(filePath));
  }

  const { default: Metadata } = await import('matroska-metadata');
  log.info('Initializing parser for file:', path.basename(filePath));

  const file = {
    name: path.basename(filePath),
    stream: () => fs.createReadStream(filePath),
    [Symbol.asyncIterator]: async function* () {
      const stream = this.stream();
      for await (const chunk of stream) {
        yield chunk;
      }
    },
  };

  const metadata = new Metadata(file);
  const result = {
    subtitles: {},
    chapters: []
  };

  try {
    const tracks = await metadata.getTracks();
    tracks.forEach((track) => {
      result.subtitles[track.number] = { track, cues: [] };
    });

    // Get chapters
    result.chapters = await metadata.getChapters();

    metadata.on('subtitle', (subtitle, trackNumber) => {
      if (result.subtitles[trackNumber]) {
        result.subtitles[trackNumber].cues.push(subtitle);
      }
    });

    if (file.name.endsWith('.mkv') || file.name.endsWith('.webm')) {
      const fileStream = file[Symbol.asyncIterator]();
      await processStream(metadata, fileStream).catch(() => {});
      return result;
    } else {
      throw new Error('Unsupported file format: ' + file.name);
    }
  } catch (error) {
    log.error('Error parsing MKV metadata:', error);
    throw error;
  }
}

async function processStream(metadata, fileStream) {
  for await (const chunk of metadata.parseStream(fileStream)) {
    // Process chunks
  }
}

// Message handler
let isProcessing = false;

parentPort?.on('message', async ({ filePath }) => {
  if (isProcessing) {
    log.info('Already processing a file, skipping...');
    return;
  }

  if (!filePath) {
    log.error('No file path provided to worker');
    parentPort?.postMessage({
      type: 'error',
      error: 'No file path provided'
    });
    return;
  }

  try {
    isProcessing = true;
    const result = await parseMkvMetadata(filePath);
    
    parentPort?.postMessage({
      type: 'complete',
      data: {
        subtitles: result.subtitles,
        chapters: result.chapters
      }
    });
  } catch (error) {
    log.error('Subtitle extraction failed:', error);
    parentPort?.postMessage({
      type: 'error',
      error: error.message || 'Unknown error in subtitle worker'
    });
  } finally {
    isProcessing = false;
  }
});
