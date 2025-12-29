import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as express from 'express';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Configure body parser with increased payload size limit (50MB)
  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true,
  });

  const vncServerUrl = process.env.VNC_SERVER_URL || 'http://localhost:6080';
  const wsProxy = createProxyMiddleware({
    target: vncServerUrl,
    ws: true,
    changeOrigin: true,
    pathRewrite: { '^/websockify': '/' },
  });
  app.use('/websockify', express.raw({ type: '*/*' }), wsProxy);
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 9990;
  const server = await app.listen(port);

  // Selective upgrade routing
  server.on('upgrade', (req, socket, head) => {
    if (req.url?.startsWith('/websockify')) {
      wsProxy.upgrade(req, socket, head);
    }
    // else let Socket.IO/Nest handle it by not hijacking the socket
  });
}
bootstrap();
