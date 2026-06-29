import { IsNotEmpty, IsOptional } from "class-validator";

export class CreateSubDatumDto {
    @IsNotEmpty()
    name: string;

    @IsOptional()
    url: string;

    @IsNotEmpty()
    decs: string;

    @IsNotEmpty()
    dataId: string;
}
