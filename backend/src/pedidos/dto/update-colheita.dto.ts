import { IsString, IsOptional, IsNumber, IsDateString, IsPositive, Min, IsArray, ValidateNested, IsNotEmpty, Validate, IsEnum, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

// DTO para mão de obra (custo de colheita)
export class UpdateColheitaMaoObraDto {
  @ApiProperty({ description: 'ID da turma de colheita', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  turmaColheitaId: number;

  @ApiProperty({ description: 'ID da fruta', example: 1 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  frutaId: number;

  @ApiProperty({ description: 'Quantidade colhida', example: 500.5 })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantidadeColhida: number;

  @ApiProperty({ description: 'Unidade de medida', enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'], example: 'KG' })
  @IsEnum(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'])
  unidadeMedida: 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';

  @ApiPropertyOptional({ description: 'Valor pago pela colheita', example: 2500.0 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  valorColheita?: number;

  @ApiPropertyOptional({ description: 'Data da colheita específica', example: '2024-12-15T08:00:00Z' })
  @IsOptional()
  @IsDateString()
  dataColheita?: string;

  @ApiPropertyOptional({ description: 'Se o pagamento foi efetuado', example: false })
  @IsOptional()
  @IsBoolean()
  pagamentoEfetuado?: boolean;

  @ApiPropertyOptional({ description: 'Observações específicas da colheita' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}

// DTO para área da fruta na colheita
export class UpdateColheitaAreaDto {
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
    example: 'Área com boa colheita',
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

// DTO para fita da fruta na colheita
export class UpdateColheitaFitaDto {
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
    example: 'Fita para banana premium',
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

// DTO para atualizar colheita de cada fruta (NOVA ESTRUTURA)
export class UpdateColheitaFrutaDto {
  @ApiProperty({
    description: 'ID da fruta do pedido',
    example: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  frutaPedidoId: number;

  @ApiPropertyOptional({
    description: 'Quantidade real colhida (opcional para colheita parcial)',
    example: 985.5,
  })
  @Transform(({ value }) => (value === '' || value === null || value === undefined ? undefined : value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantidadeReal?: number;

  @ApiPropertyOptional({ 
    description: 'Quantidade real colhida na segunda unidade (quando houver)', 
    example: 50.0 
  })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidadeReal2?: number;

  @ApiPropertyOptional({
    description: 'Array de áreas para esta fruta (obrigatório apenas se fruta for colhida)',
    type: [UpdateColheitaAreaDto],
    example: [
      {
        areaPropriaId: 1,
        observacoes: 'Área principal da colheita'
      },
      {
        areaFornecedorId: 2,
        observacoes: 'Área do fornecedor parceiro'
      }
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateColheitaAreaDto)
  areas?: UpdateColheitaAreaDto[];

  @ApiPropertyOptional({
    description: 'Array de fitas para esta fruta (apenas para bananas)',
    type: [UpdateColheitaFitaDto],
    example: [
      {
        fitaBananaId: 1,
        quantidadeFita: 500.0,
        observacoes: 'Fita vermelha premium'
      }
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateColheitaFitaDto)
  fitas?: UpdateColheitaFitaDto[];
}

export class UpdateColheitaDto {
  @ApiProperty({ description: 'Data da colheita (ISO)', example: '2025-08-26T00:00:00.000Z' })
  @IsDateString()
  dataColheita: Date;

  @ApiPropertyOptional({ description: 'Observações da colheita', example: 'Colheita realizada em tempo seco.' })
  @IsOptional()
  @IsString()
  observacoesColheita?: string;

  @ApiProperty({
    description: 'Array de frutas com quantidades colhidas',
    type: [UpdateColheitaFrutaDto],
    example: [
      {
        frutaPedidoId: 1,
        quantidadeReal: 985.5,
        quantidadeReal2: 50.0,
        areas: [
          {
            areaPropriaId: 1,
            observacoes: 'Área principal da colheita'
          }
        ],
        fitas: [
          {
            fitaBananaId: 1,
            quantidadeFita: 300.0,
            observacoes: 'Fita verde premium'
          }
        ]
      }
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateColheitaFrutaDto)
  @IsNotEmpty()
  frutas: UpdateColheitaFrutaDto[];

  // NOVOS: Campos de frete para serem atualizados durante a colheita
  @ApiPropertyOptional({ description: 'Pesagem para controle', example: '2500' })
  @IsOptional()
  @IsString({ message: 'Pesagem deve ser uma string' })
  pesagem?: string;

  @ApiPropertyOptional({ description: 'Placa do carro principal', example: 'ABC-1234' })
  @IsOptional()
  @IsString({ message: 'Placa primária deve ser uma string' })
  placaPrimaria?: string;

  @ApiPropertyOptional({ description: 'Placa do carro secundário (reboque)', example: 'XYZ-5678' })
  @IsOptional()
  @IsString({ message: 'Placa secundária deve ser uma string' })
  placaSecundaria?: string;

  @ApiPropertyOptional({ description: 'Nome do motorista', example: 'João Silva' })
  @IsOptional()
  @IsString({ message: 'Nome do motorista deve ser uma string' })
  nomeMotorista?: string;

  @ApiPropertyOptional({
    description: 'Número da nota fiscal do pedido (controle interno)',
    example: 123456,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  numeroNf?: number;

  // Mão de obra - array de itens de custo de colheita
  @ApiPropertyOptional({ 
    description: 'Mão de obra (custos de colheita)',
    type: [UpdateColheitaMaoObraDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateColheitaMaoObraDto)
  maoObra?: UpdateColheitaMaoObraDto[];
}
