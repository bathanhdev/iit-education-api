import { Injectable } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Subject } from '@prisma/client';
import { unlink } from 'fs';

@Injectable()
export class SubjectService {
  constructor(private prisma: PrismaService) { }

  async create(createSubjectDto: CreateSubjectDto) {
    const newSubject = await this.prisma.subject.create(
      {
        data: createSubjectDto
      }
    )
    return newSubject
  }

  async upload(id: string, file: Express.Multer.File): Promise<Subject | null> {
    await this.prisma.subject.findUnique(
      {
        where: { id },
      }
    ).then(data => {
      if (data && data.imageIcon) {
        unlink(data.imageIcon, () => { })
      }
    })

    return this.prisma.subject.update(
      {
        where: { id },
        data: {
          imageIcon: file.path
        }
      }
    );
  }

  async findAll() {
    const subjects = await this.prisma.subject.findMany()
    return subjects
  }

  async findOne(id: string) {
    const foundSubject = await this.prisma.subject.findUnique(
      {
        where: { id }
      }
    )
    return foundSubject;
  }

  async update(id: string, updateSubjectDto: UpdateSubjectDto) {
    const updatedSubject = await this.prisma.subject.update({
      where: { id },
      data: updateSubjectDto
    })
    return updatedSubject
  }

  async remove(id: string) {
    const deletedSubject = await this.prisma.subject.delete({
      where: { id },
    })
    return deletedSubject
  }
}
