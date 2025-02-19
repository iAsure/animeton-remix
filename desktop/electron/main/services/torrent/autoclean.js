import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import log from 'electron-log';
import { app } from 'electron';
import levenshtein from 'fast-levenshtein';

function normalizeFileName(fileName) {
  return fileName
    .replace(/\[.*?\]/g, '')
    .replace('.mkv', '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function cleanupTorrentFiles() {
  try {
    const tempPath = path.join(os.tmpdir(), 'webtorrent');
    const historyPath = path.join(app.getPath('userData'), 'history.json');

    let history;
    try {
      const historyData = await fs.readFile(historyPath, 'utf-8');
      history = JSON.parse(historyData);
    } catch (error) {
      log.warn('No history file found, cleaning all MKV files');
      history = { episodes: {} };
    }

    const files = await fs.readdir(tempPath);
    const mkvFiles = files.filter((file) => file?.endsWith('.mkv'));
    log.info('mkvFiles', mkvFiles);

    const historyFileNames = Object.values(history.episodes)
      .map((episode) => episode?.episodeFileName)
      .filter(Boolean);
    log.info('historyFileNames', historyFileNames);

    const SIMILARITY_THRESHOLD = 3;
    const filesToKeep = mkvFiles.filter((mkvFile) => {
      if (!mkvFile) return false;

      const normalizedMkvFile = normalizeFileName(String(mkvFile));

      const distances = historyFileNames
        .filter((historyFile) => typeof historyFile === 'string')
        .map((historyFile) => {
          const normalizedHistoryFile = normalizeFileName(String(historyFile));
          return {
            historyFile,
            normalizedHistoryFile,
            distance: levenshtein.get(normalizedMkvFile, normalizedHistoryFile),
          };
        });

      if (distances.length === 0) return false;

      const mostSimilar = distances.reduce(
        (min, current) => (current.distance < min.distance ? current : min),
        { distance: Infinity }
      );

      log.info(`Distance for ${mkvFile}:`, {
        normalizedMkvFile,
        mostSimilar,
      });

      return mostSimilar.distance <= SIMILARITY_THRESHOLD;
    });

    log.info('filesToKeep', filesToKeep);

    if (filesToKeep.length > 0) {
      log.info(
        `Keeping ${filesToKeep.length} MKV files from history:`,
        filesToKeep
      );
    }

    const filesToDelete = mkvFiles.filter(
      (file) => !filesToKeep.includes(file)
    );
    const deletions = filesToDelete.map((file) =>
      fs.unlink(path.join(tempPath, file))
    );

    await Promise.all(deletions);
    log.info(`Cleaned up ${deletions.length} temporary MKV files`);
  } catch (error) {
    log.warn('Failed to cleanup temporary files:', error);
  }
}

export { cleanupTorrentFiles };
