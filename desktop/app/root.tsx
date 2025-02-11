import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from '@remix-run/react';
import log from 'electron-log';

import AppProviders from '@components/core/Providers';
import Header from '@components/core/Header';
import Fonts from '@components/core/Fonts';
import HelpButton from '@components/core/HelpButton';
import InternetVerification from '@components/core/InternetVerification';
import ErrorBoundary from '@components/core/ErrorBoundary';
import useProtocolEvents from '@/hooks/useProtocolEvents';

import './globals.css';

Object.assign(console, log.functions);

export default function App() {
  const location = useLocation();
  const isActivationRoute = location.pathname === '/activation';

  useProtocolEvents();

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
        <AppProviders>
          <ErrorBoundary>
            <InternetVerification>
              {!isActivationRoute && (
                <>
                  <Header /> <HelpButton />
                </>
              )}
              <div className="h-full w-full">
                <Outlet />
              </div>
              <ScrollRestoration />
              <Scripts />
            </InternetVerification>
          </ErrorBoundary>
        </AppProviders>
      </body>
    </html>
  );
}
