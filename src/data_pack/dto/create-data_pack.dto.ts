import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDataPackDto {
    @IsNotEmpty()
    name: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    dataIds: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    clientKeyIds: string[];
}
