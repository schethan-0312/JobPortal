import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import { join } from 'node:path';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(
    helmet({
      // This backend is a JSON API + a static file host, not an HTML-rendering app —
      // helmet's default HTML-oriented CSP would add no protection here and risks
      // breaking legitimate cross-origin API/asset requests from the Next.js frontend.
      contentSecurityPolicy: false,
      // Uploaded images/resumes must be loadable by the frontend on a different
      // origin (localhost:3000) — helmet's 'same-origin' default would block that.
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? 'http://localhost:3000',
    credentials: true,
  });

  app.useStaticAssets(join(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
    setHeaders: (res) => {
      // Uploaded files are user-controlled content served same-origin — never let the
      // browser guess a different content-type (defends against MIME-sniff based XSS)
      // and never render them inline as a page (defends against HTML/SVG payloads).
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline; filename="file"');
    },
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api');

  await app.listen(process.env.PORT ?? 4000);
}
bootstrap();
