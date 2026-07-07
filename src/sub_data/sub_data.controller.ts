import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { unlink } from 'fs';
import { diskStorage } from 'multer';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateSubDatumDto } from './dto/create-sub_datum.dto';
import { UpdateSubDatumDto } from './dto/update-sub_datum.dto';
import { CreateManySubDatumDto } from './dto/create_many-sub_datum.dto';
import { SubDataService } from './sub_data.service';
import { Public } from '../auth/decorators/public.decorator';
import { Response } from 'express';
import { compressImageIfNeeded } from '../file-upload/file-helper';

@Controller('sub-data')
export class SubDataController {
  constructor(private readonly subDataService: SubDataService, private prisma: PrismaService) { }

  @Post()
  create(@Body() createSubDatumDto: CreateSubDatumDto) {
    return this.subDataService.create(createSubDatumDto);
  }

  @Post("/create-many")
  createMany(@Body() createManySubDatumDto: CreateManySubDatumDto) {
    return this.subDataService.createMany(createManySubDatumDto);
  }

  @Post("upload/:id")
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: 'uploads/',
      filename(req, file, callback) {
        const id = req.params.id;
        const extension = file.originalname.includes('.') ? file.originalname.split('.').pop() : '';
        const tempSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileName = extension ? id + '.' + tempSuffix + '.uploading.' + extension : id + '.' + tempSuffix + '.uploading';
        callback(
          null,
          Buffer.from(fileName, 'latin1').toString('utf8'),
        )
      },
    }),
    limits: { fileSize: 200 * 1024 * 1024 },
  }))
  async upload(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    try {
      await this.prisma.subData.findUniqueOrThrow({
        where: { id }
      });
    } catch (error) {
      unlink(file.path, () => { });
      throw error;
    }
    await compressImageIfNeeded(file.path);
    return this.subDataService.upload(id, file);
  }

  @Get()
  findAll(@Query() query) {
    return this.subDataService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subDataService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubDatumDto: UpdateSubDatumDto) {
    return this.subDataService.update(id, updateSubDatumDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subDataService.remove(id);
  }

  @Get('stream/:file')
  @Public()
  getFile(@Param("file") file: string, @Res() res: Response) {
    return this.subDataService.streamFile(file, res);
  }
}
