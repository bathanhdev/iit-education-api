import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateGradeDto {
    @IsNotEmpty()
    name: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    dataIds?: string[];
}
