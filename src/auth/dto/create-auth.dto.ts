import { Optional } from "@nestjs/common";
import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateAuthDto {
    @IsNotEmpty()
    key: string;

    @IsNotEmpty()
    duid: string;

    @IsOptional()
    tv?: string;

    @IsOptional()
    reAuth?: boolean;
}
