import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import log from 'electron-log';
import { app } from 'electron';
import { IPC_CHANNELS } from '../../../shared/constants/event-channels.js';

function normalizeFileName(fileName) {
  return fileName
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\.mkv$/i, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
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
      .filter(([_, episode]) => {
        const isIncomplete = !episode?.progressData?.completed;
        const hasRequiredInfo = episode?.episodeFileName && 
                              episode?.episodeTorrentUrl && 
                              episode?.progressData;
        return isIncomplete && hasRequiredInfo;
      })
      .map(([infoHash, episode]) => ({
        fileName: episode.episodeFileName,
        normalizedName: normalizeFileName(episode.episodeFileName),
        torrentUrl: episode.episodeTorrentUrl,
        infoHash,
        lastWatched: episode.progressData.lastWatched || 0,
        progress: episode.progressData.progress || 0,
        episodeNumber: episode.episodeNumber
      }))
      .filter(Boolean);

    log.info('historyEpisodes', historyEpisodes);

    const torrentsToAdd = new Map();

    const filesToKeep = mkvFiles.filter((mkvFile) => {
      if (!mkvFile) return false;

      const normalizedMkvFile = normalizeFileName(String(mkvFile));

      const matchingEpisode = historyEpisodes.find(episode => 
        episode.normalizedName === normalizedMkvFile
      );

      if (matchingEpisode) {
        log.info(`Match found for ${mkvFile}:`, {
          normalizedMkvFile,
          historyFile: matchingEpisode.normalizedName,
          episodeNumber: matchingEpisode.episodeNumber
        });

        const shouldResume = matchingEpisode.progress > 0 && matchingEpisode.progress < 0.9;
        
        if (shouldResume && !torrentsToAdd.has(matchingEpisode.infoHash)) {
          torrentsToAdd.set(matchingEpisode.infoHash, {
            torrentUrl: matchingEpisode.torrentUrl,
            torrentHash: matchingEpisode.infoHash,
            fileName: mkvFile,
            progress: matchingEpisode.progress,
            lastWatched: matchingEpisode.lastWatched,
            episodeNumber: matchingEpisode.episodeNumber
          });
        }
        return true;
      }

      log.info(`No match found for ${mkvFile}:`, {
        normalizedMkvFile
      });
      return false;
    });

    const torrentsArray = Array.from(torrentsToAdd.values());

    log.info('filesToKeep', filesToKeep);
    log.info('torrentsToAdd', {
      count: torrentsArray.length,
      details: torrentsArray.map(t => ({
        fileName: t.fileName,
        progress: t.progress,
        lastWatched: new Date(t.lastWatched).toISOString(),
        episodeNumber: t.episodeNumber
      }))
    });

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

    return torrentsArray.sort((a, b) => b.lastWatched - a.lastWatched);
  } catch (error) {
    log.error('Failed to cleanup temporary files:', error);
    return [];
  }
}

export { cleanupTorrentFiles };
