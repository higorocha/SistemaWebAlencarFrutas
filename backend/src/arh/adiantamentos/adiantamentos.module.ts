import { Module } from '@nestjs/common';
import { AdiantamentosController } from './adiantamentos.controller';
import { AdiantamentosService } from './adiantamentos.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdiantamentosController],
  providers: [AdiantamentosService],
  exports: [AdiantamentosService],
})
export class AdiantamentosModule {}
