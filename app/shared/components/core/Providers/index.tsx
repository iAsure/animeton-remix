"use client";

import { PropsWithChildren, useEffect, useState } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { PostHogProvider } from 'posthog-js/react';
import { ModalProvider } from '@context/ModalContext';
import { ConfigProvider } from '@context/ConfigContext';

const POSTHOG_CONFIG = {
  apiKey: 'phc_T5wad1TWciA187DmTuXur4wikGDfFPV6LzEDYXx9Vw',
  options: {
    api_host: 'https://us.i.posthog.com',
  },
};

const AppProviders = ({ children }: PropsWithChildren) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <NextUIProvider>
      <ConfigProvider>
        <ModalProvider>
          {isClient ? (
            <PostHogProvider
              apiKey={POSTHOG_CONFIG.apiKey}
              options={POSTHOG_CONFIG.options}
            >
              {children}
            </PostHogProvider>
          ) : (
            children
          )}
        </ModalProvider>
      </ConfigProvider>
    </NextUIProvider>
  );
};

export default AppProviders;
