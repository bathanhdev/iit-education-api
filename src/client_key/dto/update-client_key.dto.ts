import { PartialType } from '@nestjs/swagger';
import { CreateClientKeyDto } from './create-client_key.dto';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateClientKeyDto extends PartialType(CreateClientKeyDto) {
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    keys?: string[];
}
