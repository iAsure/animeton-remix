import { useState, useEffect } from 'react';

export const useUpdateDownload = () => {
  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    const handleUpdateDownloaded = () => {
      setUpdateDownloaded(true);
      // posthog?.capture('update_downloaded');
    };

    // eventBus.on('updateDownloaded', handleUpdateDownloaded);

    return () => {
      // eventBus.off('updateDownloaded', handleUpdateDownloaded);
    };
  }, []);

  const handleUpdateClick = () => {
    // eventBus.emit('modalOpen', 'updateDownloaded');
  };

  return {
    updateDownloaded,
    handleUpdateClick,
  };
};
