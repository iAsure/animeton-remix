import { parentPort } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';

let isProcessing = false;

async function parseSubtitles(filePath) {
  if (isProcessing) {
    return null;
  }
  isProcessing = true;

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
  const subtitles = {};

  try {
    const tracks = await metadata.getTracks();
    tracks.forEach((track) => {
      subtitles[track.number] = { track, cues: [] };
    });

    metadata.on('subtitle', (subtitle, trackNumber) => {
      if (subtitles[trackNumber]) {
        subtitles[trackNumber].cues.push(subtitle);
      }
    });

    if (file.name.endsWith('.mkv') || file.name.endsWith('.webm')) {
      const fileStream = file[Symbol.asyncIterator]();
      await processStream(metadata, fileStream).catch(() => {});
      return subtitles;
    } else {
      throw new Error('Unsupported file format: ' + file.name);
    }
  } catch (error) {
    log.error('Error parsing subtitles:', error);
    throw error;
  } finally {
    isProcessing = false;
  }
}

async function processStream(metadata, fileStream) {
  for await (const chunk of metadata.parseStream(fileStream)) {
    // Process chunks
  }
}

// Message handler
parentPort?.on('message', async ({ filePath }) => {
  log.info('Subtitle worker received file:', filePath);
  
  // Add validation for filePath
  if (!filePath) {
    log.error('No file path provided to worker');
    parentPort?.postMessage({
      type: 'error',
      error: 'No file path provided'
    });
    return;
  }

  try {
    const allSubtitles = await parseSubtitles(filePath);
    
    // Validate subtitles result
    if (!allSubtitles || Object.keys(allSubtitles).length === 0) {
      throw new Error('No subtitles found in file');
    }

    log.info('Subtitles extracted successfully:', Object.keys(allSubtitles).length, 'tracks found');
    
    parentPort?.postMessage({
      type: 'complete',
      data: allSubtitles,
    });
  } catch (error) {
    log.error('Subtitle extraction failed:', error);
    parentPort?.postMessage({
      type: 'error',
      error: error.message || 'Unknown error in subtitle worker'
    });
  }
});
