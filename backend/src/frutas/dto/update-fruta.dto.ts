import { PartialType } from '@nestjs/swagger';
import { CreateFrutaDto } from './create-fruta.dto';

export class UpdateFrutaDto extends PartialType(CreateFrutaDto) {} 