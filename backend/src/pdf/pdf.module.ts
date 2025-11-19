import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { PedidosModule } from '../pedidos/pedidos.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [PedidosModule, ConfigModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService], // Exporta para uso em outros módulos (ex: módulo de email)
})
export class PdfModule {}

