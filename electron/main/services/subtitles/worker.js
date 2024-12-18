import { parentPort } from 'worker_threads';
import fs from 'fs';
import path from 'path';
import log from 'electron-log';

async function parseSubtitles(filePath) {
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
      await processStream(metadata, fileStream);
      return subtitles;
    } else {
      throw new Error('Unsupported file format: ' + file.name);
    }
  } catch (error) {
    log.error('Error parsing subtitles:', error);
    throw error;
  }
}

async function processStream(metadata, fileStream) {
  try {
    for await (const chunk of metadata.parseStream(fileStream)) {
      // Process chunks
    }
  } catch (error) {
    log.warn('Error parsing subtitle chunk:', error);
    // Continue processing despite errors
  }
}

// Message handler
parentPort?.on('message', async ({ filePath }) => {
  log.info('Subtitle worker received file:', filePath);
  try {
    const allSubtitles = await parseSubtitles(filePath);

    parentPort?.postMessage({
      type: 'complete',
      data: allSubtitles,
    });
  } catch (error) {
    log.error('Subtitle extraction failed:', error);
    parentPort?.postMessage({
      type: 'error',
      error: error.message,
    });
  }
});
