import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateFornecedorDto {
  @IsNotEmpty({ message: 'Nome do fornecedor é obrigatório' })
  @IsString({ message: 'Nome deve ser uma string' })
  nome: string;

  @IsOptional()
  @IsString({ message: 'Documento deve ser uma string' })
  documento?: string;

  @IsOptional()
  @IsString({ message: 'CNPJ deve ser uma string' })
  cnpj?: string;

  @IsOptional()
  @IsString({ message: 'CPF deve ser uma string' })
  cpf?: string;

  @IsOptional()
  @IsString({ message: 'Telefone deve ser uma string' })
  telefone?: string;

  @IsOptional()
  @IsString({ message: 'Email deve ser uma string' })
  email?: string;

  @IsOptional()
  @IsString({ message: 'Endereço deve ser uma string' })
  endereco?: string;

  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  observacoes?: string;
}

