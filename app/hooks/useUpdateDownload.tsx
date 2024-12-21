import { useEffect, useState } from 'react';
import { useModal } from '@context/ModalContext';

import UpdateDownloadedModal from '@components/modals/UpdateDownloaded';

const useUpdateDownload = () => {
  const { openModal } = useModal();

  const [updateDownloaded, setUpdateDownloaded] = useState(false);

  useEffect(() => {
    const handleUpdateDownloaded = () => {
      setUpdateDownloaded(true);
    };

    window.api.updater.onDownloaded.subscribe(handleUpdateDownloaded);

    return () => {
      window.api.updater.onDownloaded.unsubscribe(handleUpdateDownloaded);
    };
  }, []);

  const handleUpdateClick = () => {
    openModal('update-downloaded', ({ onClose }) => (
      <UpdateDownloadedModal onClose={onClose} />
    ));
  };

  return { updateDownloaded, handleUpdateClick };
}

export default useUpdateDownload;
