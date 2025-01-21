import { useState, useEffect } from 'react';
import { Divider } from '@nextui-org/react';
import { Icon } from '@iconify/react';
import { DISCORD_INVITE_CODE } from '@constants/discord';

import useActivateKey from '@hooks/useActivateKey';

import { useConfig } from '@context/ConfigContext';
import { useNotification } from '@context/NotificationContext';

interface ActivationProps {
  isValid: boolean;
}

const Activation = ({ isValid }: ActivationProps) => {
  const { updateConfig } = useConfig();
  const { showAppNotification } = useNotification();

  const [activationKey, setActivationKey] = useState('');
  const [isActivated, setIsActivated] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { data, isLoading: keyLoading, error: keyError, activateKey } = useActivateKey(activationKey);

  useEffect(() => {
    if (data) {
      console.log('Activation successful:', data);
      setIsActivated(true);

      setTimeout(() => {
        updateConfig({
          user: {
            activationKey: activationKey,
            discordId: data.discordId,
          },
        });
      }, 1000);
    }
  }, [data]);

  const onActivate = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const result = await window.api.activation.validateKey(activationKey);
      if (!result) {
        showAppNotification({
          title: 'Error de activación',
          message: 'Clave inválida'
        });
      }
    } catch (error) {
      showAppNotification({
        title: 'Error de activación',
        message: error.message || 'Error al validar la clave'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center bg-zinc-900"
    >
      <div className="flex flex-col items-center justify-center bg-zinc-950 p-8 rounded-lg">
        <img
          src="assets/animeton.png"
          alt="Animeton Logo"
          className="w-32 h-32 mb-6"
        />
        <h1 className="text-3xl font-bold mb-4 text-white">
          {isValid ? '¡Bienvenido a Animeton!' : 'Tu clave ya no es válida :('}
        </h1>
        <p className="text-lg text-gray-300 mb-6 text-center">
          {isValid
            ? 'Tu portal al mundo del anime.'
            : 'Activa de nuevo tu cuenta ingresando otra clave.'}
        </p>
        <Divider />
        <h2 className="text-2xl font-semibold my-6 text-white">
          Activación de tu cuenta
        </h2>
        <div className="w-full max-w-md">
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
        </div>
      </div>
      <div className="flex flex-col items-center justify-center py-4 pb-8 rounded-lg mt-6">
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
