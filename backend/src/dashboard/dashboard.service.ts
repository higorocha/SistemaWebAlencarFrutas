// src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardResponseDto, ReceitaMensalDto, ProgramacaoColheitaDto, PrevisaoBananaDto, PagamentoEfetuadoDto, PagamentoFornecedorEfetuadoDto } from './dto/dashboard-response.dto';
import { StatusPagamentoFornecedor, StatusPedido } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getDashboardData(): Promise<DashboardResponseDto> {
    // Executar todas as queries em paralelo para melhor performance
    const [
      faturamentoTotal,
      faturamentoAberto,
      totalClientes,
      totalPedidos,
      areasProdutivasHa,
      frutasCadastradas,
      pedidosAtivos,
      pedidosNaoFinalizadosResumo,
      receitaMensal,
      programacaoColheita,
      previsoesBanana,
      pagamentosPendentes,
      pagamentosEfetuados,
      pagamentosFornecedores,
      pagamentosFornecedoresEfetuados
    ] = await Promise.all([
      this.getFaturamentoTotal(),
      this.getFaturamentoAberto(),
      this.getTotalClientes(),
      this.getTotalPedidos(),
      this.getAreasProdutivasHa(),
      this.getFrutasCadastradas(),
      this.getPedidosAtivos(),
      this.getPedidosNaoFinalizadosResumo(),
      this.getReceitaMensal(),
      this.getProgramacaoColheita(),
      this.getPrevisoesBanana(),
      this.getPagamentosPendentes(),
      this.getPagamentosEfetuados(),
      this.getFornecedoresColheitas(),
      this.getPagamentosFornecedoresEfetuados()
    ]);

    const result = {
      faturamentoTotal,
      faturamentoAberto,
      totalClientes,
      totalPedidos,
      areasProdutivasHa,
      frutasCadastradas,
      pedidosAtivos,
      pedidosNaoFinalizadosResumo,
      receitaMensal,
      programacaoColheita,
      previsoesBanana,
      pagamentosPendentes,
      pagamentosEfetuados,
      pagamentosFornecedores,
      pagamentosFornecedoresEfetuados
    };


    return result;
  }

  private async getFaturamentoTotal(): Promise<number> {
    const result = await this.prisma.pedido.aggregate({
      _sum: {
        valorRecebido: true, // ✅ CORRIGIDO: Soma valorRecebido (pagamentos efetivos)
      },
      where: {
        status: {
          in: ['PEDIDO_FINALIZADO', 'PAGAMENTO_PARCIAL', 'PAGAMENTO_REALIZADO'], // ✅ INCLUÍDO: PAGAMENTO_REALIZADO
        },
        valorRecebido: {
          not: null,
          gt: 0, // ✅ Apenas valores maiores que zero
        },
      },
    });

    return result._sum.valorRecebido || 0;
  }

  private async getFaturamentoAberto(): Promise<number> {
    // ✅ CORRIGIDO: Buscar pedidos com saldo devedor (valorFinal - valorRecebido)
    const pedidosComSaldo = await this.prisma.pedido.findMany({
      where: {
        status: {
          notIn: ['PEDIDO_FINALIZADO', 'CANCELADO', 'PAGAMENTO_REALIZADO'], // ✅ INCLUÍDO: Excluir PAGAMENTO_REALIZADO
        },
        valorFinal: {
          not: null,
          gt: 0,
        },
      },
      select: {
        valorFinal: true,
        valorRecebido: true,
      },
    });

    // Calcular saldo devedor total
    const saldoDevedorTotal = pedidosComSaldo.reduce((total, pedido) => {
      const valorFinal = pedido.valorFinal || 0;
      const valorRecebido = pedido.valorRecebido || 0;
      const saldoDevedor = valorFinal - valorRecebido;
      
      // Só incluir se houver saldo devedor
      return total + (saldoDevedor > 0 ? saldoDevedor : 0);
    }, 0);

    return saldoDevedorTotal;
  }

  private async getTotalClientes(): Promise<number> {
    return this.prisma.cliente.count({
      where: {
        status: 'ATIVO',
      },
    });
  }

  private async getTotalPedidos(): Promise<number> {
    return this.prisma.pedido.count();
  }

  private async getAreasProdutivasHa(): Promise<number> {
    const result = await this.prisma.areaAgricola.aggregate({
      _sum: {
        areaTotal: true,
      },
    });

    return result._sum.areaTotal || 0;
  }

  private async getFrutasCadastradas(): Promise<number> {
    return this.prisma.fruta.count({
      where: {
        status: 'ATIVA',
      },
    });
  }

  private async getPedidosAtivos(): Promise<number> {
    return this.prisma.pedido.count({
      where: {
        status: {
          notIn: ['CANCELADO'],
        },
      },
    });
  }

  private async getPedidosNaoFinalizadosResumo(): Promise<{ aguardandoColheita: number; aguardandoPrecificacao: number; aguardandoPagamento: number; }> {
    // Grupos operacionais solicitados
    // aguardandoColheita: PEDIDO_CRIADO, AGUARDANDO_COLHEITA, COLHEITA_PARCIAL
    // aguardandoPrecificacao: COLHEITA_REALIZADA, AGUARDANDO_PRECIFICACAO
    // aguardandoPagamento: PRECIFICACAO_REALIZADA, AGUARDANDO_PAGAMENTO, PAGAMENTO_PARCIAL
    const [aguardandoColheita, aguardandoPrecificacao, aguardandoPagamento] = await Promise.all([
      this.prisma.pedido.count({ where: { status: { in: ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL'] } } }),
      this.prisma.pedido.count({ where: { status: { in: ['COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO'] } } }),
      this.prisma.pedido.count({ where: { status: { in: ['PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL'] } } }),
    ]);

    return { aguardandoColheita, aguardandoPrecificacao, aguardandoPagamento };
  }

  private async getReceitaMensal(): Promise<ReceitaMensalDto[]> {
    // Últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const pedidosFinalizados = await this.prisma.pedido.findMany({
      where: {
        status: {
          in: ['PEDIDO_FINALIZADO', 'PAGAMENTO_PARCIAL'],
        },
        createdAt: {
          gte: sixMonthsAgo,
        },
        valorFinal: {
          not: null,
        },
      },
      select: {
        valorFinal: true,
        createdAt: true,
      },
    });

    // Agrupar por mês
    const receitaPorMes = new Map<string, number>();

    // Inicializar últimos 6 meses com 0
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const mesKey = date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const mesCapitalized = mesKey.charAt(0).toUpperCase() + mesKey.slice(1);
      receitaPorMes.set(mesCapitalized, 0);
    }

    // Somar valores por mês
    pedidosFinalizados.forEach(pedido => {
      const mes = pedido.createdAt.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
      const mesCapitalized = mes.charAt(0).toUpperCase() + mes.slice(1);
      const valorAtual = receitaPorMes.get(mesCapitalized) || 0;
      receitaPorMes.set(mesCapitalized, valorAtual + (pedido.valorFinal || 0));
    });

    // Converter para array
    return Array.from(receitaPorMes.entries()).map(([mes, valor]) => ({
      mes,
      valor,
    }));
  }

  private async getProgramacaoColheita(): Promise<ProgramacaoColheitaDto[]> {
    // ✅ Normalizar data atual para início do dia (00:00:00)
    const hoje = new Date();
    const dataAtual = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    // ✅ Buscar TODOS os pedidos (incluindo finalizados) para estatísticas completas
    const pedidos = await this.prisma.pedido.findMany({
      include: {
        cliente: {
          select: {
            nome: true,
            razaoSocial: true,
          },
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: {
                nome: true,
              },
            },
          },
        },
      },
      orderBy: {
        dataPrevistaColheita: 'asc',
      },
    });

    const programacao: ProgramacaoColheitaDto[] = [];

    pedidos.forEach(pedido => {
      const clienteNome = pedido.cliente.nome || pedido.cliente.razaoSocial || 'Cliente sem nome';

      // ✅ Normalizar data prevista para início do dia (ignorar horário)
      const dataPrevistaNormalizada = new Date(
        pedido.dataPrevistaColheita.getFullYear(),
        pedido.dataPrevistaColheita.getMonth(),
        pedido.dataPrevistaColheita.getDate()
      );

      // ✅ Calcular diferença em dias (sem considerar horário)
      const diferencaMs = dataPrevistaNormalizada.getTime() - dataAtual.getTime();
      const diasRestantes = Math.round(diferencaMs / (1000 * 60 * 60 * 24));

      const statusVisualizacao = diasRestantes < 0 ? 'ATRASADO' : pedido.status;

      pedido.frutasPedidos.forEach(frutaPedido => {
        programacao.push({
          pedidoId: pedido.id,
          numeroPedido: pedido.numeroPedido, // Adicionado para exibição no frontend
          placaPrimaria: pedido.placaPrimaria ?? undefined,
          cliente: clienteNome,
          fruta: frutaPedido.fruta.nome,
          quantidadePrevista: frutaPedido.quantidadePrevista,
          quantidadeReal: frutaPedido.quantidadeReal ?? undefined, // ✅ Converter null para undefined
          unidade: frutaPedido.unidadeMedida1,
          dataPrevistaColheita: pedido.dataPrevistaColheita.toISOString(),
          status: statusVisualizacao,
          statusPedido: pedido.status, // ✅ Status real do pedido
          diasRestantes: diasRestantes,
        });
      });
    });

    return programacao;
  }

  private async getPrevisoesBanana(): Promise<PrevisaoBananaDto[]> {
    try {
      // Usar a mesma estrutura do controle-banana/dashboard para consistência
      const response = await this.prisma.areaAgricola.findMany({
        include: {
          controlesBanana: {
            where: {
              quantidadeFitas: {
                gt: 0, // Apenas registros com fitas disponíveis
              },
            },
            include: {
              fitaBanana: {
                select: {
                  nome: true,
                  corHex: true,
                },
              },
              areaAgricola: {
                select: {
                  nome: true,
                },
              },
            },
            orderBy: {
              dataRegistro: 'asc',
            },
          },
        },
      });

      // Extrair os controles da mesma forma que o frontend faz
      const controlesBanana = response.flatMap(area => area.controlesBanana || []);

      if (controlesBanana.length === 0) {
        return [];
      }

      const dataAtual = new Date();
      const previsoesPorSemana = new Map<number, PrevisaoBananaDto>();

      controlesBanana.forEach(controle => {
        const dataRegistro = new Date(controle.dataRegistro);

        // Calcular previsões para as próximas 120 dias
        for (let diasAdicionais = 0; diasAdicionais <= 120; diasAdicionais += 7) {
          const dataSemana = new Date(dataAtual.getTime() + diasAdicionais * 24 * 60 * 60 * 1000);
          const diasDesdeRegistro = Math.floor((dataSemana.getTime() - dataRegistro.getTime()) / (1000 * 60 * 60 * 24));

          // Aplicar lógica de maturação baseada exatamente nos mesmos parâmetros do frontend
          let status = 'maturacao';
          if (diasDesdeRegistro < 100) {
            status = 'maturacao';
          } else if (diasDesdeRegistro <= 115) {
            status = 'colheita';
          } else if (diasDesdeRegistro <= 125) {
            status = 'alerta';
          } else {
            status = 'vencido';
          }

          // Só incluir se estiver no período de colheita ou alerta (próximas colheitas)
          if (status === 'colheita' || status === 'alerta') {
            const numeroSemana = this.obterNumeroSemana(dataSemana);
            const inicioSemana = this.obterInicioSemana(dataSemana);
            const fimSemana = new Date(inicioSemana);
            fimSemana.setDate(fimSemana.getDate() + 6);

            const diasRestantes = Math.ceil((inicioSemana.getTime() - dataAtual.getTime()) / (1000 * 60 * 60 * 24));

            const chavePrevisao = numeroSemana;

            if (!previsoesPorSemana.has(chavePrevisao)) {
              previsoesPorSemana.set(chavePrevisao, {
                numeroSemana,
                periodoSemana: `${this.formatarDataCurta(inicioSemana)} - ${this.formatarDataCurta(fimSemana)}`,
                diasRestantes,
                dataInicio: inicioSemana.toISOString(),
                dataFim: fimSemana.toISOString(),
                detalhes: [],
                totalFitas: 0,
                status,
              });
            }

            const previsao = previsoesPorSemana.get(chavePrevisao);

            if (previsao) {
              // Verificar se já existe um detalhe para esta área/fita
              const detalhesExistente = previsao.detalhes.find(
                d => d.areaNome === controle.areaAgricola.nome && d.fitaNome === controle.fitaBanana.nome
              );

              if (detalhesExistente) {
                detalhesExistente.quantidadeFitas += controle.quantidadeFitas;
              } else {
                previsao.detalhes.push({
                  areaNome: controle.areaAgricola.nome,
                  fitaNome: controle.fitaBanana.nome,
                  fitaCor: controle.fitaBanana.corHex,
                  quantidadeFitas: controle.quantidadeFitas,
                  id: controle.id.toString(),
                  dataRegistro: controle.dataRegistro.toISOString(),
                });
              }

              previsao.totalFitas += controle.quantidadeFitas;

              // Atualizar status para o mais crítico (prioridade: vencido > alerta > colheita > maturacao)
              const statusPrioridade = { vencido: 4, alerta: 3, colheita: 2, maturacao: 1 };
              if (statusPrioridade[status] > statusPrioridade[previsao.status]) {
                previsao.status = status;
              }
            }
          }
        }
      });

      // Converter para array e ordenar por proximidade
      const previsoesOrdenadas = Array.from(previsoesPorSemana.values())
        .sort((a, b) => a.diasRestantes - b.diasRestantes)
        .slice(0, 10); // Limitar a 10 previsões mais próximas

      return previsoesOrdenadas;

    } catch (error) {
      console.error('Erro ao buscar previsões de banana:', error);
      return [];
    }
  }

  // Métodos auxiliares para cálculos de data
  private obterNumeroSemana(data: Date): number {
    const d = new Date(Date.UTC(data.getFullYear(), data.getMonth(), data.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  }

  private obterInicioSemana(data: Date): Date {
    const inicioSemana = new Date(data);
    const diaSemana = inicioSemana.getDay();
    const diasParaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana;
    inicioSemana.setDate(inicioSemana.getDate() + diasParaSegunda);
    return inicioSemana;
  }

  private formatarDataCurta(data: Date): string {
    return data.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
  }

  private async getPagamentosPendentes(): Promise<any[]> {
    try {
      // Buscar todas as turmas com seus custos de colheita pendentes de pagamento
      const turmasComPagamentosPendentes = await this.prisma.turmaColheita.findMany({
        include: {
          custosColheita: {
            where: {
              pagamentoEfetuado: false, // Ainda não marcados como pagos
            },
            include: {
              pedido: {
                select: {
                  numeroPedido: true,
                  cliente: {
                    select: {
                      nome: true,
                      razaoSocial: true,
                    },
                  },
                },
              },
              fruta: {
                select: {
                  nome: true,
                },
              },
            },
            orderBy: {
              dataColheita: 'desc', // Mais recentes primeiro
            },
          },
        },
      });

      // Filtrar apenas turmas que realmente têm pagamentos pendentes
      const turmasComPendencias = turmasComPagamentosPendentes.filter(
        turma => turma.custosColheita.length > 0
      );

      // Processar dados para o formato esperado no frontend
      const pagamentosPendentes = turmasComPendencias.map(turma => {
        // Calcular totais agregados, separando PENDENTE x PROCESSANDO
        const totalPendente = turma.custosColheita
          .filter(custo => custo.statusPagamento !== 'PAGO')
          .reduce((acc, custo) => acc + (custo.valorColheita || 0), 0);

        const quantidadePedidos = new Set(
          turma.custosColheita.map(custo => custo.pedidoId)
        ).size;

        const quantidadeFrutas = new Set(
          turma.custosColheita.map(custo => custo.frutaId)
        ).size;

        // Detalhamento dos custos
        const detalhes = turma.custosColheita.map(custo => ({
          pedidoNumero: custo.pedido.numeroPedido,
          cliente: custo.pedido.cliente.razaoSocial || custo.pedido.cliente.nome,
          fruta: custo.fruta.nome,
          quantidadeColhida: custo.quantidadeColhida,
          unidadeMedida: custo.unidadeMedida,
          valorColheita: custo.valorColheita || 0,
          dataColheita: custo.dataColheita,
           statusPagamento: custo.statusPagamento,
          observacoes: custo.observacoes,
        }));

        return {
          id: turma.id,
          nomeColhedor: turma.nomeColhedor,
          chavePix: turma.chavePix,
          totalPendente,
          quantidadePedidos,
          quantidadeFrutas,
          detalhes,
          dataCadastro: turma.dataCadastro,
          observacoes: turma.observacoes,
        };
      });

      // Ordenar por maior valor pendente primeiro
      return pagamentosPendentes.sort((a, b) => b.totalPendente - a.totalPendente);

    } catch (error) {
      console.error('Erro ao buscar pagamentos pendentes:', error);
      return [];
    }
  }

  private async getPagamentosEfetuados(): Promise<any[]> {
    try {
      // Buscar todas as turmas com seus custos de colheita já pagos
      const turmasComPagamentosEfetuados = await this.prisma.turmaColheita.findMany({
        include: {
          custosColheita: {
            where: {
              pagamentoEfetuado: true, // Apenas pagamentos efetuados
              dataPagamento: {
                not: null, // Garantir que tem data de pagamento
              },
            },
            include: {
              pedido: {
                select: {
                  numeroPedido: true,
                  cliente: {
                    select: {
                      nome: true,
                      razaoSocial: true,
                    },
                  },
                },
              },
              fruta: {
                select: {
                  nome: true,
                },
              },
            },
            orderBy: {
              dataPagamento: 'desc', // Mais recentes primeiro
            },
          },
        },
      });

      // Filtrar apenas turmas que realmente têm pagamentos efetuados
      const turmasComEfetuados = turmasComPagamentosEfetuados.filter(
        turma => turma.custosColheita.length > 0
      );

      // Agrupar por colhedor e data de pagamento (para diferenciar de pendentes)
      const pagamentosAgrupados = new Map<string, any>();

      turmasComEfetuados.forEach(turma => {
        turma.custosColheita.forEach(custo => {
          const dataPagamento = custo.dataPagamento;
          if (!dataPagamento) return; // Skip se dataPagamento for null

          const chaveAgrupamento = `${turma.id}-${dataPagamento.toISOString().split('T')[0]}`; // colhedor + data

          if (!pagamentosAgrupados.has(chaveAgrupamento)) {
            pagamentosAgrupados.set(chaveAgrupamento, {
              id: `${turma.id}-${dataPagamento.getTime()}`,
              nomeColhedor: turma.nomeColhedor,
              chavePix: turma.chavePix,
              dataPagamento: dataPagamento,
              totalPago: 0,
              quantidadePedidos: new Set(),
              quantidadeFrutas: new Set(),
              detalhes: [],
              observacoes: turma.observacoes,
              dataCadastro: turma.dataCadastro,
            });
          }

          const pagamento = pagamentosAgrupados.get(chaveAgrupamento);

          // Acumular valores
          pagamento.totalPago += custo.valorColheita || 0;
          pagamento.quantidadePedidos.add(custo.pedidoId);
          pagamento.quantidadeFrutas.add(custo.frutaId);

          // Adicionar detalhes
          pagamento.detalhes.push({
            pedidoNumero: custo.pedido.numeroPedido,
            cliente: custo.pedido.cliente.razaoSocial || custo.pedido.cliente.nome,
            fruta: custo.fruta.nome,
            quantidadeColhida: custo.quantidadeColhida,
            unidadeMedida: custo.unidadeMedida,
            valorColheita: custo.valorColheita || 0,
            dataColheita: custo.dataColheita,
            dataPagamento: custo.dataPagamento,
            observacoes: custo.observacoes,
          });
        });
      });

      // Converter para array e ajustar contadores
      const pagamentosEfetuados = Array.from(pagamentosAgrupados.values()).map(pagamento => ({
        ...pagamento,
        quantidadePedidos: pagamento.quantidadePedidos.size,
        quantidadeFrutas: pagamento.quantidadeFrutas.size,
      }));

      // Ordenar por data de pagamento mais recente primeiro
      return pagamentosEfetuados.sort((a, b) => b.dataPagamento.getTime() - a.dataPagamento.getTime());

    } catch (error) {
      console.error('Erro ao buscar pagamentos efetuados:', error);
      return [];
    }
  }

  private async getFornecedoresColheitas(): Promise<any[]> {
    try {
      // Buscar fornecedores com suas áreas e colheitas
      const fornecedores = await this.prisma.fornecedor.findMany({
        where: {
          areas: {
            some: {
              frutasPedidosAreas: {
                some: {
                  areaFornecedorId: {
                    not: null,
                  },
                },
              },
            },
          },
        },
        include: {
          areas: {
            include: {
              frutasPedidosAreas: {
                include: {
                  frutaPedido: {
                    include: {
                      fruta: {
                        select: {
                          id: true,
                          nome: true,
                        },
                      },
                      pedido: {
                        select: {
                          id: true,
                          numeroPedido: true,
                          valorFinal: true,
                          status: true,
                          dataColheita: true,
                          cliente: {
                            select: {
                              nome: true,
                              razaoSocial: true,
                            },
                          },
                        },
                      },
                      areas: {
                        select: {
                          id: true,
                          areaFornecedorId: true,
                          quantidadeColhidaUnidade1: true,
                          quantidadeColhidaUnidade2: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Buscar todos os pagamentos (PAGO, PENDENTE, PROCESSANDO) para os fornecedores
      const pagamentos = await this.prisma.fornecedorPagamento.findMany({
        where: {
          fornecedorId: {
            in: fornecedores.map(f => f.id),
          },
        },
        select: {
          id: true,
          fornecedorId: true,
          frutaPedidoAreaId: true,
          status: true,
          valorUnitario: true,
          valorTotal: true,
          dataPagamento: true,
          formaPagamento: true,
        },
      });

      // Criar mapa de pagamentos por frutaPedidoAreaId
      const pagamentosMap = new Map<number, typeof pagamentos[0]>();
      pagamentos.forEach(p => {
        pagamentosMap.set(p.frutaPedidoAreaId, p);
      });

      const fornecedoresComDados = fornecedores.map((fornecedor) => {
        const detalhes = [] as Array<{
          pedidoId: number;
          pedidoNumero: string;
          cliente: string;
          frutaId: number;
          fruta: string;
          quantidade: number;
          unidade: string;
          quantidadeSecundaria?: number;
          unidadeSecundaria?: string | null;
          quantidadeHa?: number | null;
          valor: number;
          valorTotalFruta: number;
          areaNome: string;
          areaFornecedorId: number;
          statusPedido: string;
          dataColheita?: Date;
          frutaPedidoId: number;
          frutaPedidoAreaId: number;
          pagamentoId?: number;
          statusPagamento?: StatusPagamentoFornecedor;
          valorUnitario?: number;
          valorTotal?: number;
          dataPagamento?: Date;
          formaPagamento?: string;
        }>;

        fornecedor.areas.forEach((area) => {
          area.frutasPedidosAreas.forEach((relacaoArea) => {
            if (!relacaoArea.areaFornecedorId || !relacaoArea.frutaPedido) {
              return;
            }

            const frutaPedido = relacaoArea.frutaPedido;
            const pedido = frutaPedido.pedido;
            if (!pedido) {
              return;
            }

            const clienteNome = pedido.cliente?.razaoSocial || pedido.cliente?.nome || 'Cliente não informado';
            const frutaNome = frutaPedido.fruta?.nome || 'Fruta não identificada';
            const unidade = frutaPedido.unidadeMedida1;

            const quantidadeArea =
              relacaoArea.quantidadeColhidaUnidade1 ??
              relacaoArea.quantidadeColhidaUnidade2 ??
              frutaPedido.quantidadeReal ??
              frutaPedido.quantidadePrecificada ??
              frutaPedido.quantidadePrevista ??
              0;

            const quantidadeAreaSecundaria =
              relacaoArea.quantidadeColhidaUnidade2 ?? null;

            const unidadeSecundaria = frutaPedido.unidadeMedida2 || null;

            // Usar quantidadeHa da área do fornecedor (se disponível)
            // Garantir que seja sempre incluído no objeto, mesmo quando null/undefined
            let quantidadeHa: number | null = null;
            if (area.quantidadeHa !== null && area.quantidadeHa !== undefined) {
              const quantidadeHaNumero = Number(area.quantidadeHa);
              if (!isNaN(quantidadeHaNumero) && quantidadeHaNumero > 0) {
                quantidadeHa = quantidadeHaNumero;
              }
            }

            const somaAreasRelacionadas = frutaPedido.areas.reduce((acc, areaRelacionada) => {
              const quantidadeRelacionada =
                areaRelacionada.quantidadeColhidaUnidade1 ??
                areaRelacionada.quantidadeColhidaUnidade2 ??
                0;
              return acc + quantidadeRelacionada;
            }, 0);

            const quantidadeReferencia =
              (frutaPedido.quantidadeReal ?? frutaPedido.quantidadePrecificada ?? frutaPedido.quantidadePrevista ?? somaAreasRelacionadas) || 0;

            const valorTotalFruta = frutaPedido.valorTotal ?? 0;
            let valorProporcional = 0;
            if (valorTotalFruta > 0 && quantidadeReferencia > 0) {
              valorProporcional = (valorTotalFruta * quantidadeArea) / quantidadeReferencia;
            }

            // Verificar se existe pagamento para esta colheita
            const pagamento = pagamentosMap.get(relacaoArea.id);

            detalhes.push({
              pedidoId: pedido.id,
              pedidoNumero: pedido.numeroPedido,
              cliente: clienteNome,
              frutaId: frutaPedido.frutaId,
              fruta: frutaNome,
              quantidade: Number(quantidadeArea) || 0,
              unidade,
              quantidadeSecundaria:
                quantidadeAreaSecundaria !== null && quantidadeAreaSecundaria !== undefined
                  ? Number(quantidadeAreaSecundaria)
                  : undefined,
              unidadeSecundaria,
              quantidadeHa: quantidadeHa !== null && quantidadeHa !== undefined ? quantidadeHa : null, // Quantidade de hectares da área do fornecedor
              valor: Number(valorProporcional.toFixed(2)),
              valorTotalFruta: Number(valorTotalFruta),
              areaNome: area.nome,
              areaFornecedorId: area.id,
              statusPedido: pedido.status,
              dataColheita: pedido.dataColheita ?? undefined,
              frutaPedidoId: frutaPedido.id,
              frutaPedidoAreaId: relacaoArea.id,
              pagamentoId: pagamento?.id,
              statusPagamento: pagamento?.status,
              valorUnitario: pagamento?.valorUnitario,
              valorTotal: pagamento?.valorTotal,
              dataPagamento: pagamento?.dataPagamento,
              formaPagamento: pagamento?.formaPagamento,
            });
          });
        });

        if (detalhes.length === 0) {
          return null;
        }

        const quantidadePedidos = new Set(detalhes.map((d) => d.pedidoId)).size;
        const quantidadeFrutas = new Set(detalhes.map((d) => d.frutaId)).size;
        const quantidadeAreas = new Set(detalhes.map((d) => d.areaNome)).size;
        const totalColheitas = detalhes.length;
        // Colheitas pagas: têm pagamentoId e status é PAGO
        const colheitasPagas = detalhes.filter(d => 
          d.pagamentoId !== undefined && d.statusPagamento === StatusPagamentoFornecedor.PAGO
        ).length;
        // Colheitas em aberto: não têm pagamentoId OU têm pagamentoId mas status é PENDENTE/PROCESSANDO
        const colheitasEmAberto = detalhes.filter(d => 
          d.pagamentoId === undefined || 
          (d.pagamentoId !== undefined && d.statusPagamento !== StatusPagamentoFornecedor.PAGO)
        ).length;
        
        // Calcular totalPendente: soma dos valores das colheitas pendentes
        // IMPORTANTE: Só somar valores se houver pagamento PENDENTE/PROCESSANDO
        // Se não tem pagamento, não somar nada (valor = 0), pois não foi precificada ainda
        const totalPendente = detalhes
          .filter(d => 
            d.pagamentoId !== undefined && 
            d.statusPagamento !== undefined &&
            d.statusPagamento !== StatusPagamentoFornecedor.PAGO
          )
          .reduce((acc, item) => {
            // Se tem pagamento pendente/processando, usar valorTotal do pagamento
            // Se valorTotal não estiver definido, usar 0 (não usar valor proporcional)
            const valorPendente = item.valorTotal || 0;
            return acc + valorPendente;
          }, 0);
        
        // Calcular totalPago: soma dos valores das colheitas pagas
        const totalPago = detalhes
          .filter(d => 
            d.pagamentoId !== undefined && d.statusPagamento === StatusPagamentoFornecedor.PAGO
          )
          .reduce((acc, item) => {
            const valorPago = item.valorTotal || item.valor || 0;
            return acc + valorPago;
          }, 0);
        
        // totalValor: soma de todas as colheitas (para histórico/compatibilidade)
        const totalValor = detalhes.reduce((acc, item) => acc + (item.valor || 0), 0);
        const totalQuantidade = detalhes.reduce((acc, item) => acc + (item.quantidade || 0), 0);

        // Calcular distribuição por unidade (pago, pendente, total)
        const distribuicaoPorUnidade = new Map<string, {
          unidade: string;
          quantidadePaga: number;
          quantidadePendente: number;
          quantidadeTotal: number;
          valorPago: number;
          valorPendente: number;
          valorTotal: number;
        }>();

        detalhes.forEach((colheita) => {
          const unidade = colheita.unidade || 'UN';
          if (!distribuicaoPorUnidade.has(unidade)) {
            distribuicaoPorUnidade.set(unidade, {
              unidade,
              quantidadePaga: 0,
              quantidadePendente: 0,
              quantidadeTotal: 0,
              valorPago: 0,
              valorPendente: 0,
              valorTotal: 0,
            });
          }

          const distribuicao = distribuicaoPorUnidade.get(unidade)!;
          distribuicao.quantidadeTotal += colheita.quantidade || 0;
          distribuicao.valorTotal += colheita.valor || 0;

          // Verificar se é colheita paga (tem pagamentoId E status é PAGO)
          if (colheita.pagamentoId !== undefined && colheita.statusPagamento === StatusPagamentoFornecedor.PAGO) {
            // Colheita paga - usar valorTotal do pagamento se disponível, senão usar valorProporcional
            distribuicao.quantidadePaga += colheita.quantidade || 0;
            distribuicao.valorPago += colheita.valorTotal || colheita.valor || 0;
          } else {
            // Colheita pendente - sempre contar quantidade, mas só somar valor se houver pagamento pendente/processando
            distribuicao.quantidadePendente += colheita.quantidade || 0;
            // IMPORTANTE: Só somar valor se houver pagamento PENDENTE/PROCESSANDO
            // Se não tem pagamento, não somar valor (valor = 0), pois não foi precificada ainda
            if (colheita.pagamentoId !== undefined && 
                colheita.statusPagamento !== undefined &&
                colheita.statusPagamento !== StatusPagamentoFornecedor.PAGO) {
              // Tem pagamento pendente/processando - usar valorTotal do pagamento
              distribuicao.valorPendente += colheita.valorTotal || 0;
            }
            // Se não tem pagamento, não somar nada (valorPendente permanece 0)
          }
        });

        const distribuicaoPorUnidadeArray = Array.from(distribuicaoPorUnidade.values()).map(d => ({
          ...d,
          quantidadePaga: Number(d.quantidadePaga.toFixed(2)),
          quantidadePendente: Number(d.quantidadePendente.toFixed(2)),
          quantidadeTotal: Number(d.quantidadeTotal.toFixed(2)),
          valorPago: Number(d.valorPago.toFixed(2)),
          valorPendente: Number(d.valorPendente.toFixed(2)),
          valorTotal: Number(d.valorTotal.toFixed(2)),
        }));

        return {
          id: fornecedor.id,
          nomeFornecedor: fornecedor.nome,
          quantidadePedidos: Number(quantidadePedidos) || 0,
          quantidadeFrutas: Number(quantidadeFrutas) || 0,
          totalColheitas: Number(totalColheitas) || 0,
          colheitasPagas: Number(colheitasPagas) || 0,
          colheitasEmAberto: Number(colheitasEmAberto) || 0,
          quantidadeAreas: Number(quantidadeAreas) || 0,
          totalPendente: Number(totalPendente.toFixed(2)),
          totalPago: Number(totalPago.toFixed(2)),
          totalValor: Number(totalValor.toFixed(2)),
          totalQuantidade: Number(totalQuantidade.toFixed(2)),
          detalhes: detalhes.map((d) => {
            const detalhe = {
              pedidoId: d.pedidoId,
              pedidoNumero: d.pedidoNumero,
              cliente: d.cliente,
              frutaId: d.frutaId,
              fruta: d.fruta,
              quantidade: Number(d.quantidade.toFixed(2)),
              unidade: d.unidade,
              quantidadeSecundaria:
                d.quantidadeSecundaria !== undefined && d.quantidadeSecundaria !== null
                  ? Number(Number(d.quantidadeSecundaria).toFixed(2))
                  : undefined,
              unidadeSecundaria: d.unidadeSecundaria || undefined,
              // Quantidade de hectares da área do fornecedor (se cadastrada)
              quantidadeHa:
                d.quantidadeHa !== undefined && d.quantidadeHa !== null
                  ? Number(d.quantidadeHa)
                  : null,
              valor: Number(d.valor.toFixed(2)),
              valorTotalFruta: Number(d.valorTotalFruta.toFixed(2)),
              areaNome: d.areaNome,
              areaFornecedorId: d.areaFornecedorId,
              statusPedido: d.statusPedido,
              dataColheita: d.dataColheita ? d.dataColheita.toISOString() : undefined,
              frutaPedidoId: d.frutaPedidoId,
              frutaPedidoAreaId: d.frutaPedidoAreaId,
              // Campos de pagamento (podem ser undefined se não houver pagamento)
              pagamentoId:
                d.pagamentoId !== undefined && d.pagamentoId !== null
                  ? Number(d.pagamentoId)
                  : undefined,
              statusPagamento: d.statusPagamento || undefined,
              valorUnitario:
                d.valorUnitario !== undefined && d.valorUnitario !== null
                  ? Number(d.valorUnitario)
                  : undefined,
              valorTotal:
                d.valorTotal !== undefined && d.valorTotal !== null
                  ? Number(d.valorTotal)
                  : undefined,
              dataPagamento: d.dataPagamento ? d.dataPagamento.toISOString() : undefined,
              formaPagamento: d.formaPagamento || undefined,
            };
            return detalhe;
          }),
          distribuicaoPorUnidade: distribuicaoPorUnidadeArray,
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => b.totalValor - a.totalValor);

      return fornecedoresComDados;
    } catch (error) {
      console.error('Erro ao buscar dados de fornecedores para a dashboard:', error);
      return [];
    }
  }

  private async getPagamentosFornecedoresEfetuados(): Promise<PagamentoFornecedorEfetuadoDto[]> {
    try {
      // Buscar todos os pagamentos efetuados (status = PAGO)
      const pagamentos = await this.prisma.fornecedorPagamento.findMany({
        where: {
          status: StatusPagamentoFornecedor.PAGO,
        },
        include: {
          fornecedor: {
            select: {
              id: true,
              nome: true,
              cnpj: true,
              cpf: true,
            },
          },
          areaFornecedor: {
            select: {
              id: true,
              nome: true,
            },
          },
          pedido: {
            select: {
              id: true,
              numeroPedido: true,
              cliente: {
                select: {
                  nome: true,
                  razaoSocial: true,
                },
              },
            },
          },
          fruta: {
            select: {
              id: true,
              nome: true,
            },
          },
        },
        orderBy: {
          dataPagamento: 'desc',
        },
      });

      // Agrupar por fornecedor, data de pagamento e forma de pagamento
      const pagamentosAgrupados = new Map<string, any>();

      pagamentos.forEach(pagamento => {
        const dataPagamento = pagamento.dataPagamento;
        if (!dataPagamento) return;

        // Agrupar por fornecedor + data + formaPagamento
        const formaPagamento = pagamento.formaPagamento || 'NÃO INFORMADO';
        const chaveAgrupamento = `${pagamento.fornecedorId}-${dataPagamento.toISOString().split('T')[0]}-${formaPagamento}`;

        if (!pagamentosAgrupados.has(chaveAgrupamento)) {
          pagamentosAgrupados.set(chaveAgrupamento, {
            id: `${pagamento.fornecedorId}-${dataPagamento.getTime()}-${formaPagamento}`,
            fornecedorId: pagamento.fornecedorId,
            nomeFornecedor: pagamento.fornecedor.nome,
            cnpj: pagamento.fornecedor.cnpj || undefined,
            cpf: pagamento.fornecedor.cpf || undefined,
            dataPagamento: dataPagamento,
            totalPago: 0,
            quantidadePedidos: new Set(),
            quantidadeFrutas: new Set(),
            formaPagamento: formaPagamento,
            detalhes: [],
          });
        }

        const pagamentoAgrupado = pagamentosAgrupados.get(chaveAgrupamento);

        // Acumular valores
        pagamentoAgrupado.totalPago += pagamento.valorTotal || 0;
        pagamentoAgrupado.quantidadePedidos.add(pagamento.pedidoId);
        pagamentoAgrupado.quantidadeFrutas.add(pagamento.frutaId);

        // Adicionar detalhes
        pagamentoAgrupado.detalhes.push({
          pedidoNumero: pagamento.pedido.numeroPedido,
          cliente: pagamento.pedido.cliente.razaoSocial || pagamento.pedido.cliente.nome,
          fruta: pagamento.fruta.nome,
          areaNome: pagamento.areaFornecedor.nome,
          quantidadeColhida: pagamento.quantidade,
          unidadeMedida: pagamento.unidadeMedida,
          valorUnitario: pagamento.valorUnitario,
          valorTotal: pagamento.valorTotal,
          dataColheita: pagamento.dataColheita ? pagamento.dataColheita.toISOString() : undefined,
          dataPagamento: pagamento.dataPagamento.toISOString(),
          formaPagamento: pagamento.formaPagamento,
          observacoes: pagamento.observacoes || undefined,
        });
      });

      // Converter para array e ajustar contadores
      const pagamentosEfetuados = Array.from(pagamentosAgrupados.values()).map(pagamento => ({
        ...pagamento,
        quantidadePedidos: pagamento.quantidadePedidos.size,
        quantidadeFrutas: pagamento.quantidadeFrutas.size,
        dataPagamento: pagamento.dataPagamento.toISOString(),
      }));

      // Ordenar por data de pagamento mais recente primeiro
      return pagamentosEfetuados.sort((a, b) => 
        new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime()
      );

    } catch (error) {
      console.error('Erro ao buscar pagamentos efetuados de fornecedores:', error);
      return [];
    }
  }

  /**
   * Obter dados para gráfico de culturas/frutas
   * Agrupa por unidadePrecificada e retorna dados mensais
   */
  async getCulturasFrutas(
    tipo: 'culturas' | 'frutas',
    ids: number[],
    dataInicio?: string,
    dataFim?: string,
  ) {
    try {
      const inicio = dataInicio ? new Date(dataInicio) : new Date(new Date().setMonth(new Date().getMonth() - 6));
      const fim = dataFim ? new Date(dataFim) : new Date();

      // Buscar pedidos com colheita realizada no período
      const pedidos = await this.prisma.pedido.findMany({
        where: {
          dataColheita: {
            gte: inicio,
            lte: fim,
          },
          status: {
            not: 'CANCELADO',
          },
        },
        include: {
          frutasPedidos: {
            where: {
              unidadePrecificada: { not: null },
              quantidadePrecificada: { not: null, gt: 0 },
            },
            include: {
              fruta: {
                include: {
                  cultura: true,
                },
              },
            },
          },
        },
      });

      // Agrupar dados por período (mês) e item (cultura ou fruta)
      const dadosPorPeriodo: Record<string, Record<string, number>> = {};

      pedidos.forEach(pedido => {
        if (!pedido.dataColheita) return; // Pular se não tiver data de colheita
        const mes = new Date(pedido.dataColheita).toISOString().substring(0, 7); // YYYY-MM
        if (!dadosPorPeriodo[mes]) {
          dadosPorPeriodo[mes] = {};
        }

        pedido.frutasPedidos.forEach(fp => {
          if (!fp.unidadePrecificada || !fp.quantidadePrecificada) return;

          let chave: string;
          if (tipo === 'culturas') {
            chave = `${fp.fruta.cultura.id}-${fp.unidadePrecificada}`;
            if (ids.length > 0 && !ids.includes(fp.fruta.cultura.id)) return;
          } else {
            chave = `${fp.fruta.id}-${fp.unidadePrecificada}`;
            if (ids.length > 0 && !ids.includes(fp.fruta.id)) return;
          }

          if (!dadosPorPeriodo[mes][chave]) {
            dadosPorPeriodo[mes][chave] = 0;
          }
          dadosPorPeriodo[mes][chave] += fp.quantidadePrecificada;
        });
      });

      // Gerar períodos (meses) entre início e fim
      const periodos: string[] = [];
      const current = new Date(inicio);
      while (current <= fim) {
        periodos.push(current.toISOString().substring(0, 7));
        current.setMonth(current.getMonth() + 1);
      }

      // Criar séries agrupadas por item e unidade
      const seriesMap: Record<string, { nome: string; unidadePrecificada: string; dados: number[] }> = {};

      if (tipo === 'culturas') {
        const culturas = await this.prisma.cultura.findMany({
          where: ids.length > 0 ? { id: { in: ids } } : undefined,
        });

        culturas.forEach(cultura => {
          const unidades = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
          unidades.forEach(unidade => {
            const chave = `${cultura.id}-${unidade}`;
            seriesMap[chave] = {
              nome: cultura.descricao,
              unidadePrecificada: unidade,
              dados: periodos.map(periodo => dadosPorPeriodo[periodo]?.[chave] || 0),
            };
          });
        });
      } else {
        const frutas = await this.prisma.fruta.findMany({
          where: ids.length > 0 ? { id: { in: ids } } : undefined,
        });

        frutas.forEach(fruta => {
          const unidades = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
          unidades.forEach(unidade => {
            const chave = `${fruta.id}-${unidade}`;
            seriesMap[chave] = {
              nome: fruta.nome,
              unidadePrecificada: unidade,
              dados: periodos.map(periodo => dadosPorPeriodo[periodo]?.[chave] || 0),
            };
          });
        });
      }

      // Filtrar séries que têm pelo menos um valor > 0
      const series = Object.values(seriesMap).filter(serie => 
        serie.dados.some(valor => valor > 0)
      );

      return {
        periodos,
        series,
      };
    } catch (error) {
      console.error('Erro ao buscar dados de culturas/frutas:', error);
      return {
        periodos: [],
        series: [],
      };
    }
  }

  /**
   * Obter dados para gráfico de áreas e frutas
   * Retorna total colhido por área e fruta por mês
   */
  async getAreasFrutas(
    tipoArea: 'proprias' | 'fornecedores',
    frutaIds: number[],
    dataInicio?: string,
    dataFim?: string,
  ) {
    try {
      const inicio = dataInicio ? new Date(dataInicio) : new Date(new Date().setMonth(new Date().getMonth() - 6));
      const fim = dataFim ? new Date(dataFim) : new Date();

      // Buscar pedidos com colheita realizada no período
      const pedidos = await this.prisma.pedido.findMany({
        where: {
          dataColheita: {
            gte: inicio,
            lte: fim,
          },
          status: {
            not: 'CANCELADO',
          },
        },
        include: {
          frutasPedidos: {
            where: frutaIds.length > 0 ? { frutaId: { in: frutaIds } } : undefined,
            include: {
              fruta: true,
              areas: {
                include: {
                  areaPropria: true,
                  areaFornecedor: true,
                },
              },
            },
          },
        },
      });

      // Agrupar dados por período (mês), área e fruta
      const dadosPorPeriodo: Record<string, Record<string, number>> = {};

      pedidos.forEach(pedido => {
        if (!pedido.dataColheita) return; // Pular se não tiver data de colheita
        const mes = new Date(pedido.dataColheita).toISOString().substring(0, 7);
        if (!dadosPorPeriodo[mes]) {
          dadosPorPeriodo[mes] = {};
        }

        pedido.frutasPedidos.forEach(fp => {
          fp.areas.forEach(area => {
            // Filtrar apenas áreas do tipo selecionado
            if (tipoArea === 'proprias' && !area.areaPropriaId) return;
            if (tipoArea === 'fornecedores' && !area.areaFornecedorId) return;

            const areaId = tipoArea === 'proprias' 
              ? area.areaPropriaId 
              : area.areaFornecedorId;
            
            let areaNome: string | undefined;
            if (tipoArea === 'proprias' && area.areaPropria) {
              areaNome = area.areaPropria.nome;
            } else if (tipoArea === 'fornecedores' && area.areaFornecedor) {
              areaNome = area.areaFornecedor.nome;
            }

            if (!areaId || !areaNome) return;

            const chave = `${areaId}-${fp.frutaId}`;
            const quantidade = area.quantidadeColhidaUnidade1 || 0;

            if (!dadosPorPeriodo[mes][chave]) {
              dadosPorPeriodo[mes][chave] = 0;
            }
            dadosPorPeriodo[mes][chave] += quantidade;
          });
        });
      });

      // Gerar períodos
      const periodos: string[] = [];
      const current = new Date(inicio);
      while (current <= fim) {
        periodos.push(current.toISOString().substring(0, 7));
        current.setMonth(current.getMonth() + 1);
      }

      // Criar séries a partir dos dados coletados
      const seriesMap: Record<string, { areaNome: string; frutaNome: string; dados: number[] }> = {};

      // Buscar nomes de áreas e frutas
      const areasProprias = tipoArea === 'proprias' 
        ? await this.prisma.areaAgricola.findMany()
        : [];
      const areasFornecedores = tipoArea === 'fornecedores'
        ? await this.prisma.areaFornecedor.findMany()
        : [];
      
      const frutas = await this.prisma.fruta.findMany({
        where: frutaIds.length > 0 ? { id: { in: frutaIds } } : undefined,
      });

      // Criar mapas de nomes
      const nomesAreas: Record<number, string> = {};
      if (tipoArea === 'proprias') {
        areasProprias.forEach(area => {
          nomesAreas[area.id] = area.nome;
        });
      } else {
        areasFornecedores.forEach(area => {
          nomesAreas[area.id] = area.nome;
        });
      }

      const nomesFrutas: Record<number, string> = {};
      frutas.forEach(fruta => {
        nomesFrutas[fruta.id] = fruta.nome;
      });

      // Criar séries a partir dos dados coletados
      Object.keys(dadosPorPeriodo).forEach(periodo => {
        Object.keys(dadosPorPeriodo[periodo]).forEach(chave => {
          const [areaId, frutaId] = chave.split('-').map(Number);
          const serieKey = `${areaId}-${frutaId}`;
          
          if (!seriesMap[serieKey]) {
            seriesMap[serieKey] = {
              areaNome: nomesAreas[areaId] || `Área ${areaId}`,
              frutaNome: nomesFrutas[frutaId] || `Fruta ${frutaId}`,
              dados: periodos.map(() => 0),
            };
          }
          
          const periodoIndex = periodos.indexOf(periodo);
          if (periodoIndex >= 0) {
            seriesMap[serieKey].dados[periodoIndex] = dadosPorPeriodo[periodo][chave];
          }
        });
      });

      // Filtrar séries com dados
      const series = Object.values(seriesMap).filter(serie => 
        serie.dados.some(valor => valor > 0)
      );

      return {
        periodos,
        series,
      };
    } catch (error) {
      console.error('Erro ao buscar dados de áreas/frutas:', error);
      return {
        periodos: [],
        series: [],
      };
    }
  }

  /**
   * Obter listagem de áreas com frutas colhidas e média por hectare
   */
  async getListagemAreas(
    busca?: string,
    frutaIds?: number[],
    dataInicio?: string,
    dataFim?: string,
  ) {
    try {
      const inicio = dataInicio ? new Date(dataInicio) : undefined;
      const fim = dataFim ? new Date(dataFim) : undefined;

      // Buscar pedidos com filtros
      const wherePedido: any = {
        status: { not: 'CANCELADO' },
      };

      if (inicio || fim) {
        wherePedido.dataColheita = {};
        if (inicio) wherePedido.dataColheita.gte = inicio;
        if (fim) wherePedido.dataColheita.lte = fim;
      }

      const pedidos = await this.prisma.pedido.findMany({
        where: wherePedido,
        include: {
          frutasPedidos: {
            where: frutaIds && frutaIds.length > 0 ? { frutaId: { in: frutaIds } } : undefined,
            include: {
              fruta: true,
              areas: {
                include: {
                  areaPropria: true,
                  areaFornecedor: true,
                },
              },
            },
          },
        },
      });

      // Agrupar por área
      const areasMap: Record<string, {
        id: number;
        nome: string;
        tipo: 'propria' | 'fornecedor';
        tamanhoHa: number;
        frutas: Array<{
          frutaId: number;
          frutaNome: string;
          quantidadeColhida: number;
          unidade: string;
          mediaPorHectare: number;
        }>;
      }> = {};

      pedidos.forEach(pedido => {
        pedido.frutasPedidos.forEach(fp => {
          fp.areas.forEach(area => {
            let areaKey: string;
            let areaData: any;

            if (area.areaPropriaId) {
              areaKey = `propria-${area.areaPropriaId}`;
              areaData = area.areaPropria;
            } else if (area.areaFornecedorId) {
              areaKey = `fornecedor-${area.areaFornecedorId}`;
              areaData = area.areaFornecedor;
            } else {
              return;
            }

            // Filtrar por busca
            if (busca && areaData.nome.toLowerCase().indexOf(busca.toLowerCase()) === -1) {
              return;
            }

            if (!areasMap[areaKey]) {
              areasMap[areaKey] = {
                id: areaData.id,
                nome: areaData.nome,
                tipo: area.areaPropriaId ? 'propria' : 'fornecedor',
                tamanhoHa: area.areaPropriaId 
                  ? areaData.areaTotal 
                  : (areaData.quantidadeHa || 0),
                frutas: [],
              };
            }

            const quantidade = area.quantidadeColhidaUnidade1 || 0;
            const tamanhoHa = areasMap[areaKey].tamanhoHa;
            const mediaPorHectare = tamanhoHa > 0 ? quantidade / tamanhoHa : 0;

            // Verificar se fruta já existe
            const frutaIndex = areasMap[areaKey].frutas.findIndex(f => f.frutaId === fp.frutaId);
            if (frutaIndex >= 0) {
              areasMap[areaKey].frutas[frutaIndex].quantidadeColhida += quantidade;
              areasMap[areaKey].frutas[frutaIndex].mediaPorHectare = 
                tamanhoHa > 0 ? areasMap[areaKey].frutas[frutaIndex].quantidadeColhida / tamanhoHa : 0;
            } else {
              areasMap[areaKey].frutas.push({
                frutaId: fp.fruta.id,
                frutaNome: fp.fruta.nome,
                quantidadeColhida: quantidade,
                unidade: fp.unidadeMedida1,
                mediaPorHectare,
              });
            }
          });
        });
      });

      return {
        areas: Object.values(areasMap),
      };
    } catch (error) {
      console.error('Erro ao buscar listagem de áreas:', error);
      return {
        areas: [],
      };
    }
  }

  async getDadosPainelFrutas(mes?: number, ano?: number) {
    const whereDataColheita: any = {};

    // Se mês e ano forem fornecidos, aplica o filtro. 
    // Caso contrário, traz todo o histórico (limitado aos status válidos).
    if (mes && ano) {
      const dataInicio = new Date(ano, mes - 1, 1);
      const dataFim = new Date(ano, mes, 0, 23, 59, 59);
      whereDataColheita.dataColheita = {
        gte: dataInicio,
        lte: dataFim
      };
    } else if (ano) {
      // Filtro apenas por ano (opcional, mas útil)
      const dataInicio = new Date(ano, 0, 1);
      const dataFim = new Date(ano, 11, 31, 23, 59, 59);
      whereDataColheita.dataColheita = {
        gte: dataInicio,
        lte: dataFim
      };
    }

    // Status considerados como "Colheita Realizada" e válidos para estatísticas
    const statusValidos: StatusPedido[] = [
      StatusPedido.COLHEITA_REALIZADA,
      StatusPedido.AGUARDANDO_PRECIFICACAO,
      StatusPedido.PRECIFICACAO_REALIZADA,
      StatusPedido.AGUARDANDO_PAGAMENTO,
      StatusPedido.PAGAMENTO_PARCIAL,
      StatusPedido.PAGAMENTO_REALIZADO,
      StatusPedido.PEDIDO_FINALIZADO
    ];

    // 1. Buscar todas as culturas ativas para estruturar o retorno
    const culturas = await this.prisma.cultura.findMany({
      include: { frutas: true }
    });

    // 2. Buscar pedidos no período
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        status: { in: statusValidos },
        ...whereDataColheita // Espalha o filtro de data (ou vazio se for tudo)
      },
      include: {
        frutasPedidos: {
          where: {
            quantidadePrecificada: { not: null, gt: 0 } // Apenas itens precificados
          },
          include: {
            fruta: true,
            areas: {
              include: {
                areaPropria: true,
                areaFornecedor: true
              }
            }
          }
        }
      }
    });

    // 3. Processar e Agrupar Dados
    const resultado = culturas.map(cultura => {
      // Filtrar itens deste pedido que são desta cultura
      const itensCultura = pedidos.flatMap(p => {
        const pedido = p as any;
        return (pedido.frutasPedidos || []).filter((fp: any) => fp.fruta?.culturaId === cultura.id);
      });

      if (itensCultura.length === 0) return null; // Pula cultura sem dados

      // Unidade padrão da cultura (pega a primeira encontrada ou define padrão)
      const unidadePadrao = itensCultura[0]?.unidadePrecificada || 'KG';

      // Totais da Cultura
      const totalQtd = itensCultura.reduce((acc, item) => acc + (item.quantidadePrecificada || 0), 0);
      const totalValor = itensCultura.reduce((acc, item) => acc + (item.valorTotal || 0), 0);

      // Agrupamento por Fruta (para gráficos e detalhes)
      const frutasDados = cultura.frutas.map(fruta => {
        const itensFruta = itensCultura.filter(i => i.frutaId === fruta.id);
        if (itensFruta.length === 0) return null;

        const totalFruta = itensFruta.reduce((acc, item) => acc + (item.quantidadePrecificada || 0), 0);

        // Agrupamento por Área (para produtividade)
        const areasMap = new Map();
        
        itensFruta.forEach(item => {
          item.areas.forEach(areaRel => {
            const area = areaRel.areaPropria || areaRel.areaFornecedor;
            if (!area) return;
            
            const areaId = `${areaRel.areaPropriaId ? 'P' : 'F'}-${area.id}`;
            
            if (!areasMap.has(areaId)) {
              areasMap.set(areaId, {
                nome: area.nome,
                tipo: areaRel.areaPropriaId ? 'Propria' : 'Fornecedor',
                tamanhoHa: areaRel.areaPropria ? areaRel.areaPropria.areaTotal : (areaRel.areaFornecedor.quantidadeHa || 0),
                totalColhido: 0
              });
            }
            
            // Distribuição simples: Soma o que foi apontado na área
            // Nota: Para precisão exata com precificação, idealmente faríamos rateio, 
            // mas usar a qtd da área é mais seguro para "produtividade física".
            const qtdArea = areaRel.quantidadeColhidaUnidade1 || 0; 
            areasMap.get(areaId).totalColhido += qtdArea;
          });
        });

        // Calcular produtividade
        const areas = Array.from(areasMap.values()).map((a: any) => ({
          ...a,
          produtividade: a.tamanhoHa > 0 ? (a.totalColhido / a.tamanhoHa) : 0
        })).sort((a, b) => b.produtividade - a.produtividade);

        // Agrupar dados por dia para o gráfico
        const dadosGraficoMap = new Map();
        itensFruta.forEach(item => {
          const pedido = pedidos.find(p => p.id === item.pedidoId);
          if(pedido && pedido.dataColheita) {
            const dia = pedido.dataColheita.getDate();
            dadosGraficoMap.set(dia, (dadosGraficoMap.get(dia) || 0) + item.quantidadePrecificada);
          }
        });

        const dadosGrafico = Array.from(dadosGraficoMap.entries())
          .map(([dia, qtd]) => ({ dia, qtd }))
          .sort((a, b) => a.dia - b.dia);

        return {
          id: fruta.id,
          nome: fruta.nome,
          total: totalFruta,
          unidade: unidadePadrao,
          areas,
          dadosGrafico
        };
      }).filter(Boolean);

      // Calcular área total envolvida (soma de todas as áreas únicas que tiveram colheita)
      const areasUnicas = new Set();
      let areaTotalHa = 0;
      frutasDados.forEach((f: any) => {
        f.areas.forEach((a: any) => {
          if (!areasUnicas.has(a.nome)) { // Usando nome como chave única simples
            areasUnicas.add(a.nome);
            areaTotalHa += a.tamanhoHa;
          }
        });
      });

      return {
        cultura: cultura.descricao,
        culturaId: cultura.id,
        resumo: {
          totalColhido: totalQtd,
          valorTotal: totalValor,
          areaTotalHa,
          unidade: unidadePadrao,
          produtividadeMedia: areaTotalHa > 0 ? totalQtd / areaTotalHa : 0
        },
        frutas: frutasDados
      };
    }).filter(Boolean);

    return resultado;
  }
}