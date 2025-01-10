"use client";

import { PropsWithChildren, useEffect } from 'react';
import { NextUIProvider } from '@nextui-org/react';
import { ModalProvider } from '@context/ModalContext';
import { ConfigProvider } from '@context/ConfigContext';
import { initPostHog } from '@lib/posthog';

const AppProviders = ({ children }: PropsWithChildren) => {
  useEffect(() => {
    const apiKey = window.electron?.env?.POSTHOG_API_KEY;
    if (apiKey) {
      initPostHog(apiKey);
    }
  }, []);

  return (
    <NextUIProvider>
      <ConfigProvider>
        <ModalProvider>
          {children}
        </ModalProvider>
      </ConfigProvider>
    </NextUIProvider>
  );
};

export default AppProviders;
