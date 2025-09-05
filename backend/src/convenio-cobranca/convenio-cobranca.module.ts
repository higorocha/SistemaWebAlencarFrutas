import { Module } from '@nestjs/common';
import { ConvenioCobrancaService } from './convenio-cobranca.service';
import { ConvenioCobrancaController } from './convenio-cobranca.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ConvenioCobrancaController],
  providers: [ConvenioCobrancaService],
  exports: [ConvenioCobrancaService],
})
export class ConvenioCobrancaModule {} 