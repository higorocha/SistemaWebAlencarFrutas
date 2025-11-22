import { Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateFuncaoStatusDto {
  @Type(() => Boolean)
  @IsBoolean()
  ativo: boolean;
}

