'use client';

import { PropsWithChildren, useEffect } from 'react';
import { NextUIProvider } from '@nextui-org/react';

import { ModalProvider } from '@context/ModalContext';
import { ConfigProvider } from '@context/ConfigContext';
import { TorrentPlayerProvider } from '@context/TorrentPlayerContext';
import { NotificationProvider } from '@context/NotificationContext';

import { initAmplitude } from '@lib/amplitude';
import log from 'electron-log';

const AppProviders = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    const apiKey = '4746569d48277390af01771a9b011c53';

    log.info('initAmplitude from providers', apiKey);
    if (apiKey) {
      initAmplitude(apiKey);
    }
  }, []);

  return (
    <NextUIProvider>
      <ConfigProvider>
        <ModalProvider>
          <NotificationProvider>
            <TorrentPlayerProvider>{children}</TorrentPlayerProvider>
          </NotificationProvider>
        </ModalProvider>
      </ConfigProvider>
    </NextUIProvider>
  );
};

export default AppProviders;
