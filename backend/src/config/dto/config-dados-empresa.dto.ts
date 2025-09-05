import { 
  IsString, 
  IsOptional, 
  MinLength, 
  Matches,
  IsNotEmpty 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateConfigDadosEmpresaDto {
  @ApiProperty({
    description: 'Razão social da empresa',
    example: 'Empresa XYZ LTDA',
  })
  @IsString({ message: 'Razão social deve ser uma string' })
  @IsNotEmpty({ message: 'Razão social é obrigatória' })
  @MinLength(2, { message: 'Razão social deve ter pelo menos 2 caracteres' })
  razao_social: string;

  @ApiProperty({
    description: 'Nome fantasia da empresa',
    example: 'XYZ Comércio',
  })
  @IsString({ message: 'Nome fantasia deve ser uma string' })
  @IsNotEmpty({ message: 'Nome fantasia é obrigatório' })
  @MinLength(2, { message: 'Nome fantasia deve ter pelo menos 2 caracteres' })
  nome_fantasia: string;

  @ApiProperty({
    description: 'CNPJ da empresa (formato: XX.XXX.XXX/XXXX-XX)',
    example: '12.345.678/0001-90',
  })
  @IsString({ message: 'CNPJ deve ser uma string' })
  @IsNotEmpty({ message: 'CNPJ é obrigatório' })
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
  })
  cnpj: string;

  @ApiProperty({
    description: 'Nome do proprietário',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Proprietário deve ser uma string' })
  proprietario?: string;

  @ApiProperty({
    description: 'Telefone da empresa (formato: (XX) XXXXX-XXXX)',
    example: '(11) 99999-9999',
  })
  @IsString({ message: 'Telefone deve ser uma string' })
  @IsNotEmpty({ message: 'Telefone é obrigatório' })
  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
  })
  telefone: string;

  @ApiProperty({
    description: 'Logradouro do endereço',
    example: 'Rua Exemplo, 123',
  })
  @IsString({ message: 'Logradouro deve ser uma string' })
  @IsNotEmpty({ message: 'Logradouro é obrigatório' })
  @MinLength(5, { message: 'Logradouro deve ter pelo menos 5 caracteres' })
  logradouro: string;

  @ApiProperty({
    description: 'CEP (formato: XXXXX-XXX)',
    example: '12345-678',
  })
  @IsString({ message: 'CEP deve ser uma string' })
  @IsNotEmpty({ message: 'CEP é obrigatório' })
  @Matches(/^\d{5}-\d{3}$/, {
    message: 'CEP deve estar no formato XXXXX-XXX',
  })
  cep: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
  })
  @IsString({ message: 'Bairro deve ser uma string' })
  @IsNotEmpty({ message: 'Bairro é obrigatório' })
  @MinLength(2, { message: 'Bairro deve ter pelo menos 2 caracteres' })
  bairro: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'Marco',
  })
  @IsString({ message: 'Cidade deve ser uma string' })
  @IsNotEmpty({ message: 'Cidade é obrigatória' })
  @MinLength(2, { message: 'Cidade deve ter pelo menos 2 caracteres' })
  cidade: string;

  @ApiProperty({
    description: 'Estado (UF)',
    example: 'CE',
  })
  @IsString({ message: 'Estado deve ser uma string' })
  @IsNotEmpty({ message: 'Estado é obrigatório' })
  @MinLength(2, { message: 'Estado deve ter 2 caracteres' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'Estado deve ser uma UF válida (2 letras maiúsculas)',
  })
  estado: string;
}

export class UpdateConfigDadosEmpresaDto {
  @ApiProperty({
    description: 'Razão social da empresa',
    example: 'Empresa XYZ LTDA',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Razão social deve ser uma string' })
  @MinLength(2, { message: 'Razão social deve ter pelo menos 2 caracteres' })
  razao_social?: string;

  @ApiProperty({
    description: 'Nome fantasia da empresa',
    example: 'XYZ Comércio',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome fantasia deve ser uma string' })
  @MinLength(2, { message: 'Nome fantasia deve ter pelo menos 2 caracteres' })
  nome_fantasia?: string;

  @ApiProperty({
    description: 'CNPJ da empresa (formato: XX.XXX.XXX/XXXX-XX)',
    example: '12.345.678/0001-90',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CNPJ deve ser uma string' })
  @Matches(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
    message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
  })
  cnpj?: string;

  @ApiProperty({
    description: 'Nome do proprietário',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Proprietário deve ser uma string' })
  proprietario?: string;

  @ApiProperty({
    description: 'Telefone da empresa (formato: (XX) XXXXX-XXXX)',
    example: '(11) 99999-9999',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  @Matches(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
    message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
  })
  telefone?: string;

  @ApiProperty({
    description: 'Logradouro do endereço',
    example: 'Rua Exemplo, 123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Logradouro deve ser uma string' })
  @MinLength(5, { message: 'Logradouro deve ter pelo menos 5 caracteres' })
  logradouro?: string;

  @ApiProperty({
    description: 'CEP (formato: XXXXX-XXX)',
    example: '12345-678',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CEP deve ser uma string' })
  @Matches(/^\d{5}-\d{3}$/, {
    message: 'CEP deve estar no formato XXXXX-XXX',
  })
  cep?: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Bairro deve ser uma string' })
  @MinLength(2, { message: 'Bairro deve ter pelo menos 2 caracteres' })
  bairro?: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'Marco',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Cidade deve ser uma string' })
  @MinLength(2, { message: 'Cidade deve ter pelo menos 2 caracteres' })
  cidade?: string;

  @ApiProperty({
    description: 'Estado (UF)',
    example: 'CE',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Estado deve ser uma string' })
  @MinLength(2, { message: 'Estado deve ter 2 caracteres' })
  @Matches(/^[A-Z]{2}$/, {
    message: 'Estado deve ser uma UF válida (2 letras maiúsculas)',
  })
  estado?: string;
}

export class ConfigDadosEmpresaResponseDto {
  @ApiProperty({
    description: 'ID da configuração',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Razão social da empresa',
    example: 'Empresa XYZ LTDA',
  })
  razao_social: string;

  @ApiProperty({
    description: 'Nome fantasia da empresa',
    example: 'XYZ Comércio',
  })
  nome_fantasia: string;

  @ApiProperty({
    description: 'CNPJ da empresa',
    example: '12.345.678/0001-90',
  })
  cnpj: string;

  @ApiProperty({
    description: 'Nome do proprietário',
    example: 'João Silva',
    required: false,
  })
  proprietario?: string | null;

  @ApiProperty({
    description: 'Telefone da empresa',
    example: '(11) 99999-9999',
  })
  telefone: string;

  @ApiProperty({
    description: 'Logradouro do endereço',
    example: 'Rua Exemplo, 123',
  })
  logradouro: string;

  @ApiProperty({
    description: 'CEP',
    example: '12345-678',
  })
  cep: string;

  @ApiProperty({
    description: 'Bairro',
    example: 'Centro',
  })
  bairro: string;

  @ApiProperty({
    description: 'Cidade',
    example: 'Marco',
  })
  cidade: string;

  @ApiProperty({
    description: 'Estado (UF)',
    example: 'CE',
  })
  estado: string;

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