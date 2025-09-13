import { Module } from '@nestjs/common';
import { HistoricoFitasService } from './historico-fitas.service';
import { HistoricoFitasController } from './historico-fitas.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HistoricoFitasController],
  providers: [HistoricoFitasService],
  exports: [HistoricoFitasService],
})
export class HistoricoFitasModule {}