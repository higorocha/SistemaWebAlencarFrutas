// src/dashboard/dashboard.service.ts

import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DashboardResponseDto, ReceitaMensalDto, ProgramacaoColheitaDto, PrevisaoBananaDto } from './dto/dashboard-response.dto';

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
      previsoesBanana
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
      this.getPrevisoesBanana()
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
      previsoesBanana
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
}