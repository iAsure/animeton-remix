import path from 'path';
import { app, BrowserWindow, Notification } from 'electron';
import log from 'electron-log';
import { activateKey } from './activation-window.js';
import { ConfigService } from '../services/config/service.js';
import { getMainWindow } from './window.js';
import { IPC_CHANNELS } from '../../shared/constants/event-channels.js';

type ProtocolAction = {
  handler: (params: any) => Promise<any>;
  requiresAuth?: boolean;
};

const PROTOCOL_NAME = 'anitorrent';

const protocolActions: Record<string, ProtocolAction> = {
  activate: {
    handler: async (params: string[]) => {
      const [key] = params;
      try {
        log.info('Activating key from protocol:', key);
        const activationResult = await activateKey(key);

        if (activationResult.success) {
          const tempWindow = new BrowserWindow({ show: false });
          const configService = new ConfigService(tempWindow);
          await configService.initialize();

          await configService.update({
            user: {
              activationKey: activationResult.key,
              discordId: activationResult.discordId,
              createdAt: activationResult.createdAt,
              activatedAt: activationResult.activatedAt,
            },
          });

          showNotification(
            'AniTorrent se ha activado',
            'Gracias por confiar en nosotros'
          );
          restartApp();
          return activationResult;
        }

        showNotification(
          'Error de Activación',
          activationResult.message || 'Error al activar la clave'
        );
        return activationResult;
      } catch (error) {
        log.error('Protocol activation error:', error);
        showNotification(
          'Error de Activación',
          'Ocurrió un error al procesar la activación'
        );
        return { success: false, message: error.message };
      }
    },
  },
  anime: {
    handler: async (params: string[]) => {
      const idAnilist = params.join('/');
      const mainWindow = getMainWindow();

      if (mainWindow) {
        mainWindow.webContents.send(IPC_CHANNELS.NAVIGATION.NAVIGATE, {
          path: `/anime/${idAnilist}`,
        });
      }
      return null;
    },
  },
};

const showNotification = (title: string, body: string) => {
  new Notification({
    title,
    body,
    icon: path.join(process.env.VITE_PUBLIC ?? '', 'icon.png'),
  }).show();
};

const restartApp = () => {
  app.relaunch();
  app.exit();
};

export const handleProtocolLink = async (url: string) => {
  if (!url) return;

  const urlObject = new URL(url);
  log.info('Handling protocol link:', {
    protocol: urlObject.protocol,
    pathname: urlObject.pathname,
  });

  const protocolPrefix = `${PROTOCOL_NAME}:`;
  if (!urlObject.protocol.startsWith(protocolPrefix)) return;

  const [, action, ...params] = urlObject.pathname.split('/');
  const actionHandler = protocolActions[action];
  if (!actionHandler) {
    log.warn(`No handler found for action: ${action}`);
    return;
  }

  return await actionHandler.handler(params);
};

export const createProtocolUrl = (action: string, params: string[] = []) => {
  return `${PROTOCOL_NAME}://${action}/${params.join('/')}`;
};
