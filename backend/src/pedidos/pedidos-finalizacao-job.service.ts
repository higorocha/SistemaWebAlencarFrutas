import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { HistoricoService } from '../historico/historico.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { TipoAcaoHistorico } from '../historico/types/historico.types';
import { TipoNotificacao, PrioridadeNotificacao } from '../notificacoes/dto';
import { StatusPedido } from '@prisma/client';

/**
 * Serviço de Job Automático para Finalização de Pedidos
 * 
 * Este serviço executa diariamente na madrugada para finalizar automaticamente
 * pedidos que estão com valorFinal zerado (devido a descontos aplicados).
 * 
 * Lógica:
 * - Busca pedidos em PRECIFICACAO_REALIZADA ou AGUARDANDO_PAGAMENTO
 * - Verifica se valorFinal == 0 (ou <= 0.01 para tolerância de arredondamento)
 * - Se sim, finaliza automaticamente o pedido e registra no histórico
 */
@Injectable()
export class PedidosFinalizacaoJobService {
  private readonly logger = new Logger(PedidosFinalizacaoJobService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly historicoService: HistoricoService,
    private readonly notificacoesService: NotificacoesService,
  ) {}

  /**
   * Cron job que executa todos os dias às 3:00 da manhã (horário de Brasília)
   * Finaliza automaticamente pedidos com valorFinal zerado
   */
  @Cron('0 3 * * *', {
    name: 'finalizar-pedidos-zerados',
    timeZone: 'America/Sao_Paulo',
  })
  async finalizarPedidosZerados() {
    this.logger.log('🔄 Iniciando job de finalização automática de pedidos zerados...');
    
    try {
      const resultado = await this.processarPedidosZerados();
      
      this.logger.log(
        `✅ Job concluído: ${resultado.finalizados} pedido(s) finalizado(s), ` +
        `${resultado.processados} pedido(s) processado(s), ` +
        `${resultado.erros} erro(s) encontrado(s)`
      );
      
      return resultado;
    } catch (error) {
      this.logger.error('❌ Erro durante execução do job de finalização de pedidos:', error);
      throw error;
    }
  }

  /**
   * Processa pedidos zerados e os finaliza automaticamente
   */
  private async processarPedidosZerados(): Promise<{
    processados: number;
    finalizados: number;
    erros: number;
  }> {
    // Buscar o primeiro usuário ADMINISTRADOR para registrar no histórico
    // Nota: O campo usuarioId é obrigatório no schema do histórico,
    // então usamos um usuário ADMINISTRADOR para representar ações do sistema
    const usuarioSistema = await this.obterUsuarioSistema();
    
    if (!usuarioSistema) {
      this.logger.error('❌ Não foi possível encontrar um usuário ADMINISTRADOR para registrar no histórico');
      throw new Error('Usuário sistema não encontrado');
    }

    // Buscar pedidos que estão em fase de precificação ou aguardando pagamento
    // e que têm valorFinal zerado (ou próximo de zero por arredondamento)
    const pedidosParaFinalizar = await this.prisma.pedido.findMany({
      where: {
        status: {
          in: [StatusPedido.PRECIFICACAO_REALIZADA, StatusPedido.AGUARDANDO_PAGAMENTO],
        },
        valorFinal: {
          lte: 0.01, // Tolerância para valores muito pequenos (arredondamento)
        },
      },
      select: {
        id: true,
        numeroPedido: true,
        status: true,
        valorFinal: true,
        cliente: {
          select: {
            nome: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    this.logger.log(`📊 Encontrados ${pedidosParaFinalizar.length} pedido(s) para processar`);

    let processados = 0;
    let finalizados = 0;
    let erros = 0;

    for (const pedido of pedidosParaFinalizar) {
      try {
        processados++;

        // Verificar novamente se o valorFinal está zerado (double check)
        if (pedido.valorFinal !== null && pedido.valorFinal > 0.01) {
          this.logger.warn(
            `⚠️ Pedido ${pedido.numeroPedido} (ID: ${pedido.id}) ` +
            `tem valorFinal = ${pedido.valorFinal}, ignorando...`
          );
          continue;
        }

        // Verificar se já está finalizado (pode ter sido finalizado manualmente entre a query e agora)
        if (pedido.status === StatusPedido.PEDIDO_FINALIZADO) {
          this.logger.log(
            `ℹ️ Pedido ${pedido.numeroPedido} (ID: ${pedido.id}) já está finalizado, ignorando...`
          );
          continue;
        }

        // Finalizar o pedido e criar notificação
        await this.finalizarPedido(
          pedido.id,
          pedido.numeroPedido,
          pedido.status,
          pedido.cliente.nome,
          usuarioSistema.id
        );

        finalizados++;

        this.logger.log(
          `✅ Pedido ${pedido.numeroPedido} (ID: ${pedido.id}) ` +
          `finalizado automaticamente - Cliente: ${pedido.cliente.nome}`
        );
      } catch (error) {
        erros++;
        this.logger.error(
          `❌ Erro ao processar pedido ${pedido.numeroPedido} (ID: ${pedido.id}):`,
          error
        );
      }
    }

    return {
      processados,
      finalizados,
      erros,
    };
  }

  /**
   * Finaliza um pedido específico, registra no histórico e cria notificação informativa
   */
  private async finalizarPedido(
    pedidoId: number,
    numeroPedido: string,
    statusAnterior: StatusPedido,
    clienteNome: string,
    usuarioSistemaId: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (prisma) => {
      // Atualizar status do pedido
      await prisma.pedido.update({
        where: { id: pedidoId },
        data: {
          status: StatusPedido.PEDIDO_FINALIZADO,
          updatedAt: new Date(),
        },
      });

      // Registrar no histórico (usando usuário sistema para representar ação automática)
      await this.historicoService.registrarAcao(
        pedidoId,
        usuarioSistemaId,
        TipoAcaoHistorico.FINALIZAR_PEDIDO,
        {
          statusAnterior,
          statusNovo: StatusPedido.PEDIDO_FINALIZADO,
          mensagem: 'Pedido finalizado automaticamente pelo sistema - valorFinal zerado',
          observacoes: 'Finalização automática realizada pelo job de finalização de pedidos zerados',
        },
      );
    });

    // Criar notificação informativa (tipo SISTEMA, prioridade BAIXA, sem ação de click)
    // Notificação global (sem usuarioId) para que todos os usuários vejam
    try {
      await this.notificacoesService.create({
        titulo: 'Pedido Finalizado Automaticamente',
        conteudo: `O pedido ${numeroPedido} do cliente ${clienteNome} foi finalizado automaticamente pelo sistema, pois o valor final estava zerado (devido a desconto aplicado).`,
        tipo: TipoNotificacao.SISTEMA,
        prioridade: PrioridadeNotificacao.BAIXA,
        // Não passar usuarioId para criar notificação global (todos os usuários veem)
        dadosAdicionais: {
          tipoNegocio: 'pedido_finalizado_automatico',
          pedidoId,
          numeroPedido,
          clienteNome,
          motivo: 'valorFinal_zerado',
          menu: {
            titulo: 'Pedido Finalizado',
            resumo: `Pedido ${numeroPedido} - ${clienteNome} finalizado automaticamente`,
            icone: 'info',
          },
        },
      });
    } catch (error) {
      // Log do erro, mas não falha a finalização do pedido se a notificação falhar
      this.logger.error(
        `⚠️ Erro ao criar notificação para pedido ${numeroPedido} (ID: ${pedidoId}):`,
        error
      );
    }
  }

  /**
   * Obtém o primeiro usuário ADMINISTRADOR para usar como "usuário sistema"
   * nos registros de histórico de ações automáticas.
   * 
   * NOTA: O campo usuarioId é obrigatório no schema do histórico (Prisma),
   * então usamos um usuário ADMINISTRADOR para representar ações automáticas do sistema.
   * As notificações são criadas como globais (usuarioId: null) para todos os usuários.
   */
  private async obterUsuarioSistema(): Promise<{ id: number; nome: string } | null> {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        nivel: 'ADMINISTRADOR',
      },
      select: {
        id: true,
        nome: true,
      },
      orderBy: {
        id: 'asc', // Sempre pegar o primeiro admin criado
      },
    });

    return usuario;
  }

  /**
   * Método para execução manual (pode ser chamado via API para testes)
   */
  async executarManualmente(): Promise<{
    processados: number;
    finalizados: number;
    erros: number;
  }> {
    this.logger.log('🔧 Executando job de finalização de pedidos manualmente...');
    return await this.processarPedidosZerados();
  }

  /**
   * Método para obter status do job
   */
  getJobStatus(): {
    ativo: boolean;
    proximaExecucao: string;
    timeZone: string;
  } {
    return {
      ativo: true,
      proximaExecucao: 'Todos os dias às 03:00 (horário de Brasília)',
      timeZone: 'America/Sao_Paulo',
    };
  }
}
