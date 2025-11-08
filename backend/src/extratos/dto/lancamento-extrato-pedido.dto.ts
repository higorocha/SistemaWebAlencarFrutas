import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsBoolean, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';

export class LancamentoExtratoPedidoResponseDto {
  @ApiProperty({ description: 'ID do vínculo' })
  id: number;

  @ApiProperty({ description: 'ID do lançamento de extrato' })
  lancamentoExtratoId: string;

  @ApiProperty({ description: 'ID do pedido vinculado' })
  pedidoId: number;

  @ApiProperty({ description: 'Número do pedido vinculado', required: false })
  pedidoNumero?: string;

  @ApiProperty({ description: 'Valor vinculado ao pedido' })
  valorVinculado: number;

  @ApiProperty({ description: 'Indica se o vínculo foi automático' })
  vinculacaoAutomatica: boolean;

  @ApiPropertyOptional({ description: 'Observações adicionais' })
  observacoes?: string;

  @ApiProperty({ description: 'Data de criação do vínculo' })
  createdAt: Date;

  @ApiProperty({ description: 'Data da última atualização do vínculo' })
  updatedAt: Date;
}

export class CreateLancamentoExtratoPedidoDto {
  @ApiProperty({ description: 'ID do pedido a vincular', example: 123 })
  @IsNotEmpty()
  @IsInt()
  @Type(() => Number)
  pedidoId: number;

  @ApiProperty({ description: 'Valor a vincular', example: 5000 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  valorVinculado: number;

  @ApiPropertyOptional({ description: 'Observações sobre o vínculo' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Indica se o vínculo foi automático', default: false })
  @IsOptional()
  @IsBoolean()
  vinculacaoAutomatica?: boolean;
}

export class CreateManyLancamentoExtratoPedidoDto {
  @ApiProperty({
    description: 'Lista de vínculos a serem criados',
    type: [CreateLancamentoExtratoPedidoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateLancamentoExtratoPedidoDto)
  vinculos: CreateLancamentoExtratoPedidoDto[];
}

export class UpdateLancamentoExtratoPedidoDto {
  @ApiPropertyOptional({ description: 'Valor vinculado atualizado', example: 4000 })
  @IsOptional()
  @IsNumber()
  @Min(0.01)
  @Type(() => Number)
  valorVinculado?: number;

  @ApiPropertyOptional({ description: 'Observações' })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({ description: 'Indica se o vínculo foi automático' })
  @IsOptional()
  @IsBoolean()
  vinculacaoAutomatica?: boolean;
}

export class VinculoResumidoDto {
  @ApiProperty({ description: 'ID do pedido vinculado' })
  @Type(() => Number)
  pedidoId: number;

  @ApiProperty({ description: 'Valor vinculado ao pedido' })
  @Type(() => Number)
  valorVinculado: number;
}

export class VincularLancamentoPedidosDto {
  @ApiProperty({
    description: 'Lista de pedidos e valores a vincular',
    type: [VinculoResumidoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VinculoResumidoDto)
  itens: VinculoResumidoDto[];

  @ApiPropertyOptional({ description: 'Observações aplicadas a todos os vínculos' })
  @IsOptional()
  @IsString()
  observacoes?: string;
}
