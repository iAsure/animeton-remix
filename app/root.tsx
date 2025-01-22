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

import './globals.css';

export default function App() {
  const location = useLocation();
  const isActivationRoute = location.pathname === '/activation';

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
        </AppProviders>
      </body>
    </html>
  );
}
