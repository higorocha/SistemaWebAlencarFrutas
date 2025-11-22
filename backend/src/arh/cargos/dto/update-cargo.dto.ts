import { PartialType } from '@nestjs/mapped-types';
import { CreateCargoDto } from './create-cargo.dto';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateCargoDto extends PartialType(CreateCargoDto) {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativo?: boolean;
}

