import { Icon } from '@iconify/react';
import { Switch } from '@nextui-org/react';
import { useConfig } from '@context/ConfigContext';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SettingsMenuProps {
  onClose: () => void;
}

const SettingsMenu = ({ onClose }: SettingsMenuProps) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const { config, setConfig } = useConfig();
  const [isDevToolsOpen, setIsDevToolsOpen] = useState(false);
  const [isOnDev, setIsOnDev] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnDev(window?.electron?.env?.onDEV);
    }
  }, []);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    const checkDevTools = async () => {
      const isOpen = await window.api.shell.isDevToolsOpened();
      setIsDevToolsOpen(isOpen);
    };
    checkDevTools();
  }, []);

  const handleToggleDevTools = async () => {
    await window.api.shell.toggleDevTools();
    setIsDevToolsOpen(!isDevToolsOpen);
  };

  const handleSubtitlesIndicatorChange = useCallback(
    async (isSelected: boolean) => {
      await setConfig('features.subtitlesIndicator', isSelected);
    },
    [setConfig]
  );

  const handleSubtitlesStatusChange = useCallback(
    async (isSelected: boolean) => {
      await setConfig('features.subtitlesStatus', isSelected);
    },
    [setConfig]
  );

  return (
    <div
      ref={menuRef}
      className="fixed right-8 top-14 bg-zinc-900 rounded-lg shadow-lg backdrop-blur-sm border border-zinc-800 min-w-[280px] py-2"
      style={{ zIndex: 10000 }}
    >
      {/* Features Section */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 mb-2">
          <Icon
            icon="gravity-ui:person"
            className="text-zinc-400"
            width="16"
            height="16"
          />
          <h3 className="text-zinc-400 text-xs font-medium">CARACTERÍSTICAS</h3>
        </div>

        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-zinc-200 text-sm">Indicador de Subtítulos</span>
          <Switch
            size="sm"
            isSelected={config?.features?.subtitlesIndicator}
            onValueChange={handleSubtitlesIndicatorChange}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <span className="text-zinc-200 text-sm">Estatus de Subtítulos</span>
          <Switch
            size="sm"
            isSelected={config?.features?.subtitlesStatus}
            onValueChange={handleSubtitlesStatusChange}
          />
        </div>
      </div>

      <div className="my-2 border-t border-zinc-800" />

      {/* Utils Section */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 mb-2">
          <Icon
            icon="gravity-ui:box"
            className="text-zinc-400"
            width="16"
            height="16"
          />
          <h3 className="text-zinc-400 text-xs font-medium">UTILIDADES</h3>
        </div>

        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-zinc-200 text-sm">Archivos de registro</span>
          <button
            onClick={() => window.api.shell.openPath('logs')}
            className="text-sm px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors flex items-center gap-2"
          >
            <Icon icon="gravity-ui:folder-open" className="text-zinc-400" />
            <span>Explorar</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 mb-1">
          <span className="text-zinc-200 text-sm">Carpeta de descargas</span>
          <button
            onClick={() => window.api.shell.openPath('downloads')}
            className="text-sm px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors flex items-center gap-2"
          >
            <Icon icon="gravity-ui:folder-open" className="text-zinc-400" />
            <span>Explorar</span>
          </button>
        </div>

        {isOnDev && (
          <div className="flex items-center justify-between gap-2">
            <span className="text-zinc-200 text-sm">Consola de desarrollo</span>
            <button

              onClick={handleToggleDevTools}
              className="text-sm px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors flex items-center gap-2"
            >
              <Icon icon="gravity-ui:code" className="text-zinc-400" />
              <span>{isDevToolsOpen ? 'Cerrar' : 'Abrir'}</span>
            </button>
          </div>
        )}
      </div>

      <div className="my-2 border-t border-zinc-800" />

      {/* Preferences Section */}
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 mb-2">
          <Icon
            icon="gravity-ui:brush"
            className="text-zinc-400"
            width="16"
            height="16"
          />
          <h3 className="text-zinc-400 text-xs font-medium">PREFERENCIAS</h3>
        </div>

        {/* Theme Option */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-200 text-sm">Tema</span>
          </div>
          <div className="text-sm text-zinc-500 italic">Oscuro</div>
        </div>

        {/* Language Option */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-200 text-sm">Idioma</span>
          </div>
          <div className="text-sm text-zinc-500 italic">Español Latino</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsMenu;
