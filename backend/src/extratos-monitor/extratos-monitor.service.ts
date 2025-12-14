import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
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
export class ExtratosMonitorService implements OnModuleInit {
  private readonly logger = new Logger(ExtratosMonitorService.name);
  private readonly HORA_INICIO = 7; // 7h da manhã
  private readonly HORA_FIM = 22; // 22h (10h da noite)
  private lancamentosNotificados = new Set<number>(); // Rastrear lançamentos já notificados hoje
  private estaExecutando = false; // Flag para garantir execução sequencial
  private processandoFila = false; // Flag para indicar se a fila está sendo processada
  private ultimasExecucoes = new Map<number, number>(); // Rastrear última execução de cada conta (timestamp)
  private inicializacaoEmAndamento = false; // Flag para evitar múltiplas inicializações simultâneas
  private readonly INTERVALO_PADRAO_SEGUNDOS = 3600; // Intervalo padrão: 1 hora (3600 segundos)

  constructor(
    private readonly prisma: PrismaService,
    private readonly lancamentoExtratoService: LancamentoExtratoService,
    private readonly notificacoesService: NotificacoesService,
  ) {
    // Limpar rastreamento de lançamentos notificados ao iniciar
    this.lancamentosNotificados.clear();
  }

  /**
   * Inicializa o monitoramento quando o módulo é carregado
   * CORRIGIDO: Agora verifica se já passou tempo suficiente desde o início do dia
   * para evitar execuções imediatas desnecessárias quando o backend reinicia
   * 
   * Lógica:
   * - Se reiniciar durante o horário (7h-22h), verifica se já passou pelo menos 1 hora desde as 7h
   * - Se sim, inicia o monitoramento normalmente (executa imediatamente e inicia o loop)
   * - Se não, apenas inicia o loop sem executar imediatamente (aguarda o próximo intervalo)
   */
  async onModuleInit() {
    // Aguardar um pouco para garantir que o Prisma está conectado
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const horaAtual = new Date().getHours();
    const minutoAtual = new Date().getMinutes();
    const dataHora = this.formatarTimestamp(Date.now());
    
    if (horaAtual >= this.HORA_INICIO && horaAtual < this.HORA_FIM) {
      // Calcular minutos desde o início do dia de trabalho (7h)
      const minutosDesdeInicio = (horaAtual - this.HORA_INICIO) * 60 + minutoAtual;
      const horasDesdeInicio = minutosDesdeInicio / 60;
      
      // Buscar contas para verificar intervalo configurado
      const contasMonitoradas = await this.buscarContasMonitoradas();
      
      if (contasMonitoradas.length === 0) {
        return;
      }
      
      // Verificar intervalo mínimo configurado (usar o menor intervalo entre as contas)
      const intervalos = contasMonitoradas.map(c => c.intervalo || this.INTERVALO_PADRAO_SEGUNDOS);
      const intervaloMinimoSegundos = Math.min(...intervalos);
      const intervaloMinimoHoras = intervaloMinimoSegundos / 3600;
      
      // Se já passou pelo menos 1 intervalo desde o início do dia, executar imediatamente
      // Caso contrário, apenas iniciar o loop sem executar (aguardará o próximo intervalo)
      if (horasDesdeInicio >= intervaloMinimoHoras) {
        await this.iniciarMonitoramentoDiario();
      } else {
        await this.iniciarMonitoramentoDiarioSemExecucaoImediata();
      }
    }
  }

  /**
   * Formata timestamp para log legível
   */
  private formatarTimestamp(timestamp: number): string {
    const data = new Date(timestamp);
    return data.toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  /**
   * Cron job que executa todos os dias às 7:00 da manhã
   * Inicia o processo de monitoramento para todas as contas configuradas
   * Intervalo configurável por conta (padrão: 1 hora = 3600s) até às 22h
   */
  @Cron('0 7 * * *', {
    name: 'extratos-monitor-inicio',
    timeZone: 'America/Sao_Paulo',
  })
  async iniciarMonitoramentoDiario() {
    // Evitar múltiplas inicializações simultâneas
    if (this.inicializacaoEmAndamento) {
      this.logger.warn(`⚠️  [JOB EXTRATOS] Inicialização já em andamento. Ignorando chamada duplicada.`);
      return;
    }
    
    this.inicializacaoEmAndamento = true;
    const timestampInicio = Date.now();
    const dataHoraInicio = this.formatarTimestamp(timestampInicio);
    
    console.log(`[JOB EXTRATOS] Iniciando monitoramento automático às ${dataHoraInicio}`);
    
    try {
      // Parar processamento da fila anterior se estiver rodando
      if (this.processandoFila) {
        this.processandoFila = false;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Limpar rastreamento do dia anterior
      this.lancamentosNotificados.clear();
      this.ultimasExecucoes.clear();
      
      // Buscar todas as contas com monitoramento ativo
      const contasMonitoradas = await this.buscarContasMonitoradas();
      
      if (contasMonitoradas.length === 0) {
        console.log(`[JOB EXTRATOS] Nenhuma conta configurada para monitoramento`);
        return;
      }

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
      this.iniciarProcessamentoFila(contasMonitoradas).catch((error) => {
        console.error(`[JOB EXTRATOS] Erro ao iniciar processamento da fila:`, error);
      });
      
    } catch (error) {
      this.logger.error(`❌ [JOB EXTRATOS] Erro ao inicializar monitoramento:`, error);
      this.logger.error(`   Stack: ${error.stack || 'N/A'}`);
    } finally {
      this.inicializacaoEmAndamento = false;
    }
  }

  /**
   * Inicia o monitoramento diário SEM executar a primeira busca imediatamente
   * Usado quando o backend reinicia durante o horário de funcionamento mas ainda não passou
   * tempo suficiente desde o início do dia para justificar uma execução imediata
   * 
   * O loop de processamento será iniciado e aguardará o próximo intervalo natural
   */
  private async iniciarMonitoramentoDiarioSemExecucaoImediata(): Promise<void> {
    // Evitar múltiplas inicializações simultâneas
    if (this.inicializacaoEmAndamento) {
      this.logger.warn(`⚠️  [JOB EXTRATOS] Inicialização já em andamento. Ignorando chamada duplicada.`);
      return;
    }
    
    this.inicializacaoEmAndamento = true;
    const timestampInicio = Date.now();
    const dataHoraInicio = this.formatarTimestamp(timestampInicio);
    
    console.log(`[JOB EXTRATOS] Iniciando monitoramento (sem execução imediata) às ${dataHoraInicio}`);
    
    try {
      // Parar processamento da fila anterior se estiver rodando
      if (this.processandoFila) {
        this.processandoFila = false;
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // Limpar rastreamento do dia anterior
      this.lancamentosNotificados.clear();
      
      // Buscar todas as contas com monitoramento ativo
      const contasMonitoradas = await this.buscarContasMonitoradas();
      
      if (contasMonitoradas.length === 0) {
        console.log(`[JOB EXTRATOS] Nenhuma conta configurada para monitoramento`);
        return;
      }

      // Inicializar rastreamento de últimas execuções com timestamp do início do dia (7h)
      // Isso fará com que o loop aguarde o próximo intervalo natural
      const agora = new Date();
      const inicioDoDia = new Date(agora);
      inicioDoDia.setHours(this.HORA_INICIO, 0, 0, 0); // 7h:00:00
      const timestampInicioDoDia = inicioDoDia.getTime();
      
      for (const conta of contasMonitoradas) {
        this.ultimasExecucoes.set(conta.id, timestampInicioDoDia);
      }
      
      // Iniciar processo de fila para execuções recorrentes (sem executar imediatamente)
      this.iniciarProcessamentoFila(contasMonitoradas).catch((error) => {
        console.error(`[JOB EXTRATOS] Erro ao iniciar processamento da fila:`, error);
      });
      
    } catch (error) {
      this.logger.error(`❌ [JOB EXTRATOS] Erro ao inicializar monitoramento:`, error);
      this.logger.error(`   Stack: ${error.stack || 'N/A'}`);
    } finally {
      this.inicializacaoEmAndamento = false;
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
   * 
   * CRÍTICO: Agora usa await e tratamento de erro para garantir que o loop não pare silenciosamente
   */
  private async iniciarProcessamentoFila(contas: any[]): Promise<void> {
    if (this.processandoFila) {
      this.logger.warn(`⚠️  [JOB EXTRATOS] Processamento da fila já está em andamento. Ignorando chamada duplicada.`);
      return; // Já está processando
    }
    
    this.processandoFila = true;
    
    // Executar em background mas com tratamento de erro
    this.processarFilaExecucoes(contas).catch((error) => {
      this.logger.error(`[JOB EXTRATOS] Erro crítico no processamento da fila:`, error);
      
      // Tentar reiniciar após 30 segundos
      setTimeout(() => {
        if (!this.processandoFila) {
          this.iniciarProcessamentoFila(contas).catch((err) => {
            this.logger.error(`[JOB EXTRATOS] Erro ao reiniciar processamento:`, err);
          });
        }
      }, 30000);
    });
  }

  /**
   * Processa a fila de execuções verificando quais contas precisam executar
   * baseado em seus intervalos configurados
   * 
   * CRÍTICO: Este método agora tem proteção contra loops infinitos e logs
   * detalhados para diagnóstico
   */
  private async processarFilaExecucoes(contas: any[]): Promise<void> {
    let iteracao = 0;
    let iteracoesSemExecucao = 0;
    
    // Loop de processamento iniciado (sem log - logs apenas nas execuções)
    
    while (this.processandoFila) {
      iteracao++;
      iteracoesSemExecucao++;
      const timestampVerificacao = Date.now();
      
      // Log periódico removido - logs apenas nas execuções
      
      try {
        // Verificar se ainda está dentro do horário permitido
        const horaAtual = new Date().getHours();
        if (horaAtual >= this.HORA_FIM) {
          const dataHora = this.formatarTimestamp(timestampVerificacao);
          console.log(`[JOB EXTRATOS] Encerrando monitoramento às ${dataHora} (horário limite: ${this.HORA_FIM}h)`);
          this.processandoFila = false;
          break;
        }
        
        const agora = Date.now();
        const contasParaExecutar: Array<{ conta: any; proximaExecucao: number; tempoEsperado: number }> = [];
        
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
          const intervaloSegundos = contaAtualizada.intervalo || this.INTERVALO_PADRAO_SEGUNDOS;
          const intervaloMs = intervaloSegundos * 1000;
          const proximaExecucao = ultimaExecucao + intervaloMs;
          const tempoEsperado = proximaExecucao - agora;
          
          // Se já passou o tempo do intervalo, adicionar à fila
          if (agora >= proximaExecucao) {
            contasParaExecutar.push({
              conta: contaAtualizada,
              proximaExecucao,
              tempoEsperado: 0,
            });
          }
        }
        
        // Ordenar por próxima execução (mais antiga primeiro)
        contasParaExecutar.sort((a, b) => a.proximaExecucao - b.proximaExecucao);
        
        // Executar sequencialmente todas as contas que precisam executar
        if (contasParaExecutar.length > 0) {
          iteracoesSemExecucao = 0; // Resetar contador
        }
        
        for (const { conta } of contasParaExecutar) {
          await this.executarBuscaExtratos(conta.id);
        }
        
        // Se não há contas para executar, calcular quanto tempo aguardar
        if (contasParaExecutar.length === 0) {
          // Encontrar a próxima execução mais próxima
          let proximaExecucaoGeral = Infinity;
          const proximasExecucoes: Array<{ contaId: number; intervalo: number; proximaExecucao: number }> = [];
          
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
            const intervaloSegundos = contaAtualizada.intervalo || this.INTERVALO_PADRAO_SEGUNDOS;
            const intervaloMs = intervaloSegundos * 1000;
            const proximaExecucao = ultimaExecucao + intervaloMs;
            
            proximasExecucoes.push({
              contaId: conta.id,
              intervalo: intervaloSegundos,
              proximaExecucao,
            });
            
            if (proximaExecucao < proximaExecucaoGeral) {
              proximaExecucaoGeral = proximaExecucao;
            }
          }
          
          // Logs de próximas execuções removidos - informações já aparecem no log de cada execução
          
          // Aguardar até a próxima execução ou 30 segundos (verificar novamente)
          const tempoAguardar = Math.min(proximaExecucaoGeral - agora, 30000);
          if (tempoAguardar > 0) {
            await new Promise(resolve => setTimeout(resolve, tempoAguardar));
          }
        } else {
          // Se executou alguma conta, aguardar um pouco antes de verificar novamente
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
      } catch (error) {
        const dataHora = this.formatarTimestamp(timestampVerificacao);
        this.logger.error(`❌ [JOB EXTRATOS] Erro no processamento da fila (iteração #${iteracao}) às ${dataHora}:`, error);
        this.logger.error(`   Stack: ${error.stack || 'N/A'}`);
        this.logger.error(`   ⚠️  Continuando processamento apesar do erro...`);
        
        // Se houver muitos erros consecutivos, pode ser um problema mais grave
        if (iteracao > 0 && iteracao % 10 === 0) {
          this.logger.warn(`⚠️  [JOB EXTRATOS] Múltiplos erros detectados. Verifique os logs acima.`);
        }
        
        // Aguardar um pouco antes de tentar novamente
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    
    const dataHora = this.formatarTimestamp(Date.now());
    console.log(`[JOB EXTRATOS] Processamento encerrado às ${dataHora}`);
  }


  /**
   * Executa busca de extratos para uma conta específica
   * Executa sequencialmente para evitar conflito de tokens
   */
  private async executarBuscaExtratos(contaId: number): Promise<void> {
    const timestampInicio = Date.now();
    const dataHoraInicio = this.formatarTimestamp(timestampInicio);
    
    // Aguardar se já estiver executando (garantir execução sequencial)
    let tempoEspera = 0;
    while (this.estaExecutando) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar 1 segundo
      tempoEspera += 1000;
    }
    
    // Aguardar silenciosamente se necessário (sem log)
    
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
      
      const intervaloSegundos = conta.intervalo || this.INTERVALO_PADRAO_SEGUNDOS;
      
      // Obter data do dia atual no formato DDMMYYYY
      const hoje = new Date();
      const dataFormatada = this.formatarDataHoje(hoje);
      
      // Executar busca usando o método existente
      const resultado = await this.lancamentoExtratoService.buscarEProcessarExtratosTodosClientes({
        contaCorrenteId: contaId,
        dataInicio: dataFormatada,
        dataFim: dataFormatada,
      });
      
      // Atualizar última execução e calcular próxima execução
      const timestampFim = Date.now();
      this.ultimasExecucoes.set(contaId, timestampFim);
      const proximaExecucaoTimestamp = timestampFim + (intervaloSegundos * 1000);
      const proximaExecucaoHora = this.formatarTimestamp(proximaExecucaoTimestamp);
      
      // Criar notificações se houver novos lançamentos
      if (resultado.totalSalvos > 0) {
        await this.criarNotificacoesParaNovosLancamentos(contaId, resultado.totalSalvos);
      }
      
      // Log simplificado: apenas relatório essencial
      console.log(`[JOB EXTRATOS] Conta ${conta.agencia}/${conta.contaCorrente} | Execução: ${dataHoraInicio} | Próxima: ${proximaExecucaoHora} | Lançamentos: ${resultado.totalSalvos} novos, ${resultado.totalDuplicados} duplicados`);
      
    } catch (error) {
      const dataHoraErro = this.formatarTimestamp(Date.now());
      this.logger.error(`[JOB EXTRATOS] ERRO | Conta ${contaId} | ${dataHoraErro} | ${error.message || error}`);
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
      
      // Criar notificações silenciosamente (sem log)
      
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
      
      // Notificações criadas silenciosamente (sem log)
      
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
  async getMonitoringStatus(): Promise<{
    isActive: boolean;
    nextExecution: string;
    contasMonitoradas: number;
    lancamentosNotificadosHoje: number;
  }> {
    const contasMonitoradas = await this.buscarContasMonitoradas();
    return {
      isActive: this.processandoFila,
      nextExecution: 'Todos os dias às 07:00 (horário de Brasília)',
      contasMonitoradas: contasMonitoradas.length,
      lancamentosNotificadosHoje: this.lancamentosNotificados.size,
    };
  }
}

