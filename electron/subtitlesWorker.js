import { parentPort } from 'worker_threads';
import fs from 'fs';
import path from 'path';

console.log('Subtitles worker started');

async function parseSubtitles(filePath) {
  const { default: Metadata } = await import('matroska-metadata');
  console.log('Initializing parser for file: ' + path.basename(filePath));

  const file = {
    name: path.basename(filePath),
    stream: () => fs.createReadStream(filePath),
    [Symbol.asyncIterator]: async function* () {
      const stream = this.stream();
      for await (const chunk of stream) {
        yield chunk;
      }
    }
  };

  const metadata = new Metadata(file);
  const subtitles = {};

  try {
    const tracks = await metadata.getTracks();

    tracks.forEach(track => {
      subtitles[track.number] = {
        track: track,
        cues: []
      };
    });

    metadata.on('subtitle', (subtitle, trackNumber) => {
      if (subtitles[trackNumber]) {
        subtitles[trackNumber].cues.push(subtitle);
      }
    });

    if (file.name.endsWith('.mkv') || file.name.endsWith('.webm')) {
      const fileStream = file[Symbol.asyncIterator]();
      
      // Without this, the code doesn't work
      try {
        for await (const chunk of metadata.parseStream(fileStream)) {
        }
      } catch (error) {
        console.warn('Error parsing subtitle chunk:', error);
        // Ignore the error and continue processing
      }

      console.log('Finished parsing subtitles');
      return subtitles;
    } else {
      throw new Error('Unsupported file format: ' + file.name);
    }
  } catch (error) {
    console.error('Error parsing subtitles:', error);
    throw error;
  }
}

if (parentPort) {
  parentPort.on('message', async ({ filePath }) => {
    try {
      console.log('Worker processing file:', filePath);
      const subtitles = await parseSubtitles(filePath);
      parentPort.postMessage({ 
        type: 'complete',
        data: subtitles
      });
    } catch (error) {
      console.error('Worker error:', error);
      parentPort.postMessage({ 
        type: 'error',
        error: error.message 
      });
    }
  });
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception in worker:', error);
  parentPort?.postMessage({ 
    type: 'error',
    error: error.message 
  });
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection in worker:', reason);
  parentPort?.postMessage({ 
    type: 'error',
    error: reason?.message || 'Unhandled promise rejection'
  });
});
