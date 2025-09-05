import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsNumber, IsBoolean, IsOptional, Min, Max, IsInt } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para criação/atualização do convênio de cobrança
 * Como é um registro único, usamos o mesmo DTO para create e update
 */
export class ConvenioCobrancaDto {
  @ApiProperty({
    description: 'ID da conta corrente associada',
    example: 1,
  })
  @IsInt({ message: 'ID da conta corrente deve ser um número inteiro' })
  @Type(() => Number)
  contaCorrenteId: number;

  @ApiProperty({
    description: 'Percentual de juros ao mês',
    example: 2.5,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber({}, { message: 'Juros deve ser um número válido' })
  @Min(0, { message: 'Juros não pode ser negativo' })
  @Max(100, { message: 'Juros não pode ser superior a 100%' })
  @Type(() => Number)
  juros: number;

  @ApiProperty({
    description: 'Quantidade de dias em aberto',
    example: 30,
    minimum: 1,
    maximum: 365,
  })
  @IsNumber({}, { message: 'Dias em aberto deve ser um número válido' })
  @Min(1, { message: 'Dias em aberto deve ser pelo menos 1' })
  @Max(365, { message: 'Dias em aberto não pode ser superior a 365' })
  @Type(() => Number)
  diasAberto: number;

  @ApiProperty({
    description: 'Se a multa está ativa',
    example: true,
  })
  @IsBoolean({ message: 'Multa ativa deve ser verdadeiro ou falso' })
  multaAtiva: boolean;

  @ApiProperty({
    description: 'Se o layout do boleto tem fundo branco',
    example: false,
  })
  @IsBoolean({ message: 'Layout boleto fundo branco deve ser verdadeiro ou falso' })
  layoutBoletoFundoBranco: boolean;

  @ApiProperty({
    description: 'Valor da multa em percentual (obrigatório se multa ativa)',
    example: 5.0,
    required: false,
    minimum: 0,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Valor da multa deve ser um número válido' })
  @Min(0, { message: 'Valor da multa não pode ser negativo' })
  @Max(100, { message: 'Valor da multa não pode ser superior a 100%' })
  @Type(() => Number)
  valorMulta?: number | null;

  @ApiProperty({
    description: 'Carência da multa em dias (obrigatório se multa ativa)',
    example: 7,
    required: false,
    minimum: 0,
    maximum: 30,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Carência da multa deve ser um número válido' })
  @Min(0, { message: 'Carência da multa não pode ser negativa' })
  @Max(30, { message: 'Carência da multa não pode ser superior a 30 dias' })
  @Type(() => Number)
  carenciaMulta?: number | null;

  @ApiProperty({
    description: 'Número do convênio bancário',
    example: 'CONV123456',
  })
  @IsString({ message: 'Convênio deve ser um texto válido' })
  @IsNotEmpty({ message: 'Convênio é obrigatório' })
  convenio: string;

  @ApiProperty({
    description: 'Carteira bancária',
    example: '18',
  })
  @IsString({ message: 'Carteira deve ser um texto válido' })
  @IsNotEmpty({ message: 'Carteira é obrigatória' })
  carteira: string;

  @ApiProperty({
    description: 'Variação da carteira',
    example: '027',
  })
  @IsString({ message: 'Variação deve ser um texto válido' })
  @IsNotEmpty({ message: 'Variação é obrigatória' })
  variacao: string;
}

/**
 * DTO para resposta do convênio de cobrança
 * Inclui campos adicionais do banco de dados
 */
export class ConvenioCobrancaResponseDto extends ConvenioCobrancaDto {
  @ApiProperty({
    description: 'ID único do convênio',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
} 