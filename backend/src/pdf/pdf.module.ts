import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { PedidosModule } from '../pedidos/pedidos.module';
import { ConfigModule } from '../config/config.module';
import { ClientesModule } from '../clientes/clientes.module';

@Module({
  imports: [PedidosModule, ConfigModule, ClientesModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService], // Exporta para uso em outros módulos (ex: módulo de email)
})
export class PdfModule {}

