import { IsArray, IsNumber, IsOptional, IsDecimal } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GerenciarAdiantamentoDto {
  @ApiPropertyOptional({
    description: 'IDs dos lançamentos de adiantamento a manter (se não informar, remove todos)',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsArray()
  @IsNumber({}, { each: true })
  @IsOptional()
  lancamentosAdiantamento?: number[];

  @ApiPropertyOptional({
    description: 'Valor avulso adicional a ser somado às parcelas vinculadas',
    type: Number,
    example: 100.00,
  })
  @IsNumber()
  @IsOptional()
  adiantamentoAvulso?: number;
}
