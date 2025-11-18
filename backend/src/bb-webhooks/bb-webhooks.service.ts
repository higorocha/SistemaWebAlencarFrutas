import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PagamentosWebhookService } from './handlers/pagamentos-webhook.service';

@Injectable()
export class BbWebhooksService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly pagamentosWebhookService: PagamentosWebhookService,
  ) {}

  /**
   * Registra um evento de webhook no banco de dados
   */
  async registrarEvento(
    tipoRecurso: string,
    payload: any,
    headers: Record<string, string>,
    clientCertificate?: Record<string, any>,
  ) {
    const payloadArray = Array.isArray(payload) ? payload : [payload];
    const quantidadeItens = payloadArray.length;

    const auditHeaders = {
      ...headers,
    };

    if (clientCertificate) {
      auditHeaders['bb-client-cert'] = clientCertificate as any;
    }

    const evento = await this.prisma.bbWebhookEvent.create({
      data: {
        tipoRecurso,
        payload: payload as any,
        headers: auditHeaders as any,
        quantidadeItens,
        statusProcessamento: 'PENDENTE',
      },
    });

    console.log(
      `[WEBHOOK] Evento ${evento.id} registrado: ${tipoRecurso} com ${quantidadeItens} item(ns)`,
    );

    return evento;
  }

  /**
   * Processa um evento de forma assíncrona
   */
  async processarEventoAssincrono(eventoId: number, tipoRecurso: string) {
    // Processar de forma assíncrona para não bloquear a resposta ao BB
    setImmediate(async () => {
      try {
        await this.processarEvento(eventoId, tipoRecurso);
      } catch (error) {
        console.error(
          `[WEBHOOK] Erro ao processar evento ${eventoId}: ${error.message}`,
          error.stack,
        );
      }
    });
  }

  /**
   * Processa um evento de webhook
   */
  private async processarEvento(eventoId: number, tipoRecurso: string) {
    console.log(`[WEBHOOK] Iniciando processamento do evento ${eventoId}`);

    const evento = await this.prisma.bbWebhookEvent.findUnique({
      where: { id: eventoId },
    });

    if (!evento) {
      console.error(`[WEBHOOK] Evento ${eventoId} não encontrado`);
      return;
    }

    const payload = evento.payload as any;
    const payloadArray = Array.isArray(payload) ? payload : [payload];

    let quantidadeProcessados = 0;
    let quantidadeDescartados = 0;
    const erros: any[] = [];

    try {
      // Disparar handler específico baseado no tipo de recurso
      switch (tipoRecurso) {
        case 'pagamentos':
          const resultado = await this.pagamentosWebhookService.processarEvento(
            evento,
            payloadArray,
          );
          quantidadeProcessados = resultado.processados;
          quantidadeDescartados = resultado.descartados;
          if (resultado.erros && resultado.erros.length > 0) {
            erros.push(...resultado.erros);
          }
          break;

        default:
          console.warn(
            `[WEBHOOK] Handler não encontrado para recurso: ${tipoRecurso}`,
          );
          await this.prisma.bbWebhookEvent.update({
            where: { id: eventoId },
            data: {
              statusProcessamento: 'DESCARTADO',
              motivoDescarta: `Handler não encontrado para recurso: ${tipoRecurso}`,
              processedAt: new Date(),
            },
          });
          return;
      }

      // Determinar status final
      let statusProcessamento = 'PROCESSADO';
      if (quantidadeDescartados > 0 && quantidadeProcessados === 0) {
        statusProcessamento = 'DESCARTADO';
      } else if (quantidadeDescartados > 0 && quantidadeProcessados > 0) {
        statusProcessamento = 'PARCIALMENTE_PROCESSADO';
      } else if (erros.length > 0) {
        statusProcessamento = 'ERRO';
      }

      // Atualizar evento com resultado
      await this.prisma.bbWebhookEvent.update({
        where: { id: eventoId },
        data: {
          statusProcessamento,
          quantidadeProcessados,
          quantidadeDescartados,
          erros: erros.length > 0 ? (erros as any) : null,
          processedAt: new Date(),
        },
      });

      console.log(
        `[WEBHOOK] Evento ${eventoId} processado: ${statusProcessamento} (${quantidadeProcessados} processados, ${quantidadeDescartados} descartados)`,
      );
    } catch (error) {
      console.error(
        `[WEBHOOK] Erro ao processar evento ${eventoId}: ${error.message}`,
        error.stack,
      );

      await this.prisma.bbWebhookEvent.update({
        where: { id: eventoId },
        data: {
          statusProcessamento: 'ERRO',
          erros: [
            {
              tipo: 'ERRO_GERAL',
              mensagem: error.message,
              stack: error.stack,
            },
          ] as any,
          processedAt: new Date(),
        },
      });
    }
  }
}

