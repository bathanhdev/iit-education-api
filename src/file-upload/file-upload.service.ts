import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class FileUploadService {
    constructor(private prisma: PrismaService) { }

    handleFileUpload(file: Express.Multer.File) {
        return { message: 'File uploaded successfully', filePath: file.path };
    }

    handleUpdateSubdata(id: string, path: string) {
        return this.prisma.subData.update(
            {
                where: { id },
                data: {
                    url: path,
                }
            }
        )
    }
}