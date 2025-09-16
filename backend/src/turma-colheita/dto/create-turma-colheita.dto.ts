import { IsString, IsOptional, IsNotEmpty, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTurmaColheitaDto {
  @ApiProperty({
    description: 'Nome da pessoa que colhe',
    example: 'João Silva',
  })
  @IsString()
  @IsNotEmpty()
  nomeColhedor: string;

  @ApiPropertyOptional({
    description: 'Chave PIX do colhedor',
    example: 'joao.silva@email.com',
  })
  @IsOptional()
  @IsString()
  chavePix?: string;

  @ApiPropertyOptional({
    description: 'Data de cadastro da turma',
    example: '2024-12-15T10:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  dataCadastro?: string;

  @ApiPropertyOptional({
    description: 'Observações sobre a turma de colheita',
    example: 'Turma especializada em colheita de frutas tropicais',
  })
  @IsOptional()
  @IsString()
  observacoes?: string;
}