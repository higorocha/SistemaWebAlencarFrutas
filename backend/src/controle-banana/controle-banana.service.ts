import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateControleBananaDto, UpdateControleBananaDto } from './dto';
import { HistoricoFitasService } from '../historico-fitas/historico-fitas.service';

@Injectable()
export class ControleBananaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly historicoFitasService: HistoricoFitasService
  ) {}

  /**
   * Parse de data de registro, lidando com problemas de fuso horário
   */
  private parseDataRegistro(dataStr: string): Date {
    // Se a string já contém horário, usar como está
    if (dataStr.includes('T') || dataStr.includes(' ')) {
      return new Date(dataStr);
    }

    // Se é apenas data (YYYY-MM-DD), adicionar horário meio-dia UTC para evitar problemas de fuso
    return new Date(dataStr + 'T12:00:00.000Z');
  }

  /**
   * Calcula dias e semanas desde uma data até hoje
   */
  private calcularTempoDesdeData(dataRegistro: Date): { dias: number; semanas: number } {
    const hoje = new Date();
    const dataInicio = new Date(dataRegistro);
    
    // Zerar horas para calcular apenas dias
    hoje.setHours(0, 0, 0, 0);
    dataInicio.setHours(0, 0, 0, 0);
    
    const diferencaMs = hoje.getTime() - dataInicio.getTime();
    const dias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
    const semanas = Math.floor(dias / 7);
    
    return { dias, semanas };
  }

  async create(createControleBananaDto: CreateControleBananaDto, usuarioId: number) {
    try {
      // Verificar se a fita existe
      const fita = await this.prisma.fitaBanana.findUnique({
        where: { id: createControleBananaDto.fitaBananaId }
      });

      if (!fita) {
        throw new NotFoundException('Fita de banana não encontrada');
      }

      // Verificar se a área agrícola existe
      const area = await this.prisma.areaAgricola.findUnique({
        where: { id: createControleBananaDto.areaAgricolaId }
      });

      if (!area) {
        throw new NotFoundException('Área agrícola não encontrada');
      }

      const dataRegistro = createControleBananaDto.dataRegistro
        ? this.parseDataRegistro(createControleBananaDto.dataRegistro)
        : new Date();

      // Criar o controle
      const controle = await this.prisma.controleBanana.create({
        data: {
          ...createControleBananaDto,
          dataRegistro,
          usuarioId,
          quantidadeInicialFitas: createControleBananaDto.quantidadeFitas, // Salvar quantidade inicial para histórico
        },
        include: {
          fitaBanana: true,
          areaAgricola: {
            select: {
              id: true,
              nome: true,
            }
          },
          usuario: {
            select: {
              id: true,
              nome: true,
            }
          }
        }
      });

      // Registrar no histórico
      await this.historicoFitasService.registrarAcao(
        controle.id,
        usuarioId,
        'CRIADO',
        null,
        {
          fitaBananaId: controle.fitaBananaId,
          areaAgricolaId: controle.areaAgricolaId,
          quantidadeFitas: controle.quantidadeFitas,
          dataRegistro: controle.dataRegistro,
          observacoes: controle.observacoes
        }
      );

      return controle;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao criar controle de banana');
    }
  }

  async findAll(page?: number, limit?: number) {
    const skip = page && limit ? (page - 1) * limit : undefined;
    const take = limit || undefined;

    const [controles, total] = await Promise.all([
      this.prisma.controleBanana.findMany({
        skip,
        take,
        include: {
          fitaBanana: true,
          areaAgricola: {
            select: {
              id: true,
              nome: true,
            }
          },
          usuario: {
            select: {
              id: true,
              nome: true,
            }
          }
        },
        orderBy: {
          dataRegistro: 'desc'
        }
      }),
      this.prisma.controleBanana.count()
    ]);

    return {
      data: controles,
      total,
      page: page || 1,
      limit: limit || total,
      totalPages: limit ? Math.ceil(total / limit) : 1
    };
  }

  async findOne(id: number) {
    const controle = await this.prisma.controleBanana.findUnique({
      where: { id },
      include: {
        fitaBanana: true,
        areaAgricola: {
          select: {
            id: true,
            nome: true,
            coordenadas: true,
          }
        },
        usuario: {
          select: {
            id: true,
            nome: true,
          }
        },
        historicos: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!controle) {
      throw new NotFoundException('Controle de banana não encontrado');
    }

    return controle;
  }

  async update(id: number, updateControleBananaDto: UpdateControleBananaDto, usuarioId: number) {
    try {
      // Buscar dados atuais para histórico
      const controleAtual = await this.findOne(id);

      // Verificar se a nova fita existe (se fornecida)
      if (updateControleBananaDto.fitaBananaId) {
        const fita = await this.prisma.fitaBanana.findUnique({
          where: { id: updateControleBananaDto.fitaBananaId }
        });

        if (!fita) {
          throw new NotFoundException('Fita de banana não encontrada');
        }
      }

      // Verificar se a nova área existe (se fornecida)
      if (updateControleBananaDto.areaAgricolaId) {
        const area = await this.prisma.areaAgricola.findUnique({
          where: { id: updateControleBananaDto.areaAgricolaId }
        });

        if (!area) {
          throw new NotFoundException('Área agrícola não encontrada');
        }
      }

      const dataRegistro = updateControleBananaDto.dataRegistro
        ? this.parseDataRegistro(updateControleBananaDto.dataRegistro)
        : undefined;

      // Atualizar o controle
      const controleAtualizado = await this.prisma.controleBanana.update({
        where: { id },
        data: {
          ...updateControleBananaDto,
          ...(dataRegistro && { dataRegistro }),
        },
        include: {
          fitaBanana: true,
          areaAgricola: {
            select: {
              id: true,
              nome: true,
            }
          },
          usuario: {
            select: {
              id: true,
              nome: true,
            }
          }
        }
      });

      // Registrar no histórico
      await this.historicoFitasService.registrarAcao(
        id,
        usuarioId,
        'EDITADO',
        {
          fitaBananaId: controleAtual.fitaBanana.id,
          areaAgricolaId: controleAtual.areaAgricola.id,
          quantidadeFitas: controleAtual.quantidadeFitas,
          dataRegistro: controleAtual.dataRegistro,
          observacoes: controleAtual.observacoes
        },
        {
          fitaBananaId: controleAtualizado.fitaBanana.id,
          areaAgricolaId: controleAtualizado.areaAgricola.id,
          quantidadeFitas: controleAtualizado.quantidadeFitas,
          dataRegistro: controleAtualizado.dataRegistro,
          observacoes: controleAtualizado.observacoes
        }
      );

      return controleAtualizado;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao atualizar controle de banana');
    }
  }

  async remove(id: number, usuarioId: number) {
    try {
      // Buscar dados atuais para histórico
      const controleAtual = await this.findOne(id);

      // Registrar no histórico antes de excluir
      await this.historicoFitasService.registrarAcao(
        id,
        usuarioId,
        'REMOVIDO',
        {
          fitaBananaId: controleAtual.fitaBanana.id,
          areaAgricolaId: controleAtual.areaAgricola.id,
          quantidadeFitas: controleAtual.quantidadeFitas,
          dataRegistro: controleAtual.dataRegistro,
          observacoes: controleAtual.observacoes
        },
        null
      );

      await this.prisma.controleBanana.delete({
        where: { id }
      });

      return { message: 'Controle de banana excluído com sucesso' };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Erro ao excluir controle de banana');
    }
  }

  async findByArea(areaId: number) {
    return await this.prisma.controleBanana.findMany({
      where: { areaAgricolaId: areaId },
      include: {
        fitaBanana: true,
        usuario: {
          select: {
            id: true,
            nome: true,
          }
        }
      },
      orderBy: {
        dataRegistro: 'desc'
      }
    });
  }

  async getDashboardData() {
    // Estatísticas gerais
    const totalControles = await this.prisma.controleBanana.count();
    const totalFitas = await this.prisma.controleBanana.aggregate({
      _sum: {
        quantidadeFitas: true
      }
    });

    const areasComFitas = await this.prisma.controleBanana.groupBy({
      by: ['areaAgricolaId'],
      _count: {
        _all: true
      },
      _sum: {
        quantidadeFitas: true
      }
    });

    const totalAreas = areasComFitas.length;

    // Dados por área para o mapa
    const dadosPorArea = await this.prisma.areaAgricola.findMany({
      include: {
        controlesBanana: {
          include: {
            fitaBanana: true,
            areaAgricola: {
              select: {
                id: true,
                nome: true,
                categoria: true,
                areaTotal: true
              }
            }
          },
          orderBy: {
            dataRegistro: 'desc'
          }
        }
      }
    });

    // Dados agregados por área
    const dadosAgregados = await this.prisma.controleBanana.groupBy({
      by: ['areaAgricolaId'],
      _sum: {
        quantidadeFitas: true
      },
      _count: {
        _all: true
      }
    });

    // Combinar dados das áreas com totais e tempo
    const areasComTotais = dadosPorArea.map(area => {
      const totais = dadosAgregados.find(d => d.areaAgricolaId === area.id);
      
      // Processar fitas com tempo desde a data mais antiga
      const fitasComTempo = area.controlesBanana.reduce((acc: Array<{id: number, nome: string, corHex: string, quantidadeFitas: number, dataMaisAntiga: Date, tempoDesdeData: {dias: number, semanas: number}}>, controle) => {
        const fita = controle.fitaBanana;
        const fitaExiste = acc.find(f => f.id === fita.id);
        
        if (fitaExiste) {
          // Se a fita já existe, somar a quantidade e verificar se a data é mais antiga
          fitaExiste.quantidadeFitas += controle.quantidadeFitas;
          if (controle.dataRegistro < fitaExiste.dataMaisAntiga) {
            fitaExiste.dataMaisAntiga = controle.dataRegistro;
            fitaExiste.tempoDesdeData = this.calcularTempoDesdeData(controle.dataRegistro);
          }
        } else {
          // Se é uma nova fita, adicionar com a quantidade e data
          acc.push({
            id: fita.id,
            nome: fita.nome,
            corHex: fita.corHex,
            quantidadeFitas: controle.quantidadeFitas,
            dataMaisAntiga: controle.dataRegistro,
            tempoDesdeData: this.calcularTempoDesdeData(controle.dataRegistro)
          });
        }
        return acc;
      }, []);

      return {
        ...area,
        totalFitas: totais?._sum.quantidadeFitas || 0,
        totalRegistros: totais?._count._all || 0,
        fitas: fitasComTempo
      };
    });

    return {
      estatisticas: {
        totalControles,
        totalFitas: totalFitas._sum.quantidadeFitas || 0,
        totalAreas,
        mediaFitasPorArea: totalAreas > 0 ? Math.round((totalFitas._sum.quantidadeFitas || 0) / totalAreas) : 0
      },
      areasComFitas: areasComTotais
    };
  }

  async getDetalhesArea(areaId: number) {
    // Buscar área específica com todos os controles de banana (sem agrupamento)
    const area = await this.prisma.areaAgricola.findUnique({
      where: { id: areaId },
      include: {
        controlesBanana: {
          include: {
            fitaBanana: {
              select: {
                id: true,
                nome: true,
                corHex: true
              }
            },
            usuario: {
              select: {
                id: true,
                nome: true
              }
            }
          },
          orderBy: {
            dataRegistro: 'desc'
          }
        }
      }
    });

    if (!area) {
      throw new NotFoundException('Área não encontrada');
    }

    // Processar controles individuais (sem agrupamento)
    const controlesDetalhados = area.controlesBanana
      .filter(controle => controle.quantidadeFitas > 0)
      .map(controle => {
        // CORREÇÃO: Se a data estiver em meia-noite, ajustar para meio-dia para evitar problemas de fuso
        let dataRegistroCorrigida = controle.dataRegistro;

        if (controle.dataRegistro.getUTCHours() === 0 &&
            controle.dataRegistro.getUTCMinutes() === 0 &&
            controle.dataRegistro.getUTCSeconds() === 0) {

          dataRegistroCorrigida = new Date(controle.dataRegistro);
          dataRegistroCorrigida.setUTCHours(12, 0, 0, 0);
        }

        return {
          id: controle.id,
          fita: controle.fitaBanana,
          quantidadeFitas: controle.quantidadeFitas,
          dataRegistro: dataRegistroCorrigida, // Usar data corrigida
          usuario: controle.usuario,
          observacoes: controle.observacoes,
          tempoDesdeData: this.calcularTempoDesdeData(controle.dataRegistro)
        };
      });

    return {
      id: area.id,
      nome: area.nome,
      categoria: area.categoria,
      areaTotal: area.areaTotal,
      coordenadas: area.coordenadas,
      controles: controlesDetalhados,
      totalControles: controlesDetalhados.length,
      totalFitas: controlesDetalhados.reduce((sum, controle) => sum + controle.quantidadeFitas, 0)
    };
  }

  async getDetalhesFita(fitaId: number) {
    // Buscar fita específica com todos os controles (sem agrupamento)
    const fita = await this.prisma.fitaBanana.findUnique({
      where: { id: fitaId },
      include: {
        controles: {
          include: {
            areaAgricola: {
              select: {
                id: true,
                nome: true,
                categoria: true,
                areaTotal: true,
                coordenadas: true
              }
            },
            usuario: {
              select: {
                id: true,
                nome: true
              }
            }
          },
          orderBy: {
            dataRegistro: 'desc'
          }
        }
      }
    });

    if (!fita) {
      throw new NotFoundException('Fita não encontrada');
    }

    // Processar controles individuais (sem agrupamento)
    const controlesDetalhados = fita.controles
      .filter(controle => controle.quantidadeFitas > 0)
      .map(controle => {
        // CORREÇÃO: Se a data estiver em meia-noite, ajustar para meio-dia para evitar problemas de fuso
        let dataRegistroCorrigida = controle.dataRegistro;

        if (controle.dataRegistro.getUTCHours() === 0 &&
            controle.dataRegistro.getUTCMinutes() === 0 &&
            controle.dataRegistro.getUTCSeconds() === 0) {

          dataRegistroCorrigida = new Date(controle.dataRegistro);
          dataRegistroCorrigida.setUTCHours(12, 0, 0, 0);
        }

        return {
          id: controle.id,
          area: controle.areaAgricola,
          quantidadeFitas: controle.quantidadeFitas,
          dataRegistro: dataRegistroCorrigida, // Usar data corrigida
          usuario: controle.usuario,
          observacoes: controle.observacoes,
          tempoDesdeData: this.calcularTempoDesdeData(controle.dataRegistro)
        };
      });

    return {
      id: fita.id,
      nome: fita.nome,
      corHex: fita.corHex,
      controles: controlesDetalhados,
      totalControles: controlesDetalhados.length,
      totalFitas: controlesDetalhados.reduce((sum, controle) => sum + controle.quantidadeFitas, 0),
      totalAreas: new Set(controlesDetalhados.map(c => c.area.id)).size
    };
  }

  async getAreasComFitas() {
    // Buscar áreas que têm pelo menos um registro de controle de banana
    const areasComFitas = await this.prisma.areaAgricola.findMany({
      where: {
        controlesBanana: {
          some: {} // Pelo menos um registro
        }
      },
      include: {
        controlesBanana: {
          include: {
            fitaBanana: {
              select: {
                id: true,
                nome: true,
                corHex: true
              }
            }
          },
          orderBy: {
            dataRegistro: 'desc'
          }
        }
      }
    });

    // Processar dados para o mapa
    return areasComFitas.map(area => {
      // Agrupar fitas únicas com suas quantidades e data mais antiga
      const fitasComQuantidade = area.controlesBanana.reduce((acc: Array<{id: number, nome: string, corHex: string, quantidadeFitas: number, dataMaisAntiga: Date, tempoDesdeData: {dias: number, semanas: number}}>, controle) => {
        const fita = controle.fitaBanana;
        const fitaExiste = acc.find(f => f.id === fita.id);
        
        if (fitaExiste) {
          // Se a fita já existe, somar a quantidade e verificar se a data é mais antiga
          fitaExiste.quantidadeFitas += controle.quantidadeFitas;
          if (controle.dataRegistro < fitaExiste.dataMaisAntiga) {
            fitaExiste.dataMaisAntiga = controle.dataRegistro;
            fitaExiste.tempoDesdeData = this.calcularTempoDesdeData(controle.dataRegistro);
          }
        } else {
          // Se é uma nova fita, adicionar com a quantidade e data
          acc.push({
            id: fita.id,
            nome: fita.nome,
            corHex: fita.corHex,
            quantidadeFitas: controle.quantidadeFitas,
            dataMaisAntiga: controle.dataRegistro,
            tempoDesdeData: this.calcularTempoDesdeData(controle.dataRegistro)
          });
        }
        return acc;
      }, []);

      // Calcular total de fitas (soma das quantidades)
      const totalFitas = area.controlesBanana.reduce((sum, controle) => {
        return sum + controle.quantidadeFitas;
      }, 0);

      return {
        id: area.id,
        nome: area.nome,
        categoria: area.categoria,
        areaTotal: area.areaTotal,
        coordenadas: area.coordenadas,
        fitas: fitasComQuantidade,
        totalFitas,
        totalRegistros: area.controlesBanana.length
      };
    });
  }

  /**
   * Busca fitas agrupadas por áreas para o modal de vinculação
   * Retorna estrutura: fitas -> áreas -> quantidade disponível por área
   */
  async getFitasComAreas() {
    try {
      // Buscar todas as fitas de banana
      const fitas = await this.prisma.fitaBanana.findMany({
        include: {
          controles: {
            include: {
              areaAgricola: {
                include: {
                  lotes: {
                    include: {
                      cultura: {
                        select: {
                          descricao: true
                        }
                      }
                    }
                  }
                }
              }
            },
            // ✅ REMOVIDO: Filtro quantidadeFitas > 0 - agora retorna todos os controles
            // A lógica de exibição será feita no frontend
            orderBy: {
              dataRegistro: 'desc'
            }
          }
        },
        orderBy: {
          nome: 'asc'
        }
      });



      // Processar dados agrupando por fitaBananaId mas mantendo controleBananaId individuais
      const fitasComAreas: any[] = [];
      
      fitas.forEach((fita, fitaIndex) => {
        // Agrupar controles por área dentro da mesma fita
        const areasMap = new Map();

        fita.controles.forEach((controle, controleIndex) => {
          const area = controle.areaAgricola;
          
          // Obter culturas plantadas na área
          const culturas = area.lotes
            .map(lote => lote.cultura?.descricao)
            .filter(Boolean)
            .join(', ') || 'Não informado';

          // Usar diretamente o estoque atual da tabela controle_banana
          // A tabela já foi atualizada quando as fitas foram utilizadas na colheita
          const quantidadeDisponivel = controle.quantidadeFitas;

          // ✅ REMOVIDO: Validação quantidadeDisponivel > 0 - agora retorna todas as áreas
          // A lógica de exibição será feita no frontend
          if (!areasMap.has(area.id)) {
            areasMap.set(area.id, {
              areaId: area.id,
              areaPropriaId: area.id, // Para compatibilidade com o frontend
              nome: area.nome,
              categoria: area.categoria,
              areaTotal: area.areaTotal,
              culturas: culturas,
              quantidadeDisponivel: 0,
              controles: []
            });
          }

          const areaData = areasMap.get(area.id);
          areaData.quantidadeDisponivel += quantidadeDisponivel;
          areaData.controles.push({
            id: controle.id, // controleBananaId
            quantidadeFitas: controle.quantidadeFitas,
            dataRegistro: controle.dataRegistro,
            observacoes: controle.observacoes,
            tempoDesdeData: this.calcularTempoDesdeData(controle.dataRegistro)
          });
        });

        // Converter Map para Array - agora retorna todas as áreas
        const areas = Array.from(areasMap.values())
          .sort((a, b) => a.nome.localeCompare(b.nome));

        // Criar entrada se há áreas (com ou sem estoque)
        if (areas.length > 0) {
          const fitaComArea = {
            id: fita.id, // fitaBananaId
            fitaBananaId: fita.id,
            nome: fita.nome,
            corHex: fita.corHex,
            totalDisponivel: areas.reduce((total, area) => total + area.quantidadeDisponivel, 0),
            areas: areas
          };
          
          fitasComAreas.push(fitaComArea);
        }
      });

      // Ordenar por nome da fita
      fitasComAreas.sort((a, b) => a.nome.localeCompare(b.nome));

      return fitasComAreas;
    } catch (error) {
      console.error('Erro ao buscar fitas com áreas:', error);
      throw new BadRequestException('Erro ao buscar fitas disponíveis');
    }
  }


  /**
   * Subtrai estoque de um lote específico (controleBananaId)
   * O usuário seleciona exatamente qual lote usar no frontend
   */
  async subtrairEstoquePorControle(controleBananaId: number, quantidade: number, usuarioId: number): Promise<void> {
    // Buscar o controle específico
    const controle = await this.prisma.controleBanana.findUnique({
      where: { id: controleBananaId }
    });

    if (!controle) {
      throw new NotFoundException(`Lote de controle com ID ${controleBananaId} não encontrado`);
    }

    // Verificar se há estoque suficiente neste lote específico
    if (controle.quantidadeFitas < quantidade) {
      throw new BadRequestException(
        `Estoque insuficiente no lote ${controleBananaId}. Disponível: ${controle.quantidadeFitas}, Solicitado: ${quantidade}`
      );
    }

    // Registrar no histórico ANTES da subtração
    await this.historicoFitasService.registrarAcao(
      controleBananaId,
      usuarioId,
      'USADO_PEDIDO',
      {
        quantidadeFitas: controle.quantidadeFitas,
        observacoes: controle.observacoes
      },
      {
        quantidadeFitas: controle.quantidadeFitas - quantidade,
        observacoes: controle.observacoes
      }
    );

    // Atualizar quantidade no controle específico
    await this.prisma.controleBanana.update({
      where: { id: controleBananaId },
      data: {
        quantidadeFitas: controle.quantidadeFitas - quantidade
      }
    });

    console.log(`✅ Subtraído ${quantidade} fitas do lote ${controleBananaId}. Restante: ${controle.quantidadeFitas - quantidade}`);
  }

  /**
   * Adiciona estoque de volta a um lote específico (controleBananaId)
   * Usado na edição de pedidos para liberar fitas que estavam vinculadas
   */
  async adicionarEstoquePorControle(controleBananaId: number, quantidade: number, usuarioId: number): Promise<void> {
    // Buscar o controle específico
    const controle = await this.prisma.controleBanana.findUnique({
      where: { id: controleBananaId }
    });

    if (!controle) {
      throw new NotFoundException(`Lote de controle com ID ${controleBananaId} não encontrado`);
    }

    // Registrar no histórico ANTES da adição
    await this.historicoFitasService.registrarAcao(
      controleBananaId,
      usuarioId,
      'LIBERADO_EDICAO',
      {
        quantidadeFitas: controle.quantidadeFitas,
        observacoes: controle.observacoes
      },
      {
        quantidadeFitas: controle.quantidadeFitas + quantidade,
        observacoes: controle.observacoes
      }
    );

    // Adicionar quantidade de volta ao controle específico
    await this.prisma.controleBanana.update({
      where: { id: controleBananaId },
      data: {
        quantidadeFitas: controle.quantidadeFitas + quantidade
      }
    });

    console.log(`✅ Adicionado ${quantidade} fitas de volta ao lote ${controleBananaId}. Total: ${controle.quantidadeFitas + quantidade}`);
  }

  /**
   * Processa subtração de múltiplas fitas por lote específico
   * Subtrai diretamente do lote selecionado pelo usuário (controleBananaId)
   */
  async processarSubtracaoFitas(detalhesAreas: Array<{fitaBananaId: number, areaId: number, quantidade: number, controleBananaId: number}>, usuarioId: number): Promise<void> {
    for (const detalhe of detalhesAreas) {
      await this.subtrairEstoquePorControle(detalhe.controleBananaId, detalhe.quantidade, usuarioId);
    }
  }

  /**
   * Processa ajuste de estoque para edição de pedidos
   * Libera fitas dos lotes específicos que estavam vinculadas antes
   * Subtrai fitas dos novos lotes específicos selecionados pelo usuário
   * Usa controleBananaId para controle direto e preciso dos lotes
   */
  async processarAjusteEstoqueParaEdicao(
    fitasAntigas: Array<{fitaBananaId: number, areaId: number, quantidade: number, controleBananaId: number}>,
    fitasNovas: Array<{fitaBananaId: number, areaId: number, quantidade: number, controleBananaId: number}>,
    usuarioId: number
  ): Promise<void> {
    // Primeiro, liberar estoque das fitas antigas nos lotes específicos
    for (const fita of fitasAntigas) {
      await this.adicionarEstoquePorControle(fita.controleBananaId, fita.quantidade, usuarioId);
    }
    
    // Depois, subtrair estoque das fitas novas dos lotes específicos
    for (const fita of fitasNovas) {
      await this.subtrairEstoquePorControle(fita.controleBananaId, fita.quantidade, usuarioId);
    }
  }

}