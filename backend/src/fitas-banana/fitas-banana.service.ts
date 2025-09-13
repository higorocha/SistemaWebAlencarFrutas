import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFitaBananaDto, UpdateFitaBananaDto } from './dto';

@Injectable()
export class FitasBananaService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createFitaBananaDto: CreateFitaBananaDto, usuarioId: number) {
    try {
      // Verificar se já existe uma fita com esse nome
      const fitaExistente = await this.prisma.fitaBanana.findUnique({
        where: { nome: createFitaBananaDto.nome }
      });

      if (fitaExistente) {
        throw new ConflictException('Já existe uma fita com esse nome');
      }

      // Validar formato da cor hexadecimal
      if (!createFitaBananaDto.corHex.startsWith('#')) {
        throw new BadRequestException('Cor deve começar com #');
      }

      return await this.prisma.fitaBanana.create({
        data: {
          ...createFitaBananaDto,
          usuarioId,
        },
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar fita de banana');
    }
  }

  async findAll() {
    const fitas = await this.prisma.fitaBanana.findMany({
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          }
        },
        controles: {
          select: {
            quantidadeFitas: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    // Processar para incluir tanto a contagem de registros quanto o total de fitas
    return fitas.map(fita => ({
      ...fita,
      _count: {
        controles: fita.controles.length
      },
      _sum: {
        quantidadeFitas: fita.controles.reduce((total, controle) => total + controle.quantidadeFitas, 0)
      },
      controles: undefined // Remover os dados detalhados dos controles para não poluir a resposta
    }));
  }

  async findOne(id: number) {
    const fita = await this.prisma.fitaBanana.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
          }
        },
        controles: {
          include: {
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

    if (!fita) {
      throw new NotFoundException('Fita de banana não encontrada');
    }

    return fita;
  }

  async update(id: number, updateFitaBananaDto: UpdateFitaBananaDto, usuarioId: number) {
    try {
      // Verificar se a fita existe
      const fitaExistente = await this.findOne(id);

      // Se está alterando o nome, verificar se não conflita com outro
      if (updateFitaBananaDto.nome && updateFitaBananaDto.nome !== fitaExistente.nome) {
        const nomeConflitante = await this.prisma.fitaBanana.findUnique({
          where: { nome: updateFitaBananaDto.nome }
        });

        if (nomeConflitante) {
          throw new ConflictException('Já existe uma fita com esse nome');
        }
      }

      // Validar formato da cor hexadecimal se fornecida
      if (updateFitaBananaDto.corHex && !updateFitaBananaDto.corHex.startsWith('#')) {
        throw new BadRequestException('Cor deve começar com #');
      }

      return await this.prisma.fitaBanana.update({
        where: { id },
        data: updateFitaBananaDto,
        include: {
          usuario: {
            select: {
              id: true,
              nome: true,
            }
          }
        }
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erro ao atualizar fita de banana');
    }
  }

  async remove(id: number) {
    try {
      // Verificar se a fita existe
      await this.findOne(id);

      // Verificar se a fita está sendo usada em algum controle
      const controlesAtivos = await this.prisma.controleBanana.count({
        where: { fitaBananaId: id }
      });

      if (controlesAtivos > 0) {
        throw new ConflictException('Não é possível excluir esta fita pois ela está sendo usada em registros de controle');
      }

      await this.prisma.fitaBanana.delete({
        where: { id }
      });

      return { message: 'Fita de banana excluída com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }
      throw new BadRequestException('Erro ao excluir fita de banana');
    }
  }

  async findByUsuario(usuarioId: number) {
    return await this.prisma.fitaBanana.findMany({
      where: { usuarioId },
      include: {
        _count: {
          select: {
            controles: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  /**
   * Calcula o estoque disponível de uma fita específica
   * Estoque = Total registrado - Total já utilizado em pedidos
   * Retorna lotes com quantidade e dias desde o cadastramento
   */
  async getEstoqueFita(fitaId: number) {
    try {
      // Verificar se a fita existe
      const fita = await this.prisma.fitaBanana.findUnique({
        where: { id: fitaId },
        select: { id: true, nome: true, corHex: true }
      });

      if (!fita) {
        throw new NotFoundException('Fita de banana não encontrada');
      }

      // Buscar todos os lotes (ControleBanana) com quantidade > 0
      const lotes = await this.prisma.controleBanana.findMany({
        where: { 
          fitaBananaId: fitaId,
          quantidadeFitas: { gt: 0 } // Apenas lotes com quantidade > 0
        },
        select: {
          id: true,
          quantidadeFitas: true,
          dataRegistro: true,
          areaAgricola: {
            select: {
              nome: true
            }
          }
        },
        orderBy: {
          dataRegistro: 'desc' // Mais recentes primeiro
        }
      });

      // Calcular fitas já utilizadas em pedidos (FrutasPedidosFitas)
      const fitasUtilizadas = await this.prisma.frutasPedidosFitas.aggregate({
        where: { fitaBananaId: fitaId },
        _sum: { quantidadeFita: true }
      });

      const estoqueTotalCalculado = lotes.reduce((total, lote) => total + lote.quantidadeFitas, 0);
      const fitasUtilizadasCalculadas = fitasUtilizadas._sum.quantidadeFita || 0;
      const estoqueDisponivel = estoqueTotalCalculado - fitasUtilizadasCalculadas;

      // Determinar status do estoque
      let status: string;
      if (estoqueDisponivel <= 0) {
        status = 'esgotado';
      } else if (estoqueDisponivel <= 10) {
        status = 'baixo';
      } else {
        status = 'disponivel';
      }

      // Processar lotes para incluir dias desde cadastramento
      const lotesProcessados = lotes.map(lote => {
        const hoje = new Date();
        const dataRegistro = new Date(lote.dataRegistro);
        const diasDesdeCadastro = Math.floor((hoje.getTime() - dataRegistro.getTime()) / (1000 * 60 * 60 * 24));

        return {
          id: lote.id,
          quantidade: lote.quantidadeFitas,
          dataRegistro: lote.dataRegistro,
          diasDesdeCadastro,
          area: lote.areaAgricola.nome
        };
      });

      return {
        fitaId: fita.id,
        nome: fita.nome,
        corHex: fita.corHex,
        estoqueTotal: estoqueTotalCalculado,
        fitasUtilizadas: fitasUtilizadasCalculadas,
        estoqueDisponivel,
        status,
        lotes: lotesProcessados, // NOVO: Array de lotes com quantidade e dias
        ultimaAtualizacao: new Date()
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao consultar estoque da fita');
    }
  }
}