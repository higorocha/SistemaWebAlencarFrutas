import { IsNotEmpty, IsNumber, IsEnum, IsString, IsOptional, IsDateString, IsBoolean, Min } from 'class-validator';
import { MetodoPagamento, ContaDestino } from '@prisma/client';

export class CreatePagamentoDto {
  @IsNotEmpty({ message: 'ID do pedido é obrigatório' })
  @IsNumber({}, { message: 'ID do pedido deve ser um número' })
  pedidoId: number;

  @IsNotEmpty({ message: 'Data do pagamento é obrigatória' })
  @IsDateString({}, { message: 'Data do pagamento deve ser uma data válida' })
  dataPagamento: string;

  @IsNotEmpty({ message: 'Valor recebido é obrigatório' })
  @IsNumber({}, { message: 'Valor recebido deve ser um número' })
  @Min(0.01, { message: 'Valor recebido deve ser maior que zero' })
  valorRecebido: number;

  @IsNotEmpty({ message: 'Método de pagamento é obrigatório' })
  @IsEnum(MetodoPagamento, { message: 'Método de pagamento deve ser válido' })
  metodoPagamento: MetodoPagamento;

  @IsNotEmpty({ message: 'Conta destino é obrigatória' })
  @IsEnum(ContaDestino, { message: 'Conta destino deve ser válida' })
  contaDestino: ContaDestino;

  @IsOptional()
  @IsString({ message: 'Observações deve ser uma string' })
  observacoesPagamento?: string;

  @IsOptional()
  @IsBoolean({ message: 'Cheque compensado deve ser um boolean' })
  chequeCompensado?: boolean;

  @IsOptional()
  @IsString({ message: 'Referência externa deve ser uma string' })
  referenciaExterna?: string;
}
