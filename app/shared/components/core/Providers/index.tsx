'use client';

import { PropsWithChildren, useEffect } from 'react';
import { NextUIProvider } from '@nextui-org/react';

import { ModalProvider } from '@context/ModalContext';
import { ConfigProvider } from '@context/ConfigContext';
import { TorrentPlayerProvider } from '@context/TorrentPlayerContext';
import { NotificationProvider } from '@context/NotificationContext';

import { initAmplitude } from '@lib/amplitude';

const AppProviders = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    initAmplitude();
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
