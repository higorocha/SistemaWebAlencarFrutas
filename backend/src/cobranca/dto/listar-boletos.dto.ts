import { IsEnum, IsInt, IsOptional, IsDateString, IsString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum IndicadorSituacao {
  EM_SER = 'A',
  BAIXADOS_LIQUIDADOS = 'B'
}

export enum BoletoVencido {
  SIM = 'S',
  NAO = 'N'
}

export class ListarBoletosDto {
  @ApiProperty({
    description: 'Indicador de situação dos boletos',
    enum: IndicadorSituacao,
    example: 'A'
  })
  @IsEnum(IndicadorSituacao)
  indicadorSituacao: 'A' | 'B';

  @ApiProperty({
    description: 'Número da agência beneficiária (sem dígito e sem zeros à esquerda)',
    example: 452
  })
  @IsInt()
  agenciaBeneficiario: number;

  @ApiProperty({
    description: 'Número da conta beneficiária (sem dígito e sem zeros à esquerda)',
    example: 123873
  })
  @IsInt()
  contaBeneficiario: number;

  @ApiPropertyOptional({
    description: 'Número da carteira do convênio',
    example: 17
  })
  @IsOptional()
  @IsInt()
  carteiraConvenio?: number;

  @ApiPropertyOptional({
    description: 'Número da variação da carteira',
    example: 35
  })
  @IsOptional()
  @IsInt()
  variacaoCarteiraConvenio?: number;

  @ApiPropertyOptional({
    description: 'Modalidade de cobrança (1=Simples, 4=Vinculada)',
    example: 1,
    enum: [1, 4]
  })
  @IsOptional()
  @IsIn([1, 4])
  modalidadeCobranca?: number;

  @ApiPropertyOptional({
    description: 'Data inicial de vencimento (formato: dd.mm.aaaa)',
    example: '01.01.2026'
  })
  @IsOptional()
  @IsString()
  dataInicioVencimento?: string;

  @ApiPropertyOptional({
    description: 'Data final de vencimento (formato: dd.mm.aaaa)',
    example: '31.12.2026'
  })
  @IsOptional()
  @IsString()
  dataFimVencimento?: string;

  @ApiPropertyOptional({
    description: 'Data inicial de registro (formato: dd.mm.aaaa)',
    example: '01.01.2026'
  })
  @IsOptional()
  @IsString()
  dataInicioRegistro?: string;

  @ApiPropertyOptional({
    description: 'Data final de registro (formato: dd.mm.aaaa)',
    example: '31.12.2026'
  })
  @IsOptional()
  @IsString()
  dataFimRegistro?: string;

  @ApiPropertyOptional({
    description: 'CPF do pagador (sem dígito e sem zeros à esquerda)',
    example: 979659401
  })
  @IsOptional()
  @IsInt()
  cpfPagador?: number;

  @ApiPropertyOptional({
    description: 'Dígito do CPF do pagador',
    example: 32
  })
  @IsOptional()
  @IsInt()
  digitoCPFPagador?: number;

  @ApiPropertyOptional({
    description: 'CNPJ do pagador (sem dígito e sem zeros à esquerda)',
    example: 543483490001
  })
  @IsOptional()
  @IsInt()
  cnpjPagador?: number;

  @ApiPropertyOptional({
    description: 'Dígito do CNPJ do pagador',
    example: 48
  })
  @IsOptional()
  @IsInt()
  digitoCNPJPagador?: number;

  @ApiPropertyOptional({
    description: 'Código do estado do título de cobrança (1-21)',
    example: 6
  })
  @IsOptional()
  @IsInt()
  codigoEstadoTituloCobranca?: number;

  @ApiProperty({
    description: 'Indica se deve retornar apenas boletos vencidos',
    enum: BoletoVencido,
    example: 'N'
  })
  @IsEnum(BoletoVencido)
  boletoVencido: 'S' | 'N';

  @ApiPropertyOptional({
    description: 'Índice da listagem (para paginação)',
    example: 0
  })
  @IsOptional()
  @IsInt()
  indice?: number;
}
