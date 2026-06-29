import { Module } from '@nestjs/common';
import { DataTypeService } from './data_type.service';
import { DataTypeController } from './data_type.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DataTypeController],
  providers: [DataTypeService, PrismaService],
})
export class DataTypeModule { }
