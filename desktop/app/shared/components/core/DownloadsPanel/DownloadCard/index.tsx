import { prettyBytes } from '@utils/strings';
import { Button } from '@nextui-org/react';

const DownloadCard = ({ downloadData }) => {
  return (
    <div
      key={downloadData.episodeId}
      className="text-white bg-zinc-900 p-3 rounded-md hover:bg-zinc-800/50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <img
          src={downloadData.episodeInfo.animeImage}
          alt={downloadData.episodeInfo.animeName}
          width={64}
          height={64}
          className="aspect-square object-cover rounded-md"
        />
        <div className="flex flex-col gap-0.5 w-full min-w-0">
          <div className="font-medium truncate text-sm">
            {downloadData.episodeInfo.animeName}
          </div>
          <div className="text-xs text-zinc-400">
            Episodio {downloadData.episodeInfo.episodeNumber}
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-rounded text-sm">download</span>
              {prettyBytes(downloadData.progress.downloadSpeed)}/s
            </span>
            <span className="flex items-center gap-0.5">
              <span className="material-symbols-rounded text-sm">upload</span>
              {prettyBytes(downloadData.progress.uploadSpeed)}/s
            </span>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex-1">
          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#ff5680] transition-all duration-300"
              style={{
                width: `${Math.round(downloadData.progress.progress * 100)}%`,
              }}
            />
          </div>
          <div className="mt-1 text-xs text-zinc-500 flex justify-between">
            <span>{Math.round(downloadData.progress.progress * 100)}%</span>
            <span>{downloadData.progress.remaining}</span>
          </div>
        </div>

        <div className="flex gap-1">
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <span className="material-symbols-rounded text-lg">pause</span>
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="flat"
            className="bg-zinc-800 text-zinc-400 hover:text-red-500"
          >
            <span className="material-symbols-rounded text-lg">close</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DownloadCard;
