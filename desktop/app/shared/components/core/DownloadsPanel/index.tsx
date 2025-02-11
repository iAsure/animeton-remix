import { Divider } from '@nextui-org/react';
import useDownloads from '@hooks/useDownloads';
import DownloadCard from './DownloadCard';

interface SidePanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const DownloadsPanel = ({ isOpen, onClose }: SidePanelProps) => {
  const { downloads, hasActiveDownloads } = useDownloads();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 transition-opacity duration-300 z-[9998] ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed right-0 top-14 h-[calc(100vh-3.5rem)] w-80 bg-zinc-950 border-l border-zinc-800 transform transition-transform duration-300 ease-in-out z-[9999] ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            Descargas {hasActiveDownloads ? `(${downloads.length})` : ''}
          </h2>
          <Divider />
          <div className="mt-4 space-y-4">
            {downloads.map((download) => (
              <DownloadCard key={download.episodeId} downloadData={download} />
            ))}

            {!hasActiveDownloads && (
              <div className="text-zinc-500 text-center">
                No hay descargas activas
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DownloadsPanel;
