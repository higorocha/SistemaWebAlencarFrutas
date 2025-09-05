import { IsNotEmpty, IsString, IsNumber } from 'class-validator';

export class CreateAreaFornecedorDto {
  @IsNotEmpty({ message: 'ID do fornecedor é obrigatório' })
  @IsNumber({}, { message: 'ID do fornecedor deve ser um número' })
  fornecedorId: number;

  @IsNotEmpty({ message: 'Nome da área é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  nome: string;
}

