import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { NextUIProvider } from '@nextui-org/react';
import log from 'electron-log';

import Header from '@/shared/components/core/header';

import styles from '@/globals.css?url';

export function links() {
  return [{ rel: "stylesheet", href: styles }];
}

export default function App() {
  log.info('Renderer initialized');
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.png" type="image/png" />
        <Meta />
        <Links />
      </head>
      <body className="h-lvh max-h-lvh">
        <NextUIProvider>
          <Header />
          <Outlet />
          <ScrollRestoration />
          <Scripts />
        </NextUIProvider>
      </body>
    </html>
  );
}
