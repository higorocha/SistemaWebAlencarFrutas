import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { StatusFolhaPagamento } from '@prisma/client';
import { PaginationQueryDto } from '../../dto/pagination-query.dto';

export class ListFolhaQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(StatusFolhaPagamento)
  status?: StatusFolhaPagamento;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  mes?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  ano?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(2)
  periodo?: number;
}

