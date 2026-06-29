import { Module } from '@nestjs/common';
import { SubDataService } from './sub_data.service';
import { SubDataController } from './sub_data.controller';
import { MulterModule } from '@nestjs/platform-express';
import { PrismaService } from 'src/prisma/prisma.service';
import { HttpModule } from '@nestjs/axios';

@Module({
  controllers: [SubDataController],
  providers: [SubDataService, PrismaService],
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    HttpModule,
  ]
})
export class SubDataModule { }
