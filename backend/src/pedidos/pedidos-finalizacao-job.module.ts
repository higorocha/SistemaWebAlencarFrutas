import { Module } from '@nestjs/common';
import { PedidosFinalizacaoJobService } from './pedidos-finalizacao-job.service';
import { PedidosFinalizacaoJobController } from './pedidos-finalizacao-job.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HistoricoModule } from '../historico/historico.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [PrismaModule, HistoricoModule, NotificacoesModule],
  controllers: [PedidosFinalizacaoJobController],
  providers: [PedidosFinalizacaoJobService],
  exports: [PedidosFinalizacaoJobService],
})
export class PedidosFinalizacaoJobModule {}
