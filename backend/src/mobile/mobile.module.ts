import { Module, forwardRef } from '@nestjs/common';
import { PedidosMobileController } from './controllers/pedidos-mobile.controller';
import { FitasMobileController } from './controllers/fitas-mobile.controller';
import { PushTokensMobileController } from './controllers/push-tokens-mobile.controller';
import { ClientesMobileController } from './controllers/clientes-mobile.controller';
import { PedidosModule } from '../pedidos/pedidos.module';
import { TurmaColheitaModule } from '../turma-colheita/turma-colheita.module';
import { FitasBananaModule } from '../fitas-banana/fitas-banana.module';
import { ControleBananaModule } from '../controle-banana/controle-banana.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CulturaGuard } from './guards/cultura.guard';
import { PushTokensService } from './services/push-tokens.service';
import { ClientesModule } from '../clientes/clientes.module';

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
    PrismaModule,
    forwardRef(() => PedidosModule), // Importa para reutilizar PedidosService
    TurmaColheitaModule, // Importa para reutilizar TurmaColheitaService
    FitasBananaModule, // Reutiliza FitasBananaService
    ControleBananaModule, // Reutiliza ControleBananaService
    ClientesModule, // Reutiliza ClientesService
  ],
  controllers: [
    PedidosMobileController,
    FitasMobileController,
    PushTokensMobileController,
    ClientesMobileController,
  ],
  providers: [
    CulturaGuard,
    PushTokensService,
  ],
  exports: [
    PushTokensService, // Exportar para uso em outros módulos
  ],
})
export class MobileModule {}
