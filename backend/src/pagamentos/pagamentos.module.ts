import { Module, forwardRef } from '@nestjs/common';
import { PagamentosController } from './pagamentos.controller';
import { PagamentosService } from './pagamentos.service';
import { CredenciaisAPIModule } from '../credenciais-api/credenciais-api.module';
import { ContaCorrenteModule } from '../conta-corrente/conta-corrente.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';
import { FolhaPagamentoModule } from '../arh/folha-pagamento/folha-pagamento.module';
import { PagamentosSyncQueueService } from './pagamentos-sync-queue.service';
import { PagamentosSyncWorkerService } from './pagamentos-sync-worker.service';

/**
 * Módulo de pagamentos para integração com a API do Banco do Brasil
 * 
 * Este módulo fornece funcionalidades para:
 * - Solicitar transferências PIX
 * - Solicitar pagamento de boletos
 * - Solicitar pagamento de guias com código de barras
 * - Consultar status de solicitações
 * - Autenticação OAuth2 com cache de token
 * - Integração com credenciais e conta corrente armazenadas no banco de dados
 * 
 * Dependências:
 * - CredenciaisAPIModule: Para buscar credenciais de pagamentos do banco de dados
 * - ContaCorrenteModule: Para buscar dados da conta corrente
 */
@Module({
  imports: [
    CredenciaisAPIModule, // Importa o módulo de credenciais para buscar dados de pagamentos
    ContaCorrenteModule,  // Importa o módulo de conta corrente para buscar dados da conta
    forwardRef(() => NotificacoesModule), // Importa notificações (liberação de lote)
    forwardRef(() => FolhaPagamentoModule), // Importa folha de pagamento para recalcular totais
  ],
  controllers: [
    PagamentosController, // Controller com endpoints de pagamentos
  ],
  providers: [
    PagamentosService,    // Service com lógica de negócio e integração BB API
    PagamentosSyncQueueService,
    PagamentosSyncWorkerService,
  ],
  exports: [
    PagamentosService,    // Exporta o service para uso em outros módulos se necessário
    PagamentosSyncQueueService,
  ],
})
export class PagamentosModule {}

