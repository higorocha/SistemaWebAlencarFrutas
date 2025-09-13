import { Module } from '@nestjs/common';
import { FitasBananaService } from './fitas-banana.service';
import { FitasBananaController } from './fitas-banana.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FitasBananaController],
  providers: [FitasBananaService],
  exports: [FitasBananaService],
})
export class FitasBananaModule {}