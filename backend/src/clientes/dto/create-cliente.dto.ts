import { IsString, IsOptional, IsEnum, IsBoolean, IsInt, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Definindo os tipos dos enums
type StatusCliente = 'ATIVO' | 'INATIVO';

export class CreateClienteDto {
  @ApiProperty({
    description: 'Nome do cliente',
    example: 'Distribuidora ABC Ltda',
    maxLength: 100,
  })
  @IsString()
  nome: string;

  @ApiPropertyOptional({
    description: 'Razão social',
    example: 'DISTRIBUIDORA ABC LTDA',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  razaoSocial?: string;

  @ApiPropertyOptional({
    description: 'CPF ou CNPJ do cliente',
    example: '123.456.789-00 ou 12.345.678/0001-90',
    maxLength: 18,
  })
  @IsOptional()
  @IsString({ message: 'Documento deve ser uma string' })
  documento?: string;

  @ApiPropertyOptional({
    description: 'Inscrição estadual',
    example: '123456789',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  inscricaoEstadual?: string;

  @ApiPropertyOptional({
    description: 'Inscrição municipal',
    example: '987654321',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  inscricaoMunicipal?: string;

  @ApiPropertyOptional({
    description: 'CEP',
    example: '12345-678',
    maxLength: 9,
  })
  @IsOptional()
  @IsString()
  cep?: string;

  @ApiPropertyOptional({
    description: 'Logradouro',
    example: 'Rua das Flores',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  logradouro?: string;

  @ApiPropertyOptional({
    description: 'Número',
    example: '123',
    maxLength: 10,
  })
  @IsOptional()
  @IsString()
  numero?: string;

  @ApiPropertyOptional({
    description: 'Complemento',
    example: 'Sala 101',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  complemento?: string;

  @ApiPropertyOptional({
    description: 'Bairro',
    example: 'Centro',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  bairro?: string;

  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'Fortaleza',
    maxLength: 50,
  })
  @IsOptional()
  @IsString()
  cidade?: string;

  @ApiPropertyOptional({
    description: 'Estado',
    example: 'CE',
    maxLength: 2,
  })
  @IsOptional()
  @IsString()
  estado?: string;

  @ApiPropertyOptional({
    description: 'Telefone principal',
    example: '(88) 99966-1299',
    maxLength: 15,
  })
  @IsOptional()
  @IsString()
  telefone1?: string;

  @ApiPropertyOptional({
    description: 'Telefone secundário',
    example: '(88) 99966-1300',
    maxLength: 15,
  })
  @IsOptional()
  @IsString()
  telefone2?: string;

  @ApiPropertyOptional({
    description: 'Email principal',
    example: 'contato@cliente.com',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  email1?: string;

  @ApiPropertyOptional({
    description: 'Email secundário',
    example: 'financeiro@cliente.com',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  email2?: string;

  @ApiPropertyOptional({
    description: 'Observações',
    example: 'Cliente de frutas e verduras',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Status do cliente',
    enum: ['ATIVO', 'INATIVO'],
    example: 'ATIVO',
  })
  @IsOptional()
  @IsEnum(['ATIVO', 'INATIVO'])
  status?: StatusCliente;

  @ApiPropertyOptional({
    description: 'Se o cliente é uma indústria',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  industria?: boolean;

  @ApiPropertyOptional({
    description: 'Número de dias',
    example: 30,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  dias?: number;
} 