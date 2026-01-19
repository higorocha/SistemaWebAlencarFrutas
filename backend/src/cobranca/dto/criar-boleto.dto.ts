import { IsInt, IsNumber, IsDateString, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CriarBoletoDto {
  @ApiProperty({
    description: 'ID do pedido ao qual o boleto está vinculado',
    example: 1
  })
  @IsInt()
  @Type(() => Number)
  pedidoId: number;

  @ApiProperty({
    description: 'ID da conta corrente que emitirá o boleto',
    example: 1
  })
  @IsInt()
  @Type(() => Number)
  contaCorrenteId: number;

  @ApiProperty({
    description: 'Valor original do boleto',
    example: 123.45,
    minimum: 0.01
  })
  @IsNumber({}, { message: 'Valor original deve ser um número válido' })
  @Min(0.01, { message: 'Valor original deve ser maior que zero' })
  @Type(() => Number)
  valorOriginal: number;

  @ApiProperty({
    description: 'Data de vencimento do boleto (formato: YYYY-MM-DD)',
    example: '2026-12-31'
  })
  @IsDateString()
  dataVencimento: string;

  @ApiPropertyOptional({
    description: 'Mensagem a ser impressa no boleto (máximo 165 caracteres)',
    example: 'Pagamento referente ao pedido PED-2026-0001',
    maxLength: 165
  })
  @IsOptional()
  @IsString()
  @MaxLength(165)
  mensagemBloquetoOcorrencia?: string;
}
