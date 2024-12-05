import { useEffect, useState } from 'react';
import { getCurrentWindow } from '@electron/remote';

export const useWindowControls = () => {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    let win: Electron.BrowserWindow | null = null;
    try {
      win = getCurrentWindow();
    } catch (error) {
      console.error('Error getting window reference:', error);
      return;
    }

    const handleMaximize = () => setIsMaximized(true);
    const handleUnmaximize = () => setIsMaximized(false);
    const handleResize = () => {
      if (win) setIsMaximized(win.isMaximized());
    };

    setIsMaximized(win.isMaximized());

    win.on('maximize', handleMaximize);
    win.on('unmaximize', handleUnmaximize);
    win.on('resize', handleResize);

    return () => {
      win.off('maximize', handleMaximize);
      win.off('unmaximize', handleUnmaximize);
      win.off('resize', handleResize);
    };
  }, []);

  const handleWindowControl = (action) => (e) => {
    e.stopPropagation();
    const win = getCurrentWindow();
    if (!win) return;

    try {
      switch (action) {
        case 'minimize':
          win.minimize();
          break;
        case 'maximize':
          if (win.isFullScreen()) {
            win.setFullScreen(false);
            setTimeout(() => {
              if (win.isFullScreen()) win.maximize();
            }, 100);
          } else if (win.isMaximized()) {
            win.unmaximize();
          } else {
            win.maximize();
          }
          break;
        case 'close':
          win.close();
          break;
      }
    } catch (error) {
      console.error(`Error executing window action ${action}:`, error);
    }
  };

  return { isMaximized, handleWindowControl };
};
