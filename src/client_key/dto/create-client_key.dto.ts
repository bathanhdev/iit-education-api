import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateClientKeyDto {
  @IsNotEmpty()
  key: string;

  @Type(() => Number)
  @IsOptional()
  limit?: number;

  @Type(() => Number)
  @IsOptional()
  randomKeys?: number;

  @IsOptional()
  decs?: string;

  @IsOptional()
  expirationDate?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  deviceIds?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  dataPackIds?: string[];
}
