import { ApiProperty } from '@nestjs/swagger';
import { TipoLogin } from '../dto/login.dto';

export class LoginResponseDto {
  @ApiProperty({
    description: 'Token de acesso JWT',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'Dados do usuário logado',
    example: {
      id: 1,
      nome: 'João Silva',
      email: 'joao@alencarfrutas.com.br',
      nivel: 'USUARIO',
    },
  })
  usuario: {
    id: number;
    nome: string;
    email: string;
    nivel: string;
    ultimoAcesso: Date;
  };

  @ApiProperty({
    description: 'Data de expiração do token',
    example: '2024-01-15T23:59:59.999Z',
  })
  expiracao: string;

  @ApiProperty({
    description: 'Tipo de login utilizado',
    enum: TipoLogin,
    example: TipoLogin.WEB,
  })
  tipoLogin: TipoLogin;
}

export class RegisterResponseDto {
  @ApiProperty({
    description: 'ID do usuário criado',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Nome do usuário',
    example: 'João Silva',
  })
  nome: string;

  @ApiProperty({
    description: 'Email do usuário',
    example: 'joao@alencarfrutas.com.br',
  })
  email: string;

  @ApiProperty({
    description: 'CPF do usuário',
    example: '12345678901',
  })
  cpf: string;

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
    description: 'Data de criação',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

export class UpdatePasswordResponseDto {
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
    description: 'Email do usuário',
    example: 'joao@alencarfrutas.com.br',
  })
  email: string;

  @ApiProperty({
    description: 'Nível de acesso',
    example: 'USUARIO',
  })
  nivel: string;
} 