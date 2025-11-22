import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FolhaPagamentoService } from './folha-pagamento.service';
import { FolhaPagamentoController } from './folha-pagamento.controller';
import { FolhaCalculoService } from './folha-calculo.service';
import { FuncionarioPagamentoStatusService } from './funcionario-pagamento-status.service';

@Module({
  imports: [PrismaModule],
  controllers: [FolhaPagamentoController],
  providers: [FolhaPagamentoService, FolhaCalculoService, FuncionarioPagamentoStatusService],
  exports: [FolhaPagamentoService],
})
export class FolhaPagamentoModule {}

