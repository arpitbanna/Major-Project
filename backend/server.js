require('dotenv').config();
const app = require('./src/app');

const TARGET_PORT = parseInt(process.env.PORT, 10) || 5001;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`[Server] Coal Mine Management Backend running on http://localhost:${port}`);
    console.log(`[Server] Health check: http://localhost:${port}/api/health`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE' && port === 5000) {
      console.warn(`[Server] Port 5000 is occupied (commonly Apple AirPlay Receiver on macOS). Falling back to port 5001...`);
      startServer(5001);
    } else {
      console.error(`[Server] Fatal listen error on port ${port}:`, err.message);
      process.exit(1);
    }
  });

  return server;
}

startServer(TARGET_PORT);
