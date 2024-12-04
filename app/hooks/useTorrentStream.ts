import { useState, useEffect } from 'react'
import log from 'electron-log';

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

function prettyBytes(num: number) {
  const units = ['B', 'kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
  const neg = num < 0
  if (neg) num = -num
  if (num < 1) return (neg ? '-' : '') + num + ' B'
  const exponent = Math.min(
    Math.floor(Math.log(num) / Math.log(1000)),
    units.length - 1
  )
  const unit = units[exponent]
  num = Number((num / Math.pow(1000, exponent)).toFixed(2))
  return (neg ? '-' : '') + num + ' ' + unit
}

export { useTorrentStream }
