import { Module } from '@nestjs/common';
import { FornecedoresService } from './fornecedores.service';
import { FornecedorPagamentosService } from './fornecedor-pagamentos.service';
import { FornecedoresController } from './fornecedores.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FornecedoresController],
  providers: [
    FornecedoresService,
    FornecedorPagamentosService,
  ],
  exports: [
    FornecedoresService,
    FornecedorPagamentosService,
  ],
})
export class FornecedoresModule {}

