import { protocol, session } from 'electron';
import * as fsp from 'node:fs/promises';
import * as path from 'node:path';
import * as mime from 'mime-types';
import log from 'electron-log';
import { net } from 'electron';
import { createRequestHandler } from '@remix-run/node';
import { fileURLToPath } from 'node:url';
import { EXTERNAL_HOSTNAMES_ARRAY } from '../../shared/constants/external-hostnames.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function isValidPath(filePath) {
  // Prevent directory traversal
  const normalizedPath = path.normalize(filePath);
  return !normalizedPath.includes('..');
}

export async function setupProtocol(build, viteDevServer) {
  // Setup HTTPS handler
  const partition = 'persist:partition';
  const ses = session.fromPartition(partition);

  ses.protocol.handle('https', async (request) => {
    const url = new URL(request.url);
    log.debug(`Handling HTTPS request: ${url.pathname}`);

    // Allow direct access to External APIs
    if (EXTERNAL_HOSTNAMES_ARRAY.includes(url.hostname)) {
      return await net.fetch(request.url);
    }

    // Handle static files and dev server
    if (
      url.pathname !== '/' &&
      (request.method === 'GET' || request.method === 'HEAD')
    ) {
      if (viteDevServer) {
        const staticFile = path.resolve(
          __dirname,
          '../../../../public' + url.pathname
        );
        if (
          await fsp
            .stat(staticFile)
            .then((s) => s.isFile())
            .catch(() => false)
        ) {
          return new Response(await fsp.readFile(staticFile), {
            headers: {
              'content-type':
                mime.lookup(path.basename(staticFile)) || 'text/plain',
            },
          });
        }

        if (request.method === 'HEAD') {
          return new Response(null, {
            headers: {
              'access-control-allow-origin': '*',
              'access-control-allow-methods': 'GET, HEAD',
            },
          });
        }
        try {
          const VALID_ID_PREFIX = `/@id/`;
          const NULL_BYTE_PLACEHOLDER = `__x00__`;
          let id = url.pathname + url.search;
          id = id.startsWith(VALID_ID_PREFIX)
            ? id
                .slice(VALID_ID_PREFIX.length)
                .replace(NULL_BYTE_PLACEHOLDER, '\0')
            : id;

          const transformed = await viteDevServer.transformRequest(id, {
            html: false,
            ssr: false,
          });
          if (transformed) {
            return new Response(transformed.code, {
              headers: {
                'content-type': 'application/javascript',
              },
            });
          }
        } catch (error) {}
      } else {
        const file = path.resolve(
          __dirname,
          '..',
          '..',
          '..',
          'app',
          'client',
          url.pathname.slice(1)
        );
        try {
          const isFile = await fsp.stat(file).then((s) => s.isFile());
          if (isFile) {
            return new Response(await fsp.readFile(file), {
              headers: {
                'content-type':
                  mime.lookup(path.basename(file)) || 'text/plain',
              },
            });
          }
        } catch {}
      }
    }

    const remixHandler = createRequestHandler(build);
    return await remixHandler(request);
  });

  // Setup file protocol handler
  protocol.handle('file', async (request) => {
    let filePath = request.url.slice(7); // remove 'file://'

    if (!isValidPath(filePath)) {
      log.warn('Invalid file path requested:', filePath);
      return new Response('Invalid path', { status: 403 });
    }

    try {
      if (filePath.startsWith('/vendor/')) {
        filePath = path.join(__dirname, '../../../public', filePath);
      }

      return await net.fetch(`file://${filePath}`);
    } catch (error) {
      log.error('File protocol error:', error);
      return new Response('File not found', { status: 404 });
    }
  });
}

export function setupCSP(port, ses) {
  ses.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          `default-src 'self'; ` +
            `script-src 'self' 'unsafe-inline' https://api.iconify.design; ` +
            `media-src 'self' http://localhost:${port} blob:; ` +
            `connect-src 'self' http://localhost:${port} https://api.iconify.design; ` +
            `img-src 'self' data: http: https:; ` +
            `style-src 'self' 'unsafe-inline';`,
        ],
      },
    });
  });
}
