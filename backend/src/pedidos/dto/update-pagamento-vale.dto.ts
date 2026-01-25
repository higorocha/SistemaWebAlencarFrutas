import { IsOptional, IsString } from 'class-validator';

export class UpdatePagamentoValeDto {
  @IsOptional()
  @IsString({ message: 'Referência externa deve ser uma string' })
  referenciaExterna?: string;
}
