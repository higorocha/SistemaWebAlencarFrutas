import { Module } from '@nestjs/common';
import { CobrancaController } from './cobranca.controller';
import { WebhookController } from './webhook.controller';
import { CobrancaService } from './services/cobranca.service';
import { CobrancaAuthService } from './services/cobranca-auth.service';
import { BoletoLogService } from './services/boleto-log.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificacoesModule } from '../notificacoes/notificacoes.module';

/**
 * Módulo de Cobrança - Integração com API de Cobrança do Banco do Brasil
 * 
 * Funcionalidades:
 * - Criação de boletos
 * - Consulta de boletos
 * - Listagem de boletos
 * - Alteração de boletos
 * - Baixa/Cancelamento de boletos
 * - Consulta de baixas operacionais
 * - Consulta de retorno de movimento
 * - Recepção de webhooks de pagamento
 * - Notificações de pagamento de boletos
 */
@Module({
  imports: [PrismaModule, NotificacoesModule],
  controllers: [CobrancaController, WebhookController],
  providers: [CobrancaService, CobrancaAuthService, BoletoLogService],
  exports: [CobrancaService, CobrancaAuthService, BoletoLogService]
})
export class CobrancaModule {}
