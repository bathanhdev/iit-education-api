import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Response } from 'express';
import { lastValueFrom } from 'rxjs';

export type HealthCheckResponse = {
  status: 'ok';
  service: string;
  timestamp: string;
  uptime: {
    seconds: number;
    human: string;
  };
  runtime: {
    node: string;
    platform: string;
    memory: {
      rss: string;
      heapUsed: string;
      heapTotal: string;
    };
  };
};

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) { }

  getHello(): HealthCheckResponse {
    const memory = process.memoryUsage();
    const uptimeSeconds = Math.floor(process.uptime());

    return {
      status: 'ok',
      service: 'IIT Education API',
      timestamp: new Date().toISOString(),
      uptime: {
        seconds: uptimeSeconds,
        human: this.formatUptime(uptimeSeconds),
      },
      runtime: {
        node: process.version,
        platform: process.platform,
        memory: {
          rss: this.formatBytes(memory.rss),
          heapUsed: this.formatBytes(memory.heapUsed),
          heapTotal: this.formatBytes(memory.heapTotal),
        },
      },
    };
  }

  async streamFile(file: string, res: Response): Promise<void> {
    const response = this.httpService.get(`${process.env.CDN}${file}`, { responseType: 'stream' });

    const stream = await lastValueFrom(response);

    res.setHeader('Content-Type', stream.headers['content-type']);
    res.setHeader('Content-Length', stream.headers['content-length']);
    res.setHeader('Content-Disposition', `attachment; filename="${stream.headers['file-name'] || 'downloadedFile'}"`);

    stream.data.pipe(res);
  }

  private formatUptime(totalSeconds: number): string {
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [
      days ? `${days}d` : null,
      hours ? `${hours}h` : null,
      minutes ? `${minutes}m` : null,
      `${seconds}s`,
    ].filter(Boolean).join(' ');
  }

  private formatBytes(bytes: number): string {
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }
}
