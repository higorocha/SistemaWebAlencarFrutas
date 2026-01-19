import { IsOptional, IsDateString, IsDecimal, IsBoolean, IsString, MaxLength, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AlterarBoletoDto {
  @ApiPropertyOptional({
    description: 'Nova data de vencimento (formato: YYYY-MM-DD)',
    example: '2026-12-31'
  })
  @IsOptional()
  @IsDateString()
  novaDataVencimento?: string;

  @ApiPropertyOptional({
    description: 'Novo valor nominal do boleto',
    example: 150.00,
    minimum: 0.01
  })
  @IsOptional()
  @IsDecimal({ decimal_digits: '0,2' })
  @Min(0.01)
  novoValorNominal?: number;

  @ApiPropertyOptional({
    description: 'Indica se deve cobrar juros no boleto',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  cobrarJuros?: boolean;

  @ApiPropertyOptional({
    description: 'Indica se deve cobrar multa no boleto',
    example: true
  })
  @IsOptional()
  @IsBoolean()
  cobrarMulta?: boolean;

  @ApiPropertyOptional({
    description: 'Indica se deve dispensar juros',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  dispensarJuros?: boolean;

  @ApiPropertyOptional({
    description: 'Indica se deve dispensar multa',
    example: false
  })
  @IsOptional()
  @IsBoolean()
  dispensarMulta?: boolean;

  @ApiPropertyOptional({
    description: 'Quantidade de dias para recebimento após vencimento',
    example: 30
  })
  @IsOptional()
  quantidadeDiasAceite?: number;

  @ApiPropertyOptional({
    description: 'Novo número de título beneficiário (Seu Número)',
    example: 'PED-2026-0001',
    maxLength: 15
  })
  @IsOptional()
  @IsString()
  @MaxLength(15)
  alteracaoSeuNumero?: string;
}
