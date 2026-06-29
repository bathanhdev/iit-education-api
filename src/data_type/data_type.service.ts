import { Injectable } from '@nestjs/common';
import { CreateDataTypeDto } from './dto/create-data_type.dto';
import { UpdateDataTypeDto } from './dto/update-data_type.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class DataTypeService {
  constructor(private prisma: PrismaService) { }

  async create(createDataTypeDto: CreateDataTypeDto) {
    const newDataType = await this.prisma.dataType.create(
      { data: createDataTypeDto }
    )
    return newDataType
  }

  async findAll() {
    const dataTypes = await this.prisma.dataType.findMany()
    return dataTypes
  }

  async findOne(id: string) {
    const foundDataTypes = await this.prisma.dataType.findUnique(
      { where: { id } }
    )
    return foundDataTypes
  }

  async update(id: string, updateDataTypeDto: UpdateDataTypeDto) {
    const updatedDataTypes = await this.prisma.dataType.update(
      { where: { id }, data: updateDataTypeDto, }
    )
    return updatedDataTypes
  }

  async remove(id: string) {
    const deletedDataType = await this.prisma.dataType.delete(
      { where: { id } }
    )
    return deletedDataType
  }
}
