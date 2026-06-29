import { IsArray, IsOptional, IsString } from 'class-validator';

export class DeleteManyDeviceDto {
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deviceIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  devices?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  duids?: string[];
}
