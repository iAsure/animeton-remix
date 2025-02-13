import { useEffect, useState } from 'react';
import { IPC_CHANNELS } from '@electron/constants/event-channels';

const useWindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Get initial maximized state
    window.electron.ipc.invoke(IPC_CHANNELS.WINDOW.IS_MAXIMIZED)
      .then(setIsMaximized)
      .catch(console.error);

    // Setup event listeners
    const handleMaximize = () => setIsMaximized(true);
    const handleUnmaximize = () => setIsMaximized(false);
    const handleResize = async () => {
      const maximized = await window.electron.ipc.invoke(IPC_CHANNELS.WINDOW.IS_MAXIMIZED);
      setIsMaximized(maximized);
    };

    window.electron.ipc.on(IPC_CHANNELS.WINDOW.MAXIMIZE, handleMaximize);
    window.electron.ipc.on(IPC_CHANNELS.WINDOW.UNMAXIMIZE, handleUnmaximize);
    window.electron.ipc.on(IPC_CHANNELS.WINDOW.RESIZE, handleResize);

    return () => {
      window.electron.ipc.removeListener(IPC_CHANNELS.WINDOW.MAXIMIZE, handleMaximize);
      window.electron.ipc.removeListener(IPC_CHANNELS.WINDOW.UNMAXIMIZE, handleUnmaximize);
      window.electron.ipc.removeListener(IPC_CHANNELS.WINDOW.RESIZE, handleResize);
    };
  }, []);

  const handleWindowControl = (action: 'minimize' | 'maximize' | 'close') => (e: React.MouseEvent) => {
    e.stopPropagation();
    window.electron.ipc.send(IPC_CHANNELS.WINDOW.CONTROL, action);
  };

  return { isMaximized, handleWindowControl };
};

export default useWindowControls;
