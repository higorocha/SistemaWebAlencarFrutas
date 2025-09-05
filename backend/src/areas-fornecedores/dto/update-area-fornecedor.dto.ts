import { PartialType } from '@nestjs/mapped-types';
import { CreateAreaFornecedorDto } from './create-area-fornecedor.dto';

export class UpdateAreaFornecedorDto extends PartialType(CreateAreaFornecedorDto) {}

