import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { PrismaExceptionFilter } from './exception_filter/prisma-exception.filter';
import { json, static as static_, urlencoded } from 'express';
import * as fs from 'fs';

function loadEnvFile(filePath = '.env') {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) {
      continue;
    }

    let value = match[2];
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadEnvFile();
async function bootstrap() {
  // Đảm bảo tất cả thư mục cần thiết (uploads, chunks, thumbnails) tồn tại khi khởi chạy ứng dụng
  const requiredDirs = ['./uploads', './uploads/chunks', './thumbnails'];
  for (const dir of requiredDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('IIT Education')
    .setDescription('The IIT Education API description')
    .setVersion('0.1')
    .setContact('IIT', 'https://iit.vn/', 'info@iit.vn')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('doc', app, document);

  app.enableCors({
    allowedHeaders: '*',
    origin: '*',
    credentials: true,
  });

  // app.setGlobalPrefix('api');
  // app.use('/uploads', static_('uploads'));
  app.use('/thumbnails', static_('thumbnails'));
  app.use(json({ limit: '200mb' }));
  app.use(urlencoded({ limit: '200mb', extended: true }));

  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`, {
      params: req.params,
      query: req.query,
      // body: req.body,
    });
    next();
  });

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true
    }),
  );
  app.useGlobalFilters(new PrismaExceptionFilter());

  const port = process.env.PORT ? Number(process.env.PORT) : 22899;
  if (Number.isNaN(port)) {
    throw new Error('PORT must be a number');
  }

  await app.listen(port);

  console.log(`Application is running on port ${port}`);
}
bootstrap();
