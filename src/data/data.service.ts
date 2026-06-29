import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDatumDto } from './dto/create-datum.dto';
import { UpdateDatumDto } from './dto/update-datum.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Data } from '@prisma/client';
import { unlink } from 'fs';
import { CreateManyDataDto } from './dto/create-many-data.dto';
import { getQueryValue, paginate, PaginationQuery } from 'src/common/pagination';

@Injectable()
export class DataService {
  constructor(private prisma: PrismaService) { }

  async create(createDatumDto: CreateDatumDto): Promise<Data | null> {
    return this.prisma.data.create({
      data: {
        Subject: {
          connect: {
            id: createDatumDto.subjectId
          }
        },
        Topic: {
          connect: {
            id: createDatumDto.topicId
          }
        },
        Grades: {
          connect: createDatumDto.gradeIds.map(id => ({ id }))
        },
        Type: {
          connect: {
            id: createDatumDto.dataTypeId
          }
        },
        DataPacks: {
          connect: createDatumDto.dataPackIds.map(id => ({ id }))
        },
        name: createDatumDto.name,
        thumbnail: createDatumDto.thumbnail,
        author: createDatumDto.author,
        uses: createDatumDto.uses,
        decs: createDatumDto.decs,
      }
    })
  }

  async createMany(createManyDataDto: CreateManyDataDto): Promise<any[]> {
    if (!createManyDataDto.data.length) {
      throw new BadRequestException('Data is required')
    }

    return this.prisma.$transaction(async (prisma) => {
      const createdData = [];

      for (const createDatumDto of createManyDataDto.data) {
        const subData = createDatumDto.subData ?? [];
        const createdDatum = await prisma.data.create({
          data: {
            Subject: {
              connect: {
                id: createDatumDto.subjectId
              }
            },
            Topic: {
              connect: {
                id: createDatumDto.topicId
              }
            },
            Grades: {
              connect: createDatumDto.gradeIds.map(id => ({ id }))
            },
            Type: {
              connect: {
                id: createDatumDto.dataTypeId
              }
            },
            DataPacks: {
              connect: createDatumDto.dataPackIds.map(id => ({ id }))
            },
            name: createDatumDto.name,
            thumbnail: createDatumDto.thumbnail,
            author: createDatumDto.author,
            uses: createDatumDto.uses,
            decs: createDatumDto.decs,
          }
        })

        if (subData.length) {
          await prisma.subData.createMany({
            data: subData.map(subDatum => ({
              name: subDatum.name,
              url: subDatum.url,
              decs: subDatum.decs,
              dataId: createdDatum.id,
            }))
          })
        }

        const createdDatumWithSubData = await prisma.data.findUnique({
          where: { id: createdDatum.id },
          include: { SubData: true }
        })

        createdData.push(createdDatumWithSubData)
      }

      return createdData;
    })
  }

  async findAll(query?: PaginationQuery & Record<string, any>) {
    const where: any = {};
    const subjectId = getQueryValue(query?.subjectId);
    const topicId = getQueryValue(query?.topicId);
    const dataTypeId = getQueryValue(query?.dataTypeId);
    const gradeId = getQueryValue(query?.gradeId);
    const dataPackId = getQueryValue(query?.dataPackId);
    const search = getQueryValue(query?.search);

    if (subjectId) {
      where.subjectId = subjectId;
    }
    if (topicId) {
      where.topicId = topicId;
    }
    if (dataTypeId) {
      where.dataTypeId = dataTypeId;
    }
    if (gradeId) {
      where.gradeIds = { has: gradeId };
    }
    if (dataPackId) {
      where.dataPackIds = { has: dataPackId };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } },
        { uses: { contains: search, mode: 'insensitive' } },
        { decs: { contains: search, mode: 'insensitive' } },
      ];
    }

    return paginate(this.prisma.data, query, {
      where,
      include: {
        Subject: true,
        Topic: true,
        Grades: true,
        Type: true,
        DataPacks: true,
        SubData: true,
      },
    });
  }

  async findOne(id: string): Promise<Data | null> {
    return this.prisma.data.findUnique({
      where: { id },
      include: {
        Subject: true,
        Topic: true,
        Grades: true,
        Type: true,
        DataPacks: true,
        SubData: true,
      },
    });
  }

  async update(id: string, updateDatumDto: UpdateDatumDto): Promise<Data | null> {
    const foundData = await this.prisma.data.findUnique({
      where: { id }
    })
    if (!foundData) {
      throw new BadRequestException("Data not found")
    }

    return await this.prisma.data.update({
      where: { id },
      data: {
        name: updateDatumDto.name,
        thumbnail: updateDatumDto.thumbnail,
        author: updateDatumDto.author,
        uses: updateDatumDto.uses,
        decs: updateDatumDto.decs,
        subjectId: updateDatumDto.subjectId,
        topicId: updateDatumDto.topicId,
        dataTypeId: updateDatumDto.dataTypeId,
        Grades: updateDatumDto.gradeIds && {
          set: [...new Set(updateDatumDto.gradeIds)].map(id => ({ id }))
        },
        DataPacks: updateDatumDto.dataPackIds && {
          set: [...new Set(updateDatumDto.dataPackIds)].map(id => ({ id }))
        },
      }
    });
  }

  async remove(body: any) {
    const { dataIds } = body;

    const subData = await this.prisma.subData.findMany({
      where: {
        dataId: {
          in: dataIds
        }
      }
    })

    const dataPacks = await this.prisma.dataPack.findMany({
      where: {
        dataIds: {
          hasSome: dataIds
        }
      }
    })

    const grades = await this.prisma.grade.findMany({
      where: {
        dataIds: {
          hasSome: dataIds
        }
      }
    })

    if (subData.length) {
      for await (const sdt of subData) {
        if (sdt.url) {
          unlink(sdt.url, () => { })
        }
      }
      await this.prisma.subData.deleteMany({
        where: {
          id: { in: subData.map(e => e.id) }
        }
      })
    }

    if (dataPacks.length) {
      for await (const dtp of dataPacks) {
        await this.prisma.dataPack.update({
          where: {
            id: dtp.id
          },
          data: {
            Data: {
              disconnect: dataIds.map(e => ({ id: e })),
            }
          }
        })
      }
    }

    if (grades.length) {
      for await (const grd of grades) {
        await this.prisma.grade.update({
          where: {
            id: grd.id
          },
          data: {
            Data: {
              disconnect: dataIds.map(e => ({ id: e })),
            }
          }
        })
      }
    }

    return await this.prisma.data.deleteMany({
      where: {
        id: { in: dataIds }
      }
    },);
  }
}
