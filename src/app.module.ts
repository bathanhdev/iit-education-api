import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SubjectModule } from './subject/subject.module';
import { GradeModule } from './grade/grade.module';
import { TopicModule } from './topic/topic.module';
import { DataTypeModule } from './data_type/data_type.module';
import { ClientKeyModule } from './client_key/client_key.module';
import { DataPackModule } from './data_pack/data_pack.module';
import { DeviceModule } from './device/device.module';
import { PrismaModule } from './prisma/prisma.module';
import { DataModule } from './data/data.module';
import { SubDataModule } from './sub_data/sub_data.module';
import { AuthModule } from './auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { FileUploadModule } from './file-upload/file-upload.module';

@Module({
  imports: [SubjectModule, GradeModule, TopicModule, DataTypeModule, ClientKeyModule, DataPackModule, DeviceModule, PrismaModule, DataModule, SubDataModule, AuthModule, HttpModule, FileUploadModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
