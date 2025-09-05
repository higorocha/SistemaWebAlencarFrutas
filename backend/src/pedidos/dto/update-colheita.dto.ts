import { IsString, IsOptional, IsNumber, IsDateString, IsPositive, Min, IsArray, ValidateNested, IsNotEmpty, Validate } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

// Validador customizado para áreas excludentes
export class AreasExcludentesConstraint {
  validate(value: any, args: any) {
    const fruta = args.object;
    const hasAreaPropria = fruta.areaPropriaId !== undefined && fruta.areaPropriaId !== null;
    const hasAreaFornecedor = fruta.areaFornecedorId !== undefined && fruta.areaFornecedorId !== null;
    
    // Deve ter exatamente uma área selecionada
    return (hasAreaPropria && !hasAreaFornecedor) || (!hasAreaPropria && hasAreaFornecedor);
  }

  defaultMessage() {
    return 'Cada fruta deve ter exatamente uma área selecionada (própria OU fornecedor)';
  }
}

// DTO para atualizar colheita de cada fruta
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
    description: 'ID da área própria (deixe null se for área de terceiro)',
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

  @ApiProperty({
    description: 'Quantidade real colhida',
    example: 985.5,
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  quantidadeReal: number;

  @ApiPropertyOptional({ description: 'Quantidade real colhida na segunda unidade (quando houver)', example: 50.0 })
  @Transform(({ value }) => (value === '' || value === null ? undefined : value))
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantidadeReal2?: number;

  @ApiPropertyOptional({ description: 'Cor da fita utilizada para esta fruta', example: 'Verde' })
  @IsOptional()
  @IsString()
  fitaColheita?: string;

  // Validação customizada para áreas excludentes
  @Validate(AreasExcludentesConstraint)
  areasValidation: any;
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
        areaPropriaId: 1,
        quantidadeReal: 985.5,
        quantidadeReal2: 50.0,
        fitaColheita: 'Verde'
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
}
