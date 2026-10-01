import app from './app.js';
import { env } from './config/env.js';

const PORT = env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(` Restaurant POS Backend Server Started`);
  console.log(` Environment : ${env.NODE_ENV}`);
  console.log(` Port        : ${PORT}`);
  console.log(` Health URL  : http://localhost:${PORT}/api/health`);
  console.log(` API Base    : http://localhost:${PORT}/api`);
  console.log(`==================================================`);
});

server.on('error', (error) => {
  console.error('Unable to start Restaurant POS API:', error.code || 'server error');
  process.exit(1);
});

// Clean handling of unhandled rejections and termination signals
process.on('unhandledRejection', (reason, promise) => {
  console.error('[Unhandled Rejection at Promise]:', promise, 'reason:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[Uncaught Exception]:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default server;
