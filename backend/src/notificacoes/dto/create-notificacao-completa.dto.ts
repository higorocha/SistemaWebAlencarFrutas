import { IsString, IsOptional, IsEnum, IsArray, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TipoNotificacao, PrioridadeNotificacao } from './index';

export class ToastInfoDto {
  @ApiProperty({ description: 'Título do toast' })
  @IsString()
  titulo: string;

  @ApiProperty({ description: 'Conteúdo do toast' })
  @IsString()
  conteudo: string;

  @ApiProperty({ 
    description: 'Tipo do toast',
    enum: ['success', 'error', 'warning', 'info']
  })
  @IsEnum(['success', 'error', 'warning', 'info'])
  tipo: 'success' | 'error' | 'warning' | 'info';
}

export class MenuInfoDto {
  @ApiProperty({ description: 'Título no menu' })
  @IsString()
  titulo: string;

  @ApiProperty({ description: 'Resumo curto para o menu' })
  @IsString()
  resumo: string;

  @ApiPropertyOptional({ description: 'Ícone opcional' })
  @IsOptional()
  @IsString()
  icone?: string;
}

export class AcaoModalDto {
  @ApiProperty({ description: 'Texto da ação' })
  @IsString()
  texto: string;

  @ApiProperty({ 
    description: 'Tipo da ação',
    enum: ['primary', 'secondary']
  })
  @IsEnum(['primary', 'secondary'])
  tipo: 'primary' | 'secondary';

  @ApiProperty({ description: 'ID da ação para onClick' })
  @IsString()
  onClick: string;
}

export class ModalInfoDto {
  @ApiProperty({ description: 'Título do modal' })
  @IsString()
  titulo: string;

  @ApiProperty({ description: 'Conteúdo completo do modal' })
  @IsString()
  conteudo: string;

  @ApiPropertyOptional({ 
    description: 'Ações opcionais do modal',
    type: [AcaoModalDto]
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AcaoModalDto)
  acoes?: AcaoModalDto[];
}

export class CreateNotificacaoCompletaDto {
  @ApiProperty({ description: 'Título principal da notificação' })
  @IsString()
  titulo: string;

  @ApiProperty({ description: 'Conteúdo completo da notificação' })
  @IsString()
  conteudo: string;

  @ApiProperty({ 
    description: 'Tipo da notificação',
    enum: TipoNotificacao
  })
  @IsEnum(TipoNotificacao)
  tipo: TipoNotificacao;

  @ApiPropertyOptional({ 
    description: 'Prioridade da notificação',
    enum: PrioridadeNotificacao
  })
  @IsOptional()
  @IsEnum(PrioridadeNotificacao)
  prioridade?: PrioridadeNotificacao;

  @ApiPropertyOptional({ 
    description: 'Informações para exibição no toast',
    type: ToastInfoDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ToastInfoDto)
  toast?: ToastInfoDto;

  @ApiPropertyOptional({ 
    description: 'Informações para exibição no menu',
    type: MenuInfoDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MenuInfoDto)
  menu?: MenuInfoDto;

  @ApiPropertyOptional({ 
    description: 'Informações para exibição no modal',
    type: ModalInfoDto
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => ModalInfoDto)
  modal?: ModalInfoDto;

  @ApiPropertyOptional({ 
    description: 'Dados adicionais da notificação',
    type: 'object',
    additionalProperties: true
  })
  @IsOptional()
  @IsObject()
  dadosAdicionais?: Record<string, any>;
}
