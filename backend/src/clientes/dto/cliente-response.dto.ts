import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Definindo os tipos dos enums
type StatusCliente = 'ATIVO' | 'INATIVO';

export class ClienteResponseDto {
  @ApiProperty({
    description: 'ID do cliente',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome do cliente',
    example: 'Distribuidora ABC Ltda',
  })
  nome: string;

  @ApiPropertyOptional({
    description: 'Razão social',
    example: 'DISTRIBUIDORA ABC LTDA',
  })
  razaoSocial?: string;

  @ApiPropertyOptional({
    description: 'CPF ou CNPJ do cliente',
    example: '123.456.789-00 ou 12.345.678/0001-90',
  })
  documento?: string;

  @ApiPropertyOptional({
    description: 'Inscrição estadual',
    example: '123456789',
  })
  inscricaoEstadual?: string;

  @ApiPropertyOptional({
    description: 'Inscrição municipal',
    example: '987654321',
  })
  inscricaoMunicipal?: string;

  @ApiPropertyOptional({
    description: 'CEP',
    example: '12345-678',
  })
  cep?: string;

  @ApiPropertyOptional({
    description: 'Logradouro',
    example: 'Rua das Flores',
  })
  logradouro?: string;

  @ApiPropertyOptional({
    description: 'Número',
    example: '123',
  })
  numero?: string;

  @ApiPropertyOptional({
    description: 'Complemento',
    example: 'Sala 101',
  })
  complemento?: string;

  @ApiPropertyOptional({
    description: 'Bairro',
    example: 'Centro',
  })
  bairro?: string;

  @ApiPropertyOptional({
    description: 'Cidade',
    example: 'Fortaleza',
  })
  cidade?: string;

  @ApiPropertyOptional({
    description: 'Estado',
    example: 'CE',
  })
  estado?: string;

  @ApiPropertyOptional({
    description: 'Telefone principal',
    example: '(88) 99966-1299',
  })
  telefone1?: string;

  @ApiPropertyOptional({
    description: 'Telefone secundário',
    example: '(88) 99966-1300',
  })
  telefone2?: string;

  @ApiPropertyOptional({
    description: 'Email principal',
    example: 'contato@cliente.com',
  })
  email1?: string;

  @ApiPropertyOptional({
    description: 'Email secundário',
    example: 'financeiro@cliente.com',
  })
  email2?: string;

  @ApiPropertyOptional({
    description: 'Observações',
    example: 'Cliente de frutas e verduras',
  })
  observacoes?: string;

  @ApiProperty({
    description: 'Status do cliente',
    enum: ['ATIVO', 'INATIVO'],
    example: 'ATIVO',
  })
  status: StatusCliente;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
} 