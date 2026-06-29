import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DataService } from './data.service';
import { CreateDatumDto } from './dto/create-datum.dto';
import { UpdateDatumDto } from './dto/update-datum.dto';
import { CreateManyDataDto } from './dto/create-many-data.dto';

@Controller('data')
export class DataController {
  constructor(private readonly dataService: DataService) { }

  @Post()
  create(@Body() createDatumDto: CreateDatumDto) {
    return this.dataService.create(createDatumDto);
  }

  @Post('/create-many')
  createMany(@Body() createManyDataDto: CreateManyDataDto) {
    return this.dataService.createMany(createManyDataDto);
  }

  @Get()
  findAll(@Query() query) {
    return this.dataService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dataService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDatumDto: UpdateDatumDto) {
    return this.dataService.update(id, updateDatumDto);
  }

  @Delete()
  remove(@Body() body: any) {
    return this.dataService.remove(body);
  }
}
