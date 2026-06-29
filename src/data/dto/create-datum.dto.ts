import { IsArray, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateDatumDto {
    @IsNotEmpty()
    subjectId: string;

    @IsNotEmpty()
    topicId: string;

    @IsNotEmpty()
    @IsArray()
    @IsString({ each: true })
    gradeIds: string[];

    @IsNotEmpty()
    dataTypeId: string;

    @IsNotEmpty()
    name: string;

    @IsOptional()
    thumbnail?: string;

    @IsOptional()
    author?: string;

    @IsArray()
    @IsString({ each: true })
    @IsNotEmpty()
    dataPackIds: string[];

    @IsOptional()
    uses?: string;

    @IsOptional()
    decs?: string;
}
