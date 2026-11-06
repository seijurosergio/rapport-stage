const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;
const MAX_BODY = 1024 * 1024;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const FORBIDDEN_DIRS = ['api', 'tests', 'node_modules'];

if (!process.env.MOCK_AI) {
  process.env.MOCK_AI = '1';
}
console.log(`MOCK_AI=${process.env.MOCK_AI} (simulation ${process.env.MOCK_AI === '1' ? 'activée' : 'désactivée'})`);

function isSafePath(reqPath) {
  const normalized = path.normalize(reqPath).replace(/\\/g, '/');
  if (normalized.startsWith('..') || normalized.includes('/..')) return false;
  const parts = normalized.split('/');
  for (const part of parts) {
    if (FORBIDDEN_DIRS.includes(part)) return false;
  }
  return true;
}

function sendFile(res, filePath, mime) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', mime);
    res.end(data);
  });
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > MAX_BODY) {
        req.destroy();
        reject(new Error('Body too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', reject);
  });
}

async function handleApi(req, res, pathname) {
  const routeName = pathname.replace(/^\/api\//, '');
  if (!routeName || routeName.startsWith('_') || routeName.includes('/') || routeName.includes('\\')) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Route not found' }));
    return;
  }
  const apiPath = path.join(ROOT, 'api', routeName + '.js');
  if (!fs.existsSync(apiPath)) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Route not found' }));
    return;
  }
  try {
    const handler = require(apiPath);
    req.body = await parseBody(req);
    const parsedUrl = url.parse(req.url, true);
    req.query = parsedUrl.query;
    const send = (code, obj) => {
      res.statusCode = code;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(obj));
    };
    await handler(req, res);
  } catch (e) {
    console.error('API error:', e);
    if (!res.writableEnded) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Internal server error' }));
    }
  }
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  if (pathname.startsWith('/api/')) {
    await handleApi(req, res, pathname);
    return;
  }

  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = path.join(ROOT, filePath);

  if (!isSafePath(path.relative(ROOT, filePath))) {
    res.statusCode = 403;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'Forbidden' }));
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const mime = MIME[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'Not found' }));
      return;
    }
    sendFile(res, filePath, mime);
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});