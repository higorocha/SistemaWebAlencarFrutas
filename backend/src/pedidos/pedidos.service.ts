import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreatePedidoDto, 
  UpdatePedidoDto, 
  UpdateColheitaDto, 
  UpdatePrecificacaoDto, 
  UpdatePagamentoDto, 
  PedidoResponseDto, 
  UpdatePedidoCompletoDto,
  CreatePagamentoDto
} from './dto';

@Injectable()
export class PedidosService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats(paginaFinalizados: number = 1, limitFinalizados: number = 10): Promise<any> {
    // Buscar pedidos ativos (não finalizados) com dados completos para dashboard
    const pedidosAtivos = await this.prisma.pedido.findMany({
      where: {
        status: {
          notIn: ['PAGAMENTO_REALIZADO', 'PEDIDO_FINALIZADO', 'CANCELADO']
        }
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true
          }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: {
                id: true,
                nome: true,
                categoria: true
              }
            },
            areaPropria: {
              select: {
                id: true,
                nome: true
              }
            },
            areaFornecedor: {
              select: {
                id: true,
                nome: true,
                fornecedor: {
                  select: {
                    id: true,
                    nome: true
                  }
                }
              }
            }
          }
        },
        pagamentosPedidos: {
          select: {
            id: true,
            valorRecebido: true,
            dataPagamento: true,
            metodoPagamento: true
          }
        }
      },
      orderBy: [
        { dataPrevistaColheita: 'asc' },
        { id: 'desc' }
      ]
    });

    // Buscar todos os pedidos apenas para estatísticas
    const todosPedidos = await this.prisma.pedido.findMany({
      select: {
        id: true,
        status: true,
        valorFinal: true,
        valorRecebido: true,
        dataPrevistaColheita: true
      }
    });

    const stats = {
      totalPedidos: todosPedidos.length,
      pedidosAtivos: 0,
      pedidosFinalizados: 0,
      valorTotalAberto: 0,
      valorRecebido: 0,
      pedidosVencidos: 0, // TODO: Em decisão com o cliente - não há campo de data de vencimento ou histórico de status no schema
    };

    todosPedidos.forEach(pedido => {
      const { status, valorFinal, valorRecebido } = pedido;

      // Calcular pedidos ativos (excluir finalizados e cancelados)
      if (!['PEDIDO_FINALIZADO', 'CANCELADO'].includes(status)) {
        stats.pedidosAtivos++;
        if (valorFinal) stats.valorTotalAberto += valorFinal;
      }

      // Calcular pedidos finalizados
      if (['PAGAMENTO_REALIZADO', 'PEDIDO_FINALIZADO'].includes(status)) {
        stats.pedidosFinalizados++;
      }
      
      // Somar valores recebidos
      if (valorRecebido) stats.valorRecebido += valorRecebido;
    });

    // Buscar pedidos finalizados com paginação
    const skipFinalizados = (paginaFinalizados - 1) * limitFinalizados;
    const [pedidosFinalizados, totalFinalizados] = await Promise.all([
      this.prisma.pedido.findMany({
        where: {
          status: {
            in: ['PAGAMENTO_REALIZADO', 'PEDIDO_FINALIZADO', 'CANCELADO']
          }
        },
        include: {
          cliente: {
            select: {
              id: true,
              nome: true
            }
          },
          frutasPedidos: {
            include: {
              fruta: {
                select: {
                  id: true,
                  nome: true,
                  categoria: true
                }
              }
            }
          },
          pagamentosPedidos: {
            select: {
              id: true,
              valorRecebido: true,
              dataPagamento: true,
              metodoPagamento: true
            }
          }
        },
        orderBy: [
          { updatedAt: 'desc' },
          { id: 'desc' }
        ],
        skip: skipFinalizados,
        take: limitFinalizados
      }),
      this.prisma.pedido.count({
        where: {
          status: {
            in: ['PAGAMENTO_REALIZADO', 'PEDIDO_FINALIZADO', 'CANCELADO']
          }
        }
      })
    ]);

    // Processar e retornar dados formatados dos pedidos ativos
    const pedidosAtivosFomatados = pedidosAtivos.map(pedido => this.convertNullToUndefined({
      ...pedido,
      numeroPedido: pedido.numeroPedido,
      dataPrevistaColheita: pedido.dataPrevistaColheita?.toISOString().split('T')[0],
      dataColheita: pedido.dataColheita?.toISOString().split('T')[0],
      createdAt: pedido.createdAt?.toISOString(),
      updatedAt: pedido.updatedAt?.toISOString(),
    }));

    // Processar e retornar dados formatados dos pedidos finalizados
    const pedidosFinalizadosFormatados = pedidosFinalizados.map(pedido => this.convertNullToUndefined({
      ...pedido,
      numeroPedido: pedido.numeroPedido,
      dataPrevistaColheita: pedido.dataPrevistaColheita?.toISOString().split('T')[0],
      dataColheita: pedido.dataColheita?.toISOString().split('T')[0],
      createdAt: pedido.createdAt?.toISOString(),
      updatedAt: pedido.updatedAt?.toISOString(),
    }));

    return {
      stats,
      pedidos: pedidosAtivosFomatados,
      finalizados: {
        data: pedidosFinalizadosFormatados,
        total: totalFinalizados,
        page: paginaFinalizados,
        limit: limitFinalizados,
        totalPages: Math.ceil(totalFinalizados / limitFinalizados)
      }
    };
  }

  // Função auxiliar para converter null para undefined e serializar datas
  private convertNullToUndefined(obj: any): any {
    if (obj === null) return undefined;
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertNullToUndefined(item));
    }
    if (typeof obj === 'object') {
      const converted = { ...obj };
      for (const key in converted) {
        if (converted[key] === null) {
          converted[key] = undefined;
        } else if (converted[key] instanceof Date) {
          // Converter objetos Date para string ISO
          converted[key] = converted[key].toISOString();
        } else if (typeof converted[key] === 'object') {
          converted[key] = this.convertNullToUndefined(converted[key]);
        }
      }
      return converted;
    }
    return obj;
  }

  // Função para gerar número do pedido (thread-safe)
  private async gerarNumeroPedido(): Promise<string> {
    const ano = new Date().getFullYear();
    const prefixo = `PED-${ano}-`;
    
    // Buscar o maior número existente para este ano
    const ultimoPedido = await this.prisma.pedido.findFirst({
      where: {
        numeroPedido: {
          startsWith: prefixo
        }
      },
      orderBy: {
        numeroPedido: 'desc'
      }
    });
    
    let proximoNumero = 1;
    
    if (ultimoPedido) {
      // Extrair o número sequencial do último pedido
      const ultimoSequencial = ultimoPedido.numeroPedido.replace(prefixo, '');
      proximoNumero = parseInt(ultimoSequencial) + 1;
    }
    
    const sequencial = proximoNumero.toString().padStart(4, '0');
    return `${prefixo}${sequencial}`;
  }

  // Função para calcular valores financeiros consolidados
  private calcularValoresConsolidados(frutasPedidos: any[], frete?: number, icms?: number, desconto?: number, avaria?: number) {
    const valorTotalFrutas = frutasPedidos.reduce((total, fruta) => {
      return total + (fruta.valorTotal || 0);
    }, 0);
    
    const valorFinal = valorTotalFrutas + (frete || 0) + (icms || 0) - (desconto || 0) - (avaria || 0);
    
    return {
      valorFinal: Number(valorFinal.toFixed(2))
    };
  }

  // Função para calcular valores de cada fruta
  private calcularValoresFruta(quantidadeReal: number, valorUnitario: number) {
    const valorTotal = quantidadeReal * valorUnitario;
    return {
      valorTotal: Number(valorTotal.toFixed(2))
    };
  }

  // NOVA: Função para calcular valor recebido consolidado
  private async calcularValorRecebidoConsolidado(pedidoId: number, prismaClient?: any): Promise<number> {
    const prisma = prismaClient || this.prisma;
    
    const pagamentos = await prisma.pagamentosPedidos.findMany({
      where: { pedidoId: pedidoId },
      select: { valorRecebido: true },
    });
    
    const valorTotal = pagamentos.reduce((total, pagamento) => {
      return total + (pagamento.valorRecebido || 0);
    }, 0);
    
    return Number(valorTotal.toFixed(2));
  }

  // NOVA: Função para atualizar status do pedido baseado nos pagamentos
  private async atualizarStatusPagamento(pedidoId: number): Promise<void> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
      select: { valorFinal: true, status: true }
    });

    if (!pedido || !pedido.valorFinal) return;

    const valorRecebido = await this.calcularValorRecebidoConsolidado(pedidoId);
    
    let novoStatus: 'PAGAMENTO_REALIZADO' | 'PAGAMENTO_PARCIAL' | 'AGUARDANDO_PAGAMENTO';
    
    if (valorRecebido >= pedido.valorFinal) {
      novoStatus = 'PAGAMENTO_REALIZADO';
    } else if (valorRecebido > 0) {
      novoStatus = 'PAGAMENTO_PARCIAL';
    } else {
      novoStatus = 'AGUARDANDO_PAGAMENTO';
    }

    // Só atualiza se o status mudou
    if (pedido.status !== novoStatus) {
      await this.prisma.pedido.update({
        where: { id: pedidoId },
        data: { status: novoStatus }
      });
    }
  }

  async create(createPedidoDto: CreatePedidoDto): Promise<PedidoResponseDto> {
    // Verificar se cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createPedidoDto.clienteId },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Verificar se todas as frutas existem
    for (const fruta of createPedidoDto.frutas) {
      const frutaExiste = await this.prisma.fruta.findUnique({
        where: { id: fruta.frutaId },
      });
      if (!frutaExiste) {
        throw new NotFoundException(`Fruta com ID ${fruta.frutaId} não encontrada`);
      }
    }

    // Gerar número do pedido
    const numeroPedido = await this.gerarNumeroPedido();

    // Criar pedido e frutas em uma transação
    const pedido = await this.prisma.$transaction(async (prisma) => {
      // Criar o pedido
      const novoPedido = await prisma.pedido.create({
        data: {
          numeroPedido,
          clienteId: createPedidoDto.clienteId,
          dataPrevistaColheita: createPedidoDto.dataPrevistaColheita,
          observacoes: createPedidoDto.observacoes,
        },
      });

      // Criar as frutas do pedido
      const frutasPedidos = await Promise.all(
        createPedidoDto.frutas.map(fruta =>
          prisma.frutasPedidos.create({
            data: {
              pedidoId: novoPedido.id,
              frutaId: fruta.frutaId,
              quantidadePrevista: fruta.quantidadePrevista,
              unidadeMedida1: fruta.unidadeMedida1,
              unidadeMedida2: fruta.unidadeMedida2,
            },
          })
        )
      );

      return { ...novoPedido, frutasPedidos };
    });

    // Buscar dados completos para retorno
    const pedidoCompleto = await this.findOne(pedido.id);
    return pedidoCompleto;
  }

  async findAll(
    page?: number,
    limit?: number,
    search?: string,
    status?: string,
    clienteId?: number,
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<{ data: PedidoResponseDto[]; total: number; page: number; limit: number }> {
    const skip = page && limit ? (page - 1) * limit : 0;
    const take = limit || 10;

    const where: any = {};

    if (search) {
      where.OR = [
        { numeroPedido: { contains: search, mode: 'insensitive' } },
        { cliente: { nome: { contains: search, mode: 'insensitive' } } },
        { frutasPedidos: { some: { fruta: { nome: { contains: search, mode: 'insensitive' } } } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (dataInicio && dataFim) {
      where.dataPedido = {
        gte: dataInicio,
        lte: dataFim,
      };
    }

    const [pedidos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        skip,
        take,
        orderBy: { dataPedido: 'desc' },
        include: {
          cliente: {
            select: { id: true, nome: true }
          },
          frutasPedidos: {
            include: {
              fruta: {
                select: { id: true, nome: true }
              },
              areaPropria: {
                select: { id: true, nome: true }
              },
              areaFornecedor: {
                select: { 
                  id: true, 
                  nome: true,
                  fornecedor: {
                    select: { id: true, nome: true }
                  }
                }
              }
            }
          },
          pagamentosPedidos: true
        }
      }),
      this.prisma.pedido.count({ where }),
    ]);

    return {
      data: pedidos.map(pedido => this.convertNullToUndefined(pedido)),
      total,
      page: page || 1,
      limit: take,
    };
  }

  async findOne(id: number): Promise<PedidoResponseDto> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nome: true }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: { id: true, nome: true }
            },
            areaPropria: {
              select: { id: true, nome: true }
            },
            areaFornecedor: {
              select: { 
                id: true, 
                nome: true,
                fornecedor: {
                  select: { id: true, nome: true }
                }
              }
            }
          }
        },
        pagamentosPedidos: true
      }
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return this.convertNullToUndefined(pedido);
  }

  async update(id: number, updatePedidoDto: UpdatePedidoDto): Promise<PedidoResponseDto> {
    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Só permite atualizar pedidos que ainda não foram finalizados
    if (existingPedido.status === 'PEDIDO_FINALIZADO' || existingPedido.status === 'CANCELADO') {
      throw new BadRequestException('Não é possível atualizar pedidos finalizados ou cancelados');
    }

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: updatePedidoDto,
      include: {
        cliente: {
          select: { id: true, nome: true }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: { id: true, nome: true }
            },
            areaPropria: {
              select: { id: true, nome: true }
            },
            areaFornecedor: {
              select: { 
                id: true, 
                nome: true,
                fornecedor: {
                  select: { id: true, nome: true }
                }
              }
            }
          }
        },
        pagamentosPedidos: true
      }
    });

    return this.convertNullToUndefined(pedido);
  }

  async updateColheita(id: number, updateColheitaDto: UpdateColheitaDto): Promise<PedidoResponseDto> {
    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o status permite atualizar colheita
    if (existingPedido.status !== 'PEDIDO_CRIADO' && existingPedido.status !== 'AGUARDANDO_COLHEITA') {
      throw new BadRequestException('Status do pedido não permite atualizar colheita');
    }

    // Verificar se as áreas das frutas existem e se são excludentes
    for (const fruta of updateColheitaDto.frutas) {
      // VALIDAÇÃO: Verificar se exatamente uma área foi selecionada
      const hasAreaPropria = fruta.areaPropriaId !== undefined && fruta.areaPropriaId !== null;
      const hasAreaFornecedor = fruta.areaFornecedorId !== undefined && fruta.areaFornecedorId !== null;
      
      if (!hasAreaPropria && !hasAreaFornecedor) {
        throw new BadRequestException(`Fruta ${fruta.frutaPedidoId}: É obrigatório selecionar uma área de origem (própria ou fornecedor)`);
      }
      
      if (hasAreaPropria && hasAreaFornecedor) {
        throw new BadRequestException(`Fruta ${fruta.frutaPedidoId}: Não é possível selecionar área própria e de fornecedor simultaneamente`);
      }

      // Verificar se a área própria existe
      if (fruta.areaPropriaId) {
        const areaPropria = await this.prisma.areaAgricola.findUnique({
          where: { id: fruta.areaPropriaId },
        });
        if (!areaPropria) {
          throw new NotFoundException(`Área própria ${fruta.areaPropriaId} não encontrada`);
        }
      }
      
      // Verificar se a área de fornecedor existe
      if (fruta.areaFornecedorId) {
        const areaFornecedor = await this.prisma.areaFornecedor.findUnique({
          where: { id: fruta.areaFornecedorId },
        });
        if (!areaFornecedor) {
          throw new NotFoundException(`Área de fornecedor ${fruta.areaFornecedorId} não encontrada`);
        }
      }
    }

    // Atualizar colheita em uma transação
    const pedido = await this.prisma.$transaction(async (prisma) => {
      // Atualizar dados básicos da colheita
      const pedidoAtualizado = await prisma.pedido.update({
        where: { id },
        data: {
          dataColheita: updateColheitaDto.dataColheita,
          observacoesColheita: updateColheitaDto.observacoesColheita,
          status: 'COLHEITA_REALIZADA',
          // NOVOS: Atualizar campos de frete durante a colheita
          pesagem: updateColheitaDto.pesagem,
          placaPrimaria: updateColheitaDto.placaPrimaria,
          placaSecundaria: updateColheitaDto.placaSecundaria,
          nomeMotorista: updateColheitaDto.nomeMotorista,
        },
      });

      // Atualizar quantidades e áreas de cada fruta
      for (const fruta of updateColheitaDto.frutas) {
        await prisma.frutasPedidos.update({
          where: { id: fruta.frutaPedidoId },
          data: {
            quantidadeReal: fruta.quantidadeReal,
            quantidadeReal2: fruta.quantidadeReal2,
            areaPropriaId: fruta.areaPropriaId,
            areaFornecedorId: fruta.areaFornecedorId,
            fitaColheita: fruta.fitaColheita,
          },
        });
      }

      return pedidoAtualizado;
    });

    // Buscar dados completos para retorno
    const pedidoCompleto = await this.findOne(id);
    return pedidoCompleto;
  }

  async updatePrecificacao(id: number, updatePrecificacaoDto: UpdatePrecificacaoDto): Promise<PedidoResponseDto> {

    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o status permite precificação
    if (existingPedido.status !== 'COLHEITA_REALIZADA') {
      throw new BadRequestException('Status do pedido não permite precificação');
    }

    const pedido = await this.prisma.$transaction(async (prisma) => {
      // Atualizar valores consolidados
      const pedidoAtualizado = await prisma.pedido.update({
        where: { id },
        data: {
          frete: updatePrecificacaoDto.frete,
          icms: updatePrecificacaoDto.icms,
          desconto: updatePrecificacaoDto.desconto,
          avaria: updatePrecificacaoDto.avaria,
          status: 'PRECIFICACAO_REALIZADA',
        },
      });

      // Atualizar precificação de cada fruta
      for (const fruta of updatePrecificacaoDto.frutas) {
        const frutaPedido = await prisma.frutasPedidos.findUnique({
          where: { id: fruta.frutaPedidoId },
        });

        if (!frutaPedido) {
          throw new NotFoundException(`Fruta do pedido com ID ${fruta.frutaPedidoId} não encontrada`);
        }

        // Normalizar strings para comparação segura
        const unidadeInput = fruta.unidadePrecificada?.trim()?.toUpperCase();
        const unidadeSalva = frutaPedido.unidadePrecificada?.toString().trim().toUpperCase();
        const unidadeMedida1 = frutaPedido.unidadeMedida1?.toString().trim().toUpperCase();
        const unidadeMedida2 = frutaPedido.unidadeMedida2?.toString().trim().toUpperCase();

        // Inferir unidade efetiva de precificação
        let unidadeEfetiva = unidadeInput || unidadeSalva || undefined;
        if (!unidadeEfetiva) {
          // Se não veio no payload e não há salva, decidir por quantidade disponível
          if (unidadeMedida2 && (frutaPedido.quantidadeReal2 || 0) > 0) {
            unidadeEfetiva = unidadeMedida2;
          } else {
            unidadeEfetiva = unidadeMedida1;
          }
        }

        // Determinar a quantidade para cálculo conforme a unidade efetiva
        let quantidadeParaCalculo = 0;
        if (unidadeEfetiva === unidadeMedida1) {
          quantidadeParaCalculo = frutaPedido.quantidadeReal || 0;
        } else if (unidadeEfetiva === unidadeMedida2) {
          quantidadeParaCalculo = frutaPedido.quantidadeReal2 || 0;
        } else {
          // Fallback seguro
          quantidadeParaCalculo = frutaPedido.quantidadeReal || 0;
        }

        const valores = this.calcularValoresFruta(
          quantidadeParaCalculo,
          fruta.valorUnitario
        );

        await prisma.frutasPedidos.update({
          where: { id: fruta.frutaPedidoId },
          data: {
            valorUnitario: fruta.valorUnitario,
            valorTotal: valores.valorTotal,
            unidadePrecificada: unidadeEfetiva as any,
          },
        });
      }

      // Calcular valor final consolidado a partir do estado persistido (garantir consistência)
      const frutasDoPedido = await prisma.frutasPedidos.findMany({ where: { pedidoId: id } });
      let valorTotalFrutas = 0;
      for (const fp of frutasDoPedido) {
        const unidadePrec = fp.unidadePrecificada?.toString().trim().toUpperCase();
        const um1 = fp.unidadeMedida1?.toString().trim().toUpperCase();
        const um2 = fp.unidadeMedida2?.toString().trim().toUpperCase();

        let qtd = 0;
        if (unidadePrec === um2) {
          qtd = fp.quantidadeReal2 || 0;
        } else {
          // padrão: um1
          qtd = fp.quantidadeReal || 0;
        }
        const vt = Number(((qtd || 0) * (fp.valorUnitario || 0)).toFixed(2));

        // Se o valorTotal persistido estiver divergente, atualizar
        if ((fp.valorTotal || 0) !== vt) {
          await prisma.frutasPedidos.update({
            where: { id: fp.id },
            data: { valorTotal: vt },
          });
        }

        valorTotalFrutas += vt;
      }

      const valorFinal = valorTotalFrutas + (updatePrecificacaoDto.frete || 0) + (updatePrecificacaoDto.icms || 0) - (updatePrecificacaoDto.desconto || 0) - (updatePrecificacaoDto.avaria || 0);

      await prisma.pedido.update({
        where: { id },
        data: {
          valorFinal: Number(valorFinal.toFixed(2)),
        },
      });

      return pedidoAtualizado;
    });

    // Buscar dados completos para retorno
    const pedidoCompleto = await this.findOne(id);
    return pedidoCompleto;
  }

  // NOVA: Buscar pagamentos de um pedido
  async findPagamentosByPedido(pedidoId: number): Promise<any[]> {
    // Verificar se o pedido existe
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Usar Prisma ORM em vez de query raw
    const pagamentos = await this.prisma.pagamentosPedidos.findMany({
      where: { pedidoId: pedidoId },
      orderBy: { dataPagamento: 'asc' },
    });

    return this.convertNullToUndefined(pagamentos);
  }

  // NOVA: Criar pagamento individual
  async createPagamento(createPagamentoDto: CreatePagamentoDto): Promise<any> {
    // Verificar se o pedido existe
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: createPagamentoDto.pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o status permite pagamento
    if (pedido.status !== 'PRECIFICACAO_REALIZADA' && pedido.status !== 'AGUARDANDO_PAGAMENTO' && pedido.status !== 'PAGAMENTO_PARCIAL') {
      throw new BadRequestException('Status do pedido não permite registrar pagamento');
    }

    // Verificar se o valor do pagamento é válido (maior que zero)
    if (createPagamentoDto.valorRecebido <= 0) {
      throw new BadRequestException('Valor do pagamento deve ser maior que zero');
    }

    // Verificar se o valor do pagamento não excede o valor final
    const valorRecebidoAtual = await this.calcularValorRecebidoConsolidado(createPagamentoDto.pedidoId);
    if (valorRecebidoAtual + createPagamentoDto.valorRecebido > (pedido.valorFinal || 0)) {
      throw new BadRequestException('Valor do pagamento excede o valor final do pedido');
    }

    // Criar pagamento usando Prisma ORM
    const pagamento = await this.prisma.$transaction(async (prisma) => {
      const novoPagamento = await prisma.pagamentosPedidos.create({
        data: {
          pedidoId: createPagamentoDto.pedidoId,
          dataPagamento: new Date(createPagamentoDto.dataPagamento),
          valorRecebido: createPagamentoDto.valorRecebido,
          metodoPagamento: createPagamentoDto.metodoPagamento,
          contaDestino: createPagamentoDto.contaDestino,
          observacoesPagamento: createPagamentoDto.observacoesPagamento,
          chequeCompensado: createPagamentoDto.chequeCompensado,
          referenciaExterna: createPagamentoDto.referenciaExterna,
        },
      });

      // Atualizar valor recebido consolidado no pedido (APÓS criar o pagamento)
      const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(createPagamentoDto.pedidoId, prisma);
      
      // Atualizar status do pedido baseado no valor recebido
      const pedido = await prisma.pedido.findUnique({
        where: { id: createPagamentoDto.pedidoId },
        select: { valorFinal: true, status: true }
      });

      let novoStatus: 'PAGAMENTO_REALIZADO' | 'PAGAMENTO_PARCIAL' | 'AGUARDANDO_PAGAMENTO';
      
      if (valorRecebidoConsolidado >= (pedido?.valorFinal || 0)) {
        novoStatus = 'PAGAMENTO_REALIZADO';
      } else if (valorRecebidoConsolidado > 0) {
        novoStatus = 'PAGAMENTO_PARCIAL';
      } else {
        novoStatus = 'AGUARDANDO_PAGAMENTO';
      }

      await prisma.pedido.update({
        where: { id: createPagamentoDto.pedidoId },
        data: { 
          valorRecebido: valorRecebidoConsolidado,
          status: novoStatus
        }
      });

      return novoPagamento;
    });

    return this.convertNullToUndefined(pagamento);
  }

  // NOVA: Atualizar pagamento individual
  async updatePagamentoIndividual(id: number, updatePagamentoDto: UpdatePagamentoDto): Promise<any> {
    // Verificar se o pagamento existe
    const pagamento = await this.prisma.pagamentosPedidos.findUnique({
      where: { id },
      include: { pedido: true },
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Verificar se o status do pedido permite atualização
    if (pagamento.pedido.status !== 'PRECIFICACAO_REALIZADA' && pagamento.pedido.status !== 'AGUARDANDO_PAGAMENTO' && pagamento.pedido.status !== 'PAGAMENTO_PARCIAL') {
      throw new BadRequestException('Status do pedido não permite atualizar pagamento');
    }

    // Se estiver alterando o valor, verificar se é válido e não excede o valor final
    if (updatePagamentoDto.valorRecebido !== undefined) {
      // Verificar se o valor é válido (maior que zero)
      if (updatePagamentoDto.valorRecebido <= 0) {
        throw new BadRequestException('Valor do pagamento deve ser maior que zero');
      }

      const outrosPagamentos = await this.prisma.pagamentosPedidos.findMany({
        where: { 
          pedidoId: pagamento.pedidoId,
          id: { not: id }
        },
        select: { valorRecebido: true },
      });
      
      const valorOutrosPagamentos = outrosPagamentos.reduce((total, p) => total + (p.valorRecebido || 0), 0);
      const valorTotal = valorOutrosPagamentos + updatePagamentoDto.valorRecebido;
      
      if (valorTotal > (pagamento.pedido.valorFinal || 0)) {
        throw new BadRequestException('Valor total dos pagamentos excede o valor final do pedido');
      }
    }

    // Atualizar pagamento em transação
    const pagamentoAtualizado = await this.prisma.$transaction(async (prisma) => {
      const dadosAtualizacao: any = {};
      
      if (updatePagamentoDto.dataPagamento !== undefined) {
        dadosAtualizacao.dataPagamento = new Date(updatePagamentoDto.dataPagamento);
      }
      if (updatePagamentoDto.valorRecebido !== undefined) {
        dadosAtualizacao.valorRecebido = updatePagamentoDto.valorRecebido;
      }
      if (updatePagamentoDto.metodoPagamento !== undefined) {
        dadosAtualizacao.metodoPagamento = updatePagamentoDto.metodoPagamento;
      }
      if (updatePagamentoDto.contaDestino !== undefined) {
        dadosAtualizacao.contaDestino = updatePagamentoDto.contaDestino;
      }
      if (updatePagamentoDto.observacoesPagamento !== undefined) {
        dadosAtualizacao.observacoesPagamento = updatePagamentoDto.observacoesPagamento;
      }
      if (updatePagamentoDto.chequeCompensado !== undefined) {
        dadosAtualizacao.chequeCompensado = updatePagamentoDto.chequeCompensado;
      }
      if (updatePagamentoDto.referenciaExterna !== undefined) {
        dadosAtualizacao.referenciaExterna = updatePagamentoDto.referenciaExterna;
      }

      const pagamentoAtualizado = await prisma.pagamentosPedidos.update({
        where: { id },
        data: dadosAtualizacao,
      });

      // Atualizar valor recebido consolidado no pedido
      const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(pagamento.pedidoId, prisma);
      
      // Atualizar status do pedido baseado no valor recebido
      const pedido = await prisma.pedido.findUnique({
        where: { id: pagamento.pedidoId },
        select: { valorFinal: true, status: true }
      });

      let novoStatus: 'PAGAMENTO_REALIZADO' | 'PAGAMENTO_PARCIAL' | 'AGUARDANDO_PAGAMENTO';
      
      if (valorRecebidoConsolidado >= (pedido?.valorFinal || 0)) {
        novoStatus = 'PAGAMENTO_REALIZADO';
      } else if (valorRecebidoConsolidado > 0) {
        novoStatus = 'PAGAMENTO_PARCIAL';
      } else {
        novoStatus = 'AGUARDANDO_PAGAMENTO';
      }

      await prisma.pedido.update({
        where: { id: pagamento.pedidoId },
        data: { 
          valorRecebido: valorRecebidoConsolidado,
          status: novoStatus
        }
      });

      return pagamentoAtualizado;
    });

    return this.convertNullToUndefined(pagamentoAtualizado);
  }

  // NOVA: Remover pagamento individual
  async removePagamento(id: number): Promise<void> {
    // Verificar se o pagamento existe
    const pagamento = await this.prisma.pagamentosPedidos.findUnique({
      where: { id },
      include: { pedido: true },
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Verificar se o status do pedido permite remoção
    if (pagamento.pedido.status === 'PEDIDO_FINALIZADO') {
      throw new BadRequestException('Não é possível remover pagamentos de pedidos finalizados');
    }

    // Remover pagamento em transação
    await this.prisma.$transaction(async (prisma) => {
      await prisma.pagamentosPedidos.delete({
        where: { id },
      });

      // Atualizar valor recebido consolidado no pedido (APÓS remover o pagamento)
      const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(pagamento.pedidoId, prisma);
      
      // Atualizar status do pedido baseado no valor recebido
      const pedido = await prisma.pedido.findUnique({
        where: { id: pagamento.pedidoId },
        select: { valorFinal: true, status: true }
      });

      let novoStatus: 'PAGAMENTO_REALIZADO' | 'PAGAMENTO_PARCIAL' | 'AGUARDANDO_PAGAMENTO';
      
      if (valorRecebidoConsolidado >= (pedido?.valorFinal || 0)) {
        novoStatus = 'PAGAMENTO_REALIZADO';
      } else if (valorRecebidoConsolidado > 0) {
        novoStatus = 'PAGAMENTO_PARCIAL';
      } else {
        novoStatus = 'AGUARDANDO_PAGAMENTO';
      }

      await prisma.pedido.update({
        where: { id: pagamento.pedidoId },
        data: { 
          valorRecebido: valorRecebidoConsolidado,
          status: novoStatus
        }
      });
    });
  }

  // MÉTODO LEGADO: updatePagamento - mantido para compatibilidade
  async updatePagamento(id: number, updatePagamentoDto: UpdatePagamentoDto): Promise<PedidoResponseDto> {
    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o status permite pagamento
    if (existingPedido.status !== 'PRECIFICACAO_REALIZADA' && existingPedido.status !== 'AGUARDANDO_PAGAMENTO' && existingPedido.status !== 'PAGAMENTO_PARCIAL') {
      throw new BadRequestException('Status do pedido não permite registrar pagamento');
    }

    // MÉTODO LEGADO: Criar pagamento usando a nova estrutura
    const createPagamentoDto: CreatePagamentoDto = {
      pedidoId: id,
      dataPagamento: updatePagamentoDto.dataPagamento || new Date().toISOString(),
      valorRecebido: updatePagamentoDto.valorRecebido || 0,
      metodoPagamento: updatePagamentoDto.metodoPagamento || 'PIX',
      contaDestino: updatePagamentoDto.contaDestino || 'ALENCAR',
      observacoesPagamento: updatePagamentoDto.observacoesPagamento
    };

    await this.createPagamento(createPagamentoDto);

    // Retornar pedido atualizado
    return this.findOne(id);
  }

  async updateCompleto(id: number, updatePedidoCompletoDto: UpdatePedidoCompletoDto): Promise<PedidoResponseDto> {
    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o status permite atualização completa
    if (existingPedido.status === 'PEDIDO_FINALIZADO' || existingPedido.status === 'CANCELADO') {
      throw new BadRequestException('Não é possível atualizar pedidos finalizados ou cancelados');
    }

    // Atualizar pedido em uma transação
    const pedido = await this.prisma.$transaction(async (prisma) => {
      // Atualizar dados básicos do pedido
      const pedidoAtualizado = await prisma.pedido.update({
        where: { id },
        data: {
          clienteId: updatePedidoCompletoDto.clienteId,
          dataPrevistaColheita: updatePedidoCompletoDto.dataPrevistaColheita,

          dataColheita: updatePedidoCompletoDto.dataColheita,
          observacoes: updatePedidoCompletoDto.observacoes,
          observacoesColheita: updatePedidoCompletoDto.observacoesColheita,
          frete: updatePedidoCompletoDto.frete,
          icms: updatePedidoCompletoDto.icms,
                     desconto: updatePedidoCompletoDto.desconto,
           avaria: updatePedidoCompletoDto.avaria,
                     valorRecebido: updatePedidoCompletoDto.valorRecebido,
           status: updatePedidoCompletoDto.status,
           // NOVOS: Campos de frete
           pesagem: updatePedidoCompletoDto.pesagem,
           placaPrimaria: updatePedidoCompletoDto.placaPrimaria,
           placaSecundaria: updatePedidoCompletoDto.placaSecundaria,
           nomeMotorista: updatePedidoCompletoDto.nomeMotorista,
        },
      });

      // Atualizar frutas se fornecidas e recalcular valorTotal conforme unidadePrecificada
      let houveAlteracaoFrutas = false;
      if (updatePedidoCompletoDto.frutas) {
        for (const fruta of updatePedidoCompletoDto.frutas) {
          // Atualização por frutaPedidoId (quando informado)
          if (fruta.frutaPedidoId) {
            // Aplicar a mesma lógica do updatePrecificacao para unidade precificada
            const frutaPedidoAtual = await prisma.frutasPedidos.findUnique({ where: { id: fruta.frutaPedidoId } });
            if (!frutaPedidoAtual) {
              throw new NotFoundException(`Fruta do pedido com ID ${fruta.frutaPedidoId} não encontrada`);
            }

            // Normalizar strings para comparação segura (mesma lógica do updatePrecificacao)
            const unidadeInput = fruta.unidadePrecificada?.trim()?.toUpperCase();
            const unidadeSalva = frutaPedidoAtual.unidadePrecificada?.toString().trim().toUpperCase();
            const unidadeMedida1 = frutaPedidoAtual.unidadeMedida1?.toString().trim().toUpperCase();
            const unidadeMedida2 = frutaPedidoAtual.unidadeMedida2?.toString().trim().toUpperCase();

            // Inferir unidade efetiva de precificação (mesma lógica do updatePrecificacao)
            let unidadeEfetiva = unidadeInput || unidadeSalva || undefined;
            if (!unidadeEfetiva) {
              // Se não veio no payload e não há salva, decidir por quantidade disponível
              const quantidadeReal2Atualizada = fruta.quantidadeReal2 ?? frutaPedidoAtual.quantidadeReal2;
              if (unidadeMedida2 && (quantidadeReal2Atualizada || 0) > 0) {
                unidadeEfetiva = unidadeMedida2;
              } else {
                unidadeEfetiva = unidadeMedida1;
              }
            }

            // Determinar a quantidade para cálculo conforme a unidade efetiva
            let quantidadeParaCalculo = 0;
            if (unidadeEfetiva === unidadeMedida1) {
              quantidadeParaCalculo = (fruta.quantidadeReal ?? frutaPedidoAtual.quantidadeReal) || 0;
            } else if (unidadeEfetiva === unidadeMedida2) {
              quantidadeParaCalculo = (fruta.quantidadeReal2 ?? frutaPedidoAtual.quantidadeReal2) || 0;
            } else {
              // Fallback seguro
              quantidadeParaCalculo = (fruta.quantidadeReal ?? frutaPedidoAtual.quantidadeReal) || 0;
            }

            const valorUnitarioEfetivo = (fruta.valorUnitario ?? frutaPedidoAtual.valorUnitario) || 0;
            const valorTotalCalculado = Number((quantidadeParaCalculo * valorUnitarioEfetivo).toFixed(2));

            await prisma.frutasPedidos.update({
              where: { id: fruta.frutaPedidoId },
              data: {
                quantidadePrevista: fruta.quantidadePrevista,
                quantidadeReal: fruta.quantidadeReal,
                quantidadeReal2: fruta.quantidadeReal2,
                unidadeMedida1: fruta.unidadeMedida1,
                unidadeMedida2: fruta.unidadeMedida2,
                valorUnitario: valorUnitarioEfetivo,
                unidadePrecificada: unidadeEfetiva as any,
                valorTotal: valorTotalCalculado,
                fitaColheita: fruta.fitaColheita,
              },
            });
            houveAlteracaoFrutas = true;
            continue;
          }

          // Atualização por frutaId (compatibilidade)
          if (fruta.frutaId) {
            await prisma.frutasPedidos.updateMany({
              where: { 
                pedidoId: id,
                frutaId: fruta.frutaId 
              },
              data: {
                quantidadePrevista: fruta.quantidadePrevista,
                quantidadeReal: fruta.quantidadeReal,
                quantidadeReal2: fruta.quantidadeReal2,
                unidadeMedida1: fruta.unidadeMedida1,
                unidadeMedida2: fruta.unidadeMedida2,
                valorUnitario: fruta.valorUnitario,
                unidadePrecificada: fruta.unidadePrecificada,
                fitaColheita: fruta.fitaColheita,
              },
            });

            const frutaPedidoAtual = await prisma.frutasPedidos.findFirst({ where: { pedidoId: id, frutaId: fruta.frutaId } });
            if (frutaPedidoAtual) {
              const unidadePrecificadaEfetiva = (fruta.unidadePrecificada || frutaPedidoAtual.unidadePrecificada || frutaPedidoAtual.unidadeMedida1 || '').toString().trim().toUpperCase();
              const unidadeMedida1 = (frutaPedidoAtual.unidadeMedida1 || '').toString().trim().toUpperCase();
              const unidadeMedida2 = (frutaPedidoAtual.unidadeMedida2 || '').toString().trim().toUpperCase();

              let quantidadeParaCalculo = 0;
              if (unidadePrecificadaEfetiva === unidadeMedida1) {
                quantidadeParaCalculo = (fruta.quantidadeReal ?? frutaPedidoAtual.quantidadeReal) || 0;
              } else if (unidadePrecificadaEfetiva === unidadeMedida2) {
                quantidadeParaCalculo = (fruta.quantidadeReal2 ?? frutaPedidoAtual.quantidadeReal2) || 0;
              } else {
                quantidadeParaCalculo = (fruta.quantidadeReal ?? frutaPedidoAtual.quantidadeReal) || 0;
              }

              const valorUnitarioEfetivo = (fruta.valorUnitario ?? frutaPedidoAtual.valorUnitario) || 0;
              const valorTotalCalculado = Number((quantidadeParaCalculo * valorUnitarioEfetivo).toFixed(2));

              await prisma.frutasPedidos.update({
                where: { id: frutaPedidoAtual.id },
                data: { valorTotal: valorTotalCalculado },
              });
              houveAlteracaoFrutas = true;
            }
          }
        }
      }

      // Recalcular valor final se houver alterações financeiras ou nas frutas
      // Usar mesma lógica robusta do updatePrecificacao
      if (
        houveAlteracaoFrutas ||
        updatePedidoCompletoDto.frete !== undefined || 
        updatePedidoCompletoDto.icms !== undefined || 
        updatePedidoCompletoDto.desconto !== undefined || 
        updatePedidoCompletoDto.avaria !== undefined
      ) {
        // Calcular valor final consolidado a partir do estado persistido (garantir consistência)
        const frutasDoPedido = await prisma.frutasPedidos.findMany({ where: { pedidoId: id } });
        let valorTotalFrutas = 0;
        
        for (const fp of frutasDoPedido) {
          const unidadePrec = fp.unidadePrecificada?.toString().trim().toUpperCase();
          const um1 = fp.unidadeMedida1?.toString().trim().toUpperCase();
          const um2 = fp.unidadeMedida2?.toString().trim().toUpperCase();

          let qtd = 0;
          if (unidadePrec === um1) {
            qtd = fp.quantidadeReal || 0;
          } else if (unidadePrec === um2) {
            qtd = fp.quantidadeReal2 || 0;
          } else {
            // padrão: um1
            qtd = fp.quantidadeReal || 0;
          }
          
          const vt = Number(((qtd || 0) * (fp.valorUnitario || 0)).toFixed(2));

          // Se o valorTotal persistido estiver divergente, atualizar
          if ((fp.valorTotal || 0) !== vt) {
            await prisma.frutasPedidos.update({
              where: { id: fp.id },
              data: { valorTotal: vt },
            });
          }

          valorTotalFrutas += vt;
        }

        // Usar valores atuais do pedido se não foram fornecidos no DTO
        const pedidoAtual = await prisma.pedido.findUnique({ where: { id } });
        const frete = updatePedidoCompletoDto.frete ?? pedidoAtual?.frete ?? 0;
        const icms = updatePedidoCompletoDto.icms ?? pedidoAtual?.icms ?? 0;
        const desconto = updatePedidoCompletoDto.desconto ?? pedidoAtual?.desconto ?? 0;
        const avaria = updatePedidoCompletoDto.avaria ?? pedidoAtual?.avaria ?? 0;
        
        const valorFinal = valorTotalFrutas + frete + icms - desconto - avaria;

        await prisma.pedido.update({
          where: { id },
          data: {
            valorFinal: Number(valorFinal.toFixed(2)),
          },
        });
      }

      // NOVA: Controle do valorRecebido (mesma lógica dos endpoints individuais)
      // Se o pedido tem pagamentos, recalcular valorRecebido consolidado
      const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(id, prisma);
      
      // Atualizar valorRecebido no pedido se necessário
      if (valorRecebidoConsolidado > 0) {
        await prisma.pedido.update({
          where: { id },
          data: {
            valorRecebido: valorRecebidoConsolidado,
          },
        });
        
        // Atualizar status baseado no valorRecebido vs valorFinal
        const pedidoAtualizado = await prisma.pedido.findUnique({
          where: { id },
          select: { valorFinal: true, status: true }
        });
        
        if (pedidoAtualizado) {
          let novoStatus: string | undefined;
          
          // Só atualizar status se estiver em uma das fases de pagamento
          const statusPagamento = ['PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL', 'PAGAMENTO_REALIZADO'];
          if (statusPagamento.includes(pedidoAtualizado.status)) {
            if (valorRecebidoConsolidado >= (pedidoAtualizado.valorFinal || 0)) {
              novoStatus = 'PAGAMENTO_REALIZADO';
            } else if (valorRecebidoConsolidado > 0) {
              novoStatus = 'PAGAMENTO_PARCIAL';
            } else {
              novoStatus = 'AGUARDANDO_PAGAMENTO';
            }
            
            // Só atualizar se o status mudou
            if (pedidoAtualizado.status !== novoStatus) {
              await prisma.pedido.update({
                where: { id },
                data: { status: novoStatus as any },
              });
            }
          }
        }
      }

      return pedidoAtualizado;
    });

    // Buscar dados completos para retorno
    const pedidoCompleto = await this.findOne(id);
    return pedidoCompleto;
  }

  async finalizar(id: number): Promise<PedidoResponseDto> {
    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o status permite finalização
    if (existingPedido.status !== 'PAGAMENTO_REALIZADO') {
      throw new BadRequestException('Status do pedido não permite finalização');
    }

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        status: 'PEDIDO_FINALIZADO',
      },
      include: {
        cliente: {
          select: { id: true, nome: true }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: { id: true, nome: true }
            }
          }
        },
        pagamentosPedidos: true
      }
    });

    return this.convertNullToUndefined(pedido);
  }

  async cancelar(id: number): Promise<PedidoResponseDto> {
    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Verificar se o status permite cancelamento
    if (existingPedido.status === 'PEDIDO_FINALIZADO') {
      throw new BadRequestException('Não é possível cancelar pedidos finalizados');
    }

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        status: 'CANCELADO',
      },
      include: {
        cliente: {
          select: { id: true, nome: true }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: { id: true, nome: true }
            }
          }
        },
        pagamentosPedidos: true
      }
    });

    return this.convertNullToUndefined(pedido);
  }

  async remove(id: number): Promise<void> {
    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Só permite remover pedidos cancelados ou recém criados
    if (existingPedido.status !== 'CANCELADO' && existingPedido.status !== 'PEDIDO_CRIADO') {
      throw new BadRequestException('Só é possível remover pedidos cancelados ou recém criados');
    }

    // Remover em transação para garantir integridade
    await this.prisma.$transaction(async (prisma) => {
      // Remover frutas do pedido (cascade)
      await prisma.frutasPedidos.deleteMany({
        where: { pedidoId: id },
      });

      // Remover pagamentos do pedido (cascade)
      await prisma.pagamentosPedidos.deleteMany({
        where: { pedidoId: id },
      });

      // Remover o pedido
      await prisma.pedido.delete({
        where: { id },
      });
    });
  }
}
