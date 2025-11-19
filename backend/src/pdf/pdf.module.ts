import { Module } from '@nestjs/common';
import { PdfService } from './pdf.service';
import { PdfController } from './pdf.controller';
import { PedidosModule } from '../pedidos/pedidos.module';

@Module({
  imports: [PedidosModule],
  controllers: [PdfController],
  providers: [PdfService],
  exports: [PdfService], // Exporta para uso em outros módulos (ex: módulo de email)
})
export class PdfModule {}

