import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateDataTypeDto {
    @IsNotEmpty()
    name: string;

    @IsOptional()
    icon?: string;
}
