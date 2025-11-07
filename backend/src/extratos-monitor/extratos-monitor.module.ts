import { Module } from '@nestjs/common';
import { ExtratosMonitorService } from './extratos-monitor.service';
import { ExtratosMonitorController } from './extratos-monitor.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ExtratosModule } from '../extratos/extratos.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { ContaCorrenteModule } from '../conta-corrente/conta-corrente.module';

@Module({
  imports: [
    PrismaModule,
    ExtratosModule,
    NotificacoesModule,
    ContaCorrenteModule,
  ],
  controllers: [ExtratosMonitorController],
  providers: [ExtratosMonitorService],
  exports: [ExtratosMonitorService],
})
export class ExtratosMonitorModule {}

