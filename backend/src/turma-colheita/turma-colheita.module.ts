import { Module } from '@nestjs/common';
import { TurmaColheitaService } from './turma-colheita.service';
import { TurmaColheitaController } from './turma-colheita.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [TurmaColheitaController],
  providers: [TurmaColheitaService, PrismaService],
  exports: [TurmaColheitaService],
})
export class TurmaColheitaModule {}