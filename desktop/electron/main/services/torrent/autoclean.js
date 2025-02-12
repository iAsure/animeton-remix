import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import log from 'electron-log';
import { app } from 'electron';

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
    const mkvFiles = files.filter(file => file.endsWith('.mkv'));

    const filesToKeep = mkvFiles.filter(file => 
      Object.values(history.episodes).some(episode => 
        episode.episodeFileName === file
      )
    );

    const filesToDelete = mkvFiles.filter(file => !filesToKeep.includes(file));

    if (filesToKeep.length > 0) {
      log.info(`Keeping ${filesToKeep.length} MKV files from history:`, filesToKeep);
    }

    const deletions = filesToDelete.map(file => 
      fs.unlink(path.join(tempPath, file))
    );

    await Promise.all(deletions);
    log.info(`Cleaned up ${deletions.length} temporary MKV files`);
  } catch (error) {
    log.warn('Failed to cleanup temporary files:', error);
  }
}

export { cleanupTorrentFiles };
