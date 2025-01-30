import { useState, useEffect } from 'react';
import { Divider } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { DISCORD_INVITE_CODE } from '@constants/discord';

import { useNotification } from '@context/NotificationContext';

import WindowControls from '@components/core/Header/WindowControls';

import log from 'electron-log';

const Activation = () => {
  const { showWinNotification } = useNotification();

  const [activationKey, setActivationKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onSuccess = () => {
      log.info('Activation successful');
      showWinNotification({
        title: 'Activación exitosa',
        message: '¡Bienvenido a Animeton!',
      });
    };

    const onError = (_, { error }) => {
      log.error('Activation error:', error);
      showWinNotification({
        title: 'Error de activación',
        message: error,
      });
      setError(error);
      setIsLoading(false);
    };

    const onStatusChanged = (_, { isValid }) => {
      log.info('Activation status changed:', isValid);
      if (!isValid) {
        showWinNotification({
          title: 'Estado de activación',
          message: 'Tu clave de activación ya no es válida',
        });
        setError('Tu clave de activación ya no es válida');
      }
    };

    window.api.activation.onSuccess.subscribe(onSuccess);
    window.api.activation.onError.subscribe(onError);
    window.api.activation.onStatusChanged.subscribe(onStatusChanged);

    return () => {
      window.api.activation.onSuccess.unsubscribe(onSuccess);
      window.api.activation.onError.unsubscribe(onError);
      window.api.activation.onStatusChanged.unsubscribe(onStatusChanged);
    };
  }, []);

  const onActivate = async () => {
    if (isLoading || !activationKey.trim()) return;

    setIsLoading(true);
    try {
      await window.api.activation.activateKey(activationKey);
    } catch (error) {
      log.error('Error activating key:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center bg-zinc-950 w-full">
      <div className="flex flex-row items-center justify-end w-full bg-zinc-950 p-2 webkit-app-region-drag">
        <WindowControls hideMaximize />
      </div>

      <div className="flex flex-col items-center justify-center bg-zinc-950 p-8 rounded-lg w-full">
        <img
          src="assets/animeton.png"
          alt="Animeton Logo"
          className="w-32 h-32 mb-6"
        />
        <h1 className="text-3xl font-bold mb-4 text-white">
          ¡Bienvenido a Animeton!
        </h1>
        <p className="text-lg text-gray-300 mb-6 text-center">
          Tu portal al mundo del anime.
        </p>
        <Divider />
        <div className="w-full max-w-md mt-6">
          <input
            type="text"
            placeholder="Ingresa tu clave de activación"
            className="w-full px-4 py-2 mb-4 bg-zinc-900 text-white border border-zinc-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={activationKey}
            onChange={(e) => setActivationKey(e.target.value)}
            disabled={isLoading}
          />
          <button
            onClick={onActivate}
            className="relative text-center flex justify-center items-center rounded-full px-8 py-3 bg-white text-black font-bold cursor-pointer hover:bg-opacity-90 transition-all duration-300 w-full"
            disabled={isLoading}
          >
            {isLoading ? 'Activando...' : 'Comenzar mi aventura'}
          </button>
          {error && <p className="text-red-500 mt-2 text-center">{error}</p>}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-4 pb-8 rounded-lg mt-6 w-full">
        <p className="text-white text-xl font-bold">¿No tienes una clave?</p>
        <p className="text-white text-lg mb-4">
          Únete a nuestro Discord y consigue una
        </p>
        <button
          className="flex items-center justify-center bg-[#5865F2] text-white px-6 py-2 rounded-full hover:bg-opacity-80 transition-all duration-300"
          onClick={() =>
            window.api.shell.openExternal(
              `discord://-/invite/${DISCORD_INVITE_CODE}`
            )
          }
        >
          <Icon
            icon="ic:baseline-discord"
            className="pointer-events-none mr-2"
            width="26"
            height="26"
            style={{ color: 'white' }}
          />
          <p className="text-white text-lg font-bold">Animeton</p>
        </button>
      </div>
    </div>
  );
};

export default Activation;
