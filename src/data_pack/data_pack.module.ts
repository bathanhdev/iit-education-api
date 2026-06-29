import { Module } from '@nestjs/common';
import { DataPackService } from './data_pack.service';
import { DataPackController } from './data_pack.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [DataPackController],
  providers: [DataPackService, PrismaService],
})
export class DataPackModule { }
