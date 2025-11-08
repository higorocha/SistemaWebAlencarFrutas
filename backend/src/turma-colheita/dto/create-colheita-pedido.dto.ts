import { IsString, IsOptional, IsEnum, IsNumber, IsPositive, IsNotEmpty, IsDateString, IsBoolean, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Definindo o tipo do enum UnidadeMedida
type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';

export class CreateTurmaColheitaPedidoCustoDto {
  @ApiProperty({
    description: 'ID da turma de colheita',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  turmaColheitaId: number;

  @ApiProperty({
    description: 'ID do pedido',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  pedidoId: number;

  @ApiProperty({
    description: 'ID da fruta',
    example: 1,
  })
  @IsNumber()
  @IsPositive()
  frutaId: number;

  @ApiProperty({
    description: 'Quantidade colhida',
    example: 500.5,
  })
  @IsNumber()
  @IsPositive()
  quantidadeColhida: number;

  @ApiProperty({
    description: 'Unidade de medida da quantidade',
    enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'],
    example: 'KG',
  })
  @IsEnum(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'])
  unidadeMedida: UnidadeMedida;

  @ApiPropertyOptional({
    description: 'Valor pago pela colheita',
    example: 2500.0,
  })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  valorColheita?: number;

  @ApiPropertyOptional({
    description: 'Data da colheita específica',
    example: '2024-12-15T08:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dataColheita?: string;

  @ApiPropertyOptional({
    description: 'Se o pagamento foi efetuado',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  pagamentoEfetuado?: boolean;

  @ApiPropertyOptional({
    description: 'Forma como o pagamento foi realizado',
    example: 'PIX',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  formaPagamento?: string;

  @ApiPropertyOptional({
    description: 'Observações específicas da colheita',
    example: 'Colheita realizada em boas condições climáticas',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}