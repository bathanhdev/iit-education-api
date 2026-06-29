import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileUploadService } from './file-upload.service';
import * as fs from 'fs';
import * as path from 'path';
import { diskStorage, memoryStorage } from 'multer';
import { unlink } from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';
import { compressImageIfNeeded } from './file-helper';

@Controller('file-upload')
export class FileUploadController {
  private uploadDir = './uploads/';
  private chunkDir = './uploads/chunks/';

  constructor(
    private readonly fileUploadService: FileUploadService,
    private prisma: PrismaService,
  ) {
    // Tự động tạo thư mục upload nếu chưa tồn tại
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
    // Tự động tạo thư mục chứa chunk tạm nếu chưa tồn tại
    if (!fs.existsSync(this.chunkDir)) {
      fs.mkdirSync(this.chunkDir, { recursive: true });
    }
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    // Nén ảnh nếu cần thiết
    await compressImageIfNeeded(file.path);
    return this.fileUploadService.handleFileUpload(file);
  }

  @Post('chunk')
  @UseInterceptors(
    FileInterceptor('chunk', {
      storage: memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { chunkIndex: string; totalChunks: string; fileName: string; id: string },
  ) {
    if (!file) {
      throw new BadRequestException('No chunk uploaded');
    }
    const { chunkIndex, totalChunks, fileName, id } = body;

    // 1. Kiểm tra sự tồn tại của SubData trước khi xử lý ghi chunk
    const foundSubData = await this.prisma.subData.findUnique({
      where: { id },
    });
    if (!foundSubData) {
      throw new NotFoundException('SubData not found');
    }

    const chunkBuffer = file.buffer;
    const sanitizedFileName = path.basename(fileName);
    const finalFileName = `${id}-${sanitizedFileName}`;

    // Đường dẫn tạm thời để lưu chunk trong thư mục riêng biệt
    const chunkTempPath = path.join(this.chunkDir, `${finalFileName}.part.${chunkIndex}`);
    fs.writeFileSync(chunkTempPath, chunkBuffer as any);

    console.log(`Receiving chunk ${parseInt(chunkIndex) + 1}/${totalChunks} for file: ${sanitizedFileName}`);

    // Nếu đã nhận hết tất cả các chunk, tiến hành ghép chúng lại
    if (parseInt(chunkIndex) === parseInt(totalChunks) - 1) {
      // Xóa file cũ nếu tồn tại
      if (foundSubData.url && fs.existsSync(foundSubData.url)) {
        unlink(foundSubData.url, () => {});
      }
      const finalFilePath = await this.mergeChunks(sanitizedFileName, totalChunks, id);
      return this.fileUploadService.handleUpdateSubdata(id, finalFilePath);
    }

    return { message: `Chunk ${chunkIndex} uploaded successfully` };
  }

  // Ghép các chunk lại thành file hoàn chỉnh bằng Stream (Tiết kiệm bộ nhớ RAM)
  private async mergeChunks(sanitizedFileName: string, totalChunks: string, id: string): Promise<string> {
    const finalFileName = `${id}-${sanitizedFileName}`;
    const finalFilePath = path.join(this.uploadDir, finalFileName);
    const writeStream = fs.createWriteStream(finalFilePath);

    const totalChunksInt = parseInt(totalChunks);

    try {
      for (let i = 0; i < totalChunksInt; i++) {
        const chunkPath = path.join(this.chunkDir, `${finalFileName}.part.${i}`);

        if (!fs.existsSync(chunkPath)) {
          throw new BadRequestException(`Missing chunk part ${i}`);
        }

        await new Promise<void>((resolve, reject) => {
          const readStream = fs.createReadStream(chunkPath);
          readStream.pipe(writeStream, { end: false });
          readStream.on('end', () => {
            // Xóa chunk tạm ngay sau khi đã ghi thành công vào file chính
            fs.unlink(chunkPath, () => {});
            resolve();
          });
          readStream.on('error', (err) => reject(err));
        });
      }

      writeStream.end();

      // Đợi writeStream hoàn thành đóng file trên đĩa cứng
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });

      // Tự động kiểm tra và thực hiện nén ảnh dưới 1MB nếu file là ảnh
      await compressImageIfNeeded(finalFilePath);

      return finalFilePath;
    } catch (error) {
      writeStream.end();
      // Dọn dẹp các file lỗi nếu quá trình ghép gặp sự cố
      if (fs.existsSync(finalFilePath)) {
        fs.unlinkSync(finalFilePath);
      }
      for (let i = 0; i < totalChunksInt; i++) {
        const chunkPath = path.join(this.chunkDir, `${finalFileName}.part.${i}`);
        if (fs.existsSync(chunkPath)) {
          fs.unlinkSync(chunkPath);
        }
      }
      throw error;
    }
  }
}