import { Module } from '@nestjs/common';
import { PedidosMobileController } from './controllers/pedidos-mobile.controller';
import { FitasMobileController } from './controllers/fitas-mobile.controller';
import { PedidosModule } from '../pedidos/pedidos.module';
import { TurmaColheitaModule } from '../turma-colheita/turma-colheita.module';
import { FitasBananaModule } from '../fitas-banana/fitas-banana.module';
import { ControleBananaModule } from '../controle-banana/controle-banana.module';
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
    TurmaColheitaModule, // Importa para reutilizar TurmaColheitaService
    FitasBananaModule, // Reutiliza FitasBananaService
    ControleBananaModule, // Reutiliza ControleBananaService
  ],
  controllers: [
    PedidosMobileController,
    FitasMobileController,
  ],
  providers: [
    CulturaGuard,
  ],
})
export class MobileModule {}
