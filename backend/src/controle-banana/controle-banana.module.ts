import { Module } from '@nestjs/common';
import { ControleBananaService } from './controle-banana.service';
import { ControleBananaController } from './controle-banana.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { HistoricoFitasModule } from '../historico-fitas/historico-fitas.module';

@Module({
  imports: [PrismaModule, HistoricoFitasModule],
  controllers: [ControleBananaController],
  providers: [ControleBananaService],
  exports: [ControleBananaService],
})
export class ControleBananaModule {}