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
}