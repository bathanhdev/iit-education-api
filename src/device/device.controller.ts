import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { DeviceService } from './device.service';
import { CreateDeviceDto } from './dto/create-device.dto';
import { UpdateDeviceDto } from './dto/update-device.dto';
import { DeleteManyDeviceDto } from './dto/delete-many-device.dto';

@Controller('device')
export class DeviceController {
  constructor(private readonly deviceService: DeviceService) { }

  @Post()
  create(@Body() createDeviceDto: CreateDeviceDto) {
    return this.deviceService.create(createDeviceDto);
  }

  @Get()
  findAll(@Query() query) {
    return this.deviceService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.deviceService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDeviceDto: UpdateDeviceDto) {
    return this.deviceService.update(id, updateDeviceDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.deviceService.remove(id);
  }

  @Post('/delete_many')
  removeMany(@Body() deleteManyDeviceDto: DeleteManyDeviceDto) {
    return this.deviceService.removeMany(deleteManyDeviceDto);
  }
}
