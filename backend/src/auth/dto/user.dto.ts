import { 
  IsEmail, 
  IsString, 
  MinLength, 
  IsOptional, 
  IsEnum, 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NivelUsuario } from './register.dto';

export class CreateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome: string;

  @ApiProperty({
    description: 'CPF do usuário (apenas números)',
    example: '12345678901',
  })
  @IsString({ message: 'CPF deve ser uma string' })
  @MinLength(11, { message: 'CPF deve ter 11 dígitos' })
  cpf: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@alencarfrutas.com.br',
  })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'minhasenha123',
    minLength: 6,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(6, { message: 'Senha deve ter pelo menos 6 caracteres' })
  senha: string;

  @ApiProperty({
    description: 'Nível de acesso do usuário',
    enum: NivelUsuario,
    default: NivelUsuario.USUARIO,
  })
  @IsEnum(NivelUsuario, { message: 'Nível deve ser ADMINISTRADOR, USUARIO ou CONVIDADO' })
  nivel: NivelUsuario;
}

export class UpdateUserDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  nome?: string;

  @ApiProperty({
    description: 'CPF do usuário (apenas números)',
    example: '12345678901',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'CPF deve ser uma string' })
  @MinLength(11, { message: 'CPF deve ter 11 dígitos' })
  cpf?: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@alencarfrutas.com.br',
    required: false,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email inválido' })
  email?: string;

  @ApiProperty({
    description: 'Nível de acesso do usuário',
    enum: NivelUsuario,
    required: false,
  })
  @IsOptional()
  @IsEnum(NivelUsuario, { message: 'Nível deve ser ADMINISTRADOR, USUARIO ou CONVIDADO' })
  nivel?: NivelUsuario;
}

export class UserResponseDto {
  @ApiProperty({
    description: 'ID do usuário',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva',
  })
  nome: string;

  @ApiProperty({
    description: 'CPF do usuário',
    example: '12345678901',
  })
  cpf: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@alencarfrutas.com.br',
  })
  email: string;

  @ApiProperty({
    description: 'Nível de acesso',
    example: 'USUARIO',
  })
  nivel: string;

  @ApiProperty({
    description: 'Data de cadastro',
    example: '2024-01-15T10:30:00.000Z',
  })
  dataCadastro: Date;

  @ApiProperty({
    description: 'Último acesso',
    example: '2024-01-15T10:30:00.000Z',
    required: false,
  })
  ultimoAcesso?: Date | null;

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