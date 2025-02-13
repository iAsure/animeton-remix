import { Icon } from '@iconify/react';
import useWindowControls from '@hooks/system/useWindowControls';

const WindowControls = ({ hideMaximize = false }) => {
  const { isMaximized, handleWindowControl } = useWindowControls();

  return (
    <div className="flex flex-row items-center gap-1">
      <button
        onClick={handleWindowControl('minimize')}
        style={{ zIndex: 9999 }}
        className="p-1 hover:bg-zinc-800 rounded webkit-app-region-no-drag"
      >
        <Icon
          icon="gravity-ui:minus"
          className="pointer-events-none text-white"
          width="26"
          height="26"
        />
      </button>
      {!hideMaximize && (
        <button
          onClick={handleWindowControl('maximize')}
          style={{ zIndex: 9999 }}
          className="p-1 hover:bg-zinc-800 rounded webkit-app-region-no-drag"
        >
          <Icon
            icon={isMaximized ? 'gravity-ui:copy' : 'gravity-ui:square'}
            className="pointer-events-none text-white"
            width="26"
            height="26"
          />
        </button>
      )}
      <button
        onClick={handleWindowControl('close')}
        style={{ zIndex: 9999 }}
        className="p-1 hover:bg-zinc-800 rounded webkit-app-region-no-drag"
      >
        <Icon
          icon="gravity-ui:xmark"
          className="pointer-events-none text-white"
          width="26"
          height="26"
        />
      </button>
    </div>
  );
};

export default WindowControls;
