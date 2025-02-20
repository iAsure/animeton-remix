import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import log from 'electron-log';
import { app } from 'electron';
import levenshtein from 'fast-levenshtein';
import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';

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

    const historyEpisodes = Object.entries(history.episodes)
      .filter(([_, episode]) => episode?.episodeFileName && !episode.progressData.completed)
      .map(([infoHash, episode]) => ({
        fileName: episode.episodeFileName,
        torrentUrl: episode.episodeTorrentUrl,
        infoHash
      }))
      .filter(Boolean);
    log.info('historyEpisodes', historyEpisodes);

    const SIMILARITY_THRESHOLD = 3;
    const torrentsToAdd = [];

    const filesToKeep = mkvFiles.filter((mkvFile) => {
      if (!mkvFile) return false;

      const normalizedMkvFile = normalizeFileName(String(mkvFile));

      const distances = historyEpisodes
        .map((episode) => {
          const normalizedHistoryFile = normalizeFileName(String(episode.fileName));
          return {
            episode,
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

      if (mostSimilar.distance <= SIMILARITY_THRESHOLD) {
        torrentsToAdd.push({
          torrentUrl: mostSimilar.episode.torrentUrl,
          torrentHash: mostSimilar.episode.infoHash
        });
        return true;
      }

      return false;
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

    return torrentsToAdd;
  } catch (error) {
    log.warn('Failed to cleanup temporary files:', error);
    return [];
  }
}

export { cleanupTorrentFiles };
