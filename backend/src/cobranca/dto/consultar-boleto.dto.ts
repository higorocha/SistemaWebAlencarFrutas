import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsultarBoletoDto {
  @ApiProperty({
    description: 'Número do convênio de cobrança',
    example: '3128557'
  })
  @IsString()
  numeroConvenio: string;

  @ApiPropertyOptional({
    description: 'ID da conta corrente',
    example: '1',
    type: String
  })
  @IsOptional()
  @IsString()
  contaCorrenteId?: string;

  @ApiPropertyOptional({
    description: 'Incluir logs e relacionamentos completos do boleto',
    example: 'true',
    default: 'false',
    type: String
  })
  @IsOptional()
  @IsIn(['true', 'false', '1', '0', ''])
  includeLogs?: string;
}
