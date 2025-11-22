import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CargosService } from './cargos.service';
import { CargosController } from './cargos.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CargosController],
  providers: [CargosService],
  exports: [CargosService],
})
export class CargosModule {}

