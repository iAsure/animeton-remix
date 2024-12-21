import { Icon } from '@iconify/react';
import { motion, AnimatePresence } from 'framer-motion';

import usePlayerStore from '@stores/player';

const VideoPlayPauseOverlay = () => {
  const { playLastAction } = usePlayerStore();

  return (
    <AnimatePresence>
      {playLastAction && (
        <motion.div
          key={playLastAction}
          className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0], scale: [0.5, 1] }}
          exit={{ opacity: 0, scale: 1.5 }}
          transition={{ duration: 0.5, times: [0, 0.5, 1] }}
        >
          <div className="bg-black/50 rounded-full p-5 w-32 h-32 flex items-center justify-center">
            <Icon
              icon={playLastAction === 'pause' ? 'fluent:pause-48-filled' : 'fluent:play-48-filled'}
              className="text-white"
              width="64"
              height="64"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoPlayPauseOverlay;