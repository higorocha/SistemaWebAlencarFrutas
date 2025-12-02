import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BbWebhooksController } from './bb-webhooks.controller';
import { BbWebhooksService } from './bb-webhooks.service';
import { PagamentosWebhookService } from './handlers/pagamentos-webhook.service';
import { BbWebhookMtlsGuard } from './guards/bb-webhook-mtls.guard';
import { PagamentosModule } from '../pagamentos/pagamentos.module';

@Module({
  imports: [PrismaModule, PagamentosModule],
  controllers: [BbWebhooksController],
  providers: [BbWebhooksService, PagamentosWebhookService, BbWebhookMtlsGuard],
  exports: [BbWebhooksService],
})
export class BbWebhooksModule {}

