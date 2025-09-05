import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsInt, IsOptional, Matches } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para criação de credenciais API
 * Mapeia os campos enviados pelo frontend para validação
 */
export class CreateCredenciaisAPIDto {
  @ApiProperty({
    description: 'Código do banco (ex: 001)',
    example: '001',
  })
  @IsString()
  @IsNotEmpty({ message: 'Banco é obrigatório' })
  banco: string;

  @ApiProperty({
    description: 'ID da conta corrente associada',
    example: 1,
  })
  @IsInt({ message: 'ID da conta corrente deve ser um número inteiro' })
  @Type(() => Number)
  contaCorrenteId: number;

  @ApiProperty({
    description: 'Modalidade da API (ex: 001 - Cobrança, 002 - PIX)',
    example: '001 - Cobrança',
  })
  @IsString()
  @IsNotEmpty({ message: 'Modalidade API é obrigatória' })
  modalidadeApi: string;

  @ApiProperty({
    description: 'Developer Application Key fornecida pelo banco',
    example: 'your-developer-app-key-here',
  })
  @IsString()
  @IsNotEmpty({ message: 'Developer Application Key é obrigatória' })
  developerAppKey: string;

  @ApiProperty({
    description: 'Cliente ID fornecido pelo banco',
    example: 'your-client-id-here',
  })
  @IsString()
  @IsNotEmpty({ message: 'Cliente ID é obrigatório' })
  clienteId: string;

  @ApiProperty({
    description: 'Cliente Secret fornecido pelo banco',
    example: 'your-client-secret-here',
  })
  @IsString()
  @IsNotEmpty({ message: 'Cliente Secret é obrigatório' })
  clienteSecret: string;
}

/**
 * DTO para atualização de credenciais API
 * Todos os campos são opcionais para permitir atualizações parciais
 */
export class UpdateCredenciaisAPIDto extends PartialType(CreateCredenciaisAPIDto) {
  @ApiProperty({
    description: 'Código do banco (ex: 001)',
    example: '001',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Banco não pode estar vazio' })
  banco?: string;

  @ApiProperty({
    description: 'ID da conta corrente associada',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsInt({ message: 'ID da conta corrente deve ser um número inteiro' })
  @Type(() => Number)
  contaCorrenteId?: number;

  @ApiProperty({
    description: 'Modalidade da API (ex: 001 - Cobrança, 002 - PIX)',
    example: '001 - Cobrança',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Modalidade API não pode estar vazia' })
  modalidadeApi?: string;

  @ApiProperty({
    description: 'Developer Application Key fornecida pelo banco',
    example: 'your-developer-app-key-here',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Developer Application Key não pode estar vazia' })
  developerAppKey?: string;

  @ApiProperty({
    description: 'Cliente ID fornecido pelo banco',
    example: 'your-client-id-here',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Cliente ID não pode estar vazio' })
  clienteId?: string;

  @ApiProperty({
    description: 'Cliente Secret fornecido pelo banco',
    example: 'your-client-secret-here',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: 'Cliente Secret não pode estar vazio' })
  clienteSecret?: string;
}

/**
 * DTO para resposta de credenciais API
 * Usado nas respostas da API, incluindo campos do banco de dados
 */
export class CredenciaisAPIResponseDto {
  @ApiProperty({
    description: 'ID único das credenciais',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Código do banco',
    example: '001',
  })
  banco: string;

  @ApiProperty({
    description: 'ID da conta corrente associada',
    example: 1,
  })
  contaCorrenteId: number;

  @ApiProperty({
    description: 'Modalidade da API',
    example: '001 - Cobrança',
  })
  modalidadeApi: string;

  @ApiProperty({
    description: 'Developer Application Key',
    example: 'your-developer-app-key-here',
  })
  developerAppKey: string;

  @ApiProperty({
    description: 'Cliente ID',
    example: 'your-client-id-here',
  })
  clienteId: string;

  @ApiProperty({
    description: 'Cliente Secret',
    example: 'your-client-secret-here',
  })
  clienteSecret: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data da última atualização',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;
} 