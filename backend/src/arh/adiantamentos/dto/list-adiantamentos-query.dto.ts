import { IsOptional, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';

export class ListAdiantamentosQueryDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  apenasAtivos?: boolean;
}
