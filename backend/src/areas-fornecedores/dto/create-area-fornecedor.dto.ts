import { IsNotEmpty, IsString, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAreaFornecedorDto {
  @IsNotEmpty({ message: 'ID do fornecedor é obrigatório' })
  @IsNumber({}, { message: 'ID do fornecedor deve ser um número' })
  @Type(() => Number)
  fornecedorId: number;

  @IsNotEmpty({ message: 'Nome da área é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  nome: string;

  @IsOptional({ message: 'ID da cultura é opcional' })
  @IsNumber({}, { message: 'ID da cultura deve ser um número' })
  @Type(() => Number)
  culturaId?: number;
}

