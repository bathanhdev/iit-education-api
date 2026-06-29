import { Controller, Get, Param, Res } from '@nestjs/common';
import { AppService, HealthCheckResponse } from './app.service';
import { Public } from './auth/decorators/public.decorator';
import { Response } from 'express';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) { }

  @Get()
  @Public()
  getHello(): HealthCheckResponse {
    return this.appService.getHello();
  }

  @Get('uploads/:file')
  @Public()
  streamFile(@Param("file") file: string, @Res() res: Response) {
    return this.appService.streamFile(file, res);
  }
}
