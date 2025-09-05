import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum NivelUsuario {
  ADMINISTRADOR = 'ADMINISTRADOR',
  USUARIO = 'USUARIO',
  CONVIDADO = 'CONVIDADO',
}

export class RegisterDto {
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
    required: false,
  })
  @IsOptional()
  @IsEnum(NivelUsuario, { message: 'Nível deve ser ADMINISTRADOR, USUARIO ou CONVIDADO' })
  nivel?: NivelUsuario;
} 