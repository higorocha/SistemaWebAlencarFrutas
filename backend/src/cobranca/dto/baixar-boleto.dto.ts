import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BaixarBoletoDto {
  @ApiProperty({
    description: 'Número do convênio de cobrança',
    example: '3128557'
  })
  @IsString()
  numeroConvenio: string;
}
