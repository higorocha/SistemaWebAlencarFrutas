import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  HttpCode,
  HttpStatus,
  Logger,
  Req,
  UseGuards,
} from '@nestjs/common';
import { BbWebhooksService } from './bb-webhooks.service';
import { PagamentosWebhookService } from './handlers/pagamentos-webhook.service';
import { BbWebhookMtlsGuard } from './guards/bb-webhook-mtls.guard';

@UseGuards(BbWebhookMtlsGuard)
@Controller('api/webhooks/bb')
export class BbWebhooksController {
  private readonly logger = new Logger(BbWebhooksController.name);

  constructor(
    private readonly bbWebhooksService: BbWebhooksService,
    private readonly pagamentosWebhookService: PagamentosWebhookService,
  ) {}

  @Post(':recurso')
  @HttpCode(HttpStatus.OK)
  async receberWebhook(
    @Param('recurso') recurso: string,
    @Body() payload: any,
    @Headers() headers: Record<string, string>,
    @Req() req: any,
  ) {
    this.logger.log(`[WEBHOOK] Recebido webhook para recurso: ${recurso}`);
    this.logger.debug(`[WEBHOOK] Payload: ${JSON.stringify(payload)}`);

    // Validar IP de origem (monitoramento - não bloqueia em desenvolvimento)
    const clientIP = this.extrairIP(req);
    this.logger.log(`[WEBHOOK] IP de origem: ${clientIP}`);

    // Registrar evento no banco
    const clientCertificate = req.bbWebhookClientCert;

    const evento = await this.bbWebhooksService.registrarEvento(
      recurso,
      payload,
      headers,
      clientCertificate,
    );

    // Responder imediatamente ao BB (200 OK)
    // O processamento será feito de forma assíncrona
    this.bbWebhooksService.processarEventoAssincrono(evento.id, recurso);

    return {
      message: 'Webhook recebido com sucesso',
      timestamp: new Date().toISOString(),
    };
  }

  private extrairIP(req: any): string {
    const forwardedFor = req.headers['x-forwarded-for'];
    const realIP = req.headers['x-real-ip'];
    const remoteAddress = req.connection?.remoteAddress || req.socket?.remoteAddress;

    if (forwardedFor) {
      return forwardedFor.split(',')[0].trim();
    }
    if (realIP) {
      return realIP;
    }
    if (remoteAddress) {
      return remoteAddress.replace(/^::ffff:/, '');
    }
    return 'unknown';
  }
}

