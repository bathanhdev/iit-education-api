import { Module } from '@nestjs/common';
import { FileUploadService } from './file-upload.service';
import { FileUploadController } from './file-upload.controller';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { PrismaService } from 'src/prisma/prisma.service';
@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename = `${Date.now()}-${file.originalname}`;
          cb(null, filename);
        },
      }),
      limits: { fileSize: 200 * 1024 * 1024 }
    }),
  ],
  controllers: [FileUploadController],
  providers: [FileUploadService, PrismaService],
})
export class FileUploadModule { }