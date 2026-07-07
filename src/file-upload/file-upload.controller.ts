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
import { memoryStorage } from 'multer';
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
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
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
    const chunkIndexInt = this.parseChunkNumber(chunkIndex, 'chunkIndex');
    const totalChunksInt = this.parseChunkNumber(totalChunks, 'totalChunks');
    if (chunkIndexInt >= totalChunksInt) {
      throw new BadRequestException('chunkIndex must be less than totalChunks');
    }

    const foundSubData = await this.prisma.subData.findUnique({
      where: { id },
    });
    if (!foundSubData) {
      throw new NotFoundException('SubData not found');
    }

    const sanitizedFileName = path.basename(fileName);
    const extension = path.extname(sanitizedFileName);
    const finalFileName = id + extension;
    const chunkTempPath = path.join(this.chunkDir, `${finalFileName}.part.${chunkIndexInt}`);
    fs.writeFileSync(chunkTempPath, file.buffer as any);

    console.log(`Receiving chunk ${chunkIndexInt + 1}/${totalChunksInt} for file: ${sanitizedFileName}`);

    if (chunkIndexInt === totalChunksInt - 1) {
      const mergedFile = await this.mergeChunks(sanitizedFileName, totalChunksInt, id);
      return this.replaceChunkFileAndUpdateSubData(id, mergedFile.tempFilePath, mergedFile.finalFilePath, foundSubData.url);
    }

    return { message: `Chunk ${chunkIndexInt} uploaded successfully` };
  }

  private async mergeChunks(
    sanitizedFileName: string,
    totalChunks: number,
    id: string,
  ): Promise<{ tempFilePath: string; finalFilePath: string }> {
    const extension = path.extname(sanitizedFileName);
    const finalFileName = id + extension;
    const finalFilePath = path.join(this.uploadDir, finalFileName);
    const tempFilePath = path.join(this.uploadDir, `${finalFileName}.${Date.now()}.merging`);
    const writeStream = fs.createWriteStream(tempFilePath);

    try {
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(this.chunkDir, `${finalFileName}.part.${i}`);

        if (!fs.existsSync(chunkPath)) {
          throw new BadRequestException(`Missing chunk part ${i}`);
        }

        await new Promise<void>((resolve, reject) => {
          const readStream = fs.createReadStream(chunkPath);
          readStream.pipe(writeStream, { end: false });
          readStream.on('end', () => {
            fs.unlink(chunkPath, () => { });
            resolve();
          });
          readStream.on('error', (err) => reject(err));
        });
      }

      writeStream.end();
      await new Promise<void>((resolve, reject) => {
        writeStream.on('finish', () => resolve());
        writeStream.on('error', (err) => reject(err));
      });

      await compressImageIfNeeded(tempFilePath);

      return { tempFilePath, finalFilePath };
    } catch (error) {
      writeStream.end();
      await fs.promises.unlink(tempFilePath).catch(() => { });
      for (let i = 0; i < totalChunks; i++) {
        const chunkPath = path.join(this.chunkDir, `${finalFileName}.part.${i}`);
        await fs.promises.unlink(chunkPath).catch(() => { });
      }
      throw error;
    }
  }

  private async replaceChunkFileAndUpdateSubData(
    id: string,
    tempFilePath: string,
    finalFilePath: string,
    oldPath?: string | null,
  ) {
    const backupPath = `${finalFilePath}.${Date.now()}.backup`;
    const finalExists = fs.existsSync(finalFilePath);
    let backupCreated = false;

    try {
      if (finalExists) {
        await fs.promises.rename(finalFilePath, backupPath);
        backupCreated = true;
      }

      await fs.promises.rename(tempFilePath, finalFilePath);
      const updatedSubData = await this.fileUploadService.handleUpdateSubdata(id, finalFilePath);

      if (backupCreated) {
        await fs.promises.unlink(backupPath).catch(() => { });
      }
      if (oldPath && oldPath !== finalFilePath && oldPath !== backupPath) {
        await fs.promises.unlink(oldPath).catch(() => { });
      }

      return updatedSubData;
    } catch (error) {
      await fs.promises.unlink(finalFilePath).catch(() => { });
      if (backupCreated && !fs.existsSync(finalFilePath)) {
        await fs.promises.rename(backupPath, finalFilePath).catch(() => { });
      }
      await fs.promises.unlink(tempFilePath).catch(() => { });
      throw error;
    }
  }

  private parseChunkNumber(value: string, fieldName: string): number {
    const parsedValue = Number(value);
    if (!Number.isInteger(parsedValue) || parsedValue < 0) {
      throw new BadRequestException(`${fieldName} must be a non-negative integer`);
    }
    return parsedValue;
  }
}
