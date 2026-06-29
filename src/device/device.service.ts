import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeleteManyDeviceDto } from './dto/delete-many-device.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { buildPaginatedResult, getPaginationParams, getQueryValue, paginate, PaginationQuery } from 'src/common/pagination';

@Injectable()
export class DeviceService {
  constructor(private prisma: PrismaService) { }

  async create(createDeviceDto: CreateDeviceDto) {
    const newDevice = await this.prisma.device.create({
      data: {
        duid: createDeviceDto.duid,
        tv: createDeviceDto.tv,
        ClientKeys: createDeviceDto.clientKeyIds && (createDeviceDto.clientKeyIds.length ? {
          connect: createDeviceDto.clientKeyIds.map(id => ({ id }))
        } : undefined)
      }
    })
    return newDevice
  }

  async findAll(query?: PaginationQuery & Record<string, any>) {
    const where: any = {};
    const clientKeyId = getQueryValue(query?.clientKeyId);
    const search = getQueryValue(query?.search);
    const keyCount = this.getCountQueryValue(query?.keyCount ?? query?.keysCount, 'keyCount');
    const minKeyCount = this.getCountQueryValue(query?.minKeyCount, 'minKeyCount');
    const maxKeyCount = this.getCountQueryValue(query?.maxKeyCount, 'maxKeyCount');
    const hasKeyCountFilter = keyCount !== undefined || minKeyCount !== undefined || maxKeyCount !== undefined;

    if (minKeyCount !== undefined && maxKeyCount !== undefined && minKeyCount > maxKeyCount) {
      throw new BadRequestException('minKeyCount must be less than or equal to maxKeyCount');
    }
    if (clientKeyId) {
      where.clientKeyIds = { has: clientKeyId };
    }
    if (search) {
      where.OR = [
        { duid: { contains: search, mode: 'insensitive' } },
        { tv: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (hasKeyCountFilter) {
      const devices = await this.prisma.device.findMany({
        where,
        include: {
          ClientKeys: true,
        },
      });
      const filteredDevices = devices.filter(device => {
        const currentKeyCount = device.clientKeyIds?.length ?? 0;
        return (
          (keyCount === undefined || currentKeyCount === keyCount) &&
          (minKeyCount === undefined || currentKeyCount >= minKeyCount) &&
          (maxKeyCount === undefined || currentKeyCount <= maxKeyCount)
        );
      });
      const pagination = getPaginationParams(query);

      if (!pagination) {
        return filteredDevices;
      }

      const total = filteredDevices.length;
      const totalPages = Math.ceil(total / pagination.limit);
      const page = totalPages > 0 ? Math.min(pagination.page, totalPages) : pagination.page;
      const start = (page - 1) * pagination.limit;

      return buildPaginatedResult(
        filteredDevices.slice(start, start + pagination.limit),
        total,
        { page, limit: pagination.limit },
      );
    }

    return paginate(this.prisma.device, query, {
      where,
      include: {
        ClientKeys: true,
      },
    });
  }

  private getCountQueryValue(value: unknown, fieldName: string): number | undefined {
    const queryValue = getQueryValue(value);
    if (queryValue === undefined) {
      return undefined;
    }

    const count = Number(queryValue);
    if (!Number.isInteger(count) || count < 0) {
      throw new BadRequestException(fieldName + ' must be a non-negative integer');
    }

    return count;
  }

  async findOne(id: string) {
    const foundDevice = await this.prisma.device.findUnique({
      where: {
        id
      },
      include: {
        ClientKeys: true,
      },
    })
    return foundDevice
  }

  async update(id: string, updateDeviceDto: UpdateDeviceDto) {
    const updatedDevice = await this.prisma.device.update({
      where: { id },
      data: {
        duid: updateDeviceDto.duid,
        tv: updateDeviceDto.tv,
        ClientKeys: updateDeviceDto.clientKeyIds && {
          set: [...new Set(updateDeviceDto.clientKeyIds)].map(id => ({ id }))
        }
      }
    })
    return updatedDevice
  }

  async removeMany(deleteManyDeviceDto: DeleteManyDeviceDto) {
    const uniqueDeviceIds = [...new Set([
      ...(deleteManyDeviceDto.deviceIds ?? []),
      ...(deleteManyDeviceDto.devices ?? []),
    ])];
    const uniqueDuids = [...new Set(deleteManyDeviceDto.duids ?? [])];

    if (!uniqueDeviceIds.length && !uniqueDuids.length) {
      throw new BadRequestException('Device ids or duids is require and not empty!');
    }

    const conditions = [];
    if (uniqueDeviceIds.length) {
      conditions.push({ id: { in: uniqueDeviceIds } });
    }
    if (uniqueDuids.length) {
      conditions.push({ duid: { in: uniqueDuids } });
    }

    const devices = await this.prisma.device.findMany({
      where: conditions.length > 1 ? { OR: conditions } : conditions[0],
    });

    if (!devices.length) {
      throw new NotFoundException('Devices not found!');
    }

    const foundDeviceIds = devices.map(device => device.id);
    const clientKeys = await this.prisma.clientKey.findMany({
      where: {
        deviceIds: {
          hasSome: foundDeviceIds,
        },
      },
    });

    const operations: any[] = clientKeys.map(clientKey => this.prisma.clientKey.update({
      where: { id: clientKey.id },
      data: {
        Devices: {
          disconnect: foundDeviceIds.map(id => ({ id })),
        },
      },
    }));

    operations.push(this.prisma.device.deleteMany({
      where: {
        id: {
          in: foundDeviceIds,
        },
      },
    }) as any);

    const results = await this.prisma.$transaction(operations);
    const deletedDevices = results[results.length - 1] as { count: number };

    return {
      count: deletedDevices.count,
      deviceIds: foundDeviceIds,
      missingDeviceIds: uniqueDeviceIds.filter(id => !devices.some(device => device.id === id)),
      missingDuids: uniqueDuids.filter(duid => !devices.some(device => device.duid === duid)),
    };
  }

  async remove(id: string) {
    const clientKeys = await this.prisma.clientKey.findMany({
      where: {
        deviceIds: {
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
              Devices: {
                disconnect: { id }
              }
            }
          }
        )
      }
    }

    const deletedDevice = await this.prisma.device.delete({
      where: { id },
    })
    return deletedDevice
  }
}
