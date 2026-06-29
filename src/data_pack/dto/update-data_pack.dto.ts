import { PartialType } from '@nestjs/swagger';
import { CreateDataPackDto } from './create-data_pack.dto';
import { IsOptional } from 'class-validator';

export class UpdateDataPackDto extends PartialType(CreateDataPackDto) {
    @IsOptional()
    fromDataPackId?: string;
}
