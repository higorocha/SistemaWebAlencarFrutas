import { PartialType } from '@nestjs/mapped-types';
import { CreateFuncaoDiaristaDto } from './create-funcao-diarista.dto';
import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFuncaoDiaristaDto extends PartialType(CreateFuncaoDiaristaDto) {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  ativo?: boolean;
}

