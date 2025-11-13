import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CreateFornecedorPagamentoDto } from './create-fornecedor-pagamento.dto';

export class CreateManyFornecedorPagamentoDto {
  @ApiProperty({
    description: 'Array de pagamentos a serem criados',
    type: [CreateFornecedorPagamentoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateFornecedorPagamentoDto)
  pagamentos: CreateFornecedorPagamentoDto[];
}

