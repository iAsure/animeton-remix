import { motion } from "framer-motion";

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

  const pulseTransition = {
    repeat: Infinity,
    duration: 2,
    ease: "easeInOut",
    times: [0, 0.5, 1]
  };

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
      style={{
        zIndex: 999,
      }}
    >
      <motion.img
        src="./anitorrent.png"
        width="128"
        height="128"
        animate={{ 
          opacity: [1, 0.4, 1],
          scale: [1, 0.95, 1]
        }}
        transition={pulseTransition}
      />

      <div className="mt-6 text-center text-gray-200 font-medium">
        <div className="flex flex-col items-center justify-center space-y-3">
          {Number(parsedProgress) > 0 && (
            <>
              <span className="text-3xl text-white font-semibold">
                {parsedProgress}% | Descargando...
              </span>

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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoSpinner;
