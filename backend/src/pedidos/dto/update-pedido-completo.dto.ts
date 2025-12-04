import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsDateString, IsEnum, IsArray, ValidateNested, IsPositive, IsNotEmpty, Min } from 'class-validator';
import { Type, Transform } from 'class-transformer';

// Definindo os tipos dos enums
type StatusPedido = 'PEDIDO_CRIADO' | 'AGUARDANDO_COLHEITA' | 'COLHEITA_REALIZADA' | 'AGUARDANDO_PRECIFICACAO' | 'PRECIFICACAO_REALIZADA' | 'AGUARDANDO_PAGAMENTO' | 'PAGAMENTO_PARCIAL' | 'PEDIDO_FINALIZADO' | 'CANCELADO';
type UnidadeMedida = 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';

// DTO para área da fruta no update completo
export class UpdateCompletoAreaDto {
  @ApiPropertyOptional({
    description: 'ID da área (para update de área existente)',
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  id?: number;

  @ApiPropertyOptional({
    description: 'ID da área própria (deixe null se for área de fornecedor)',
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaPropriaId?: number;

  @ApiPropertyOptional({
    description: 'ID da área de fornecedor (deixe null se for área própria)',
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  areaFornecedorId?: number;

  @ApiPropertyOptional({
    description: 'Observações sobre esta área',
    example: 'Área atualizada',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Quantidade colhida nesta área (unidade 1)',
    example: 500,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidadeColhidaUnidade1?: number;

  @ApiPropertyOptional({
    description: 'Quantidade colhida nesta área (unidade 2)',
    example: 25,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidadeColhidaUnidade2?: number;
}

// DTO para mão de obra no update completo
export class UpdateCompletoMaoObraDto {
  @ApiPropertyOptional({
    description: 'ID do custo de colheita (para update de custo existente)',
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  id?: number;

  @ApiProperty({
    description: 'ID da turma de colheita',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  turmaColheitaId: number;

  @ApiProperty({
    description: 'ID da fruta',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  frutaId: number;

  @ApiProperty({
    description: 'Quantidade colhida pela turma',
    example: 500.5,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantidadeColhida: number;

  @ApiPropertyOptional({
    description: 'Unidade de medida (se não informada, será derivada da fruta)',
    enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'],
    example: 'KG',
  })
  @IsOptional()
  @IsEnum(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'])
  unidadeMedida?: 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';

  @ApiPropertyOptional({
    description: 'Valor pago pela colheita',
    example: 2500.0,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  valorColheita?: number;

  @ApiPropertyOptional({
    description: 'Observações sobre a colheita',
    example: 'Colheita realizada em boas condições',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Data da colheita',
    example: '2024-01-15T12:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  dataColheita?: string;
}

// DTO para fita da fruta no update completo
export class UpdateCompletoFitaDto {
  @ApiPropertyOptional({
    description: 'ID da fita (para update de fita existente)',
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  id?: number;

  @ApiProperty({
    description: 'ID da fita de banana',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  fitaBananaId: number;

  @ApiPropertyOptional({
    description: 'ID do controle de banana (lote específico)',
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  controleBananaId?: number;

  @ApiPropertyOptional({
    description: 'Quantidade desta fita',
    example: 250.0,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantidadeFita?: number;

  @ApiPropertyOptional({
    description: 'Observações sobre esta fita',
    example: 'Fita atualizada',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Detalhes das áreas para subtração específica de estoque',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        fitaBananaId: { type: 'number', description: 'ID da fita' },
        areaId: { type: 'number', description: 'ID da área' },
        quantidade: { type: 'number', description: 'Quantidade desta área' }
      }
    }
  })
  @IsOptional()
  @IsArray()
  detalhesAreas?: Array<{
    fitaBananaId: number;
    areaId: number;
    quantidade: number;
    controleBananaId: number; // ID específico do lote de controle
  }>;
}

// DTO para atualizar fruta do pedido (NOVA ESTRUTURA)
export class UpdateFrutaPedidoDto {
  @ApiPropertyOptional({ description: 'ID da fruta do pedido' })
  @IsOptional()
  @IsNumber({}, { message: 'ID da fruta do pedido deve ser um número' })
  frutaPedidoId?: number;

  @ApiPropertyOptional({ description: 'ID da fruta' })
  @IsOptional()
  @IsNumber({}, { message: 'ID da fruta deve ser um número' })
  frutaId?: number;

  @ApiPropertyOptional({ description: 'Quantidade prevista' })
  @IsOptional()
  @IsNumber({}, { message: 'Quantidade prevista deve ser um número' })
  @IsPositive({ message: 'Quantidade prevista deve ser positiva' })
  quantidadePrevista?: number;

  @ApiPropertyOptional({ description: 'Quantidade real' })
  @IsOptional()
  @IsNumber({}, { message: 'Quantidade real deve ser um número' })
  @IsPositive({ message: 'Quantidade real deve ser positiva' })
  quantidadeReal?: number;

  @ApiPropertyOptional({ description: 'Quantidade real 2' })
  @IsOptional()
  @IsNumber({}, { message: 'Quantidade real 2 deve ser um número' })
  @IsPositive({ message: 'Quantidade real 2 deve ser positiva' })
  quantidadeReal2?: number;

  @ApiPropertyOptional({ description: 'Unidade de medida 1', enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'] })
  @IsOptional()
  @IsEnum(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'], { message: 'Unidade de medida 1 deve ser KG, TON, CX, UND, ML ou LT' })
  unidadeMedida1?: UnidadeMedida;

  @ApiPropertyOptional({ description: 'Unidade de medida 2', enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'] })
  @Transform(({ value }) => value === undefined || value === '' ? null : value)
  @IsOptional()
  @IsEnum(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'], { message: 'Unidade de medida 2 deve ser KG, TON, CX, UND, ML ou LT' })
  unidadeMedida2?: UnidadeMedida | null;

  @ApiPropertyOptional({ description: 'Valor unitário' })
  @IsOptional()
  @IsNumber({}, { message: 'Valor unitário deve ser um número' })
  @IsPositive({ message: 'Valor unitário deve ser positivo' })
  valorUnitario?: number;

  @ApiPropertyOptional({ description: 'Unidade precificada', enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'] })
  @IsOptional()
  @IsEnum(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'], { message: 'Unidade precificada deve ser KG, TON, CX, UND, ML ou LT' })
  unidadePrecificada?: UnidadeMedida;

  @ApiPropertyOptional({ description: 'Quantidade real que será usada para precificação e relatórios' })
  @IsOptional()
  @IsNumber({}, { message: 'Quantidade precificada deve ser um número' })
  @IsPositive({ message: 'Quantidade precificada deve ser positiva' })
  quantidadePrecificada?: number;

  @ApiPropertyOptional({ description: 'Valor total da fruta (quantidade * valor unitário)' })
  @IsOptional()
  @IsNumber({}, { message: 'Valor total deve ser um número' })
  valorTotal?: number;

  @ApiPropertyOptional({
    description: 'Array de áreas para esta fruta',
    type: [UpdateCompletoAreaDto],
    example: [
      {
        areaPropriaId: 1,
        observacoes: 'Área atualizada'
      }
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCompletoAreaDto)
  areas?: UpdateCompletoAreaDto[];

  @ApiPropertyOptional({
    description: 'Array de fitas para esta fruta (apenas para bananas)',
    type: [UpdateCompletoFitaDto],
    example: [
      {
        fitaBananaId: 1,
        quantidadeFita: 300.0,
        observacoes: 'Fita atualizada'
      }
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateCompletoFitaDto)
  fitas?: UpdateCompletoFitaDto[];
}

// DTO principal para atualização completa do pedido
export class UpdatePedidoCompletoDto {
  @ApiPropertyOptional({ description: 'ID do cliente' })
  @IsOptional()
  @IsNumber({}, { message: 'ID do cliente deve ser um número' })
  clienteId?: number;

  @ApiPropertyOptional({ description: 'Data do pedido (temporário)' })
  @IsOptional()
  @IsDateString({}, { message: 'Data do pedido deve ser uma data válida' })
  dataPedido?: string;

  @ApiPropertyOptional({ description: 'Data prevista para colheita' })
  @IsOptional()
  @IsDateString({}, { message: 'Data prevista para colheita deve ser uma data válida' })
  dataPrevistaColheita?: string;

  @ApiPropertyOptional({ description: 'Data da colheita' })
  @IsOptional()
  @IsDateString({}, { message: 'Data da colheita deve ser uma data válida' })
  dataColheita?: string;

  @ApiPropertyOptional({ description: 'Data em que a precificação foi realizada' })
  @IsOptional()
  @IsDateString({}, { message: 'Data da precificação deve ser uma data válida' })
  dataPrecificacaoRealizada?: string;

  // REMOVIDO: fitaColheita movido para frutasPedidos

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Observações da colheita' })
  @IsOptional()
  @IsString({ message: 'Observações da colheita deve ser uma string' })
  observacoesColheita?: string;

  @ApiPropertyOptional({ description: 'Frete' })
  @IsOptional()
  @IsNumber({}, { message: 'Frete deve ser um número' })
  frete?: number;

  @ApiPropertyOptional({ description: 'ICMS' })
  @IsOptional()
  @IsNumber({}, { message: 'ICMS deve ser um número' })
  icms?: number;

  @ApiPropertyOptional({ description: 'Desconto' })
  @IsOptional()
  @IsNumber({}, { message: 'Desconto deve ser um número' })
  desconto?: number;

  @ApiPropertyOptional({ description: 'Avaria' })
  @IsOptional()
  @IsNumber({}, { message: 'Avaria deve ser um número' })
  avaria?: number;

  @ApiPropertyOptional({ description: 'Valor recebido consolidado' })
  @IsOptional()
  @IsNumber({}, { message: 'Valor recebido deve ser um número' })
  valorRecebido?: number;

  @ApiPropertyOptional({ description: 'Status do pedido', enum: ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO', 'PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL', 'PEDIDO_FINALIZADO', 'CANCELADO'] })
  @IsOptional()
  @IsEnum(['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO', 'PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL', 'PEDIDO_FINALIZADO', 'CANCELADO'], { message: 'Status deve ser válido' })
  status?: StatusPedido;

  @ApiPropertyOptional({ description: 'Frutas do pedido', type: [UpdateFrutaPedidoDto] })
  @IsOptional()
  @IsArray({ message: 'Frutas deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateFrutaPedidoDto)
  frutas?: UpdateFrutaPedidoDto[];

  @ApiPropertyOptional({
    description: 'Mão de obra (custos de colheita) do pedido',
    type: [UpdateCompletoMaoObraDto],
    example: [
      {
        turmaColheitaId: 1,
        frutaId: 1,
        quantidadeColhida: 500.5,
        valorColheita: 2500.0,
        observacoes: 'Colheita realizada em boas condições'
      }
    ]
  })
  @IsOptional()
  @IsArray({ message: 'Mão de obra deve ser um array' })
  @ValidateNested({ each: true })
  @Type(() => UpdateCompletoMaoObraDto)
  maoObra?: UpdateCompletoMaoObraDto[];

  // NOVOS: Campos de frete
  @ApiPropertyOptional({ description: 'Pesagem para controle' })
  @IsOptional()
  @IsString({ message: 'Pesagem deve ser uma string' })
  pesagem?: string;

  @ApiPropertyOptional({ description: 'Placa do carro principal' })
  @IsOptional()
  @IsString({ message: 'Placa primária deve ser uma string' })
  placaPrimaria?: string;

  @ApiPropertyOptional({ description: 'Placa do carro secundário (reboque)' })
  @IsOptional()
  @IsString({ message: 'Placa secundária deve ser uma string' })
  placaSecundaria?: string;

  @ApiPropertyOptional({ description: 'Nome do motorista' })
  @IsOptional()
  @IsString({ message: 'Nome do motorista deve ser uma string' })
  nomeMotorista?: string;

  // Campos específicos para clientes indústria
  @ApiPropertyOptional({
    description: 'Data de entrada (apenas para clientes indústria)',
    example: '2024-03-15',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de entrada deve ser uma data válida' })
  indDataEntrada?: string;

  @ApiPropertyOptional({
    description: 'Data de descarga (apenas para clientes indústria)',
    example: '2024-03-16',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de descarga deve ser uma data válida' })
  indDataDescarga?: string;

  @ApiPropertyOptional({
    description: 'Peso médio (apenas para clientes indústria)',
    example: 1250.75,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Peso médio deve ser um número' })
  @IsPositive({ message: 'Peso médio deve ser positivo' })
  indPesoMedio?: number;

  @ApiPropertyOptional({
    description: 'Média em mililitros (apenas para clientes indústria)',
    example: 500.25,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Média em mililitros deve ser um número' })
  @IsPositive({ message: 'Média em mililitros deve ser positiva' })
  indMediaMililitro?: number;

  @ApiPropertyOptional({
    description: 'Número da nota fiscal (apenas para clientes indústria)',
    example: 123456,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Número da nota fiscal deve ser um número' })
  @IsPositive({ message: 'Número da nota fiscal deve ser positivo' })
  indNumeroNf?: number;

  @ApiPropertyOptional({
    description: 'Número da nota fiscal do pedido (controle interno)',
    example: 789012,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Número da nota fiscal do pedido deve ser um número' })
  @IsPositive({ message: 'Número da nota fiscal do pedido deve ser positivo' })
  numeroNf?: number;
}


