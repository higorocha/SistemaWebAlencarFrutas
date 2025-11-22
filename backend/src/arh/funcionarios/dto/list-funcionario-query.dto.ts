import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import {
  StatusFuncionario,
  TipoContratoFuncionario,
} from '@prisma/client';
import { PaginationQueryDto } from '../../dto/pagination-query.dto';

export class ListFuncionarioQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  search?: string;

  @IsOptional()
  @IsEnum(StatusFuncionario)
  status?: StatusFuncionario;

  @IsOptional()
  @IsEnum(TipoContratoFuncionario)
  tipoContrato?: TipoContratoFuncionario;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  cargoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  funcaoId?: number;
}

