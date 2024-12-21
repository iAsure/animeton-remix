import path from 'path';
import os from 'os';
import { promises as fs } from 'fs';
import log from 'electron-log';

async function cleanupTorrentFiles() {
  try {
    const tempPath = path.join(os.tmpdir(), 'webtorrent');
    const files = await fs.readdir(tempPath);

    const deletions = files
      .filter((file) => file.endsWith('.mkv'))
      .map((file) => fs.unlink(path.join(tempPath, file)));

    await Promise.all(deletions);
    log.info(`Cleaned up ${deletions.length} temporary MKV files`);
  } catch (error) {
    log.warn('Failed to cleanup temporary files:', error);
  }
}

export { cleanupTorrentFiles };
