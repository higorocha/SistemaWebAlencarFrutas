import { IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MarcarLoteExcluidoDto {
  @ApiProperty({
    description: 'Indica se o lote deve ser marcado como excluído',
    example: true,
  })
  @IsBoolean()
  excluido: boolean;
}
