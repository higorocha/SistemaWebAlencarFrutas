import { IsInt, IsOptional, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BaixaOperacionalDto {
  @ApiProperty({
    description: 'Número da agência beneficiária (sem dígito e sem zeros à esquerda)',
    example: 452
  })
  @IsInt()
  agencia: number;

  @ApiProperty({
    description: 'Número da conta beneficiária (sem dígito e sem zeros à esquerda)',
    example: 123873
  })
  @IsInt()
  conta: number;

  @ApiProperty({
    description: 'Número da carteira do convênio',
    example: 17
  })
  @IsInt()
  carteira: number;

  @ApiProperty({
    description: 'Número da variação da carteira',
    example: 35
  })
  @IsInt()
  variacao: number;

  @ApiProperty({
    description: 'Data inicial de agendamento/pagamento (formato: dd.mm.aaaa)',
    example: '01.05.2026'
  })
  @IsString()
  dataInicioAgendamentoTitulo: string;

  @ApiProperty({
    description: 'Data final de agendamento/pagamento (formato: dd.mm.aaaa)',
    example: '31.05.2026'
  })
  @IsString()
  dataFimAgendamentoTitulo: string;

  @ApiPropertyOptional({
    description: 'Estado de baixa a ser pesquisado (1=BB, 2=Outros Bancos, 10=Cancelamento)',
    example: 2,
    enum: [1, 2, 10]
  })
  @IsOptional()
  @IsIn([1, 2, 10])
  estadoBaixaTitulo?: number;

  @ApiPropertyOptional({
    description: 'Modalidade de cobrança (1=Simples, 4=Vinculada)',
    example: 1,
    enum: [1, 4]
  })
  @IsOptional()
  @IsIn([1, 4])
  modalidadeTitulo?: number;

  @ApiPropertyOptional({
    description: 'Data inicial de vencimento (formato: dd.mm.aaaa)',
    example: '01.05.2026'
  })
  @IsOptional()
  @IsString()
  dataInicioVencimentoTitulo?: string;

  @ApiPropertyOptional({
    description: 'Data final de vencimento (formato: dd.mm.aaaa)',
    example: '31.05.2026'
  })
  @IsOptional()
  @IsString()
  dataFimVencimentoTitulo?: string;

  @ApiPropertyOptional({
    description: 'Data inicial de registro (formato: dd.mm.aaaa)',
    example: '01.05.2026'
  })
  @IsOptional()
  @IsString()
  dataInicioRegistroTitulo?: string;

  @ApiPropertyOptional({
    description: 'Data final de registro (formato: dd.mm.aaaa)',
    example: '31.05.2026'
  })
  @IsOptional()
  @IsString()
  dataFimRegistroTitulo?: string;

  @ApiPropertyOptional({
    description: 'Horário inicial de agendamento (formato: hh:mm:ss)',
    example: '07:00:00'
  })
  @IsOptional()
  @IsString()
  horarioInicioAgendamentoTitulo?: string;

  @ApiPropertyOptional({
    description: 'Horário final de agendamento (formato: hh:mm:ss)',
    example: '17:00:00'
  })
  @IsOptional()
  @IsString()
  horarioFimAgendamentoTitulo?: string;

  @ApiPropertyOptional({
    description: 'ID do próximo título (para paginação)',
    example: '00012345670000000003'
  })
  @IsOptional()
  @IsString()
  idProximoTitulo?: string;
}
