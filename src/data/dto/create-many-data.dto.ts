import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsOptional, ValidateNested } from 'class-validator';
import { CreateDatumDto } from './create-datum.dto';

export class CreateNestedSubDatumDto {
    @IsNotEmpty()
    name: string;

    @IsOptional()
    url?: string;

    @IsNotEmpty()
    decs: string;
}

export class CreateDatumWithSubDataDto extends CreateDatumDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateNestedSubDatumDto)
    @IsOptional()
    subData?: CreateNestedSubDatumDto[];

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateNestedSubDatumDto)
    @IsOptional()
    SubData?: CreateNestedSubDatumDto[];
}

export class CreateManyDataDto {
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDatumWithSubDataDto)
    @IsNotEmpty()
    data: CreateDatumWithSubDataDto[];
}
