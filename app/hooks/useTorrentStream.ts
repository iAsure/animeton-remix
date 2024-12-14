import { useState, useEffect } from 'react';
import log from 'electron-log';

import { prettyBytes } from '@/shared/utils/strings';

function useTorrentStream(torrentId: string) {
  const [torrent, setTorrent] = useState<any>(null)
  const [progress, setProgress] = useState<number>(0)
  const [downloadSpeed, setDownloadSpeed] = useState<string>('0 b/s')
  const [uploadSpeed, setUploadSpeed] = useState<string>('0 b/s')
  const [numPeers, setNumPeers] = useState<number>(0)
  const [downloaded, setDownloaded] = useState<string>('0 B')
  const [total, setTotal] = useState<string>('0 B')
  const [remaining, setRemaining] = useState<string>('Remaining')

  useEffect(() => {
    log.info('Starting torrent stream', { torrentId });
    window.api.addTorrent(torrentId)

    const handleTorrentProgress = (event: any, data: any) => {
      // log.debug('Torrent progress update', {
      //   progress: Math.round(data.progress * 100 * 100) / 100,
      //   downloadSpeed: prettyBytes(data.downloadSpeed) + '/s',
      //   peers: data.numPeers
      // });

      const {
        numPeers,
        downloaded,
        total,
        progress,
        downloadSpeed,
        uploadSpeed,
        remaining
      } = data

      setNumPeers(numPeers)
      setDownloaded(prettyBytes(downloaded))
      setTotal(prettyBytes(total))
      setProgress(Math.round(progress * 100 * 100) / 100)
      setDownloadSpeed(prettyBytes(downloadSpeed) + '/s')
      setUploadSpeed(prettyBytes(uploadSpeed) + '/s')
      setRemaining(remaining)
    }

    const handleTorrentDone = () => {
      log.info('Torrent download completed', { torrentId });
      document.body.className += ' is-seed'
    }

    const handleTorrentError = (event: any, data: any) => {
      log.error('Torrent error occurred', { 
        torrentId, 
        error: data.message 
      });
      console.error('Torrent error:', data.message)
      alert('Error: ' + data.message)
    }

    window.api.torrent.onProgress.subscribe(handleTorrentProgress)
    window.api.torrent.onDone.subscribe(handleTorrentDone)
    window.api.torrent.onError.subscribe(handleTorrentError)

    return () => {
      log.info('Cleaning up torrent stream', { torrentId });
      window.api.torrent.onProgress.unsubscribe(handleTorrentProgress)
      window.api.torrent.onDone.unsubscribe(handleTorrentDone)
      window.api.torrent.onError.unsubscribe(handleTorrentError)
    }
  }, [torrentId])

  return {
    torrent,
    progress,
    downloadSpeed,
    uploadSpeed,
    numPeers,
    downloaded,
    total,
    remaining
  }
}

export { useTorrentStream }
