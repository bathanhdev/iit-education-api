import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDeviceDto {
    @IsNotEmpty()
    duid: string;

    @IsOptional()
    tv?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    authLog?: Date[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    clientKeyIds?: string[];
}
