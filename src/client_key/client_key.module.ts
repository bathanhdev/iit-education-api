import { Module } from '@nestjs/common';
import { ClientKeyService } from './client_key.service';
import { ClientKeyController } from './client_key.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [ClientKeyController],
  providers: [ClientKeyService, PrismaService],
})
export class ClientKeyModule {}
