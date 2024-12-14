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

import './globals.css';

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
      <body className="h-lvh max-h-lvh dark">
        <NextUIProvider>
          <Header />
          <div className="h-full w-full mt-14">
            <Outlet />
          </div>
          <ScrollRestoration />
          <Scripts />
        </NextUIProvider>
      </body>
    </html>
  );
}
