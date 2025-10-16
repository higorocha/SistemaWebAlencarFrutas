import { IsDateString, IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para query parameters de consulta de transações PIX
 */
export class QueryTransacoesPixDto {
  @ApiProperty({
    description: 'Data de início no formato YYYY-MM-DD',
    example: '2024-01-01',
    format: 'date'
  })
  @IsDateString({}, { message: 'Data de início deve estar no formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  inicio: string;

  @ApiProperty({
    description: 'Data de fim no formato YYYY-MM-DD',
    example: '2024-01-31',
    format: 'date'
  })
  @IsDateString({}, { message: 'Data de fim deve estar no formato YYYY-MM-DD' })
  @IsNotEmpty({ message: 'Data de fim é obrigatória' })
  fim: string;
}

/**
 * DTO para informações do pagador PIX
 */
export class PagadorPixDto {
  @ApiPropertyOptional({ description: 'CPF do pagador' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ description: 'CNPJ do pagador' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ description: 'Nome do pagador' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Nome fantasia do pagador' })
  @IsOptional()
  @IsString()
  nomeFantasia?: string;
}

/**
 * DTO para informações do recebedor PIX
 */
export class RecebedorPixDto {
  @ApiPropertyOptional({ description: 'CPF do recebedor' })
  @IsOptional()
  @IsString()
  cpf?: string;

  @ApiPropertyOptional({ description: 'CNPJ do recebedor' })
  @IsOptional()
  @IsString()
  cnpj?: string;

  @ApiPropertyOptional({ description: 'Nome do recebedor' })
  @IsOptional()
  @IsString()
  nome?: string;

  @ApiPropertyOptional({ description: 'Nome fantasia do recebedor' })
  @IsOptional()
  @IsString()
  nomeFantasia?: string;

  @ApiPropertyOptional({ description: 'Agência do recebedor' })
  @IsOptional()
  @IsString()
  agencia?: string;

  @ApiPropertyOptional({ description: 'Conta do recebedor' })
  @IsOptional()
  @IsString()
  conta?: string;

  @ApiPropertyOptional({ description: 'Tipo de conta do recebedor' })
  @IsOptional()
  @IsString()
  tipoConta?: string;
}

/**
 * DTO para resposta de transação PIX
 */
export class TransacaoPixResponseDto {
  @ApiProperty({ description: 'Identificador end-to-end da transação PIX' })
  @IsString()
  endToEndId: string;

  @ApiPropertyOptional({ description: 'ID da transação PIX' })
  @IsOptional()
  @IsString()
  txid?: string;

  @ApiProperty({ description: 'Valor da transação em formato string' })
  @IsString()
  valor: string;

  @ApiProperty({ description: 'Horário da transação no formato ISO 8601' })
  @IsString()
  horario: string;

  @ApiPropertyOptional({ description: 'Informações do pagador' })
  @IsOptional()
  @Type(() => PagadorPixDto)
  pagador?: PagadorPixDto;

  @ApiPropertyOptional({ description: 'Informações do recebedor' })
  @IsOptional()
  @Type(() => RecebedorPixDto)
  recebedor?: RecebedorPixDto;

  @ApiPropertyOptional({ description: 'Chave PIX utilizada' })
  @IsOptional()
  @IsString()
  chave?: string;

  @ApiPropertyOptional({ description: 'Descrição da transação' })
  @IsOptional()
  @IsString()
  descricao?: string;

  @ApiPropertyOptional({ description: 'Informações adicionais da transação' })
  @IsOptional()
  infoAdicionais?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Tipo da transação PIX' })
  @IsOptional()
  @IsString()
  tipo?: string;

  @ApiPropertyOptional({ description: 'Status da transação' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Motivo do cancelamento (se cancelada)' })
  @IsOptional()
  @IsString()
  motivoCancelamento?: string;

  @ApiPropertyOptional({ description: 'Data de criação da transação' })
  @IsOptional()
  @IsString()
  criacao?: string;

  @ApiPropertyOptional({ description: 'Data de expiração da transação' })
  @IsOptional()
  @IsString()
  expiracao?: string;

  @ApiPropertyOptional({ description: 'Valor original da transação (para devoluções)' })
  @IsOptional()
  @IsString()
  valorOriginal?: string;

  @ApiPropertyOptional({ description: 'ID da transação original (para devoluções)' })
  @IsOptional()
  @IsString()
  txidOriginal?: string;
}

/**
 * DTO para resposta da consulta de transações PIX
 */
export class ConsultaTransacoesPixResponseDto {
  @ApiProperty({ 
    description: 'Array de transações PIX encontradas',
    type: [TransacaoPixResponseDto]
  })
  transacoes: TransacaoPixResponseDto[];

  @ApiProperty({ description: 'Total de transações encontradas' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Período consultado - data de início' })
  @IsString()
  periodoInicio: string;

  @ApiProperty({ description: 'Período consultado - data de fim' })
  @IsString()
  periodoFim: string;

  @ApiProperty({ description: 'Data/hora da consulta' })
  @IsString()
  consultadoEm: string;
}

/**
 * DTO para resposta de erro da API PIX
 */
export class ErroPixResponseDto {
  @ApiProperty({ description: 'Mensagem de erro' })
  @IsString()
  error: string;

  @ApiPropertyOptional({ description: 'Código do erro' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Detalhes adicionais do erro' })
  @IsOptional()
  detalhes?: Record<string, any>;
}
