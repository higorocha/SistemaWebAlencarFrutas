import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsEmail, IsNumber, IsBoolean, IsIn, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para criação da configuração de email
 */
export class CreateConfigEmailDto {
  @ApiProperty({
    description: 'Servidor SMTP',
    example: 'smtp.gmail.com',
  })
  @IsString({ message: 'Servidor SMTP deve ser um texto válido' })
  @IsNotEmpty({ message: 'Servidor SMTP é obrigatório' })
  servidorSMTP: string;

  @ApiProperty({
    description: 'Porta do servidor SMTP',
    example: 587,
    minimum: 1,
    maximum: 65535,
  })
  @IsNumber({}, { message: 'Porta deve ser um número válido' })
  @Min(1, { message: 'Porta deve ser maior que 0' })
  @Max(65535, { message: 'Porta deve ser menor que 65536' })
  @Type(() => Number)
  porta: number;

  @ApiProperty({
    description: 'Email que será usado para envio',
    example: 'noreply@empresa.com',
  })
  @IsEmail({}, { message: 'Email de envio deve ter um formato válido' })
  @IsNotEmpty({ message: 'Email de envio é obrigatório' })
  emailEnvio: string;

  @ApiProperty({
    description: 'Nome que aparecerá como remetente',
    example: 'Sistema Alencar Frutas',
  })
  @IsString({ message: 'Nome de exibição deve ser um texto válido' })
  @IsNotEmpty({ message: 'Nome de exibição é obrigatório' })
  nomeExibicao: string;

  @ApiProperty({
    description: 'Usuário para autenticação no servidor SMTP',
    example: 'usuario@empresa.com',
  })
  @IsString({ message: 'Usuário deve ser um texto válido' })
  @IsNotEmpty({ message: 'Usuário é obrigatório' })
  usuario: string;

  @ApiProperty({
    description: 'Senha para autenticação no servidor SMTP',
    example: 'senhaSegura123',
  })
  @IsString({ message: 'Senha deve ser um texto válido' })
  @IsNotEmpty({ message: 'Senha é obrigatória' })
  senha: string;

  @ApiProperty({
    description: 'Método de autenticação',
    example: 'LOGIN',
    enum: ['LOGIN', 'PLAIN', 'CRAM-MD5'],
  })
  @IsString({ message: 'Método de autenticação deve ser um texto válido' })
  @IsIn(['LOGIN', 'PLAIN', 'CRAM-MD5'], { 
    message: 'Método de autenticação deve ser LOGIN, PLAIN ou CRAM-MD5' 
  })
  metodoAutenticacao: string;

  @ApiProperty({
    description: 'Timeout da conexão em segundos',
    example: 30,
    minimum: 5,
    maximum: 300,
  })
  @IsNumber({}, { message: 'Timeout deve ser um número válido' })
  @Min(5, { message: 'Timeout deve ser pelo menos 5 segundos' })
  @Max(300, { message: 'Timeout não pode ser superior a 300 segundos' })
  @Type(() => Number)
  timeoutConexao: number;

  @ApiProperty({
    description: 'Se deve usar SSL/TLS',
    example: true,
  })
  @IsBoolean({ message: 'Usar SSL deve ser verdadeiro ou falso' })
  usarSSL: boolean;
}

/**
 * DTO para atualização da configuração de email
 */
export class UpdateConfigEmailDto extends CreateConfigEmailDto {}

/**
 * DTO para resposta da configuração de email
 */
export class ConfigEmailResponseDto extends CreateConfigEmailDto {
  @ApiProperty({
    description: 'ID único da configuração',
    example: 1,
  })
  id: number;

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