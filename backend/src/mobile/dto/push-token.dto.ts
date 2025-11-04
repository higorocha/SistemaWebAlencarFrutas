import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePushTokenDto {
  @ApiProperty({
    description: 'Token Expo Push Notification',
    example: 'ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'Plataforma do dispositivo',
    example: 'ios',
    enum: ['ios', 'android'],
  })
  @IsString()
  @IsNotEmpty()
  platform: string;

  @ApiProperty({
    description: 'ID do dispositivo (opcional)',
    example: 'iPhone 13 Pro',
    required: false,
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class PushTokenResponseDto {
  @ApiProperty({ description: 'ID do token' })
  id: number;

  @ApiProperty({ description: 'Token Expo Push Notification' })
  token: string;

  @ApiProperty({ description: 'Plataforma do dispositivo' })
  platform: string;

  @ApiProperty({ description: 'ID do dispositivo', required: false })
  deviceId?: string;

  @ApiProperty({ description: 'Se o token está ativo' })
  ativo: boolean;

  @ApiProperty({ description: 'Data de criação' })
  createdAt: Date;

  @ApiProperty({ description: 'Data de atualização' })
  updatedAt: Date;
}

