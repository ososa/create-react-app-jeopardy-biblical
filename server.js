const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'build');

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
};

const server = http.createServer((req, res) => {
  // Evitar ataques de path traversal
  let safeSuffix = path.normalize(req.url).replace(/^(\.\.[\/\\])+/, '');
  
  // Limpiar parámetros de búsqueda (query params)
  if (safeSuffix.includes('?')) {
    safeSuffix = safeSuffix.split('?')[0];
  }

  let filePath = path.join(PUBLIC_DIR, safeSuffix);

  // Si se solicita una carpeta, servir index.html
  if (req.url === '/' || req.url === '') {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.stat(filePath, (error, stats) => {
    if (error || !stats.isFile()) {
      // Fallback para Single Page Application (SPA): Servir index.html para rutas no encontradas
      const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallbackPath, (err, content) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Internal Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content, 'utf-8');
        }
      });
    } else {
      fs.readFile(filePath, (err, content) => {
        if (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('500 Internal Server Error');
        } else {
          res.writeHead(200, { 'Content-Type': contentType });
          res.end(content, 'utf-8');
        }
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Serving static files from: ${PUBLIC_DIR}`);
});
