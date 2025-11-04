import { Module, forwardRef } from '@nestjs/common';
import { PedidosService } from './pedidos.service';
import { PedidosController } from './pedidos.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ControleBananaModule } from '../controle-banana/controle-banana.module';
import { TurmaColheitaModule } from '../turma-colheita/turma-colheita.module';
import { HistoricoModule } from '../historico/historico.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

@Module({
  imports: [PrismaModule, ControleBananaModule, TurmaColheitaModule, HistoricoModule, forwardRef(() => NotificacoesModule)],
  controllers: [PedidosController],
  providers: [PedidosService],
  exports: [PedidosService],
})
export class PedidosModule {}
