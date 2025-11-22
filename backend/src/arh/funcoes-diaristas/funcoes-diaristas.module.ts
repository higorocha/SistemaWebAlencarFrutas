import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FuncoesDiaristasService } from './funcoes-diaristas.service';
import { FuncoesDiaristasController } from './funcoes-diaristas.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FuncoesDiaristasController],
  providers: [FuncoesDiaristasService],
  exports: [FuncoesDiaristasService],
})
export class FuncoesDiaristasModule {}

