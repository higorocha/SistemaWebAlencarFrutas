import {
  IsDateString,
  IsArray,
  ValidateNested,
  IsOptional,
  IsString,
  IsInt,
  IsNumber,
  IsPositive,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO de Colheita (Mobile)
 * Agora compatível com o fluxo completo usado no web (áreas, fitas e campos de frete)
 */
class MobileColheitaAreaDto {
  @ApiProperty({ description: 'ID da área (para update de área existente)', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  id?: number;

  @ApiProperty({ description: 'ID da área própria', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  areaPropriaId?: number;

  @ApiProperty({ description: 'ID da área de fornecedor', required: false, example: 2 })
  @IsOptional()
  @IsInt()
  areaFornecedorId?: number;

  @ApiProperty({ description: 'Observações da área', required: false, example: 'Área principal' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ description: 'Quantidade colhida na unidade 1', required: false, example: 500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidadeColhidaUnidade1?: number;

  @ApiProperty({ description: 'Quantidade colhida na unidade 2', required: false, example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidadeColhidaUnidade2?: number;

  // Campos extras do frontend (ignorados na conversão, mas aceitos para compatibilidade)
  @ApiProperty({ description: 'Nome da área (apenas visualização, não processado)', required: false })
  @IsOptional()
  @IsString()
  areaNome?: string;
  
  // Permitir qualquer outro campo extra (usado pelo frontend mas não processado)
  [key: string]: any;
}

class MobileColheitaFitaDto {
  @ApiProperty({ description: 'ID da fita (para update de fita existente)', required: false, example: 1 })
  @IsOptional()
  @IsInt()
  @IsPositive()
  id?: number;

  @ApiProperty({ description: 'ID da fita de banana', example: 1 })
  @IsInt()
  @IsPositive()
  fitaBananaId: number;

  @ApiProperty({ description: 'Quantidade de fita utilizada', required: false, example: 300 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidadeFita?: number;

  @ApiProperty({ description: 'Observações da fita', required: false, example: 'Fita verde premium' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiProperty({ description: 'Detalhes das áreas relacionadas à fita', required: false, example: [] })
  @IsOptional()
  @IsArray()
  detalhesAreas?: any[];
}

class FrutaColheitaDto {
  @ApiProperty({
    description: 'ID da fruta no pedido (frutaPedidoId)',
    example: 1
  })
  @IsInt()
  frutaPedidoId: number;

  @ApiProperty({
    description: 'Quantidade real colhida',
    example: 950.5
  })
  @IsNumber()
  @IsPositive()
  quantidadeReal: number;

  @ApiProperty({ description: 'Quantidade real na segunda unidade (quando houver)', required: false, example: 50.0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidadeReal2?: number;

  @ApiProperty({ description: 'Áreas de origem desta fruta', required: false, type: [MobileColheitaAreaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MobileColheitaAreaDto)
  areas?: MobileColheitaAreaDto[];

  @ApiProperty({ description: 'Fitas utilizadas (bananas)', required: false, type: [MobileColheitaFitaDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MobileColheitaFitaDto)
  fitas?: MobileColheitaFitaDto[];
}

export class MobileColheitaDto {
  @ApiProperty({
    description: 'Data da colheita (formato ISO)',
    example: '2025-10-22'
  })
  @IsDateString()
  dataColheita: string;

  @ApiProperty({ description: 'Lista de frutas colhidas', type: [FrutaColheitaDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FrutaColheitaDto)
  frutas: FrutaColheitaDto[];

  @ApiProperty({
    description: 'IDs das turmas de colheita (opcional)',
    required: false,
    example: [1, 2]
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  turmasIds?: number[];

  @ApiProperty({
    description: 'Observações sobre a colheita',
    required: false,
    example: 'Colheita realizada pela manhã'
  })
  @IsOptional()
  @IsString()
  observacoesColheita?: string;

  // Campos de frete (compatíveis com DTO do service)
  @ApiProperty({ description: 'Pesagem (string)', required: false, example: '2500' })
  @IsOptional()
  @IsString()
  pesagem?: string;

  @ApiProperty({ description: 'Placa principal', required: false, example: 'ABC-1234' })
  @IsOptional()
  @IsString()
  placaPrimaria?: string;

  @ApiProperty({ description: 'Placa secundária', required: false, example: 'XYZ-5678' })
  @IsOptional()
  @IsString()
  placaSecundaria?: string;

  @ApiProperty({ description: 'Nome do motorista', required: false, example: 'João Silva' })
  @IsOptional()
  @IsString()
  nomeMotorista?: string;

  // Mão de obra - agora processada junto com a colheita
  @ApiProperty({ 
    description: 'Mão de obra (custos de colheita)',
    type: 'array',
    required: false 
  })
  @IsOptional()
  @IsArray()
  maoObra?: Array<{
    turmaColheitaId: number;
    frutaId: number;
    quantidadeColhida: number;
    unidadeMedida?: 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';
    valorColheita?: number;
    dataColheita?: string;
    pagamentoEfetuado?: boolean;
    observacoes?: string;
  }>;
}
