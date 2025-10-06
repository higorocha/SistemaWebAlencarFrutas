// src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardResponseDto, ReceitaMensalDto, ProgramacaoColheitaDto, PrevisaoBananaDto, PagamentoEfetuadoDto } from './dto/dashboard-response.dto';

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
      receitaMensal,
      programacaoColheita,
      previsoesBanana,
      pagamentosPendentes,
      pagamentosEfetuados
    ] = await Promise.all([
      this.getFaturamentoTotal(),
      this.getFaturamentoAberto(),
      this.getTotalClientes(),
      this.getTotalPedidos(),
      this.getAreasProdutivasHa(),
      this.getFrutasCadastradas(),
      this.getPedidosAtivos(),
      this.getReceitaMensal(),
      this.getProgramacaoColheita(),
      this.getPrevisoesBanana(),
      this.getPagamentosPendentes(),
      this.getPagamentosEfetuados()
    ]);

    const result = {
      faturamentoTotal,
      faturamentoAberto,
      totalClientes,
      totalPedidos,
      areasProdutivasHa,
      frutasCadastradas,
      pedidosAtivos,
      receitaMensal,
      programacaoColheita,
      previsoesBanana,
      pagamentosPendentes,
      pagamentosEfetuados
    };


    return result;
  }

  private async getFaturamentoTotal(): Promise<number> {
    const result = await this.prisma.pedido.aggregate({
      _sum: {
        valorFinal: true,
      },
      where: {
        status: 'PEDIDO_FINALIZADO',
        valorFinal: {
          not: null,
        },
      },
    });

    return result._sum.valorFinal || 0;
  }

  private async getFaturamentoAberto(): Promise<number> {
    const result = await this.prisma.pedido.aggregate({
      _sum: {
        valorFinal: true,
      },
      where: {
        status: {
          notIn: ['PEDIDO_FINALIZADO', 'CANCELADO'],
        },
        valorFinal: {
          not: null,
        },
      },
    });

    return result._sum.valorFinal || 0;
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
          notIn: ['PEDIDO_FINALIZADO', 'CANCELADO'],
        },
      },
    });
  }

  private async getReceitaMensal(): Promise<ReceitaMensalDto[]> {
    // Últimos 6 meses
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const pedidosFinalizados = await this.prisma.pedido.findMany({
      where: {
        status: 'PEDIDO_FINALIZADO',
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
    const dataAtual = new Date();

    // Buscar TODOS os pedidos com status de colheita (futuros e atrasados)
    // Ordenar por data: atrasados primeiro (prioridade), depois futuros
    const pedidos = await this.prisma.pedido.findMany({
      where: {
        status: {
          in: ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA'],
        },
      },
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
        dataPrevistaColheita: 'asc', // Mais antigos primeiro (atrasados têm prioridade)
      },
      take: 15, // Aumentar limite para mostrar mais pedidos
    });

    const programacao: ProgramacaoColheitaDto[] = [];

    pedidos.forEach(pedido => {
      const clienteNome = pedido.cliente.razaoSocial || pedido.cliente.nome;
      const diasRestantes = Math.ceil(
        (pedido.dataPrevistaColheita.getTime() - dataAtual.getTime()) / (1000 * 60 * 60 * 24)
      );

      const statusVisualizacao = diasRestantes < 0 ? 'ATRASADO' : pedido.status;

      pedido.frutasPedidos.forEach(frutaPedido => {
        programacao.push({
          pedidoId: pedido.id,
          cliente: clienteNome,
          fruta: frutaPedido.fruta.nome,
          quantidadePrevista: frutaPedido.quantidadePrevista,
          unidade: frutaPedido.unidadeMedida1,
          dataPrevistaColheita: pedido.dataPrevistaColheita.toISOString(),
          status: statusVisualizacao, // Usar status com indicação de atraso
          diasRestantes: diasRestantes, // Permitir valores negativos para indicar atraso
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
              pagamentoEfetuado: false, // Apenas pagamentos pendentes
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
        // Calcular totais agregados
        const totalPendente = turma.custosColheita.reduce(
          (acc, custo) => acc + (custo.valorColheita || 0),
          0
        );

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
}