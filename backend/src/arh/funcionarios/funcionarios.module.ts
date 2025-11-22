import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { FuncionariosService } from './funcionarios.service';
import { FuncionariosController } from './funcionarios.controller';

@Module({
  imports: [PrismaModule],
  controllers: [FuncionariosController],
  providers: [FuncionariosService],
  exports: [FuncionariosService],
})
export class FuncionariosModule {}

