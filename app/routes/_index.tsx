import { type MetaFunction } from '@remix-run/react';
import { useState, useRef, useCallback, useEffect } from 'react';
import { Progress } from '@nextui-org/react';
import { useTorrentStream } from '../hooks/useTorrentStream';
import { useSubtitles } from '../hooks/useSubtitles';

export const meta: MetaFunction = () => {
  return [
    { title: 'Animeton' },
    { name: 'description', content: 'Stream anime torrents directly!' },
  ];
};

export default function Index() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [torrentId] = useState('https://nyaa.si/download/1849578.torrent');
  const [isVideoReady, setIsVideoReady] = useState(false);

  const {
    torrent,
    progress,
    downloadSpeed,
    uploadSpeed,
    numPeers,
    downloaded,
    total,
    remaining,
  } = useTorrentStream(torrentId);

  const { loadSubtitlesFromFile } = useSubtitles(videoRef, isVideoReady);

  const handleVideoReady = useCallback(() => {
    setIsVideoReady(true);
  }, []);

  const handleVideoPlay = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.play().catch((error) => {
        console.error('Error playing video:', error);
      });
    }
  }, []);

  useEffect(() => {
    const handleTorrentServerDone = (event: any, data: any) => {
      const { url, filePath } = data;
      if (videoRef.current) {
        videoRef.current.src = url;
      }
    };

    window.api.onTorrentServerDone(handleTorrentServerDone);

    return () => {
      window.api.removeTorrentServerDone(handleTorrentServerDone);
    };
  }, []);

  return (
    <div className="dark flex flex-col justify-center items-center gap-4 min-h-screen bg-gray-100 p-4">
      <div className="mb-4 w-full max-w-4xl">
        <Progress
          color="secondary"
          aria-label="Loading..."
          className="w-full"
          value={progress}
        />
        <video
          id="output"
          ref={videoRef}
          className="w-full mt-4 rounded-lg shadow-lg"
          controls
          onCanPlay={handleVideoReady}
          onPlay={handleVideoPlay}
          crossOrigin="anonymous"
        />
      </div>
      <div className="bg-white rounded-lg shadow-md p-4 max-w-4xl w-full">
        <div className="mb-2">
          <span
            className={`font-semibold ${
              torrent?.done ? 'text-green-600' : 'text-blue-600'
            }`}
          >
            {torrent?.done ? 'Seeding' : 'Downloading'}
          </span>
          <a
            className="text-sm text-gray-600 hover:text-gray-800 ml-2 break-all"
            href={torrentId}
          >
            {torrentId}
          </a>
          <span
            className={`ml-2 ${
              torrent?.done ? 'text-green-600' : 'text-blue-600'
            }`}
          >
            {torrent?.done ? ' to ' : ' from '}
          </span>
          <span className="font-mono text-sm">{numPeers} peers</span>
        </div>
        <div className="text-sm text-gray-700">
          <span className="font-mono">{downloaded}</span>
          <span> of </span>
          <span className="font-mono">{total}</span>
          <span className="ml-2 text-gray-500">{remaining}</span>
          <div className="mt-1">
            <span className="mr-2">↓</span>
            <span className="font-mono">{downloadSpeed}/s</span>
            <span className="mx-2">/</span>
            <span className="mr-2">↑</span>
            <span className="font-mono">{uploadSpeed}/s</span>
          </div>
        </div>
      </div>
      <div className="w-full max-w-4xl">
        <input
          type="file"
          accept=".ass"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              loadSubtitlesFromFile(e.target.files[0]);
            }
          }}
          className="w-full p-2 border rounded-lg"
        />
      </div>
      {/* Uncomment if you want to show subtitle extraction status
      {isExtracting && <p>Extracting subtitles...</p>}
      {error && <p>Error extracting subtitles: {error.message}</p>}
      {subtitleTracks.map((track) => (
        <div key={track.number}>
          <h3>{track.name} ({track.language})</h3>
          <p>{track.subtitles.length} subtitles</p>
        </div>
      ))} */}
    </div>
  );
}
