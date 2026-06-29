import { Injectable } from '@nestjs/common';
import { CreateSubDatumDto } from './dto/create-sub_datum.dto';
import { UpdateSubDatumDto } from './dto/update-sub_datum.dto';
import { CreateManySubDatumDto } from './dto/create_many-sub_datum.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { SubData } from '@prisma/client';
import { unlink } from 'fs';
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
    await this.prisma.subData.findUnique(
      {
        where: { id },
      }
    ).then(data => {
      if (data && data.url) {
        unlink(data.url, () => { })
      }
    })

    return this.prisma.subData.update(
      {
        where: { id },
        data: {
          url: file.path
        }
      }
    );
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
        unlink(subData.url, () => { })
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
}
