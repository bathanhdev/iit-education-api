import { Body, Controller, Delete, Get, Param, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { SubjectService } from './subject.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { unlink } from 'fs';
import { PrismaService } from 'src/prisma/prisma.service';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService, private prisma: PrismaService) { }

  @Post()
  create(@Body() createSubjectDto: CreateSubjectDto) {
    return this.subjectService.create(createSubjectDto);
  }

  @Post("upload/:id")
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: 'thumbnails/',
      filename(_req, file, callback) {
        callback(
          null,
          Buffer.from(`${uuid()}.${file.mimetype.split("/").slice(-1)[0]}`, 'latin1').toString(
            'utf8',
          ),
        )
      },
    }),
  }))
  upload(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    this.prisma.subject.findUniqueOrThrow({
      where: { id }
    }).catch(_ => unlink(file.path, () => { }))
    return this.subjectService.upload(id, file);
  }

  @Get()
  findAll() {
    return this.subjectService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.subjectService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
    return this.subjectService.update(id, updateSubjectDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subjectService.remove(id);
  }
}
