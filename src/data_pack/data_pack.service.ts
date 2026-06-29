import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateDataPackDto } from './dto/create-data_pack.dto';
import { UpdateDataPackDto } from './dto/update-data_pack.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { getQueryValue, paginate, PaginationQuery } from 'src/common/pagination';

@Injectable()
export class DataPackService {
  constructor(private prisma: PrismaService) { }

  async create(createDataPackDto: CreateDataPackDto) {
    const newDataPack = await this.prisma.dataPack.create({
      data: {
        name: createDataPackDto.name,
        Data: createDataPackDto.dataIds?.length ? {
          connect: createDataPackDto.dataIds.map(id => ({ id }))
        } : undefined,
        ClientKeys: createDataPackDto.clientKeyIds?.length ? {
          connect: createDataPackDto.clientKeyIds.map(id => ({ id }))
        } : undefined,
      }
    })
    return newDataPack;
  }

  async findAll() {
    const dataPacks = await this.prisma.dataPack.findMany()
    return dataPacks
  }

  async findOne(id: string) {
    const foundDataPack = this.prisma.dataPack.findUnique(
      {
        where: { id },
        include: {
          Data: true,
          ClientKeys: true,
        },
      }
    )
    return foundDataPack
  }
  async findKeys(id: string, query?: PaginationQuery & Record<string, any>) {
    const foundDataPack = await this.prisma.dataPack.findUnique({ where: { id } });
    if (!foundDataPack) {
      throw new BadRequestException("Data Package not found")
    }

    const where: any = {
      dataPackIds: { has: id },
    };
    const search = getQueryValue(query?.search);

    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { decs: { contains: search, mode: 'insensitive' } },
      ];
    }

    return paginate(this.prisma.clientKey, query, {
      where,
      include: {
        DataPacks: true,
        Devices: true,
      },
    });
  }

  async update(id: string, updateDataPackDto: UpdateDataPackDto) {
    const foundDataPack = await this.prisma.dataPack.findUnique({ where: { id } });
    if (!foundDataPack) {
      throw new BadRequestException("Data Package not found")
    }

    return this.prisma.dataPack.update({
      where: { id },
      data: {
        name: updateDataPackDto.name,
        Data: updateDataPackDto.dataIds && {
          set: [...new Set(updateDataPackDto.dataIds)].map(id => ({ id }))
        },
        ClientKeys: updateDataPackDto.clientKeyIds && {
          set: [...new Set(updateDataPackDto.clientKeyIds)].map(id => ({ id }))
        },
      }
    });
  }

  async copy(id: string, updateDataPackDto: UpdateDataPackDto) {
    let foundDataPack = await this.prisma.dataPack.findUnique({ where: { id: id } });
    if (!foundDataPack) {
      throw new BadRequestException("Data Package not found")
    } else {
      if (updateDataPackDto.fromDataPackId) {
        let foundFromDataPack = await this.prisma.dataPack.findUnique({ where: { id: updateDataPackDto.fromDataPackId } });
        foundDataPack = await this.prisma.dataPack.update(
          {
            where: { id },
            data: {
              Data: {
                connect: foundFromDataPack.dataIds.map(id => ({ id })),
              },
            }
          }
        )
      } else {
        throw new BadRequestException("Copy Data Package not found")
      }
    }
    return foundDataPack;
  }

  async remove(id: string) {
    const clientKeys = await this.prisma.clientKey.findMany({
      where: {
        dataPackIds: {
          has: id
        }
      }
    })

    if (clientKeys?.length) {
      for await (const clK of clientKeys) {
        await this.prisma.clientKey.update(
          {
            where: { id: clK.id },
            data: {
              DataPacks: {
                disconnect: { id }
              }
            }
          }
        )
      }
    }
    return this.prisma.dataPack.delete(
      {
        where: { id }
      }
    )
  }
}
