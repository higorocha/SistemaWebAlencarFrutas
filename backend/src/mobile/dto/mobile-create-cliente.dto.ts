import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class MobileCreateClienteDto {
  @ApiProperty({
    description: 'Nome do cliente a ser criado',
    example: 'Novo Cliente Mobile',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  nome: string;

  @ApiPropertyOptional({
    description: 'Indica se o cliente é uma indústria',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  industria?: boolean;
}

