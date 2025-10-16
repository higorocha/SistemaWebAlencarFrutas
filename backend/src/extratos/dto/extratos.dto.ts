import { IsDateString, IsNotEmpty, IsOptional, IsString, IsNumber, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO para query parameters de consulta de extratos
 */
export class QueryExtratosDto {
  @ApiProperty({
    description: 'Data de início no formato DDMMYYYY',
    example: '01122024',
    pattern: '^\\d{8}$'
  })
  @IsString()
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  dataInicio: string;

  @ApiProperty({
    description: 'Data de fim no formato DDMMYYYY',
    example: '31122024',
    pattern: '^\\d{8}$'
  })
  @IsString()
  @IsNotEmpty({ message: 'Data de fim é obrigatória' })
  dataFim: string;
}

/**
 * DTO para query parameters de consulta de extratos por período
 */
export class QueryExtratosPeriodoDto {
  @ApiProperty({
    description: 'Data de início no formato DD-MM-YYYY',
    example: '01-12-2024'
  })
  @IsString()
  @IsNotEmpty({ message: 'Data de início é obrigatória' })
  inicio: string;

  @ApiProperty({
    description: 'Data de fim no formato DD-MM-YYYY',
    example: '31-12-2024'
  })
  @IsString()
  @IsNotEmpty({ message: 'Data de fim é obrigatória' })
  fim: string;
}

/**
 * DTO para informações de lançamento de extrato
 */
export class LancamentoExtratoDto {
  @ApiProperty({ description: 'Data do lançamento' })
  @IsString()
  dataLancamento: string;

  @ApiProperty({ description: 'Data de efetivação do lançamento' })
  @IsString()
  dataEfetivaLancamento: string;

  @ApiProperty({ description: 'Descrição do lançamento' })
  @IsString()
  descricao: string;

  @ApiProperty({ description: 'Número do documento' })
  @IsString()
  numeroDocumento: string;

  @ApiProperty({ description: 'Valor do lançamento' })
  @IsString()
  valorLancamento: string;

  @ApiProperty({ description: 'Situação do lançamento' })
  @IsString()
  situacao: string;

  @ApiProperty({ description: 'Dados bancários do lançamento' })
  @IsString()
  dadosBancarios: string;

  @ApiPropertyOptional({ description: 'Informações adicionais do lançamento' })
  @IsOptional()
  @IsString()
  infoAdicionais?: string;

  @ApiPropertyOptional({ description: 'Tipo de lançamento' })
  @IsOptional()
  @IsString()
  tipoLancamento?: string;

  @ApiPropertyOptional({ description: 'Código de identificação do lançamento' })
  @IsOptional()
  @IsString()
  codigoIdentificacao?: string;

  @ApiPropertyOptional({ description: 'Histórico do lançamento' })
  @IsOptional()
  @IsString()
  historico?: string;

  @ApiPropertyOptional({ description: 'Agência de origem' })
  @IsOptional()
  @IsString()
  agenciaOrigem?: string;

  @ApiPropertyOptional({ description: 'Conta de origem' })
  @IsOptional()
  @IsString()
  contaOrigem?: string;

  @ApiPropertyOptional({ description: 'Nome do favorecido' })
  @IsOptional()
  @IsString()
  nomeFavorecido?: string;

  @ApiPropertyOptional({ description: 'CPF/CNPJ do favorecido' })
  @IsOptional()
  @IsString()
  cpfCnpjFavorecido?: string;

  @ApiPropertyOptional({ description: 'Banco de destino' })
  @IsOptional()
  @IsString()
  bancoDestino?: string;

  @ApiPropertyOptional({ description: 'Agência de destino' })
  @IsOptional()
  @IsString()
  agenciaDestino?: string;

  @ApiPropertyOptional({ description: 'Conta de destino' })
  @IsOptional()
  @IsString()
  contaDestino?: string;
}

/**
 * DTO para resposta de consulta de extratos
 */
export class ConsultaExtratosResponseDto {
  @ApiProperty({ 
    description: 'Array de lançamentos de extrato encontrados',
    type: [LancamentoExtratoDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LancamentoExtratoDto)
  lancamentos: LancamentoExtratoDto[];

  @ApiProperty({ description: 'Total de lançamentos encontrados' })
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

  @ApiPropertyOptional({ description: 'Informações da conta consultada' })
  @IsOptional()
  contaInfo?: {
    agencia: string;
    conta: string;
    banco: string;
  };
}

/**
 * DTO para resposta de extratos mensais
 */
export class ExtratosMensaisResponseDto {
  @ApiProperty({ 
    description: 'Array de lançamentos do período mensal',
    type: [LancamentoExtratoDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LancamentoExtratoDto)
  lancamentos: LancamentoExtratoDto[];

  @ApiProperty({ description: 'Total de lançamentos encontrados' })
  @IsNumber()
  total: number;

  @ApiProperty({ description: 'Período consultado' })
  @IsString()
  periodo: string;

  @ApiProperty({ description: 'Data/hora da consulta' })
  @IsString()
  consultadoEm: string;

  @ApiProperty({ description: 'Indica se os dados vieram do cache' })
  @IsString()
  origem: 'cache' | 'api';
}

/**
 * DTO para resposta de erro da API de extratos
 */
export class ErroExtratosResponseDto {
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

/**
 * DTO para health check de extratos
 */
export class ExtratosHealthResponseDto {
  @ApiProperty({ description: 'Status do serviço' })
  @IsString()
  status: 'healthy' | 'unhealthy';

  @ApiProperty({ description: 'Mensagem de status' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Timestamp da verificação' })
  @IsString()
  timestamp: string;

  @ApiProperty({ description: 'Indica se o serviço está configurado' })
  configurado: boolean;

  @ApiPropertyOptional({ description: 'Número de credenciais encontradas' })
  @IsOptional()
  @IsNumber()
  credenciaisEncontradas?: number;

  @ApiPropertyOptional({ description: 'Informações da conta configurada' })
  @IsOptional()
  contaInfo?: {
    agencia: string;
    conta: string;
    banco: string;
  };
}
