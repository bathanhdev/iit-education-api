import { IsNotEmpty, IsArray } from "class-validator";
import { CreateSubDatumDto } from "./create-sub_datum.dto";

export class CreateManySubDatumDto {
    @IsArray()
    @IsNotEmpty()
    subData: CreateSubDatumDto[];
}
