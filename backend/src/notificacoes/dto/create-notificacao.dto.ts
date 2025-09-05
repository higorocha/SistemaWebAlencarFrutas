import { IsString, IsOptional, IsEnum, IsNumber, IsUrl, IsDateString, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum TipoNotificacao {
  SISTEMA = 'SISTEMA',
  PIX = 'PIX',
  COBRANCA = 'COBRANCA',
  FATURA = 'FATURA',
  BOLETO = 'BOLETO',
  ALERTA = 'ALERTA',
}

export enum PrioridadeNotificacao {
  BAIXA = 'BAIXA',
  MEDIA = 'MEDIA',
  ALTA = 'ALTA',
}

export class CreateNotificacaoDto {
  @ApiProperty({
    description: 'Título da notificação',
    example: 'Novo pagamento recebido',
    maxLength: 100,
  })
  @IsString({ message: 'Título deve ser uma string' })
  titulo: string;

  @ApiProperty({
    description: 'Conteúdo da notificação',
    example: 'O cliente João Silva realizou um pagamento de R$ 150,00',
  })
  @IsString({ message: 'Conteúdo deve ser uma string' })
  conteudo: string;

  @ApiProperty({
    description: 'Tipo da notificação',
    enum: TipoNotificacao,
    default: TipoNotificacao.SISTEMA,
    required: false,
  })
  @IsOptional()
  @IsEnum(TipoNotificacao, { message: 'Tipo deve ser um valor válido' })
  tipo?: TipoNotificacao;

  @ApiProperty({
    description: 'Prioridade da notificação',
    enum: PrioridadeNotificacao,
    default: PrioridadeNotificacao.MEDIA,
    required: false,
  })
  @IsOptional()
  @IsEnum(PrioridadeNotificacao, { message: 'Prioridade deve ser um valor válido' })
  prioridade?: PrioridadeNotificacao;

  @ApiProperty({
    description: 'ID do usuário destinatário (opcional para notificações globais)',
    example: 1,
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'ID do usuário deve ser um número' })
  usuarioId?: number;

  @ApiProperty({
    description: 'Dados adicionais em formato JSON',
    example: { valor: 150.00, cliente: 'João Silva' },
    required: false,
  })
  @IsOptional()
  @IsObject({ message: 'Dados adicionais devem ser um objeto' })
  dadosAdicionais?: Record<string, any>;

  @ApiProperty({
    description: 'Link relacionado à notificação',
    example: 'https://exemplo.com/detalhes',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'Link deve ser uma URL válida' })
  link?: string;

  @ApiProperty({
    description: 'Data de expiração da notificação',
    example: '2024-12-31T23:59:59.000Z',
    required: false,
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de expiração deve ser uma data válida' })
  expirarEm?: string;
} 