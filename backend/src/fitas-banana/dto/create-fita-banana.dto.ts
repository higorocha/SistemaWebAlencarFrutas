import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreateFitaBananaDto {
  @IsString()
  @IsNotEmpty({ message: 'Nome é obrigatório' })
  @Length(1, 100, { message: 'Nome deve ter entre 1 e 100 caracteres' })
  nome: string;

  @IsString()
  @IsNotEmpty({ message: 'Cor é obrigatória' })
  @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Cor deve ser um valor hexadecimal válido (ex: #FF0000)' })
  @Length(7, 7, { message: 'Cor deve ter exatamente 7 caracteres (ex: #FF0000)' })
  corHex: string;
}