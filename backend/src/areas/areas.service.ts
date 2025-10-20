import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAreaDto, UpdateAreaDto, AreaResponseDto, CulturaAreaDto } from './dto';

@Injectable()
export class AreasService {
  constructor(private prisma: PrismaService) {}

  async create(createAreaDto: CreateAreaDto): Promise<AreaResponseDto> {
    const { culturas, ...areaData } = createAreaDto;

    try {
      const area = await this.prisma.areaAgricola.create({
        data: {
          ...areaData,
          lotes: {
            create: culturas.map(cultura => ({
              culturaId: cultura.culturaId,
              areaPlantada: cultura.areaPlantada,
              areaProduzindo: cultura.areaProduzindo,
            })),
          },
        },
        include: {
          lotes: {
            include: {
              cultura: true,
            },
          },
        },
      });

      return this.mapToResponseDto(area);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Área com este nome já existe');
      }
      throw error;
    }
  }

  async findAll(): Promise<AreaResponseDto[]> {
    const areas = await this.prisma.areaAgricola.findMany({
      where: {
        desativar: false, // ✅ Filtrar apenas áreas ativas
      },
      include: {
        lotes: {
          include: {
            cultura: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return areas.map(this.mapToResponseDto);
  }

  async findAllIncludingInactive(): Promise<AreaResponseDto[]> {
    const areas = await this.prisma.areaAgricola.findMany({
      include: {
        lotes: {
          include: {
            cultura: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
    });

    return areas.map(this.mapToResponseDto);
  }

  async buscarPorNome(termo: string): Promise<AreaResponseDto[]> {
    if (!termo || termo.trim().length < 2) {
      return [];
    }

    const areas = await this.prisma.areaAgricola.findMany({
      where: {
        nome: {
          contains: termo.trim(),
          mode: 'insensitive',
        },
        desativar: false, // ✅ Filtrar apenas áreas ativas
      },
      include: {
        lotes: {
          include: {
            cultura: true,
          },
        },
      },
      orderBy: {
        nome: 'asc',
      },
      take: 10, // Limitar a 10 resultados
    });

    return areas.map(this.mapToResponseDto);
  }

  async findOne(id: number): Promise<AreaResponseDto> {
    const area = await this.prisma.areaAgricola.findUnique({
      where: { id },
      include: {
        lotes: {
          include: {
            cultura: true,
          },
        },
      },
    });

    if (!area) {
      throw new NotFoundException('Área agrícola não encontrada');
    }

    return this.mapToResponseDto(area);
  }

  async update(id: number, updateAreaDto: UpdateAreaDto): Promise<AreaResponseDto> {
    // Verificar se a área existe
    const existingArea = await this.prisma.areaAgricola.findUnique({
      where: { id },
    });

    if (!existingArea) {
      throw new NotFoundException('Área agrícola não encontrada');
    }

    const { culturas, ...areaData } = updateAreaDto;

    try {
      // Se há culturas para atualizar, primeiro remove todas e depois cria as novas
      if (culturas) {
        await this.prisma.lotesCulturas.deleteMany({
          where: { areaAgricolaId: id },
        });
      }

      const area = await this.prisma.areaAgricola.update({
        where: { id },
        data: {
          ...areaData,
          ...(culturas && {
            lotes: {
              create: culturas.map(cultura => ({
                culturaId: cultura.culturaId,
                areaPlantada: cultura.areaPlantada,
                areaProduzindo: cultura.areaProduzindo,
              })),
            },
          }),
        },
        include: {
          lotes: {
            include: {
              cultura: true,
            },
          },
        },
      });

      return this.mapToResponseDto(area);
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('Área com este nome já existe');
      }
      throw error;
    }
  }

  async remove(id: number): Promise<void> {
    // Verificar se a área existe
    const area = await this.prisma.areaAgricola.findUnique({
      where: { id },
    });

    if (!area) {
      throw new NotFoundException('Área agrícola não encontrada');
    }

    // As culturas serão removidas automaticamente devido ao onDelete: Cascade
    await this.prisma.areaAgricola.delete({
      where: { id },
    });
  }

  async toggleDesativar(id: number): Promise<AreaResponseDto> {
    // Verificar se a área existe
    const existingArea = await this.prisma.areaAgricola.findUnique({
      where: { id },
      include: {
        lotes: {
          include: {
            cultura: true,
          },
        },
      },
    });

    if (!existingArea) {
      throw new NotFoundException('Área agrícola não encontrada');
    }

    // Alternar o status de desativar
    const area = await this.prisma.areaAgricola.update({
      where: { id },
      data: {
        desativar: !existingArea.desativar,
      },
      include: {
        lotes: {
          include: {
            cultura: true,
          },
        },
      },
    });

    return this.mapToResponseDto(area);
  }

  /**
   * Busca detalhes completos da área incluindo estatísticas e KPIs
   */
  async findDetalhes(id: number) {
    // 1. Buscar área com culturas e controle de banana
    const area = await this.prisma.areaAgricola.findUnique({
      where: { id },
      include: {
        lotes: {
          include: {
            cultura: true,
          },
        },
        controlesBanana: {
          include: {
            fitaBanana: true,
          },
        },
      },
    });

    if (!area) {
      throw new NotFoundException('Área agrícola não encontrada');
    }

    // 2. Buscar pedidos relacionados via FrutasPedidosAreas
    const pedidosRelacionados = await this.prisma.pedido.findMany({
      where: {
        frutasPedidos: {
          some: {
            areas: {
              some: { areaPropriaId: id },
            },
          },
        },
      },
      include: {
        cliente: true,
        frutasPedidos: {
          include: {
            fruta: true,
            areas: {
              include: {
                areaPropria: true,
                areaFornecedor: {
                  include: {
                    fornecedor: true,
                  },
                },
              },
            },
            fitas: {
              include: {
                fitaBanana: true,
                controleBanana: {
                  include: {
                    areaAgricola: true,
                  },
                },
              },
            },
          },
        },
        pagamentosPedidos: true,
      },
      orderBy: {
        dataPedido: 'desc',
      },
    });

    // 3. Buscar custos de colheita relacionados a esses pedidos
    const pedidoIds = pedidosRelacionados.map(p => p.id);
    const custosColheita = pedidoIds.length > 0
      ? await this.prisma.turmaColheitaPedidoCusto.findMany({
          where: {
            pedidoId: { in: pedidoIds },
          },
          include: {
            turmaColheita: true,
            pedido: {
              select: {
                numeroPedido: true,
              },
            },
            fruta: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        })
      : [];

    // 4. Calcular estatísticas
    const estatisticas = this.calcularEstatisticas(pedidosRelacionados, custosColheita);

    // 5. Formatar resposta
    return {
      id: area.id,
      nome: area.nome,
      categoria: area.categoria,
      areaTotal: area.areaTotal,
      coordenadas: area.coordenadas,
      createdAt: area.createdAt,
      updatedAt: area.updatedAt,
      
      // Culturas formatadas
      culturas: area.lotes.map(lote => ({
        id: lote.id,
        culturaId: lote.culturaId,
        areaPlantada: lote.areaPlantada,
        areaProduzindo: lote.areaProduzindo,
        cultura: {
          id: lote.cultura.id,
          descricao: lote.cultura.descricao,
          periodicidade: lote.cultura.periodicidade,
          permitirConsorcio: lote.cultura.permitirConsorcio,
        },
        createdAt: lote.createdAt,
        updatedAt: lote.updatedAt,
      })),

      // Pedidos formatados
      pedidos: pedidosRelacionados.map(pedido => ({
        id: pedido.id,
        numeroPedido: pedido.numeroPedido,
        clienteId: pedido.clienteId,
        cliente: pedido.cliente,
        dataPedido: pedido.dataPedido,
        dataPrevistaColheita: pedido.dataPrevistaColheita,
        dataColheita: pedido.dataColheita,
        status: pedido.status,
        valorFinal: pedido.valorFinal,
        valorRecebido: pedido.valorRecebido,
        observacoes: pedido.observacoes,
        frutas: pedido.frutasPedidos,
        custosColheita: custosColheita.filter(c => c.pedidoId === pedido.id),
      })),

      // Custos de colheita consolidados
      custosColheita: custosColheita.map(custo => ({
        id: custo.id,
        turmaColheitaId: custo.turmaColheitaId,
        turma: custo.turmaColheita,
        pedidoId: custo.pedidoId,
        pedido: custo.pedido,
        frutaId: custo.frutaId,
        fruta: custo.fruta,
        quantidadeColhida: custo.quantidadeColhida,
        unidadeMedida: custo.unidadeMedida,
        valorColheita: custo.valorColheita,
        dataColheita: custo.dataColheita,
        pagamentoEfetuado: custo.pagamentoEfetuado,
        dataPagamento: custo.dataPagamento,
      })),

      // Controle de banana (se houver)
      controlesBanana: area.controlesBanana.map(controle => ({
        id: controle.id,
        fitaBananaId: controle.fitaBananaId,
        fitaBanana: controle.fitaBanana,
        quantidadeFitas: controle.quantidadeFitas,
        quantidadeInicialFitas: controle.quantidadeInicialFitas,
        dataRegistro: controle.dataRegistro,
        observacoes: controle.observacoes,
        createdAt: controle.createdAt,
        updatedAt: controle.updatedAt,
      })),

      // Estatísticas calculadas
      estatisticas,
    };
  }

  /**
   * Calcula estatísticas e KPIs baseados nos pedidos e custos
   */
  private calcularEstatisticas(pedidos: any[], custos: any[]) {
    const totalPedidos = pedidos.length;
    
    // ✅ FATURAMENTO = Soma dos PAGAMENTOS RECEBIDOS (não valorFinal)
    const totalFaturamento = pedidos.reduce((sum, p) => sum + (p.valorRecebido || 0), 0);
    const totalRecebido = totalFaturamento; // Mesmo valor, pois só contamos o que foi pago
    
    const totalCustos = custos.reduce((sum, c) => sum + (c.valorColheita || 0), 0);
    const margemBruta = totalFaturamento - totalCustos;
    
    // Ticket médio baseado em pedidos com pagamento
    const pedidosComPagamento = pedidos.filter(p => (p.valorRecebido || 0) > 0);
    const ticketMedio = pedidosComPagamento.length > 0 
      ? totalFaturamento / pedidosComPagamento.length 
      : 0;

    // ✅ INADIMPLÊNCIA = Pedidos com mais de 30 dias da colheita sem pagamento completo
    const valorInadimplente = this.calcularInadimplencia(pedidos);
    const totalValorPedidos = pedidos.reduce((sum, p) => sum + (p.valorFinal || 0), 0);
    const taxaInadimplencia = totalValorPedidos > 0 
      ? (valorInadimplente / totalValorPedidos) * 100 
      : 0;

    // Faturamento por mês (baseado em pagamentos)
    const faturamentoPorMes = this.agruparPorMes(pedidos, custos);

    // Principais clientes (baseado em pagamentos)
    const principaisClientes = this.topClientes(pedidos, 10);

    // Produção por mês e fruta (quantidades precificadas)
    const producaoPorMesFruta = this.agruparProducaoPorMesFruta(pedidos);

    return {
      totalPedidos,
      totalFaturamento, // Total recebido em pagamentos
      totalRecebido, // Mesmo valor
      totalCustos,
      margemBruta,
      ticketMedio,
      taxaInadimplencia,
      valorInadimplente, // Valor total em atraso
      faturamentoPorMes,
      principaisClientes,
      producaoPorMesFruta,
    };
  }

  /**
   * Calcula valor total em inadimplência
   * Considera inadimplente: pedidos com mais de 30 dias da colheita sem pagamento completo
   */
  private calcularInadimplencia(pedidos: any[]): number {
    const hoje = new Date();
    const trintaDiasEmMs = 30 * 24 * 60 * 60 * 1000;

    return pedidos.reduce((total, pedido) => {
      // Se não tem data de colheita, não considera inadimplente
      if (!pedido.dataColheita) return total;

      // Se não tem valor final, não considera
      if (!pedido.valorFinal || pedido.valorFinal <= 0) return total;

      // Calcular dias desde a colheita
      const dataColheita = new Date(pedido.dataColheita);
      const diasDesdeColheita = hoje.getTime() - dataColheita.getTime();

      // Se menos de 30 dias, não é inadimplente
      if (diasDesdeColheita < trintaDiasEmMs) return total;

      // Calcular saldo devedor
      const valorRecebido = pedido.valorRecebido || 0;
      const saldoDevedor = pedido.valorFinal - valorRecebido;

      // Se tem saldo devedor, adiciona ao total inadimplente
      if (saldoDevedor > 0) {
        return total + saldoDevedor;
      }

      return total;
    }, 0);
  }

  /**
   * Agrupa faturamento e custos por mês
   * Faturamento = soma dos PAGAMENTOS recebidos por mês
   */
  private agruparPorMes(pedidos: any[], custos: any[]) {
    const mesesMap: Record<string, { faturamento: number; custos: number }> = {};

    // ✅ Agrupar faturamento baseado em PAGAMENTOS (não valorFinal)
    pedidos.forEach(pedido => {
      // Usar data da colheita para agrupar (não dataPedido)
      if (pedido.dataColheita && pedido.valorRecebido && pedido.valorRecebido > 0) {
        const data = new Date(pedido.dataColheita);
        const mes = this.formatarMesAno(data);
        
        if (!mesesMap[mes]) {
          mesesMap[mes] = { faturamento: 0, custos: 0 };
        }
        // Adicionar valor recebido (pagamentos) ao invés de valorFinal
        mesesMap[mes].faturamento += pedido.valorRecebido;
      }
    });

    // Agrupar custos
    custos.forEach(custo => {
      if (custo.dataColheita && custo.valorColheita) {
        const data = new Date(custo.dataColheita);
        const mes = this.formatarMesAno(data);
        
        if (!mesesMap[mes]) {
          mesesMap[mes] = { faturamento: 0, custos: 0 };
        }
        mesesMap[mes].custos += custo.valorColheita;
      }
    });

    // Converter para array e ordenar cronologicamente (janeiro -> dezembro)
    return Object.entries(mesesMap)
      .map(([mes, valores]) => ({
        mes,
        faturamento: valores.faturamento,
        custos: valores.custos,
        margem: valores.faturamento - valores.custos,
      }))
      .sort((a, b) => {
        // Ordenar do mais antigo para o mais recente
        const [mesA, anoA] = a.mes.split('/');
        const [mesB, anoB] = b.mes.split('/');
        const dataA = new Date(`20${anoA}-${this.mesParaNumero(mesA)}-01`);
        const dataB = new Date(`20${anoB}-${this.mesParaNumero(mesB)}-01`);
        return dataA.getTime() - dataB.getTime();
      });
  }

  /**
   * Formata data para o padrão "mes/ano" (ex: "jan/24")
   */
  private formatarMesAno(data: Date): string {
    const mesesAbrev = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 
                        'jul', 'ago', 'set', 'out', 'nov', 'dez'];
    const mes = mesesAbrev[data.getMonth()];
    const ano = data.getFullYear().toString().slice(-2);
    return `${mes}/${ano}`;
  }

  /**
   * Converte nome do mês abreviado para número
   */
  private mesParaNumero(mes: string): string {
    const meses: Record<string, string> = {
      'jan': '01', 'fev': '02', 'mar': '03', 'abr': '04',
      'mai': '05', 'jun': '06', 'jul': '07', 'ago': '08',
      'set': '09', 'out': '10', 'nov': '11', 'dez': '12',
    };
    return meses[mes.toLowerCase()] || '01';
  }

  /**
   * Agrupa produção por mês e fruta
   * Soma TODAS as unidades de medida (unidade1 + unidade2)
   * Para unidade precificada: usa quantidadePrecificada
   * Para outra unidade: usa quantidadeReal ou quantidadeReal2
   */
  private agruparProducaoPorMesFruta(pedidos: any[]) {
    // Map: unidade -> mes -> fruta -> quantidade
    const producaoPorUnidade: Record<string, Record<string, Record<string, number>>> = {};
    const unidadesEncontradas = new Set<string>();

    pedidos.forEach(pedido => {
      if (pedido.dataColheita && pedido.frutasPedidos) {
        const data = new Date(pedido.dataColheita);
        const mes = this.formatarMesAno(data);

        pedido.frutasPedidos.forEach((fp: any) => {
          if (fp.fruta) {
            const frutaNome = fp.fruta.nome || 'Sem fruta';

            // Processar unidade 1 (sempre existe)
            if (fp.unidadeMedida1) {
              const unidade1 = fp.unidadeMedida1;
              unidadesEncontradas.add(unidade1);

              // Se unidade1 é a precificada, usa quantidadePrecificada, senão usa quantidadeReal
              let quantidade1 = 0;
              if (fp.unidadePrecificada === unidade1 && fp.quantidadePrecificada) {
                quantidade1 = fp.quantidadePrecificada;
              } else if (fp.quantidadeReal) {
                quantidade1 = fp.quantidadeReal;
              }

              if (quantidade1 > 0) {
                if (!producaoPorUnidade[unidade1]) {
                  producaoPorUnidade[unidade1] = {};
                }
                if (!producaoPorUnidade[unidade1][mes]) {
                  producaoPorUnidade[unidade1][mes] = {};
                }
                if (!producaoPorUnidade[unidade1][mes][frutaNome]) {
                  producaoPorUnidade[unidade1][mes][frutaNome] = 0;
                }
                producaoPorUnidade[unidade1][mes][frutaNome] += quantidade1;
              }
            }

            // Processar unidade 2 (se existir)
            if (fp.unidadeMedida2) {
              const unidade2 = fp.unidadeMedida2;
              unidadesEncontradas.add(unidade2);

              // Se unidade2 é a precificada, usa quantidadePrecificada, senão usa quantidadeReal2
              let quantidade2 = 0;
              if (fp.unidadePrecificada === unidade2 && fp.quantidadePrecificada) {
                quantidade2 = fp.quantidadePrecificada;
              } else if (fp.quantidadeReal2) {
                quantidade2 = fp.quantidadeReal2;
              }

              if (quantidade2 > 0) {
                if (!producaoPorUnidade[unidade2]) {
                  producaoPorUnidade[unidade2] = {};
                }
                if (!producaoPorUnidade[unidade2][mes]) {
                  producaoPorUnidade[unidade2][mes] = {};
                }
                if (!producaoPorUnidade[unidade2][mes][frutaNome]) {
                  producaoPorUnidade[unidade2][mes][frutaNome] = 0;
                }
                producaoPorUnidade[unidade2][mes][frutaNome] += quantidade2;
              }
            }
          }
        });
      }
    });

    // Processar cada unidade separadamente
    const resultado = {};
    const unidades = Array.from(unidadesEncontradas);

    unidades.forEach(unidade => {
      const producaoMap = producaoPorUnidade[unidade];
      
      if (!producaoMap) {
        resultado[unidade] = [];
        return;
      }

      // Ordenar meses cronologicamente (janeiro -> dezembro)
      const mesesOrdenados = Object.keys(producaoMap).sort((a, b) => {
        const [mesA, anoA] = a.split('/');
        const [mesB, anoB] = b.split('/');
        const dataA = new Date(`20${anoA}-${this.mesParaNumero(mesA)}-01`);
        const dataB = new Date(`20${anoB}-${this.mesParaNumero(mesB)}-01`);
        return dataA.getTime() - dataB.getTime();
      });

      // Coletar todas as frutas únicas para esta unidade
      const frutasUnicas = new Set<string>();
      Object.values(producaoMap).forEach(frutasPorMes => {
        Object.keys(frutasPorMes).forEach(fruta => frutasUnicas.add(fruta));
      });

      // Criar array de dados para esta unidade
      resultado[unidade] = mesesOrdenados.map(mes => {
        const dados: any = { mes };
        
        // Adicionar dados de cada fruta
        frutasUnicas.forEach(fruta => {
          dados[fruta] = producaoMap[mes][fruta] || 0;
        });

        return dados;
      });
    });

    // Retornar objeto com dados por unidade e lista de unidades disponíveis
    return {
      unidades: unidades,
      dados: resultado,
    };
  }

  /**
   * Retorna top N clientes por faturamento (baseado em PAGAMENTOS recebidos)
   */
  private topClientes(pedidos: any[], limite: number) {
    const clientesMap: Record<number, { id: number; nome: string; totalPedidos: number; totalFaturamento: number }> = {};

    pedidos.forEach(pedido => {
      if (pedido.cliente) {
        const clienteId = pedido.cliente.id;
        
        if (!clientesMap[clienteId]) {
          clientesMap[clienteId] = {
            id: clienteId,
            nome: pedido.cliente.nome,
            totalPedidos: 0,
            totalFaturamento: 0,
          };
        }

        // Sempre conta o pedido
        clientesMap[clienteId].totalPedidos += 1;
        
        // ✅ Faturamento = valor RECEBIDO (pagamentos), não valorFinal
        clientesMap[clienteId].totalFaturamento += pedido.valorRecebido || 0;
      }
    });

    return Object.values(clientesMap)
      .sort((a, b) => b.totalFaturamento - a.totalFaturamento)
      .slice(0, limite);
  }

  private mapToResponseDto(area: any): AreaResponseDto {
    return {
      id: area.id,
      nome: area.nome,
      categoria: area.categoria,
      areaTotal: area.areaTotal,
      coordenadas: area.coordenadas,
      desativar: area.desativar || false,
      culturas: area.lotes.map(lc => ({
        culturaId: lc.culturaId,
        areaPlantada: lc.areaPlantada,
        areaProduzindo: lc.areaProduzindo,
        descricao: lc.cultura?.descricao || `Cultura ${lc.culturaId}`,
      })),
      createdAt: area.createdAt,
      updatedAt: area.updatedAt,
    };
  }
} 