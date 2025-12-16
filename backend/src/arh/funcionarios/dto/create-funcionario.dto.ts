import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoContratoFuncionario } from '@prisma/client';

export class CreateFuncionarioDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  apelido?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(14)
  cpf: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  rg?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  pis?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  ctps?: string;

  @IsOptional()
  @IsDateString()
  dataNascimento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  celular?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  estadoCivil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(9)
  cep?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  logradouro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(10)
  numero?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  complemento?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  bairro?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  cidade?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2)
  estado?: string;

  @IsEnum(TipoContratoFuncionario)
  tipoContrato: TipoContratoFuncionario;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  cargoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  funcaoId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  salarioCustomizado?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  valorDiariaCustomizada?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(4)
  tipoChavePix?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  modalidadeChave?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  chavePix?: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  responsavelChavePix?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ajudaCusto?: number;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  pixTerceiro?: boolean;

  @IsOptional()
  @IsObject()
  endereco?: Record<string, any>;

  @IsOptional()
  @IsObject()
  dadosBancarios?: Record<string, any>;

  @IsOptional()
  @IsObject()
  dependentes?: Record<string, any>;

  @IsOptional()
  @IsString()
  observacoes?: string;

  @IsOptional()
  @IsDateString()
  dataAdmissao?: string;

  @IsOptional()
  @IsDateString()
  dataDemissao?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  gerenteId?: number;
}

