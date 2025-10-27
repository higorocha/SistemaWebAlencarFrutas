import { Module } from '@nestjs/common';
import { PedidosMobileController } from './controllers/pedidos-mobile.controller';
import { PedidosModule } from '../pedidos/pedidos.module';
import { CulturaGuard } from './guards/cultura.guard';

/**
 * Módulo Mobile - API específica para o aplicativo mobile
 *
 * Arquitetura:
 * - Reutiliza services existentes (PedidosService)
 * - Controllers específicos com DTOs adaptados
 * - Guards customizados para validação de cultura
 * - Rotas independentes em /api/mobile/*
 *
 * Vantagens:
 * - Zero duplicação de lógica de negócio
 * - Rotas isoladas (não afeta sistema web)
 * - DTOs otimizados para mobile
 * - Fácil manutenção
 */
@Module({
  imports: [
    PedidosModule, // Importa para reutilizar PedidosService
  ],
  controllers: [
    PedidosMobileController,
  ],
  providers: [
    CulturaGuard,
  ],
})
export class MobileModule {}
