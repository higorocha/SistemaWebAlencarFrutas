import { IsString, IsOptional, IsNotEmpty, IsDateString, IsInt, Min, Max } from 'class-validator';
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
    description: 'Responsável pela chave PIX',
    example: 'Maria Santos',
  })
  @IsOptional()
  @IsString()
  responsavelChavePix?: string;

  @ApiPropertyOptional({
    description: 'Código do tipo da chave PIX: 1=Telefone, 2=Email, 3=CPF/CNPJ, 4=Chave Aleatória',
    example: 2,
    enum: [1, 2, 3, 4],
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(4)
  tipoChavePix?: number;

  @ApiPropertyOptional({
    description: 'Nome da modalidade da chave PIX: "Telefone", "Email", "CPF/CNPJ", "Chave Aleatória"',
    example: 'Email',
  })
  @IsOptional()
  @IsString()
  modalidadeChave?: string;

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