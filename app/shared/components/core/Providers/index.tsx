"use client";

import { PropsWithChildren, useEffect, useState } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { PostHogProvider } from 'posthog-js/react';
import { ModalProvider } from '@context/ModalContext';
import { ConfigProvider } from '@context/ConfigContext';

const AppProviders = ({ children }: PropsWithChildren) => {
  const [isClient, setIsClient] = useState(false);
  const [posthogConfig, setPosthogConfig] = useState<{apiKey?: string, options: any}>({
    apiKey: undefined,
    options: {
      api_host: 'https://us.i.posthog.com',
    },
  });

  useEffect(() => {
    setIsClient(true);
    setPosthogConfig({
      apiKey: window.electron?.env?.POSTHOG_API_KEY,
      options: {
        api_host: 'https://us.i.posthog.com',
      },
    });
  }, []);

  return (
    <NextUIProvider>
      <ConfigProvider>
        <ModalProvider>
          {isClient && posthogConfig.apiKey ? (
            <PostHogProvider
              apiKey={posthogConfig.apiKey}
              options={posthogConfig.options}
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
