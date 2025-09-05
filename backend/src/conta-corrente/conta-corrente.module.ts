import { Module } from '@nestjs/common';
import { ContaCorrenteService } from './conta-corrente.service';
import { ContaCorrenteController } from './conta-corrente.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ContaCorrenteController],
  providers: [ContaCorrenteService],
  exports: [ContaCorrenteService],
})
export class ContaCorrenteModule {} 