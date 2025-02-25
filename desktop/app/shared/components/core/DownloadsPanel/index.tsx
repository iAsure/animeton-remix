import { Divider } from '@nextui-org/react';
import useDownloads from '@hooks/user/useDownloads';
import AnimeDownloadCard from './AnimeDownloadCard';
import { Icon } from '@iconify/react';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnimeGroup {
  animeId: number;
  animeName: string;
  animeImage: string;
  episodes: any[];
}

const groupDownloadsByAnime = (downloads: any[]): AnimeGroup[] => {
  const groups = downloads.reduce((acc, download) => {
    const animeId = download.episodeInfo.animeIdAnilist;
    if (!acc[animeId]) {
      acc[animeId] = {
        animeId,
        animeName: download.episodeInfo.animeName,
        animeImage: download.episodeInfo.animeImage,
        episodes: []
      };
    }
    acc[animeId].episodes.push(download);
    return acc;
  }, {} as Record<number, AnimeGroup>);

  return Object.values(groups);
};

const DownloadsPanel = ({ isOpen, onClose }: SidePanelProps) => {
  const { visualDownloads, hasVisualDownloads } = useDownloads();
  const animeGroups = groupDownloadsByAnime(visualDownloads);

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 transition-opacity duration-300 z-[9998] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-80 bg-black border-l border-zinc-800 transform transition-transform duration-300 ease-in-out z-[9999] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6 h-full">
          <h2 className="text-xl font-bold text-white mb-4">
            Descargas {hasVisualDownloads ? `(${visualDownloads.length})` : ''}
          </h2>
          <Divider />
          {!hasVisualDownloads ? (
            <div className="flex flex-col items-center justify-center h-[calc(100%-6rem)] text-zinc-500 text-sm">
              <Icon icon="material-symbols:download-done" className="text-4xl mb-2" />
              <span>No hay descargas activas</span>
            </div>
          ) : (
            <div className="relative h-[calc(100%-6rem)]">
              <div className="h-full mt-4 space-y-4 overflow-y-auto pr-2">
                {animeGroups.map(group => (
                  <AnimeDownloadCard key={group.animeId} animeGroup={group} />
                ))}
              </div>
              <div className="absolute bottom-0 left-0 right-2 h-12 bg-gradient-to-t from-black to-transparent pointer-events-none" />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DownloadsPanel;
