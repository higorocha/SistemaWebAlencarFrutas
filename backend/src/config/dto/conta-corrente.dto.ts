import { 
  IsString, 
  IsNotEmpty,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
  IsNumber,
  Min
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateContaCorrenteDto {
  @ApiProperty({
    description: 'Código do banco',
    example: '001',
  })
  @IsString({ message: 'Código do banco deve ser uma string' })
  @IsNotEmpty({ message: 'Código do banco é obrigatório' })
  @MinLength(3, { message: 'Código do banco deve ter pelo menos 3 caracteres' })
  @MaxLength(3, { message: 'Código do banco deve ter no máximo 3 caracteres' })
  bancoCodigo: string;

  @ApiProperty({
    description: 'Número da agência',
    example: '1234',
  })
  @IsString({ message: 'Agência deve ser uma string' })
  @IsNotEmpty({ message: 'Agência é obrigatória' })
  @MinLength(1, { message: 'Agência deve ter pelo menos 1 caractere' })
  @MaxLength(10, { message: 'Agência deve ter no máximo 10 caracteres' })
  agencia: string;

  @ApiProperty({
    description: 'Dígito verificador da agência',
    example: '0',
  })
  @IsString({ message: 'Dígito da agência deve ser uma string' })
  @IsNotEmpty({ message: 'Dígito da agência é obrigatório' })
  @MinLength(1, { message: 'Dígito da agência deve ter pelo menos 1 caractere' })
  @MaxLength(2, { message: 'Dígito da agência deve ter no máximo 2 caracteres' })
  agenciaDigito: string;

  @ApiProperty({
    description: 'Número da conta corrente',
    example: '987654',
  })
  @IsString({ message: 'Conta corrente deve ser uma string' })
  @IsNotEmpty({ message: 'Conta corrente é obrigatória' })
  @MinLength(1, { message: 'Conta corrente deve ter pelo menos 1 caractere' })
  @MaxLength(20, { message: 'Conta corrente deve ter no máximo 20 caracteres' })
  contaCorrente: string;

  @ApiProperty({
    description: 'Dígito verificador da conta corrente',
    example: '1',
  })
  @IsString({ message: 'Dígito da conta corrente deve ser uma string' })
  @IsNotEmpty({ message: 'Dígito da conta corrente é obrigatório' })
  @MinLength(1, { message: 'Dígito da conta corrente deve ter pelo menos 1 caractere' })
  @MaxLength(2, { message: 'Dígito da conta corrente deve ter no máximo 2 caracteres' })
  contaCorrenteDigito: string;

  @ApiProperty({
    description: 'Indica se a conta será monitorada automaticamente',
    example: false,
    required: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Monitorar deve ser um valor booleano' })
  monitorar?: boolean;

  @ApiProperty({
    description: 'Intervalo de monitoramento em segundos',
    example: 3600,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Intervalo deve ser um número' })
  @Min(1, { message: 'Intervalo deve ser maior que 0' })
  intervalo?: number;
}

export class UpdateContaCorrenteDto {
  @ApiProperty({
    description: 'Código do banco',
    example: '001',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Código do banco deve ser uma string' })
  @MinLength(3, { message: 'Código do banco deve ter pelo menos 3 caracteres' })
  @MaxLength(3, { message: 'Código do banco deve ter no máximo 3 caracteres' })
  bancoCodigo?: string;

  @ApiProperty({
    description: 'Número da agência',
    example: '1234',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Agência deve ser uma string' })
  @MinLength(1, { message: 'Agência deve ter pelo menos 1 caractere' })
  @MaxLength(10, { message: 'Agência deve ter no máximo 10 caracteres' })
  agencia?: string;

  @ApiProperty({
    description: 'Dígito verificador da agência',
    example: '0',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Dígito da agência deve ser uma string' })
  @MinLength(1, { message: 'Dígito da agência deve ter pelo menos 1 caractere' })
  @MaxLength(2, { message: 'Dígito da agência deve ter no máximo 2 caracteres' })
  agenciaDigito?: string;

  @ApiProperty({
    description: 'Número da conta corrente',
    example: '987654',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Conta corrente deve ser uma string' })
  @MinLength(1, { message: 'Conta corrente deve ter pelo menos 1 caractere' })
  @MaxLength(20, { message: 'Conta corrente deve ter no máximo 20 caracteres' })
  contaCorrente?: string;

  @ApiProperty({
    description: 'Dígito verificador da conta corrente',
    example: '1',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Dígito da conta corrente deve ser uma string' })
  @MinLength(1, { message: 'Dígito da conta corrente deve ter pelo menos 1 caractere' })
  @MaxLength(2, { message: 'Dígito da conta corrente deve ter no máximo 2 caracteres' })
  contaCorrenteDigito?: string;

  @ApiProperty({
    description: 'Indica se a conta será monitorada automaticamente',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'Monitorar deve ser um valor booleano' })
  monitorar?: boolean;

  @ApiProperty({
    description: 'Intervalo de monitoramento em segundos',
    example: 3600,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Intervalo deve ser um número' })
  @Min(1, { message: 'Intervalo deve ser maior que 0' })
  intervalo?: number;
}

export class ContaCorrenteResponseDto {
  @ApiProperty({
    description: 'ID da conta corrente',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Código do banco',
    example: '001',
  })
  bancoCodigo: string;

  @ApiProperty({
    description: 'Número da agência',
    example: '1234',
  })
  agencia: string;

  @ApiProperty({
    description: 'Dígito verificador da agência',
    example: '0',
  })
  agenciaDigito: string;

  @ApiProperty({
    description: 'Número da conta corrente',
    example: '987654',
  })
  contaCorrente: string;

  @ApiProperty({
    description: 'Dígito verificador da conta corrente',
    example: '1',
  })
  contaCorrenteDigito: string;

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

  @ApiProperty({
    description: 'Indica se a conta será monitorada automaticamente',
    example: false,
  })
  monitorar: boolean;

  @ApiProperty({
    description: 'Intervalo de monitoramento em segundos',
    example: 3600,
    required: false,
  })
  intervalo?: number | null;
} 