import { Module } from '@nestjs/common';
import { AreasFornecedoresService } from './areas-fornecedores.service';
import { AreasFornecedoresController } from './areas-fornecedores.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AreasFornecedoresController],
  providers: [AreasFornecedoresService],
  exports: [AreasFornecedoresService],
})
export class AreasFornecedoresModule {}
