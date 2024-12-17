import { Icon } from '@iconify/react';
import { prettyBytes } from '@utils/strings';

interface VideoSpinnerProps {
  progress: number;
  downloadSpeed: string;
  uploadSpeed: string;
}

const VideoSpinner = ({
  progress,
  downloadSpeed,
  uploadSpeed,
}: VideoSpinnerProps) => {
  const parsedProgress = Number(progress).toFixed(0);

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <Icon
        icon="fluent:spinner-ios-16-filled"
        width="128"
        height="128"
        className="animate-spin text-white/90"
      />

      <div className="mt-6 text-center text-gray-200 font-medium">
        <div className="flex flex-col items-center justify-center space-y-3">
          <span className="text-3xl text-white font-semibold">
            {parsedProgress}% | Descargando...
          </span>

          {/* Speed and peers info */}
          <div className="flex items-center space-x-4 text-base text-gray-400">
            <span className="flex items-center">
              <span className="mr-1">↓</span>
              {downloadSpeed}
            </span>
            <span className="flex items-center">
              <span className="mr-1">↑</span>
              {uploadSpeed}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoSpinner;
