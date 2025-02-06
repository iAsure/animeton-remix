'use client';

import { PropsWithChildren } from 'react';
import { NextUIProvider } from '@nextui-org/react';

import { ModalProvider } from '@context/ModalContext';
import { ConfigProvider } from '@context/ConfigContext';
import { TorrentPlayerProvider } from '@context/TorrentPlayerContext';
import { NotificationProvider } from '@context/NotificationContext';

const AppProviders = ({ children }: PropsWithChildren) => {
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
