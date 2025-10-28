import { IsNumber, IsOptional, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAjustesPrecificacaoDto {
  @ApiPropertyOptional({ description: 'Valor do frete (opcional)', example: 150.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  frete?: number;

  @ApiPropertyOptional({ description: 'Valor do ICMS (opcional)', example: 89.75 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  icms?: number;

  @ApiPropertyOptional({ description: 'Valor do desconto (opcional)', example: 50.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  desconto?: number;

  @ApiPropertyOptional({ description: 'Valor da avaria (opcional)', example: 25.00 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  avaria?: number;
}
