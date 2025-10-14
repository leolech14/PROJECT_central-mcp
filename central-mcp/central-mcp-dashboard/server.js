// Custom Next.js server with WebSocket support for terminals
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { WebSocketServer } = require('ws');
const { terminalManager } = require('./lib/terminal-manager');

const dev = process.env.NODE_ENV !== 'production';
const hostname = '0.0.0.0'; // Bind to all interfaces for external access
const port = parseInt(process.env.PORT || '3002', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // WebSocket server for terminals
  const wss = new WebSocketServer({ noServer: true });
  wss.on('connection', (ws, request, sessionId) => {
    console.log(`✅ WebSocket connected for terminal: ${sessionId}`);
    terminalManager.attachClient(sessionId, ws);
  });

  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url, true);
    const match = pathname.match(/^\/api\/terminal\/([^\/]+)\/ws$/);
    if (match) {
      const sessionId = match[1];
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request, sessionId);
      });
    } else {
      socket.destroy();
    }
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> Environment: ${process.env.NODE_ENV}`);
    console.log(`> Dashboard URL: http://34.41.115.199:${port}`);
  });
});
