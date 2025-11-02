import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { HistoricoService } from './historico.service';

@Module({
  imports: [PrismaModule],
  providers: [HistoricoService],
  exports: [HistoricoService],
})
export class HistoricoModule {}
