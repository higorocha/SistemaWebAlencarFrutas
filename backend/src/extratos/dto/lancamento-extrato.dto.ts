import { IsOptional, IsString, IsNumber, IsBoolean, IsInt, IsDateString, IsEnum, IsNotEmpty, Matches, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TipoOperacaoExtrato } from '@prisma/client';

/**
 * DTO para criação de lançamento de extrato
 */
export class CreateLancamentoExtratoDto {
  @ApiProperty({ description: 'Indicador do tipo de lançamento', example: '1' })
  @IsOptional()
  @IsString()
  indicadorTipoLancamento?: string;

  @ApiProperty({ description: 'Data do lançamento no formato original (DDMMYYYY como número)', example: 1102025 })
  @IsOptional()
  @IsNumber()
  dataLancamentoRaw?: number;

  @ApiProperty({ description: 'Data de movimento', example: 0 })
  @IsOptional()
  @IsNumber()
  dataMovimento?: number;

  @ApiProperty({ description: 'Código da agência de origem', example: 0 })
  @IsOptional()
  @IsNumber()
  codigoAgenciaOrigem?: number;

  @ApiProperty({ description: 'Número do lote', example: 14397 })
  @IsOptional()
  @IsNumber()
  numeroLote?: number;

  @ApiProperty({ description: 'Número do documento', example: '11156207270602' })
  @IsOptional()
  @IsString()
  numeroDocumento?: string;

  @ApiProperty({ description: 'Código do histórico', example: 821 })
  @IsOptional()
  @IsNumber()
  codigoHistorico?: number;

  @ApiProperty({ description: 'Texto descritivo do histórico', example: 'Pix - Recebido' })
  @IsOptional()
  @IsString()
  textoDescricaoHistorico?: string;

  @ApiProperty({ description: 'Valor original do lançamento', example: 18557.40 })
  @IsOptional()
  @IsNumber()
  valorLancamentoRaw?: number;

  @ApiProperty({ description: 'Indicador de sinal (C = Crédito, D = Débito)', example: 'C' })
  @IsOptional()
  @IsString()
  indicadorSinalLancamento?: string;

  @ApiProperty({ description: 'Texto informativo complementar', example: '01/10 11:56 52641514000120 AGC NORDEST' })
  @IsOptional()
  @IsString()
  textoInformacaoComplementar?: string;

  @ApiProperty({ description: 'CPF/CNPJ da contrapartida', example: '52641514000120' })
  @IsOptional()
  @IsString()
  numeroCpfCnpjContrapartida?: string;

  @ApiProperty({ description: 'Tipo de pessoa da contrapartida (J = Jurídica, F = Física)', example: 'J' })
  @IsOptional()
  @IsString()
  indicadorTipoPessoaContrapartida?: string;

  @ApiProperty({ description: 'Código do banco da contrapartida', example: 0 })
  @IsOptional()
  @IsNumber()
  codigoBancoContrapartida?: number;

  @ApiProperty({ description: 'Código da agência da contrapartida', example: 3007 })
  @IsOptional()
  @IsNumber()
  codigoAgenciaContrapartida?: number;

  @ApiProperty({ description: 'Número da conta da contrapartida', example: '00000000000000273327' })
  @IsOptional()
  @IsString()
  numeroContaContrapartida?: string;

  @ApiProperty({ description: 'Dígito verificador da conta da contrapartida', example: '7' })
  @IsOptional()
  @IsString()
  textoDvContaContrapartida?: string;

  @ApiProperty({ description: 'Data do lançamento convertida', example: '2025-10-01T00:00:00Z' })
  @IsNotEmpty()
  @IsDateString()
  dataLancamento: string;

  @ApiProperty({ description: 'Valor do lançamento (sempre positivo)', example: 18557.40 })
  @IsNotEmpty()
  @IsNumber()
  valorLancamento: number;

  @ApiProperty({ description: 'Tipo de operação', enum: TipoOperacaoExtrato, example: TipoOperacaoExtrato.CREDITO })
  @IsNotEmpty()
  @IsEnum(TipoOperacaoExtrato)
  tipoOperacao: TipoOperacaoExtrato;

  @ApiProperty({ description: 'Categoria da operação', example: 'PIX_RECEBIDO' })
  @IsOptional()
  @IsString()
  categoriaOperacao?: string;

  @ApiProperty({ description: 'Horário do lançamento extraído', example: '11:56' })
  @IsOptional()
  @IsString()
  horarioLancamento?: string;

  @ApiProperty({ description: 'Nome da contrapartida extraído', example: 'AGC NORDEST' })
  @IsOptional()
  @IsString()
  nomeContrapartida?: string;

  @ApiPropertyOptional({ description: 'ID do cliente identificado', example: 1 })
  @IsOptional()
  @IsInt()
  clienteId?: number;

  @ApiPropertyOptional({ description: 'ID do pedido vinculado', example: 1 })
  @IsOptional()
  @IsInt()
  pedidoId?: number;

  @ApiPropertyOptional({ description: 'ID da conta corrente usada na busca', example: 1 })
  @IsOptional()
  @IsInt()
  contaCorrenteId?: number;

  @ApiPropertyOptional({ description: 'Agência da conta (referência)', example: '2273' })
  @IsOptional()
  @IsString()
  agenciaConta?: string;

  @ApiPropertyOptional({ description: 'Número da conta (referência)', example: '8249' })
  @IsOptional()
  @IsString()
  numeroConta?: string;

  @ApiProperty({ description: 'Se já foi processado', example: false })
  @IsOptional()
  @IsBoolean()
  processado?: boolean;

  @ApiProperty({ description: 'Se foi vinculado a um pedido', example: false })
  @IsOptional()
  @IsBoolean()
  vinculadoPedido?: boolean;

  @ApiProperty({ description: 'Se foi criado registro em PagamentosPedidos', example: false })
  @IsOptional()
  @IsBoolean()
  vinculadoPagamento?: boolean;

  @ApiProperty({ description: 'Se a vinculação foi automática', example: false })
  @IsOptional()
  @IsBoolean()
  vinculacaoAutomatica?: boolean;

  @ApiPropertyOptional({ description: 'Valor usado na comparação com pedido', example: 18557.40 })
  @IsOptional()
  @IsNumber()
  valorComparacao?: number;

  @ApiPropertyOptional({ description: 'Valor disponível para vinculações', example: 5000 })
  @IsOptional()
  @IsNumber()
  valorDisponivel?: number;

  @ApiPropertyOptional({ description: 'Total já vinculado a pedidos', example: 13557.4 })
  @IsOptional()
  @IsNumber()
  valorVinculadoTotal?: number;

  @ApiPropertyOptional({ description: 'Indica se o lançamento foi totalmente liquidado', example: false })
  @IsOptional()
  @IsBoolean()
  estaLiquidado?: boolean;

  @ApiPropertyOptional({ description: 'Observações sobre o processamento' })
  @IsOptional()
  @IsString()
  observacoesProcessamento?: string;
}

/**
 * DTO para atualização de lançamento de extrato
 */
export class UpdateLancamentoExtratoDto {
  @ApiPropertyOptional({ description: 'ID do pedido vinculado', example: 1 })
  @IsOptional()
  @IsInt()
  pedidoId?: number;

  @ApiPropertyOptional({ description: 'Se foi vinculado a um pedido', example: true })
  @IsOptional()
  @IsBoolean()
  vinculadoPedido?: boolean;

  @ApiPropertyOptional({ description: 'Se foi criado registro em PagamentosPedidos', example: true })
  @IsOptional()
  @IsBoolean()
  vinculadoPagamento?: boolean;

  @ApiPropertyOptional({ description: 'Se a vinculação foi automática', example: false })
  @IsOptional()
  @IsBoolean()
  vinculacaoAutomatica?: boolean;

  @ApiPropertyOptional({ description: 'Se já foi processado', example: true })
  @IsOptional()
  @IsBoolean()
  processado?: boolean;

  @ApiPropertyOptional({ description: 'Valor usado na comparação com pedido', example: 18557.40 })
  @IsOptional()
  @IsNumber()
  valorComparacao?: number;

  @ApiPropertyOptional({ description: 'Valor disponível para vinculações', example: 5000 })
  @IsOptional()
  @IsNumber()
  valorDisponivel?: number;

  @ApiPropertyOptional({ description: 'Total já vinculado a pedidos', example: 13557.4 })
  @IsOptional()
  @IsNumber()
  valorVinculadoTotal?: number;

  @ApiPropertyOptional({ description: 'Indica se o lançamento foi totalmente liquidado', example: false })
  @IsOptional()
  @IsBoolean()
  estaLiquidado?: boolean;

  @ApiPropertyOptional({ description: 'Observações sobre o processamento' })
  @IsOptional()
  @IsString()
  observacoesProcessamento?: string;
}

/**
 * DTO para vinculação manual de lançamento a pedido
 */
export class VincularLancamentoPedidoDto {
  @ApiProperty({ description: 'ID do pedido para vincular', example: 1 })
  @IsNotEmpty()
  @IsInt()
  pedidoId: number;

  @ApiPropertyOptional({ description: 'Valor que será vinculado ao pedido', example: 5000 })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  valorVinculado?: number;

  @ApiPropertyOptional({ description: 'Observações sobre a vinculação' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

/**
 * DTO para query parameters de consulta de lançamentos
 */
export class QueryLancamentoExtratoDto {
  @ApiPropertyOptional({ description: 'ID do cliente para filtrar', example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  clienteId?: number;

  @ApiPropertyOptional({ description: 'ID do pedido para filtrar', example: 1 })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  pedidoId?: number;

  @ApiPropertyOptional({ description: 'Data inicial para filtrar (ISO string)', example: '2025-10-01' })
  @IsOptional()
  @IsDateString()
  dataInicio?: string;

  @ApiPropertyOptional({ description: 'Data final para filtrar (ISO string)', example: '2025-10-31' })
  @IsOptional()
  @IsDateString()
  dataFim?: string;

  @ApiPropertyOptional({ description: 'Tipo de operação para filtrar', enum: TipoOperacaoExtrato })
  @IsOptional()
  @IsEnum(TipoOperacaoExtrato)
  tipoOperacao?: TipoOperacaoExtrato;

  @ApiPropertyOptional({ description: 'Categoria da operação para filtrar', example: 'PIX_RECEBIDO' })
  @IsOptional()
  @IsString()
  categoriaOperacao?: string;

  @ApiPropertyOptional({ description: 'Filtrar por processado', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  processado?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar por vinculado a pedido', example: true })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  vinculadoPedido?: boolean;
}

/**
 * DTO de resposta de lançamento de extrato
 */
export class LancamentoExtratoResponseDto {
  @ApiProperty({ description: 'ID do lançamento' })
  id: string;

  @ApiPropertyOptional({ description: 'Indicador do tipo de lançamento' })
  indicadorTipoLancamento?: string;

  @ApiPropertyOptional({ description: 'Data do lançamento no formato original' })
  dataLancamentoRaw?: number;

  @ApiPropertyOptional({ description: 'Número do documento' })
  numeroDocumento?: string;

  @ApiPropertyOptional({ description: 'Texto descritivo do histórico' })
  textoDescricaoHistorico?: string;

  @ApiProperty({ description: 'Data do lançamento' })
  dataLancamento: Date;

  @ApiProperty({ description: 'Valor do lançamento' })
  valorLancamento: number;

  @ApiProperty({ description: 'Tipo de operação', enum: TipoOperacaoExtrato })
  tipoOperacao: TipoOperacaoExtrato;

  @ApiPropertyOptional({ description: 'Categoria da operação' })
  categoriaOperacao?: string;

  @ApiPropertyOptional({ description: 'Nome da contrapartida' })
  nomeContrapartida?: string;

  @ApiPropertyOptional({ description: 'ID do cliente' })
  clienteId?: number;

  @ApiPropertyOptional({ description: 'ID do pedido vinculado' })
  pedidoId?: number;

  @ApiProperty({ description: 'Se já foi processado' })
  processado: boolean;

  @ApiProperty({ description: 'Se foi vinculado a um pedido' })
  vinculadoPedido: boolean;

  @ApiProperty({ description: 'Se foi criado registro em PagamentosPedidos' })
  vinculadoPagamento: boolean;

  @ApiProperty({ description: 'Se a vinculação foi automática' })
  vinculacaoAutomatica: boolean;

  @ApiProperty({ description: 'Valor disponível para vinculações' })
  valorDisponivel: number;

  @ApiProperty({ description: 'Total já vinculado a pedidos' })
  valorVinculadoTotal: number;

  @ApiProperty({ description: 'Indica se o lançamento foi totalmente liquidado' })
  estaLiquidado: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'Dados do cliente vinculado' })
  cliente?: {
    id: number;
    nome: string;
    cnpj?: string;
    cpf?: string;
  };

  @ApiPropertyOptional({ description: 'Dados do pedido vinculado' })
  pedido?: {
    id: number;
    numeroPedido: string;
    valorFinal?: number;
    status: string;
  };

  @ApiPropertyOptional({
    description: 'Vínculos parciais associados ao lançamento',
    type: [Object],
  })
  vinculos?: Array<{
    id: number;
    pedidoId: number;
    pedidoNumero: string;
    valorVinculado: number;
    vinculacaoAutomatica: boolean;
    observacoes?: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
}

/**
 * DTO para buscar e processar extratos para todos os clientes com CPF/CNPJ
 * Usado para busca automática e jobs
 */
export class BuscarProcessarExtratosTodosClientesDto {
  @ApiProperty({ description: 'Data de início no formato DDMMYYYY', example: '01102025' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Data deve estar no formato DDMMYYYY' })
  dataInicio: string;

  @ApiProperty({ description: 'Data de fim no formato DDMMYYYY', example: '31102025' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Data deve estar no formato DDMMYYYY' })
  dataFim: string;

  @ApiProperty({ description: 'ID da conta corrente para buscar extratos', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  contaCorrenteId: number;
}

/**
 * DTO para buscar e processar extratos
 */
export class BuscarProcessarExtratosDto {
  @ApiProperty({ description: 'Data de início no formato DDMMYYYY', example: '01102025' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Data deve estar no formato DDMMYYYY' })
  dataInicio: string;

  @ApiProperty({ description: 'Data de fim no formato DDMMYYYY', example: '31102025' })
  @IsNotEmpty()
  @IsString()
  @Matches(/^\d{8}$/, { message: 'Data deve estar no formato DDMMYYYY' })
  dataFim: string;

  @ApiProperty({ 
    description: 'ID do cliente para filtrar pagamentos (mantido para compatibilidade)', 
    example: 1,
    required: false
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  clienteId?: number;

  @ApiProperty({ 
    description: 'IDs dos clientes para filtrar pagamentos (aceita múltiplos clientes)', 
    example: [1, 2, 3],
    required: false,
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Type(() => Number)
  clienteIds?: number[];

  @ApiProperty({ description: 'ID da conta corrente para buscar extratos', example: 1 })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  contaCorrenteId: number;
}

/**
 * DTO de resposta para busca e processamento de extratos
 */
export class BuscarProcessarExtratosResponseDto {
  @ApiProperty({ description: 'Total de lançamentos encontrados na API' })
  totalEncontrados: number;

  @ApiProperty({ description: 'Total de lançamentos elegíveis (créditos retornados pela API)' })
  totalFiltrados: number;

  @ApiProperty({ description: 'Total de lançamentos salvos (não duplicados)' })
  totalSalvos: number;

  @ApiProperty({ description: 'Total de lançamentos duplicados (já existentes)' })
  totalDuplicados: number;

  @ApiPropertyOptional({ description: 'Total de lançamentos com cliente identificado' })
  totalComClienteIdentificado?: number;

  @ApiPropertyOptional({ description: 'Total de lançamentos sem cliente identificado' })
  totalSemClienteIdentificado?: number;

  @ApiPropertyOptional({ description: 'Total de lançamentos salvos com cliente identificado' })
  totalSalvosComClienteIdentificado?: number;

  @ApiPropertyOptional({ description: 'Total de lançamentos salvos sem cliente identificado' })
  totalSalvosSemClienteIdentificado?: number;

  @ApiPropertyOptional({ description: 'Total de lançamentos que apresentaram erro durante o salvamento' })
  totalErros?: number;

  @ApiProperty({ description: 'Período consultado' })
  periodo: {
    inicio: string;
    fim: string;
  };

  @ApiProperty({ description: 'Conta corrente utilizada' })
  contaCorrente: {
    id: number;
    agencia: string;
    conta: string;
  };

  @ApiPropertyOptional({ description: 'Cliente principal processado (mantido para compatibilidade)' })
  cliente?: {
    id: number;
    nome: string;
  };

  @ApiProperty({ 
    description: 'Lista de todos os clientes processados', 
    type: [Object],
    required: false 
  })
  clientes?: Array<{
    id: number;
    nome: string;
  }>;
}

