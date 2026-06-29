import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateSubjectDto {
    @IsNotEmpty()
    name: string;

    @IsOptional()
    icon?: string;

    @IsOptional()
    imageIcon?: string;

    @IsNotEmpty()
    decs: string;
}
