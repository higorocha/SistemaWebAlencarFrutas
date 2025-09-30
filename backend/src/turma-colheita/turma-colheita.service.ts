import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateTurmaColheitaDto } from './dto/create-turma-colheita.dto';
import { UpdateTurmaColheitaDto } from './dto/update-turma-colheita.dto';
import { CreateTurmaColheitaPedidoCustoDto } from './dto/create-colheita-pedido.dto';
import { UpdateTurmaColheitaPedidoCustoDto } from './dto/update-colheita-pedido.dto';
import { TurmaColheitaResponseDto } from './dto/turma-colheita-response.dto';
import { TurmaColheitaPedidoCustoResponseDto } from './dto/colheita-pedido-response.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TurmaColheitaService {
  constructor(private readonly prisma: PrismaService) {}

  // ========================================
  // TURMA DE COLHEITA - CRUD
  // ========================================

  async create(createTurmaColheitaDto: CreateTurmaColheitaDto): Promise<TurmaColheitaResponseDto> {
    const { dataCadastro, ...turmaData } = createTurmaColheitaDto;

    const turmaColheita = await this.prisma.turmaColheita.create({
      data: {
        ...turmaData,
        ...(dataCadastro && { dataCadastro: new Date(dataCadastro) }),
      },
      include: {
        custosColheita: {
          include: {
            pedido: {
              select: {
                numeroPedido: true,
                status: true,
                dataPedido: true,
              },
            },
            fruta: {
              select: {
                nome: true,
                categoria: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return turmaColheita;
  }

  async findAll(): Promise<TurmaColheitaResponseDto[]> {
    const turmasColheita = await this.prisma.turmaColheita.findMany({
      include: {
        custosColheita: {
          include: {
            pedido: {
              select: {
                numeroPedido: true,
                status: true,
                dataPedido: true,
              },
            },
            fruta: {
              select: {
                nome: true,
                categoria: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Adicionar estatísticas agregadas para cada turma
    const turmasComEstatisticas = await Promise.all(
      turmasColheita.map(async (turma) => {
        const estatisticas = await this.getEstatisticasPorTurma(turma.id);
        
        return {
          ...turma,
          estatisticas: {
            totalGeral: estatisticas.totalGeral,
            totaisPorUnidade: estatisticas.totaisPorUnidade,
          },
        };
      })
    );

    return turmasComEstatisticas;
  }

  async findOne(id: number): Promise<TurmaColheitaResponseDto> {
    const turmaColheita = await this.prisma.turmaColheita.findUnique({
      where: { id },
      include: {
        custosColheita: {
          include: {
            pedido: {
              select: {
                numeroPedido: true,
                status: true,
                dataPedido: true,
              },
            },
            fruta: {
              select: {
                nome: true,
                categoria: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!turmaColheita) {
      throw new NotFoundException(`Turma de colheita com ID ${id} não encontrada`);
    }

    return turmaColheita;
  }

  async update(id: number, updateTurmaColheitaDto: UpdateTurmaColheitaDto): Promise<TurmaColheitaResponseDto> {
    const turmaExiste = await this.prisma.turmaColheita.findUnique({
      where: { id },
    });

    if (!turmaExiste) {
      throw new NotFoundException(`Turma de colheita com ID ${id} não encontrada`);
    }

    const { dataCadastro, ...turmaData } = updateTurmaColheitaDto;

    const turmaColheita = await this.prisma.turmaColheita.update({
      where: { id },
      data: {
        ...turmaData,
        ...(dataCadastro && { dataCadastro: new Date(dataCadastro) }),
      },
      include: {
        custosColheita: {
          include: {
            pedido: {
              select: {
                numeroPedido: true,
                status: true,
                dataPedido: true,
              },
            },
            fruta: {
              select: {
                nome: true,
                categoria: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    return turmaColheita;
  }

  async remove(id: number): Promise<void> {
    const turmaExiste = await this.prisma.turmaColheita.findUnique({
      where: { id },
    });

    if (!turmaExiste) {
      throw new NotFoundException(`Turma de colheita com ID ${id} não encontrada`);
    }

    await this.prisma.turmaColheita.delete({
      where: { id },
    });
  }

  // ========================================
  // COLHEITA POR PEDIDO - CRUD
  // ========================================

  async createCustoColheita(createCustoDto: CreateTurmaColheitaPedidoCustoDto): Promise<TurmaColheitaPedidoCustoResponseDto> {
    const { turmaColheitaId, pedidoId, frutaId, dataColheita, ...colheitaData } = createCustoDto;

    // Verificar se a turma de colheita existe
    const turmaExiste = await this.prisma.turmaColheita.findUnique({
      where: { id: turmaColheitaId },
    });

    if (!turmaExiste) {
      throw new NotFoundException(`Turma de colheita com ID ${turmaColheitaId} não encontrada`);
    }

    // Verificar se o pedido existe
    const pedidoExiste = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedidoExiste) {
      throw new NotFoundException(`Pedido com ID ${pedidoId} não encontrado`);
    }

    // Verificar se a fruta existe
    const frutaExiste = await this.prisma.fruta.findUnique({
      where: { id: frutaId },
    });

    if (!frutaExiste) {
      throw new NotFoundException(`Fruta com ID ${frutaId} não encontrada`);
    }

    // Verificar se a fruta está no pedido
    const frutaNoPedido = await this.prisma.frutasPedidos.findFirst({
      where: {
        pedidoId: pedidoId,
        frutaId: frutaId,
      },
    });

    if (!frutaNoPedido) {
      throw new BadRequestException(`Fruta com ID ${frutaId} não encontrada no pedido ${pedidoId}`);
    }

    const colheitaPedido = await this.prisma.turmaColheitaPedidoCusto.create({
      data: {
        turmaColheitaId,
        pedidoId,
        frutaId,
        ...colheitaData,
        ...(dataColheita && { dataColheita: new Date(dataColheita) }),
      },
      include: {
        turmaColheita: {
          select: {
            nomeColhedor: true,
            chavePix: true,
            dataCadastro: true,
          },
        },
        pedido: {
          select: {
            numeroPedido: true,
            status: true,
            dataPedido: true,
          },
        },
        fruta: {
          select: {
            nome: true,
            categoria: true,
          },
        },
      },
    });

    return colheitaPedido;
  }

  async findAllColheitasPedidos(): Promise<TurmaColheitaPedidoCustoResponseDto[]> {
    const colheitasPedidos = await this.prisma.turmaColheitaPedidoCusto.findMany({
      include: {
        turmaColheita: {
          select: {
            nomeColhedor: true,
            chavePix: true,
            dataCadastro: true,
          },
        },
        pedido: {
          select: {
            numeroPedido: true,
            status: true,
            dataPedido: true,
          },
        },
        fruta: {
          select: {
            nome: true,
            categoria: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return colheitasPedidos;
  }

  async findOneColheitaPedido(id: number): Promise<TurmaColheitaPedidoCustoResponseDto> {
    const colheitaPedido = await this.prisma.turmaColheitaPedidoCusto.findUnique({
      where: { id },
      include: {
        turmaColheita: {
          select: {
            nomeColhedor: true,
            chavePix: true,
            dataCadastro: true,
          },
        },
        pedido: {
          select: {
            numeroPedido: true,
            status: true,
            dataPedido: true,
          },
        },
        fruta: {
          select: {
            nome: true,
            categoria: true,
          },
        },
      },
    });

    if (!colheitaPedido) {
      throw new NotFoundException(`Colheita de pedido com ID ${id} não encontrada`);
    }

    return colheitaPedido;
  }

  async updateColheitaPedido(id: number, updateColheitaPedidoDto: UpdateTurmaColheitaPedidoCustoDto): Promise<TurmaColheitaPedidoCustoResponseDto> {
    const colheitaExiste = await this.prisma.turmaColheitaPedidoCusto.findUnique({
      where: { id },
    });

    if (!colheitaExiste) {
      throw new NotFoundException(`Colheita de pedido com ID ${id} não encontrada`);
    }

    const { dataColheita, ...colheitaData } = updateColheitaPedidoDto;

    const colheitaPedido = await this.prisma.turmaColheitaPedidoCusto.update({
      where: { id },
      data: {
        ...colheitaData,
        ...(dataColheita && { dataColheita: new Date(dataColheita) }),
      },
      include: {
        turmaColheita: {
          select: {
            nomeColhedor: true,
            chavePix: true,
            dataCadastro: true,
          },
        },
        pedido: {
          select: {
            numeroPedido: true,
            status: true,
            dataPedido: true,
          },
        },
        fruta: {
          select: {
            nome: true,
            categoria: true,
          },
        },
      },
    });

    return colheitaPedido;
  }

  async removeColheitaPedido(id: number): Promise<void> {
    const colheitaExiste = await this.prisma.turmaColheitaPedidoCusto.findUnique({
      where: { id },
    });

    if (!colheitaExiste) {
      throw new NotFoundException(`Colheita de pedido com ID ${id} não encontrada`);
    }

    await this.prisma.turmaColheitaPedidoCusto.delete({
      where: { id },
    });
  }

  // ========================================
  // CONSULTAS ESPECÍFICAS
  // ========================================

  async findColheitasByPedido(pedidoId: number): Promise<TurmaColheitaPedidoCustoResponseDto[]> {
    const pedidoExiste = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedidoExiste) {
      throw new NotFoundException(`Pedido com ID ${pedidoId} não encontrado`);
    }

    const colheitasPedido = await this.prisma.turmaColheitaPedidoCusto.findMany({
      where: { pedidoId },
      include: {
        turmaColheita: {
          select: {
            nomeColhedor: true,
            chavePix: true,
            dataCadastro: true,
          },
        },
        pedido: {
          select: {
            numeroPedido: true,
            status: true,
            dataPedido: true,
          },
        },
        fruta: {
          select: {
            nome: true,
            categoria: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return colheitasPedido;
  }

  async findColheitasByTurma(turmaColheitaId: number): Promise<TurmaColheitaPedidoCustoResponseDto[]> {
    const turmaExiste = await this.prisma.turmaColheita.findUnique({
      where: { id: turmaColheitaId },
    });

    if (!turmaExiste) {
      throw new NotFoundException(`Turma de colheita com ID ${turmaColheitaId} não encontrada`);
    }

    const colheitasPedido = await this.prisma.turmaColheitaPedidoCusto.findMany({
      where: { turmaColheitaId },
      include: {
        turmaColheita: {
          select: {
            nomeColhedor: true,
            chavePix: true,
            dataCadastro: true,
          },
        },
        pedido: {
          select: {
            numeroPedido: true,
            status: true,
            dataPedido: true,
          },
        },
        fruta: {
          select: {
            nome: true,
            categoria: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return colheitasPedido;
  }

  // ========================================
  // MÉTODOS DE BUSCA POR RELACIONAMENTOS
  // ========================================

  async findByPedido(pedidoId: number): Promise<TurmaColheitaResponseDto[]> {
    const pedidoExiste = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedidoExiste) {
      throw new NotFoundException(`Pedido com ID ${pedidoId} não encontrado`);
    }

    // Buscar turmas que têm colheitas para este pedido
    const colheitasDoPedido = await this.prisma.turmaColheitaPedidoCusto.findMany({
      where: { pedidoId },
      select: { turmaColheitaId: true },
      distinct: ['turmaColheitaId'],
    });

    const turmaIds = colheitasDoPedido.map(c => c.turmaColheitaId);

    const turmasColheita = await this.prisma.turmaColheita.findMany({
      where: { id: { in: turmaIds } },
      include: {
        custosColheita: {
          where: { pedidoId },
          include: {
            pedido: {
              select: {
                numeroPedido: true,
                status: true,
                dataPedido: true,
              },
            },
            fruta: {
              select: {
                nome: true,
                categoria: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return turmasColheita;
  }

  async findByFruta(frutaId: number): Promise<TurmaColheitaResponseDto[]> {
    const frutaExiste = await this.prisma.fruta.findUnique({
      where: { id: frutaId },
    });

    if (!frutaExiste) {
      throw new NotFoundException(`Fruta com ID ${frutaId} não encontrada`);
    }

    // Buscar turmas que têm colheitas para esta fruta
    const colheitasDaFruta = await this.prisma.turmaColheitaPedidoCusto.findMany({
      where: { frutaId },
      select: { turmaColheitaId: true },
      distinct: ['turmaColheitaId'],
    });

    const turmaIds = colheitasDaFruta.map(c => c.turmaColheitaId);

    const turmasColheita = await this.prisma.turmaColheita.findMany({
      where: { id: { in: turmaIds } },
      include: {
        custosColheita: {
          where: { frutaId },
          include: {
            pedido: {
              select: {
                numeroPedido: true,
                status: true,
                dataPedido: true,
              },
            },
            fruta: {
              select: {
                nome: true,
                categoria: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return turmasColheita;
  }

  async getEstatisticasPorTurma(turmaId: number) {
    const colheitas = await this.prisma.turmaColheitaPedidoCusto.findMany({
      where: { turmaColheitaId: turmaId },
      include: {
        fruta: {
          select: {
            nome: true,
            categoria: true,
          },
        },
        pedido: {
          select: {
            numeroPedido: true,
            status: true,
          },
        },
      },
    });

    // Calcular totais por unidade de medida
    const totaisPorUnidade = colheitas.reduce((acc, colheita) => {
      const unidade = colheita.unidadeMedida;
      if (!acc[unidade]) {
        acc[unidade] = {
          quantidade: 0,
          valor: 0,
          valorPago: 0,
        };
      }
      acc[unidade].quantidade += colheita.quantidadeColhida;
      acc[unidade].valor += colheita.valorColheita || 0;
      if (colheita.pagamentoEfetuado) {
        acc[unidade].valorPago += colheita.valorColheita || 0;
      }
      return acc;
    }, {} as Record<string, { quantidade: number; valor: number; valorPago: number }>);

    // Calcular totais gerais
    const totalGeral = {
      quantidade: colheitas.reduce((sum, c) => sum + c.quantidadeColhida, 0),
      valor: colheitas.reduce((sum, c) => sum + (c.valorColheita || 0), 0),
      valorPago: colheitas
        .filter(c => c.pagamentoEfetuado)
        .reduce((sum, c) => sum + (c.valorColheita || 0), 0),
      totalPedidos: new Set(colheitas.map(c => c.pedidoId)).size,
      totalFrutas: new Set(colheitas.map(c => c.frutaId)).size,
    };

    return {
      totaisPorUnidade,
      totalGeral,
      detalhes: colheitas.map(colheita => ({
        id: colheita.id,
        pedido: colheita.pedido.numeroPedido,
        fruta: colheita.fruta.nome,
        quantidade: colheita.quantidadeColhida,
        unidade: colheita.unidadeMedida,
        valor: colheita.valorColheita,
        pagamentoEfetuado: colheita.pagamentoEfetuado,
        dataColheita: colheita.dataColheita,
        observacoes: colheita.observacoes,
      })),
    };
  }

  async getRelatorio() {
    const totalTurmas = await this.prisma.turmaColheita.count();
    const totalColheitas = await this.prisma.turmaColheitaPedidoCusto.count();

    const colheitasPorTurma = await this.prisma.turmaColheitaPedidoCusto.groupBy({
      by: ['turmaColheitaId'],
      _count: {
        id: true,
      },
      _sum: {
        quantidadeColhida: true,
        valorColheita: true,
      },
    });

    const colheitasPorFruta = await this.prisma.turmaColheitaPedidoCusto.groupBy({
      by: ['frutaId'],
      _count: {
        id: true,
      },
      _sum: {
        quantidadeColhida: true,
        valorColheita: true,
      },
    });

    const pagamentosEfetuados = await this.prisma.turmaColheitaPedidoCusto.count({
      where: { pagamentoEfetuado: true },
    });

    const pagamentosPendentes = await this.prisma.turmaColheitaPedidoCusto.count({
      where: { pagamentoEfetuado: false },
    });

    return {
      totalTurmas,
      totalColheitas,
      colheitasPorTurma,
      colheitasPorFruta,
      pagamentosEfetuados,
      pagamentosPendentes,
    };
  }

  async getPagamentosPendentesDetalhado(turmaId: number) {
    // Verificar se a turma existe
    const turma = await this.prisma.turmaColheita.findUnique({
      where: { id: turmaId },
    });

    if (!turma) {
      throw new NotFoundException('Turma de colheita não encontrada');
    }

    // Buscar todos os custos de colheita da turma com pagamentos pendentes
    const custosComPendencias = await this.prisma.turmaColheitaPedidoCusto.findMany({
      where: {
        turmaColheitaId: turmaId,
        pagamentoEfetuado: false,
      },
      include: {
        pedido: {
          select: {
            id: true,
            numeroPedido: true,
            cliente: {
              select: {
                id: true,
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
      orderBy: [
        { dataColheita: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Calcular totais
    const totalPendente = custosComPendencias.reduce(
      (acc, custo) => acc + (custo.valorColheita || 0),
      0
    );

    const quantidadePedidos = new Set(
      custosComPendencias.map(custo => custo.pedidoId)
    ).size;

    const quantidadeFrutas = new Set(
      custosComPendencias.map(custo => custo.frutaId)
    ).size;

    // Formattar detalhes das colheitas
    const colheitasDetalhadas = custosComPendencias.map(custo => ({
      id: custo.id,
      pedidoId: custo.pedidoId,
      pedidoNumero: custo.pedido.numeroPedido,
      cliente: {
        id: custo.pedido.cliente.id,
        nome: custo.pedido.cliente.razaoSocial || custo.pedido.cliente.nome,
      },
      fruta: {
        id: custo.fruta.id,
        nome: custo.fruta.nome,
      },
      quantidadeColhida: custo.quantidadeColhida,
      unidadeMedida: custo.unidadeMedida,
      valorColheita: custo.valorColheita || 0,
      dataColheita: custo.dataColheita,
      observacoes: custo.observacoes,
      createdAt: custo.createdAt,
      updatedAt: custo.updatedAt,
    }));

    // Retornar dados completos
    return {
      turma: {
        id: turma.id,
        nomeColhedor: turma.nomeColhedor,
        chavePix: turma.chavePix,
        dataCadastro: turma.dataCadastro,
        observacoes: turma.observacoes,
      },
      resumo: {
        totalPendente,
        quantidadePedidos,
        quantidadeFrutas,
        quantidadeColheitas: custosComPendencias.length,
      },
      colheitas: colheitasDetalhadas,
    };
  }

  async processarPagamentosSeletivos(
    turmaId: number,
    dadosPagamento: { colheitaIds: number[]; observacoes?: string }
  ) {
    // Verificar se a turma existe
    const turma = await this.prisma.turmaColheita.findUnique({
      where: { id: turmaId },
    });

    if (!turma) {
      throw new NotFoundException('Turma de colheita não encontrada');
    }

    if (!dadosPagamento.colheitaIds || dadosPagamento.colheitaIds.length === 0) {
      throw new BadRequestException('Nenhuma colheita selecionada para pagamento');
    }

    // Verificar se todas as colheitas pertencem à turma e estão pendentes
    const colheitasParaPagar = await this.prisma.turmaColheitaPedidoCusto.findMany({
      where: {
        id: { in: dadosPagamento.colheitaIds },
        turmaColheitaId: turmaId,
        pagamentoEfetuado: false,
      },
    });

    if (colheitasParaPagar.length !== dadosPagamento.colheitaIds.length) {
      throw new BadRequestException(
        'Algumas colheitas não foram encontradas ou já foram pagas'
      );
    }

    // Processar pagamentos em transação
    const resultados = await this.prisma.$transaction(async (prisma) => {
      const pagamentosProcessados: Array<{
        id: number;
        pedidoNumero: string;
        cliente: string;
        fruta: string;
        valorPago: number;
      }> = [];

      for (const colheita of colheitasParaPagar) {
        const pagamentoAtualizado = await prisma.turmaColheitaPedidoCusto.update({
          where: { id: colheita.id },
          data: {
            pagamentoEfetuado: true,
            dataPagamento: this.gerarDataComHorarioFixo(),
            observacoes: dadosPagamento.observacoes
              ? `${colheita.observacoes || ''}\n[PAGAMENTO] ${dadosPagamento.observacoes}`.trim()
              : colheita.observacoes,
          },
          include: {
            pedido: {
              select: {
                numeroPedido: true,
                cliente: { select: { nome: true, razaoSocial: true } },
              },
            },
            fruta: { select: { nome: true } },
          },
        });

        pagamentosProcessados.push({
          id: pagamentoAtualizado.id,
          pedidoNumero: pagamentoAtualizado.pedido.numeroPedido,
          cliente: pagamentoAtualizado.pedido.cliente.razaoSocial ||
                   pagamentoAtualizado.pedido.cliente.nome,
          fruta: pagamentoAtualizado.fruta.nome,
          valorPago: pagamentoAtualizado.valorColheita || 0,
        });
      }

      return pagamentosProcessados;
    });

    // Calcular totais
    const totalPago = resultados.reduce((acc, item) => acc + item.valorPago, 0);

    return {
      sucesso: true,
      message: `${resultados.length} pagamento(s) processado(s) com sucesso`,
      totalPago,
      quantidadePagamentos: resultados.length,
      pagamentosProcessados: resultados,
    };
  }

  /**
   * Gera uma data com horário fixo em 12:00:00 para evitar problemas de fuso horário
   * @returns Date com horário fixo em 12:00:00
   */
  private gerarDataComHorarioFixo(): Date {
    const hoje = new Date();
    // Definir horário fixo em 12:00:00 (meio-dia)
    hoje.setHours(12, 0, 0, 0);
    return hoje;
  }

  /**
   * Busca todos os pagamentos efetuados agrupados por turma de colheita
   * @returns Array de pagamentos efetuados com detalhes
   */
  async getPagamentosEfetuadosAgrupados(): Promise<any[]> {
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
      const turmasComPagamentos = turmasComPagamentosEfetuados.filter(
        turma => turma.custosColheita.length > 0
      );

      // Agrupar pagamentos por turma e data de pagamento
      const pagamentosAgrupados: any[] = [];

      for (const turma of turmasComPagamentos) {
        // Agrupar por data de pagamento
        const pagamentosPorData = new Map();

        for (const custo of turma.custosColheita) {
          if (!custo.dataPagamento) continue; // Pular se não tem data de pagamento
          const dataPagamento = custo.dataPagamento.toISOString().split('T')[0]; // YYYY-MM-DD
          const chave = `${dataPagamento}`;

          if (!pagamentosPorData.has(chave)) {
            pagamentosPorData.set(chave, {
              id: `${turma.id}-${new Date(dataPagamento).getTime()}`, // ID único
              nomeColhedor: turma.nomeColhedor,
              chavePix: turma.chavePix,
              dataPagamento: dataPagamento,
              totalPago: 0,
              quantidadePedidos: 0,
              quantidadeFrutas: 0,
              dataCadastro: turma.createdAt.toISOString(),
              observacoes: turma.observacoes,
              detalhes: [],
              frutas: new Set(),
            });
          }

          const grupo = pagamentosPorData.get(chave);
          grupo.totalPago += custo.valorColheita;
          grupo.quantidadePedidos += 1;
          grupo.frutas.add(custo.fruta.nome);

          grupo.detalhes.push({
            pedidoNumero: custo.pedido.numeroPedido,
            cliente: custo.pedido.cliente.razaoSocial || custo.pedido.cliente.nome,
            fruta: custo.fruta.nome,
            quantidadeColhida: custo.quantidadeColhida,
            unidadeMedida: custo.unidadeMedida,
            valorColheita: custo.valorColheita,
            dataColheita: custo.dataColheita?.toISOString(),
            dataPagamento: custo.dataPagamento?.toISOString(),
            observacoes: custo.observacoes,
          });
        }

        // Converter Set para número e adicionar ao resultado
        for (const grupo of pagamentosPorData.values()) {
          (grupo as any).quantidadeFrutas = (grupo as any).frutas.size;
          delete (grupo as any).frutas; // Remover o Set após contar
          pagamentosAgrupados.push(grupo);
        }
      }

      // Ordenar por data de pagamento (mais recentes primeiro)
      return pagamentosAgrupados.sort((a, b) => 
        new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime()
      );

    } catch (error) {
      console.error('Erro ao buscar pagamentos efetuados:', error);
      throw error;
    }
  }

  async getPagamentosEfetuadosTurma(turmaId: number): Promise<any> {
    try {
      // Verificar se a turma existe
      const turma = await this.prisma.turmaColheita.findUnique({
        where: { id: turmaId },
        include: {
          custosColheita: {
            where: {
              pagamentoEfetuado: true,
              dataPagamento: {
                not: null,
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
              dataPagamento: 'desc',
            },
          },
        },
      });

      if (!turma) {
        throw new Error('Turma de colheita não encontrada');
      }

      // Se não há pagamentos efetuados, retornar estrutura vazia
      if (turma.custosColheita.length === 0) {
        return {
          turma: {
            id: turma.id,
            nomeColhedor: turma.nomeColhedor,
            chavePix: turma.chavePix,
            observacoes: turma.observacoes,
            createdAt: turma.createdAt,
          },
          resumo: {
            totalPago: 0,
            quantidadeColheitas: 0,
            quantidadePedidos: 0,
            quantidadeFrutas: 0,
          },
          colheitas: [],
        };
      }

      // Agrupar por data de pagamento
      const pagamentosPorData = new Map();
      const frutas = new Set();
      const pedidos = new Set();

      for (const custo of turma.custosColheita) {
        if (!custo.dataPagamento) continue;
        const dataPagamento = custo.dataPagamento.toISOString().split('T')[0];
        const chave = `${dataPagamento}`;

        if (!pagamentosPorData.has(chave)) {
          pagamentosPorData.set(chave, {
            dataPagamento: dataPagamento,
            totalPago: 0,
            quantidadePedidos: 0,
            quantidadeFrutas: 0,
            detalhes: [],
            frutas: new Set(),
            pedidos: new Set(),
          });
        }

        const grupo = pagamentosPorData.get(chave);
        grupo.totalPago += custo.valorColheita;
        grupo.pedidos.add(custo.pedido.numeroPedido);
        grupo.frutas.add(custo.fruta.nome);
        pedidos.add(custo.pedido.numeroPedido);
        frutas.add(custo.fruta.nome);

        grupo.detalhes.push({
          id: custo.id,
          pedidoNumero: custo.pedido.numeroPedido,
          cliente: custo.pedido.cliente.razaoSocial || custo.pedido.cliente.nome,
          fruta: custo.fruta.nome,
          quantidadeColhida: custo.quantidadeColhida,
          unidadeMedida: custo.unidadeMedida,
          valorColheita: custo.valorColheita,
          dataColheita: custo.dataColheita?.toISOString(),
          dataPagamento: custo.dataPagamento?.toISOString(),
          observacoes: custo.observacoes,
        });
      }

      // Converter Sets para números e preparar dados finais
      const colheitas: any[] = [];
      let totalPago = 0;

      for (const grupo of pagamentosPorData.values()) {
        grupo.quantidadePedidos = grupo.pedidos.size;
        grupo.quantidadeFrutas = grupo.frutas.size;
        delete grupo.pedidos;
        delete grupo.frutas;
        totalPago += grupo.totalPago;
        colheitas.push(grupo);
      }

      // Ordenar por data de pagamento (mais recentes primeiro)
      colheitas.sort((a: any, b: any) => 
        new Date(b.dataPagamento).getTime() - new Date(a.dataPagamento).getTime()
      );

      return {
        turma: {
          id: turma.id,
          nomeColhedor: turma.nomeColhedor,
          chavePix: turma.chavePix,
          observacoes: turma.observacoes,
          createdAt: turma.createdAt,
        },
        resumo: {
          totalPago,
          quantidadeColheitas: colheitas.length,
          quantidadePedidos: pedidos.size,
          quantidadeFrutas: frutas.size,
        },
        colheitas,
      };

    } catch (error) {
      console.error('Erro ao buscar pagamentos efetuados da turma:', error);
      throw error;
    }
  }
}