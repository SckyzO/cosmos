// Serves a static folder, runs a command against it, and stops with it:
//
//   node serve.mjs <dir> -- <command> [args...]
//
// The server listens on a free port of 127.0.0.1 and hands its address to the
// command as PLAYWRIGHT_BASE_URL, which is how the capture spec is pointed at a
// Storybook build. `make visual-diff` serves two builds that way, one after the
// other. The exit code is the command's. No dependency: the cosmos-dev image
// has no static server besides Vite's, which needs the project's own config.
import { spawn } from 'node:child_process';
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import path from 'node:path';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.txt': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
};

const separator = process.argv.indexOf('--');
const [dir, ...extra] = process.argv.slice(2, separator === -1 ? undefined : separator);
const command = separator === -1 ? [] : process.argv.slice(separator + 1);
if (!dir || extra.length > 0 || command.length === 0) {
  console.error('usage: node serve.mjs <dir> -- <command> [args...]');
  process.exit(2);
}
const root = path.resolve(dir);
if (!statSync(path.join(root, 'index.html'), { throwIfNoEntry: false })?.isFile()) {
  console.error(`${root} has no index.html: build Storybook first`);
  process.exit(2);
}

/** The file a request path names, or undefined: never outside the root. */
const resolveFile = (pathname) => {
  let decoded;
  try {
    decoded = decodeURIComponent(pathname);
  } catch {
    return undefined;
  }
  if (decoded.includes('\0')) return undefined;
  const file = path.join(root, path.normalize(decoded));
  if (file !== root && !file.startsWith(root + path.sep)) return undefined;
  const stat = statSync(file, { throwIfNoEntry: false });
  if (stat?.isDirectory()) return resolveFile(path.posix.join(pathname, 'index.html'));
  return stat?.isFile() ? file : undefined;
};

const server = createServer((request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  const file = resolveFile(new URL(request.url ?? '/', 'http://localhost').pathname);
  if (!file) {
    response.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found');
    return;
  }
  response.writeHead(200, {
    'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
    // Two builds are served from the same URL one after the other.
    'Cache-Control': 'no-store',
  });
  if (request.method === 'HEAD') {
    response.end();
    return;
  }
  createReadStream(file)
    .on('error', () => response.destroy())
    .pipe(response);
});

server.listen(0, '127.0.0.1', () => {
  const { port } = server.address();
  const child = spawn(command[0], command.slice(1), {
    stdio: 'inherit',
    env: { ...process.env, PLAYWRIGHT_BASE_URL: `http://127.0.0.1:${port}` },
  });
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => child.kill(signal));
  child.on('error', (error) => {
    console.error(`cannot run ${command[0]}: ${error.message}`);
    server.close();
    process.exitCode = 1;
  });
  child.on('exit', (code) => {
    server.close();
    server.closeAllConnections();
    process.exitCode = code ?? 1;
  });
});
