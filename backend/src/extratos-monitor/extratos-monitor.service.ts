import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { LancamentoExtratoService } from '../extratos/lancamento-extrato.service';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { TipoNotificacao, PrioridadeNotificacao } from '../notificacoes/dto';

/**
 * Serviço de Monitoramento Automático de Extratos
 * 
 * Este serviço executa verificações automáticas de extratos bancários
 * para contas configuradas para monitoramento, criando notificações
 * para pagamentos novos identificados.
 */
@Injectable()
export class ExtratosMonitorService {
  private readonly logger = new Logger(ExtratosMonitorService.name);
  private readonly HORA_INICIO = 7; // 7h da manhã
  private readonly HORA_FIM = 22; // 22h (10h da noite)
  private lancamentosNotificados = new Set<number>(); // Rastrear lançamentos já notificados hoje
  private execucoesAgendadas = new Map<number, NodeJS.Timeout[]>(); // Rastrear timeouts agendados por conta
  private estaExecutando = false; // Flag para garantir execução sequencial
  private filaExecucao: Array<{ contaId: number; timestamp: number }> = []; // Fila de execuções pendentes
  private processandoFila = false; // Flag para indicar se a fila está sendo processada
  private ultimasExecucoes = new Map<number, number>(); // Rastrear última execução de cada conta (timestamp)

  constructor(
    private readonly prisma: PrismaService,
    private readonly lancamentoExtratoService: LancamentoExtratoService,
    private readonly notificacoesService: NotificacoesService,
  ) {
    // Limpar rastreamento de lançamentos notificados ao iniciar
    this.lancamentosNotificados.clear();
  }

  /**
   * Cron job que executa todos os dias às 7:00 da manhã
   * Inicia o processo de monitoramento para todas as contas configuradas
   * Intervalo configurável por conta (padrão: 1 hora) até às 22h
   */
  @Cron('0 7 * * *', {
    name: 'extratos-monitor-inicio',
    timeZone: 'America/Sao_Paulo',
  })
  async iniciarMonitoramentoDiario() {
    this.logger.log('[JOB EXTRATOS] Iniciando monitoramento automático de extratos (7h-22h)');
    
    try {
      // Limpar rastreamento do dia anterior
      this.lancamentosNotificados.clear();
      // Parar processamento da fila anterior se estiver rodando
      this.processandoFila = false;
      // Limpar rastreamento de últimas execuções
      this.ultimasExecucoes.clear();
      
      // Buscar todas as contas com monitoramento ativo
      const contasMonitoradas = await this.buscarContasMonitoradas();
      
      if (contasMonitoradas.length === 0) {
        this.logger.log('[JOB EXTRATOS] Nenhuma conta configurada para monitoramento');
        return;
      }

      this.logger.log(`[JOB EXTRATOS] ${contasMonitoradas.length} conta(s) encontrada(s). Intervalo padrão: 1h`);
      
      // Inicializar rastreamento de últimas execuções
      const agora = Date.now();
      for (const conta of contasMonitoradas) {
        this.ultimasExecucoes.set(conta.id, agora);
      }
      
      // Executar primeira busca sequencialmente para cada conta
      for (const conta of contasMonitoradas) {
        await this.executarBuscaExtratos(conta.id);
      }
      
      // Iniciar processo de fila para execuções recorrentes
      this.iniciarProcessamentoFila(contasMonitoradas);
      
    } catch (error) {
      this.logger.error('[JOB EXTRATOS] Erro ao inicializar monitoramento:', error);
    }
  }

  /**
   * Busca todas as contas correntes com monitoramento ativo
   */
  private async buscarContasMonitoradas(): Promise<any[]> {
    // Buscar todas as contas com monitoramento ativo
    const contas = await this.prisma.contaCorrente.findMany({
      where: {
        monitorar: true,
      },
    });

    if (contas.length === 0) {
      return [];
    }

    // Para cada conta, verificar se tem credenciais de extrato válidas
    const contasComCredenciais: any[] = [];
    for (const conta of contas) {
      const credenciais = await this.prisma.credenciaisAPI.findFirst({
        where: {
          contaCorrenteId: conta.id,
          modalidadeApi: '003 - Extratos',
        },
      });
      
      if (credenciais) {
        contasComCredenciais.push(conta);
      }
    }

    return contasComCredenciais;
  }
  
  /**
   * Formata valor monetário em formato brasileiro
   */
  private formatarValorMonetario(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valor);
  }

  /**
   * Inicia o processamento da fila de execuções recorrentes
   * Respeita o intervalo de cada conta e garante execução sequencial
   */
  private iniciarProcessamentoFila(contas: any[]): void {
    if (this.processandoFila) {
      return; // Já está processando
    }
    
    this.processandoFila = true;
    this.processarFilaExecucoes(contas);
  }

  /**
   * Processa a fila de execuções verificando quais contas precisam executar
   * baseado em seus intervalos configurados
   */
  private async processarFilaExecucoes(contas: any[]): Promise<void> {
    while (this.processandoFila) {
      try {
        // Verificar se ainda está dentro do horário permitido
        const horaAtual = new Date().getHours();
        if (horaAtual >= this.HORA_FIM) {
          this.logger.log(`[JOB EXTRATOS] Horário limite atingido (22h). Encerrando para hoje`);
          this.processandoFila = false;
          break;
        }
        
        const agora = Date.now();
        const contasParaExecutar: Array<{ conta: any; proximaExecucao: number }> = [];
        
        // Verificar quais contas precisam executar
        for (const conta of contas) {
          // Buscar dados atualizados da conta (pode ter mudado o intervalo ou sido desativada)
          const contaAtualizada = await this.prisma.contaCorrente.findUnique({
            where: { id: conta.id },
          });
          
          // Verificar se conta foi desativada
          if (!contaAtualizada || !contaAtualizada.monitorar) {
            continue;
          }
          
          // Verificar se ainda tem credenciais de extrato válidas
          const credencialExtrato = await this.prisma.credenciaisAPI.findFirst({
            where: {
              contaCorrenteId: conta.id,
              modalidadeApi: '003 - Extratos',
            },
          });
          
          if (!credencialExtrato) {
            continue;
          }
          
          const ultimaExecucao = this.ultimasExecucoes.get(conta.id) || agora;
          const intervaloSegundos = contaAtualizada.intervalo || 3600; // Default: 1 hora
          const intervaloMs = intervaloSegundos * 1000;
          const proximaExecucao = ultimaExecucao + intervaloMs;
          
          // Se já passou o tempo do intervalo, adicionar à fila
          if (agora >= proximaExecucao) {
            contasParaExecutar.push({
              conta: contaAtualizada,
              proximaExecucao,
            });
          }
        }
        
        // Ordenar por próxima execução (mais antiga primeiro)
        contasParaExecutar.sort((a, b) => a.proximaExecucao - b.proximaExecucao);
        
        // Executar sequencialmente todas as contas que precisam executar
        for (const { conta } of contasParaExecutar) {
          await this.executarBuscaExtratos(conta.id);
          // Atualizar última execução
          this.ultimasExecucoes.set(conta.id, Date.now());
        }
        
        // Se não há contas para executar, calcular quanto tempo aguardar
        if (contasParaExecutar.length === 0) {
          // Encontrar a próxima execução mais próxima
          let proximaExecucaoGeral = Infinity;
          for (const conta of contas) {
            const contaAtualizada = await this.prisma.contaCorrente.findUnique({
              where: { id: conta.id },
            });
            
            if (!contaAtualizada || !contaAtualizada.monitorar) {
              continue;
            }
            
            // Verificar se ainda tem credenciais de extrato válidas
            const credencialExtrato = await this.prisma.credenciaisAPI.findFirst({
              where: {
                contaCorrenteId: conta.id,
                modalidadeApi: '003 - Extratos',
              },
            });
            
            if (!credencialExtrato) {
              continue;
            }
            
            const ultimaExecucao = this.ultimasExecucoes.get(conta.id) || agora;
            const intervaloSegundos = contaAtualizada.intervalo || 3600;
            const intervaloMs = intervaloSegundos * 1000;
            const proximaExecucao = ultimaExecucao + intervaloMs;
            
            if (proximaExecucao < proximaExecucaoGeral) {
              proximaExecucaoGeral = proximaExecucao;
            }
          }
          
          // Aguardar até a próxima execução ou 60 segundos (verificar novamente)
          const tempoAguardar = Math.min(proximaExecucaoGeral - agora, 60000);
          if (tempoAguardar > 0) {
            await new Promise(resolve => setTimeout(resolve, tempoAguardar));
          }
        } else {
          // Se executou alguma conta, aguardar um pouco antes de verificar novamente
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        this.logger.error('❌ Erro no processamento da fila:', error);
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }


  /**
   * Executa busca de extratos para uma conta específica
   * Executa sequencialmente para evitar conflito de tokens
   */
  private async executarBuscaExtratos(contaId: number): Promise<void> {
    // Aguardar se já estiver executando (garantir execução sequencial)
    while (this.estaExecutando) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
    }
    
    this.estaExecutando = true;
    
    try {
      // Verificar se ainda está dentro do horário permitido
      const horaAtual = new Date().getHours();
      if (horaAtual >= this.HORA_FIM) {
        return;
      }
      
      // Buscar conta para obter dados atualizados
      const conta = await this.prisma.contaCorrente.findUnique({
        where: { id: contaId },
      });
      
      if (!conta || !conta.monitorar) {
        return;
      }
      
      // Verificar se ainda tem credenciais de extrato válidas
      const credencialExtrato = await this.prisma.credenciaisAPI.findFirst({
        where: {
          contaCorrenteId: contaId,
          modalidadeApi: '003 - Extratos',
        },
      });
      
      if (!credencialExtrato) {
        return;
      }
      
      // Obter data do dia atual no formato DDMMYYYY
      const hoje = new Date();
      const dataFormatada = this.formatarDataHoje(hoje);
      
      // Executar busca usando o método existente
      const resultado = await this.lancamentoExtratoService.buscarEProcessarExtratosTodosClientes({
        contaCorrenteId: contaId,
        dataInicio: dataFormatada,
        dataFim: dataFormatada,
      });
      
      // Log resumido apenas se houver novos lançamentos
      if (resultado.totalSalvos > 0) {
        this.logger.log(
          `[JOB EXTRATOS] Conta ${contaId}: ${resultado.totalSalvos} novo(s), ${resultado.totalDuplicados} duplicado(s)`
        );
        await this.criarNotificacoesParaNovosLancamentos(contaId, resultado.totalSalvos);
      }
      
    } catch (error) {
      this.logger.error(`[JOB EXTRATOS] Erro na conta ${contaId}:`, error.message || error);
    } finally {
      this.estaExecutando = false;
    }
  }

  /**
   * Formata a data de hoje no formato DDMMYYYY
   */
  private formatarDataHoje(data: Date): string {
    const dia = data.getDate().toString().padStart(2, '0');
    const mes = (data.getMonth() + 1).toString().padStart(2, '0');
    const ano = data.getFullYear().toString();
    return `${dia}${mes}${ano}`;
  }

  /**
   * Cria notificações para lançamentos novos identificados
   */
  private async criarNotificacoesParaNovosLancamentos(
    contaId: number,
    totalSalvos: number
  ): Promise<void> {
    try {
      // Buscar lançamentos salvos hoje para esta conta que ainda não foram notificados
      const hoje = new Date();
      hoje.setHours(0, 0, 0, 0);
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      
      const lancamentosNovos = await this.prisma.lancamentoExtrato.findMany({
        where: {
          contaCorrenteId: contaId,
          dataLancamento: {
            gte: hoje,
            lt: amanha,
          },
          id: {
            notIn: Array.from(this.lancamentosNotificados).length > 0 
              ? Array.from(this.lancamentosNotificados).map(id => Number(id))
              : [-1], // Se não há notificados, usar array com valor inválido
          },
          tipoOperacao: 'CREDITO', // Apenas créditos (pagamentos recebidos)
        },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
              cpf: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: totalSalvos, // Limitar aos últimos salvos
      });
      
      // Buscar dados da conta corrente separadamente
      const contaCorrente = await this.prisma.contaCorrente.findUnique({
        where: { id: contaId },
        select: {
          agencia: true,
          contaCorrente: true,
        },
      });
      
      if (lancamentosNovos.length === 0) {
        return;
      }
      
      this.logger.log(`[JOB EXTRATOS] Criando notificações para ${lancamentosNovos.length} novo(s) pagamento(s)`);
      
      // Buscar todos os usuários elegíveis (mesma lógica das notificações de pedidos)
      const usuariosElegiveis = await this.prisma.usuario.findMany({
        where: {
          nivel: {
            in: ['ADMINISTRADOR', 'GERENTE_GERAL', 'ESCRITORIO'],
          },
        },
        select: {
          id: true,
          nome: true,
        },
      });
      
      if (usuariosElegiveis.length === 0) {
        return;
      }
      
      // Criar notificação para cada lançamento novo
      for (const lancamento of lancamentosNovos) {
        // Marcar como notificado
        this.lancamentosNotificados.add(Number(lancamento.id));
        
        // Criar notificações para todos os usuários elegíveis
        await this.criarNotificacaoPagamento(lancamento, usuariosElegiveis);
      }
      
    } catch (error) {
      this.logger.error('[JOB EXTRATOS] Erro ao criar notificações:', error.message || error);
    }
  }

  /**
   * Cria notificações para um pagamento recebido para todos os usuários elegíveis
   */
  private async criarNotificacaoPagamento(
    lancamento: any,
    usuariosElegiveis: any[]
  ): Promise<void> {
    try {
      const nomeCliente = lancamento.cliente?.nome || lancamento.nomeContrapartida || 'Cliente não identificado';
      const valorFormatado = this.formatarValorMonetario(Number(lancamento.valorLancamento));
      const dataFormatada = new Date(lancamento.dataLancamento).toLocaleDateString('pt-BR');
      const documentoContrapartida = lancamento.numeroCpfCnpjContrapartida || 'Não informado';
      const nomeContrapartida = lancamento.nomeContrapartida || 'Não identificado';
      
      // Buscar dados da conta corrente
      const contaCorrente = await this.prisma.contaCorrente.findUnique({
        where: { id: lancamento.contaCorrenteId },
        select: {
          agencia: true,
          contaCorrente: true,
        },
      });
      
      const agencia = contaCorrente?.agencia || 'N/A';
      const conta = contaCorrente?.contaCorrente || 'N/A';
      
      // Gerar conteúdo simplificado para o menu
      const conteudoMenu = `Origem: ${nomeCliente}\nValor: ${valorFormatado}\nData: ${dataFormatada}`;
      
      // Gerar conteúdo completo para modal
      const conteudoCompleto = `Novo Pagamento Recebido\n\n` +
        `Origem: ${nomeCliente}\n` +
        `Documento: ${documentoContrapartida}\n` +
        `Valor: ${valorFormatado}\n` +
        `Data: ${dataFormatada}\n` +
        `Conta: ${agencia}/${conta}\n` +
        `Descrição: ${lancamento.textoDescricaoHistorico || 'N/A'}\n` +
        `Categoria: ${lancamento.categoriaOperacao || 'N/A'}\n` +
        `Contrapartida (nome): ${nomeContrapartida}`;
      
      const titulo = 'Novo pagamento recebido';
      
      // Criar notificação para cada usuário elegível
      const notificacoes = await Promise.all(
        usuariosElegiveis.map((usuario) => {
          return this.notificacoesService.create(
            {
              titulo: titulo,
              conteudo: conteudoMenu,
              tipo: TipoNotificacao.PIX,
              prioridade: PrioridadeNotificacao.MEDIA,
              usuarioId: usuario.id,
              dadosAdicionais: {
                toast: {
                  titulo: titulo,
                  conteudo: `${nomeCliente} - ${valorFormatado}`,
                  tipo: 'success',
                },
                menu: {
                  titulo: titulo,
                  conteudo: conteudoMenu,
                },
                modal: {
                  titulo: titulo,
                  conteudo: conteudoCompleto,
                },
                // Dados adicionais do pagamento
                lancamentoId: lancamento.id,
                clienteId: lancamento.clienteId,
                clienteNome: nomeCliente,
                contrapartidaDocumento: documentoContrapartida,
                valor: lancamento.valorLancamento,
                dataLancamento: lancamento.dataLancamento,
                contaCorrenteId: lancamento.contaCorrenteId,
                // Flag temporária para identificar que é pagamento (até criar modal específico)
                tipoPagamento: true,
              },
            },
            usuario.id
          ).catch((error) => {
            // Log erro individual sem interromper outras notificações
            this.logger.error(
              `❌ Erro ao criar notificação de pagamento para usuário ${usuario.id} (${usuario.nome}):`,
              error
            );
            return null;
          });
        })
      );
      
      // Filtrar notificações nulas (erros)
      const notificacoesCriadas = notificacoes.filter(n => n !== null);
      
      this.logger.log(
        `[JOB EXTRATOS] ${notificacoesCriadas.length} notificação(ões) criada(s): ${nomeCliente} - ${valorFormatado}`
      );
      
    } catch (error) {
      this.logger.error('[JOB EXTRATOS] Erro ao criar notificações:', error.message || error);
    }
  }

  /**
   * Método para verificação manual (pode ser chamado via API)
   */
  async executarMonitoramentoManualmente(): Promise<{
    contasMonitoradas: number;
    lancamentosProcessados: number;
    notificacoesCriadas: number;
  }> {
    this.logger.log('[JOB EXTRATOS] Execução manual iniciada');
    
    try {
      // Salvar estado atual do rastreamento
      const lancamentosNotificadosAnterior = new Set(this.lancamentosNotificados);
      // Buscar contas monitoradas
      const contasMonitoradas = await this.buscarContasMonitoradas();
      
      if (contasMonitoradas.length === 0) {
        this.logger.log('[JOB EXTRATOS] Nenhuma conta monitorada encontrada');
        return {
          contasMonitoradas: 0,
          lancamentosProcessados: 0,
          notificacoesCriadas: 0,
        };
      }
      
      let lancamentosProcessados = 0;
      
      this.logger.log(`🚀 [EXECUÇÃO MANUAL] Iniciando processamento de ${contasMonitoradas.length} conta(s)...`);
      
      // Executar busca para cada conta
      for (let i = 0; i < contasMonitoradas.length; i++) {
        const conta = contasMonitoradas[i];
        this.logger.log(`🔄 [EXECUÇÃO MANUAL] Processando conta ${i + 1}/${contasMonitoradas.length}: ${conta.id} (${conta.agencia}/${conta.contaCorrente})`);
        
        const resultado = await this.executarBuscaExtratosParaManual(conta.id);
        lancamentosProcessados += resultado.totalSalvos || 0;
        
        this.logger.log(`✅ [EXECUÇÃO MANUAL] Conta ${conta.id} processada: ${resultado.totalSalvos || 0} lançamento(s) salvo(s)`);
      }
      
      // Calcular quantas notificações foram criadas nesta execução
      const notificacoesCriadas = this.lancamentosNotificados.size - lancamentosNotificadosAnterior.size;
      
      this.logger.log(`📊 [EXECUÇÃO MANUAL] Resumo final: ${contasMonitoradas.length} conta(s) processada(s), ${lancamentosProcessados} lançamento(s) salvo(s), ${notificacoesCriadas} notificação(ões) criada(s)`);
      
      return {
        contasMonitoradas: contasMonitoradas.length,
        lancamentosProcessados,
        notificacoesCriadas: Math.max(0, notificacoesCriadas), // Garantir que não seja negativo
      };
      
    } catch (error) {
      this.logger.error('[JOB EXTRATOS] Erro na execução manual:', error.message || error);
      throw error;
    }
  }

  /**
   * Executa busca de extratos para uma conta (versão para execução manual)
   * Retorna resultado com informações para contagem
   */
  private async executarBuscaExtratosParaManual(contaId: number): Promise<{ totalSalvos: number }> {
    // Aguardar se já estiver executando (garantir execução sequencial)
    while (this.estaExecutando) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    this.estaExecutando = true;
    
    try {
      // Buscar conta para obter dados atualizados
      const conta = await this.prisma.contaCorrente.findUnique({
        where: { id: contaId },
      });
      
      if (!conta || !conta.monitorar) {
        return { totalSalvos: 0 };
      }
      
      // Verificar se ainda tem credenciais de extrato válidas
      const credencialExtrato = await this.prisma.credenciaisAPI.findFirst({
        where: {
          contaCorrenteId: contaId,
          modalidadeApi: '003 - Extratos',
        },
      });
      
      if (!credencialExtrato) {
        return { totalSalvos: 0 };
      }
      
      // Obter data do dia atual no formato DDMMYYYY
      const hoje = new Date();
      const dataFormatada = this.formatarDataHoje(hoje);
      
      // Executar busca usando o método existente
      const resultado = await this.lancamentoExtratoService.buscarEProcessarExtratosTodosClientes({
        contaCorrenteId: contaId,
        dataInicio: dataFormatada,
        dataFim: dataFormatada,
      });
      
      // Buscar lançamentos novos salvos nesta execução e criar notificações
      if (resultado.totalSalvos > 0) {
        await this.criarNotificacoesParaNovosLancamentos(contaId, resultado.totalSalvos);
      }
      
      return { totalSalvos: resultado.totalSalvos };
      
    } catch (error) {
      this.logger.error(`[JOB EXTRATOS] Erro na conta ${contaId}:`, error.message || error);
      return { totalSalvos: 0 };
    } finally {
      this.estaExecutando = false;
    }
  }

  /**
   * Método para obter status do monitoramento
   */
  getMonitoringStatus(): {
    isActive: boolean;
    nextExecution: string;
    contasMonitoradas: number;
    lancamentosNotificadosHoje: number;
  } {
    return {
      isActive: true,
      nextExecution: 'Todos os dias às 07:00 (horário de Brasília)',
      contasMonitoradas: this.execucoesAgendadas.size,
      lancamentosNotificadosHoje: this.lancamentosNotificados.size,
    };
  }
}

