import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsUrl, IsObject } from 'class-validator';
import { Type } from 'class-transformer';

/**
 * DTO para criação da configuração de WhatsApp
 */
export class CreateConfigWhatsAppDto {
  @ApiProperty({
    description: 'ID do número de telefone no Facebook Business',
    example: '123456789012345',
  })
  @IsString({ message: 'ID do número de telefone deve ser um texto válido' })
  @IsNotEmpty({ message: 'ID do número de telefone é obrigatório' })
  phoneNumberId: string;

  @ApiProperty({
    description: 'Token de acesso da API do WhatsApp Business',
    example: 'EAABsbCS1...token_longo',
  })
  @IsString({ message: 'Token de acesso deve ser um texto válido' })
  @IsNotEmpty({ message: 'Token de acesso é obrigatório' })
  accessToken: string;

  @ApiProperty({
    description: 'ID da conta comercial do Facebook (opcional)',
    example: '987654321098765',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'ID da conta comercial deve ser um texto válido' })
  businessAccountId?: string;

  @ApiProperty({
    description: 'Token de verificação do webhook (opcional)',
    example: 'meu_token_verificacao_123',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Token de verificação deve ser um texto válido' })
  verifyToken?: string;

  @ApiProperty({
    description: 'Número de telefone formatado',
    example: '+55 85 99999-9999',
  })
  @IsString({ message: 'Número de telefone deve ser um texto válido' })
  @IsNotEmpty({ message: 'Número de telefone é obrigatório' })
  numeroTelefone: string;

  @ApiProperty({
    description: 'Nome que aparece no WhatsApp',
    example: 'Alencar Frutas - Atendimento',
  })
  @IsString({ message: 'Nome de exibição deve ser um texto válido' })
  @IsNotEmpty({ message: 'Nome de exibição é obrigatório' })
  nomeExibicao: string;

  @ApiProperty({
    description: 'Se a configuração está ativa',
    example: true,
    default: true,
  })
  @IsBoolean({ message: 'Ativo deve ser verdadeiro ou falso' })
  ativo: boolean;

  @ApiProperty({
    description: 'URL do webhook para receber mensagens (opcional)',
    example: 'https://api.empresa.com/webhook/whatsapp',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'URL do webhook deve ter um formato válido' })
  webhookUrl?: string;

  @ApiProperty({
    description: 'Configurações adicionais em formato JSON (opcional)',
    example: { 
      "timeout": 30, 
      "retry_attempts": 3,
      "default_template": "saudacao_inicial"
    },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Configurações adicionais devem ser um objeto JSON válido' })
  configuracoesAdicionais?: Record<string, any>;
}

/**
 * DTO para atualização da configuração de WhatsApp
 */
export class UpdateConfigWhatsAppDto extends CreateConfigWhatsAppDto {}

/**
 * DTO para resposta da configuração de WhatsApp
 */
export class ConfigWhatsAppResponseDto extends CreateConfigWhatsAppDto {
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