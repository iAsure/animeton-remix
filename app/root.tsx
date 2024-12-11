import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react';
import { NextUIProvider } from '@nextui-org/react';
import log from 'electron-log';

import Header from '@components/core/header';
import Fonts from '@components/core/fonts';

import './globals.css';

export default function App() {
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
