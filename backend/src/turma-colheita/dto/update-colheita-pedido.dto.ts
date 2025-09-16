import { PartialType } from '@nestjs/swagger';
import { CreateTurmaColheitaPedidoCustoDto } from './create-colheita-pedido.dto';

export class UpdateTurmaColheitaPedidoCustoDto extends PartialType(CreateTurmaColheitaPedidoCustoDto) {}