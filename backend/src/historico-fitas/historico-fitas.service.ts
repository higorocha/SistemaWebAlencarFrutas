import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HistoricoFitasService {
  constructor(private readonly prisma: PrismaService) {}

  async registrarAcao(
    controleBananaId: number,
    usuarioId: number,
    acao: string,
    dadosAnteriores?: any,
    dadosNovos?: any
  ) {
    return await this.prisma.historicoFitas.create({
      data: {
        controleBananaId,
        usuarioId,
        acao,
        dadosAnteriores: dadosAnteriores ? JSON.parse(JSON.stringify(dadosAnteriores)) : null,
        dadosNovos: dadosNovos ? JSON.parse(JSON.stringify(dadosNovos)) : null,
      }
    });
  }

  async findByControle(controleBananaId: number) {
    return await this.prisma.historicoFitas.findMany({
      where: { controleBananaId },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          }
        },
        controleBanana: {
          include: {
            fitaBanana: {
              select: {
                id: true,
                nome: true,
                corHex: true,
              }
            },
            areaAgricola: {
              select: {
                id: true,
                nome: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async findAll(page?: number, limit?: number) {
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    const [historicos, total] = await Promise.all([
      this.prisma.historicoFitas.findMany({
        skip,
        take,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
            }
          },
          controleBanana: {
            include: {
              fitaBanana: {
                select: {
                  id: true,
                  nome: true,
                  corHex: true,
                }
              },
              areaAgricola: {
                select: {
                  id: true,
                  nome: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.historicoFitas.count()
    ]);

    return {
      data: historicos,
      total,
      page: page || 1,
      limit: limit || total,
      totalPages: limit ? Math.ceil(total / limit) : 1
    };
  }

  async findOne(id: number) {
    const historico = await this.prisma.historicoFitas.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          }
        },
        controleBanana: {
          include: {
            fitaBanana: {
              select: {
                id: true,
                nome: true,
                corHex: true,
              }
            },
            areaAgricola: {
              select: {
                id: true,
                nome: true,
              }
            }
          }
        }
      }
    });

    if (!historico) {
      throw new NotFoundException('Histórico não encontrado');
    }

    return historico;
  }

  async findByUsuario(usuarioId: number, page?: number, limit?: number) {
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    const [historicos, total] = await Promise.all([
      this.prisma.historicoFitas.findMany({
        where: { usuarioId },
        skip,
        take,
        include: {
          controleBanana: {
            include: {
              fitaBanana: {
                select: {
                  id: true,
                  nome: true,
                  corHex: true,
                }
              },
              areaAgricola: {
                select: {
                  id: true,
                  nome: true,
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.historicoFitas.count({
        where: { usuarioId }
      })
    ]);

    return {
      data: historicos,
      total,
      page: page || 1,
      limit: limit || total,
      totalPages: limit ? Math.ceil(total / limit) : 1
    };
  }

  async getEstatisticas() {
    const totalHistorico = await this.prisma.historicoFitas.count();
    
    const acoesPorTipo = await this.prisma.historicoFitas.groupBy({
      by: ['acao'],
      _count: {
        _all: true
      }
    });

    const ultimasAcoes = await this.prisma.historicoFitas.findMany({
      take: 10,
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          }
        },
        controleBanana: {
          include: {
            fitaBanana: {
              select: {
                id: true,
                nome: true,
                corHex: true,
              }
            },
            areaAgricola: {
              select: {
                id: true,
                nome: true,
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return {
      totalHistorico,
      acoesPorTipo: acoesPorTipo.reduce((acc, curr) => {
        acc[curr.acao] = curr._count._all;
        return acc;
      }, {} as Record<string, number>),
      ultimasAcoes
    };
  }
}