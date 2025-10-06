import { Module } from '@nestjs/common';
import { TurmaColheitaService } from './turma-colheita.service';
import { TurmaColheitaController } from './turma-colheita.controller';

@Module({
  controllers: [TurmaColheitaController],
  providers: [TurmaColheitaService],
  exports: [TurmaColheitaService],
})
export class TurmaColheitaModule {}