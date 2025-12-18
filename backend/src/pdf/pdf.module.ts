import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { PedidosModule } from '../pedidos/pedidos.module';
import { ConfigModule } from '../config/config.module';
import { ClientesModule } from '../clientes/clientes.module';
import { ArhModule } from '../arh/arh.module';
import { ContaCorrenteModule } from '../conta-corrente/conta-corrente.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PedidosModule, ConfigModule, ClientesModule, ArhModule, ContaCorrenteModule, PrismaModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService], // Exporta para uso em outros módulos (ex: módulo de email)
})
export class PdfModule {}

