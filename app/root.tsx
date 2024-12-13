import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from '@remix-run/react';
import { NextUIProvider } from '@nextui-org/react';
import log from 'electron-log';

import { ModalProvider } from './context/ModalContext';
import { ConfigProvider } from './context/ConfigContext';

import Header from '@components/core/Header';
import Fonts from '@components/core/Fonts';
import HelpButton from '@components/core/HelpButton';

import './globals.css';

export default function App() {
  const location = useLocation();
  const isPlayerRoute = location.pathname === '/player';

  log.info('Renderer initialized');
  return (
    <html lang="en" className="dark">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <Fonts />
        <Meta />
        <Links />
      </head>
      <body className="text-foreground bg-background font-noto">
        <NextUIProvider>
          <ConfigProvider>
            <ModalProvider>
              <Header />
              <HelpButton />
              <div className={`h-full w-full ${!isPlayerRoute ? 'mt-14' : ''}`}>
                <Outlet />
              </div>
              <ScrollRestoration />
              <Scripts />
            </ModalProvider>
          </ConfigProvider>
        </NextUIProvider>
      </body>
    </html>
  );
}
