import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { DataTypeService } from './data_type.service';
import { CreateDataTypeDto } from './dto/create-data_type.dto';
import { UpdateDataTypeDto } from './dto/update-data_type.dto';

@Controller('data-type')
export class DataTypeController {
  constructor(private readonly dataTypeService: DataTypeService) { }

  @Post()
  create(@Body() createDataTypeDto: CreateDataTypeDto) {
    return this.dataTypeService.create(createDataTypeDto);
  }

  @Get()
  findAll() {
    return this.dataTypeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.dataTypeService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDataTypeDto: UpdateDataTypeDto) {
    return this.dataTypeService.update(id, updateDataTypeDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dataTypeService.remove(id);
  }
}
