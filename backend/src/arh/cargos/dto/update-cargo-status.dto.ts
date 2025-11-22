import { Type } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export class UpdateCargoStatusDto {
  @Type(() => Boolean)
  @IsBoolean()
  ativo: boolean;
}

