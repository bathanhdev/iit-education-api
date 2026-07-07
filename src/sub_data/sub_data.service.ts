import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSubDatumDto } from './dto/create-sub_datum.dto';
import { UpdateSubDatumDto } from './dto/update-sub_datum.dto';
import { CreateManySubDatumDto } from './dto/create_many-sub_datum.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubData } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { lastValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { paginate, PaginationQuery } from 'src/common/pagination';

@Injectable()
export class SubDataService {
  constructor(private prisma: PrismaService, private readonly httpService: HttpService) { }

  async create(createSubDatumDto: CreateSubDatumDto): Promise<SubData | null> {
    return this.prisma.subData.create({
      data: {
        name: createSubDatumDto.name,
        decs: createSubDatumDto.decs,
        Data: {
          connect: {
            id: createSubDatumDto.dataId
          }
        }
      }
    })
  }

  async createMany(createManySubDatumDto: CreateManySubDatumDto): Promise<SubData[] | null> {
    return await this.prisma.$transaction(
      createManySubDatumDto.subData.map((sd) => this.prisma.subData.create({ data: sd })),
    );
  }

  async upload(id: string, file: Express.Multer.File): Promise<SubData | null> {
    const foundSubData = await this.prisma.subData.findUnique({
      where: { id },
    });
    if (!foundSubData) {
      await fs.promises.unlink(file.path).catch(() => { });
      throw new NotFoundException('SubData not found');
    }

    const extension = path.extname(file.originalname);
    const finalPath = path.join(path.dirname(file.path), `${id}${extension}`);

    return this.replaceSubDataFileSafely(id, file.path, finalPath, foundSubData.url);
  }

  async findAll(query?: PaginationQuery) {
    return paginate(this.prisma.subData, query);
  }

  async findOne(id: string): Promise<SubData | null> {
    return this.prisma.subData.findUnique({
      where: { id }
    });
  }

  async update(id: string, updateSubDatumDto: UpdateSubDatumDto): Promise<SubData | null> {
    return await this.prisma.subData.update({
      where: { id },
      data: {
        name: updateSubDatumDto.name,
        decs: updateSubDatumDto.decs,
      }
    })
  }

  async remove(id: string): Promise<SubData | null> {
    return this.prisma.subData.delete({
      where: { id }
    }).then(subData => {
      if (subData.url) {
        fs.unlink(subData.url, () => { })
      }
      return subData
    });
  }

  async streamFile(file: string, res: Response): Promise<void> {
    const response = this.httpService.get(`${process.env.CDN}${file}`, { responseType: 'stream' });

    const stream = await lastValueFrom(response);

    res.setHeader('Content-Type', stream.headers['content-type']);
    res.setHeader('Content-Length', stream.headers['content-length']);
    res.setHeader('Content-Disposition', `attachment; filename="${stream.headers['file-name'] || 'downloadedFile'}"`);

    stream.data.pipe(res);
  }

  private async replaceSubDataFileSafely(
    id: string,
    tempPath: string,
    finalPath: string,
    oldPath?: string | null,
  ): Promise<SubData | null> {
    const backupPath = `${finalPath}.${Date.now()}.backup`;
    const finalExists = fs.existsSync(finalPath);
    let backupCreated = false;

    try {
      if (finalExists) {
        await fs.promises.rename(finalPath, backupPath);
        backupCreated = true;
      }

      await fs.promises.rename(tempPath, finalPath);
      const updatedSubData = await this.prisma.subData.update({
        where: { id },
        data: {
          url: finalPath,
        },
      });

      if (backupCreated) {
        await fs.promises.unlink(backupPath).catch(() => { });
      }
      if (oldPath && oldPath !== finalPath && oldPath !== backupPath) {
        await fs.promises.unlink(oldPath).catch(() => { });
      }

      return updatedSubData;
    } catch (error) {
      await fs.promises.unlink(finalPath).catch(() => { });
      if (backupCreated && !fs.existsSync(finalPath)) {
        await fs.promises.rename(backupPath, finalPath).catch(() => { });
      }
      await fs.promises.unlink(tempPath).catch(() => { });
      throw error;
    }
  }
}
