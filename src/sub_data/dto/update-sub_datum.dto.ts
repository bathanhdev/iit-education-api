import { PartialType } from '@nestjs/swagger';
import { CreateSubDatumDto } from './create-sub_datum.dto';

export class UpdateSubDatumDto extends PartialType(CreateSubDatumDto) {}
