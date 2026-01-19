import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RetornoMovimentoDto {
  @ApiProperty({
    description: 'Data inicial do processamento do movimento de retorno (formato: dd/mm/aaaa)',
    example: '13/02/2026'
  })
  @IsString()
  dataMovimentoRetornoInicial: string;

  @ApiProperty({
    description: 'Data final do processamento do movimento de retorno (formato: dd/mm/aaaa)',
    example: '18/02/2026'
  })
  @IsString()
  dataMovimentoRetornoFinal: string;

  @ApiPropertyOptional({
    description: 'Código do prefixo identificador de uma dependência do Banco',
    example: 3478
  })
  @IsOptional()
  @IsInt()
  codigoPrefixoAgencia?: number;

  @ApiPropertyOptional({
    description: 'Número identificador de uma Conta Corrente',
    example: 54160
  })
  @IsOptional()
  @IsInt()
  numeroContaCorrente?: number;

  @ApiPropertyOptional({
    description: 'Número identificador da carteira de Cobrança',
    example: 17
  })
  @IsOptional()
  @IsInt()
  numeroCarteiraCobranca?: number;

  @ApiPropertyOptional({
    description: 'Número identificador da variação da Carteira de Cobrança',
    example: 19
  })
  @IsOptional()
  @IsInt()
  numeroVariacaoCarteiraCobranca?: number;

  @ApiPropertyOptional({
    description: 'Número do registro ou da página que deseja buscar (primeira chamada: "001")',
    example: '001',
    default: '001'
  })
  @IsOptional()
  @IsString()
  numeroRegistroPretendido?: string;

  @ApiPropertyOptional({
    description: 'Quantidade de registros ou páginas que desejar buscar (máximo: 10000)',
    example: 1000,
    minimum: 1,
    maximum: 10000,
    default: 1000
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10000)
  quantidadeRegistroPretendido?: number;
}
