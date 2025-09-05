import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum } from 'class-validator';

export enum TipoLogin {
  WEB = 'web',
  MOBILE = 'mobile',
}

export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'admin@alencarfrutas.com.br',
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
    description: 'Tipo de login (web ou mobile)',
    enum: TipoLogin,
    default: TipoLogin.WEB,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoLogin, { message: 'Tipo de login deve ser web ou mobile' })
  tipoLogin?: TipoLogin;
} 