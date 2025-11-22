import { PartialType } from '@nestjs/mapped-types';
import { CreateFuncionarioDto } from './create-funcionario.dto';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';
import { StatusFuncionario } from '@prisma/client';

export class UpdateFuncionarioDto extends PartialType(CreateFuncionarioDto) {
  @IsOptional()
  @IsEnum(StatusFuncionario)
  status?: StatusFuncionario;

  @IsOptional()
  @IsDateString()
  dataAdmissao?: string;

  @IsOptional()
  @IsDateString()
  dataDemissao?: string;
}

