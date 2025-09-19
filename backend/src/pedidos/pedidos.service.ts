import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ControleBananaService } from '../controle-banana/controle-banana.service';
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
  constructor(
    private prisma: PrismaService,
    private controleBananaService: ControleBananaService
  ) {}

  async getDashboardStats(paginaFinalizados: number = 1, limitFinalizados: number = 10): Promise<any> {
    // Validar e garantir que os parâmetros sejam números válidos
    const paginaValida = Math.max(1, Math.floor(paginaFinalizados) || 1);
    const limitValido = Math.max(1, Math.floor(limitFinalizados) || 10);
    // Buscar pedidos ativos (não finalizados) com dados completos para dashboard
    const pedidosAtivos = await this.prisma.pedido.findMany({
      where: {
        status: {
          notIn: ['PEDIDO_FINALIZADO', 'CANCELADO']
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
            areas: {
              include: {
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
                      select: { id: true, nome: true }
                    }
                  }
                }
              }
            },
            fitas: {
              include: {
                fitaBanana: {
                  select: {
                    id: true,
                    nome: true,
                    corHex: true
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
            metodoPagamento: true,
            contaDestino: true,
            observacoesPagamento: true,
            referenciaExterna: true,
            createdAt: true,
            updatedAt: true
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
        dataPrevistaColheita: true,
        dataPedido: true
      }
    });

    const stats = {
      totalPedidos: todosPedidos.length,
      pedidosAtivos: 0,
      pedidosFinalizados: 0,
      valorTotalAberto: 0,
      valorRecebido: 0,
      pedidosVencidos: 0,
    };

    // Data atual para cálculo de vencimento
    const hoje = new Date();
    const trintaDiasAtras = new Date(hoje.getTime() - (30 * 24 * 60 * 60 * 1000));

    todosPedidos.forEach(pedido => {
      const { status, valorFinal, valorRecebido, dataPedido } = pedido;

      // Calcular pedidos ativos (excluir finalizados e cancelados)
      if (!['PEDIDO_FINALIZADO', 'CANCELADO'].includes(status)) {
        stats.pedidosAtivos++;
        if (valorFinal) stats.valorTotalAberto += valorFinal;
      }

      // Calcular pedidos finalizados
      if (['PEDIDO_FINALIZADO'].includes(status)) {
        stats.pedidosFinalizados++;
      }
      
      // Somar valores recebidos
      if (valorRecebido) stats.valorRecebido += valorRecebido;

      // Calcular pedidos vencidos: dataPedido > 30 dias atrás E 
      // status de colheita/precificação/pagamento (exclui criados/aguardando colheita)
      if (dataPedido && dataPedido < trintaDiasAtras && 
          !['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'PEDIDO_FINALIZADO', 'CANCELADO', 'PAGAMENTO_REALIZADO'].includes(status)) {
        stats.pedidosVencidos++;
      }
    });

    // Buscar pedidos finalizados com paginação
    const skipFinalizados = Math.max(0, (paginaValida - 1) * limitValido);
    const [pedidosFinalizados, totalFinalizados] = await Promise.all([
      this.prisma.pedido.findMany({
        where: {
          status: {
            in: ['PEDIDO_FINALIZADO', 'CANCELADO']
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
              metodoPagamento: true,
              contaDestino: true,
              observacoesPagamento: true,
              referenciaExterna: true,
              createdAt: true,
              updatedAt: true
            }
          }
        },
        orderBy: [
          { updatedAt: 'desc' },
          { id: 'desc' }
        ],
        skip: skipFinalizados,
        take: limitValido
      }),
      this.prisma.pedido.count({
        where: {
          status: {
            in: ['PEDIDO_FINALIZADO', 'CANCELADO']
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

  // Método auxiliar para gerenciar áreas e fitas de uma fruta
  private async gerenciarAreasEFitas(
    prisma: any,
    frutaPedidoId: number,
    areas?: any[],
    fitas?: any[]
  ) {
    // Gerenciar áreas
    if (areas && areas.length > 0) {
      for (const area of areas) {
        if (area.id) {
          // Atualizar área existente
          await prisma.frutasPedidosAreas.update({
            where: { id: area.id },
            data: {
              areaPropriaId: area.areaPropriaId || null,
              areaFornecedorId: area.areaFornecedorId || null,
              observacoes: area.observacoes,
            },
          });
        } else {
          // Criar nova área
          await prisma.frutasPedidosAreas.create({
            data: {
              frutaPedidoId,
              areaPropriaId: area.areaPropriaId || null,
              areaFornecedorId: area.areaFornecedorId || null,
              observacoes: area.observacoes,
            },
          });
        }
      }
    }

    // Gerenciar fitas
    if (fitas && fitas.length > 0) {
      for (const fita of fitas) {
        if (fita.id) {
          // Atualizar fita existente
          await prisma.frutasPedidosFitas.update({
            where: { id: fita.id },
            data: {
              fitaBananaId: fita.fitaBananaId,
              quantidadeFita: fita.quantidadeFita,
              observacoes: fita.observacoes,
            },
          });
        } else {
          // Criar nova fita - buscar controle específico
          const controle = await prisma.controleBanana.findFirst({
            where: {
              fitaBananaId: fita.fitaBananaId,
              quantidadeFitas: { gt: 0 }
            },
            orderBy: {
              quantidadeFitas: 'desc'
            }
          });

          if (controle) {
            await prisma.frutasPedidosFitas.create({
              data: {
                frutaPedidoId,
                fitaBananaId: fita.fitaBananaId,
                controleBananaId: controle.id,
                quantidadeFita: fita.quantidadeFita,
                observacoes: fita.observacoes,
              },
            });
          }
        }
      }
    }
  }

  // Adapter simplificado - apenas retorna os dados como estão
  private adaptPedidoResponse(pedido: any): any {
    if (!pedido) return pedido;

    const resultado = {
      ...pedido,
      frutasPedidos: pedido.frutasPedidos?.map(fp => {

        // Retornar dados com a nova estrutura (areas[] e fitas[])
        const frutaAdaptada = {
          ...fp,
          areas: fp.areas || [],
          fitas: fp.fitas?.map(fita => ({
            ...fita,
            // ✅ CONSTRUIR detalhesAreas a partir dos dados existentes
            detalhesAreas: fita.controleBanana && fita.controleBanana.areaAgricola ? [{
              fitaBananaId: fita.fitaBananaId,
              areaId: fita.controleBanana.areaAgricola.id,
              quantidade: fita.quantidadeFita || 0,
              controleBananaId: fita.controleBananaId  // ✅ CORREÇÃO: Incluir controleBananaId
            }] : []
          })) || []
        };

        return frutaAdaptada;
      }) || []
    };

    return resultado;
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
    
    let novoStatus: 'PEDIDO_FINALIZADO' | 'PAGAMENTO_PARCIAL' | 'AGUARDANDO_PAGAMENTO';

    if (valorRecebido >= pedido.valorFinal) {
      novoStatus = 'PEDIDO_FINALIZADO';
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

    // ✅ NOVA VALIDAÇÃO: Verificar se há frutas duplicadas no pedido
    const frutaIds = createPedidoDto.frutas.map(f => f.frutaId);
    const frutasUnicas = new Set(frutaIds);
    
    if (frutaIds.length !== frutasUnicas.size) {
      // Encontrar frutas duplicadas
      const frutasDuplicadas: number[] = [];
      const contadorFrutas: { [key: number]: number } = {};
      
      for (const frutaId of frutaIds) {
        contadorFrutas[frutaId] = (contadorFrutas[frutaId] || 0) + 1;
        if (contadorFrutas[frutaId] > 1 && !frutasDuplicadas.includes(frutaId)) {
          frutasDuplicadas.push(frutaId);
        }
      }
      
      // Buscar nomes das frutas duplicadas para mensagem mais clara
      const nomesFrutasDuplicadas: string[] = [];
      for (const frutaId of frutasDuplicadas) {
        const fruta = await this.prisma.fruta.findUnique({
          where: { id: frutaId },
          select: { nome: true }
        });
        nomesFrutasDuplicadas.push(fruta?.nome || `ID ${frutaId}`);
      }
      
      throw new BadRequestException(
        `Frutas duplicadas detectadas no pedido: ${nomesFrutasDuplicadas.join(', ')}. ` +
        `Cada fruta pode ser adicionada apenas uma vez por pedido.`
      );
    }

    // Verificar se todas as frutas existem
    for (const fruta of createPedidoDto.frutas) {
      const frutaExiste = await this.prisma.fruta.findUnique({
        where: { id: fruta.frutaId },
      });
      if (!frutaExiste) {
        throw new NotFoundException(`Fruta com ID ${fruta.frutaId} não encontrada`);
      }

      // Validar que cada fruta tem pelo menos uma área
      if (!fruta.areas || fruta.areas.length === 0) {
        throw new BadRequestException(`Fruta ${fruta.frutaId} deve ter pelo menos uma área associada`);
      }

      // Validar que cada área é ou própria OU de fornecedor OU placeholder (não ambas)
      for (const area of fruta.areas) {
        const temAreaPropria = !!area.areaPropriaId;
        const temAreaFornecedor = !!area.areaFornecedorId;
        
        if (temAreaPropria && temAreaFornecedor) {
          throw new BadRequestException('Área não pode ser própria E de fornecedor simultaneamente');
        }
        
        // Permitir áreas placeholder durante criação (sem área definida)
        // Serão preenchidas durante a colheita
        if (!temAreaPropria && !temAreaFornecedor) {
          // Área placeholder é permitida na criação - será definida na colheita
          continue;
        }

        // Verificar se área própria existe
        if (temAreaPropria) {
          const areaPropriaExiste = await this.prisma.areaAgricola.findUnique({
            where: { id: area.areaPropriaId },
          });
          if (!areaPropriaExiste) {
            throw new NotFoundException(`Área própria com ID ${area.areaPropriaId} não encontrada`);
          }
        }

        // Verificar se área de fornecedor existe
        if (temAreaFornecedor) {
          const areaFornecedorExiste = await this.prisma.areaFornecedor.findUnique({
            where: { id: area.areaFornecedorId },
          });
          if (!areaFornecedorExiste) {
            throw new NotFoundException(`Área de fornecedor com ID ${area.areaFornecedorId} não encontrada`);
          }
        }
      }

      // Verificar se fitas existem e validar estoque (quando informadas)
      if (fruta.fitas && fruta.fitas.length > 0) {
        await this.validarEstoqueFitas(fruta.fitas, false); // false = nova colheita
      }
    }

    // Gerar número do pedido
    const numeroPedido = await this.gerarNumeroPedido();

    // Criar pedido, frutas, áreas e fitas em uma transação
    const pedido = await this.prisma.$transaction(async (prisma) => {
      // Criar o pedido
      const novoPedido = await prisma.pedido.create({
        data: {
          numeroPedido,
          clienteId: createPedidoDto.clienteId,
          dataPedido: createPedidoDto.dataPedido,
          dataPrevistaColheita: createPedidoDto.dataPrevistaColheita,
          observacoes: createPedidoDto.observacoes,
          // Campos específicos para clientes indústria
          indDataEntrada: createPedidoDto.indDataEntrada ? new Date(createPedidoDto.indDataEntrada) : null,
          indDataDescarga: createPedidoDto.indDataDescarga ? new Date(createPedidoDto.indDataDescarga) : null,
          indPesoMedio: createPedidoDto.indPesoMedio,
          indMediaMililitro: createPedidoDto.indMediaMililitro,
          indNumeroNf: createPedidoDto.indNumeroNf,
        },
      });

      // Criar as frutas do pedido com suas áreas e fitas
      for (const fruta of createPedidoDto.frutas) {
        // Criar a fruta do pedido
        const frutaPedido = await prisma.frutasPedidos.create({
          data: {
            pedidoId: novoPedido.id,
            frutaId: fruta.frutaId,
            quantidadePrevista: fruta.quantidadePrevista,
            unidadeMedida1: fruta.unidadeMedida1,
            unidadeMedida2: fruta.unidadeMedida2,
          },
        });

        // Criar as áreas da fruta
        for (const area of fruta.areas) {
          await prisma.frutasPedidosAreas.create({
            data: {
              frutaPedidoId: frutaPedido.id,
              areaPropriaId: area.areaPropriaId || null,
              areaFornecedorId: area.areaFornecedorId || null,
              observacoes: area.observacoes,
            },
          });
        }

        // Criar as fitas da fruta (se informadas)
        if (fruta.fitas && fruta.fitas.length > 0) {
          for (const fita of fruta.fitas) {
            // Buscar controle específico para esta fita
            const controle = await prisma.controleBanana.findFirst({
              where: {
                fitaBananaId: fita.fitaBananaId,
                quantidadeFitas: { gt: 0 }
              },
              orderBy: {
                quantidadeFitas: 'desc'
              }
            });

            if (controle) {
              await prisma.frutasPedidosFitas.create({
                data: {
                  frutaPedidoId: frutaPedido.id,
                  fitaBananaId: fita.fitaBananaId,
                  controleBananaId: controle.id,
                  quantidadeFita: fita.quantidadeFita,
                  observacoes: fita.observacoes,
                },
              });
            }
          }
        }
      }

      return novoPedido;
    });

    // Buscar dados completos para retorno
    const pedidoCompleto = await this.findOne(pedido.id);
    return this.adaptPedidoResponse(pedidoCompleto);
  }

  async findAll(
    page?: number,
    limit?: number,
    search?: string,
    searchType?: string,
    status?: string,
    clienteId?: number,
    dataInicio?: Date,
    dataFim?: Date,
  ): Promise<{ data: PedidoResponseDto[]; total: number; page: number; limit: number }> {
    const skip = page && limit ? (page - 1) * limit : 0;
    const take = limit || 10;

    const where: any = {};

    if (search) {
      // Se searchType foi especificado, buscar por tipo específico
      if (searchType) {
        switch (searchType) {
          case 'numero':
            where.numeroPedido = { contains: search, mode: 'insensitive' };
            break;
          case 'cliente':
            where.cliente = { nome: { contains: search, mode: 'insensitive' } };
            break;
          case 'motorista':
            where.nomeMotorista = { contains: search, mode: 'insensitive' };
            break;
          case 'placa':
            where.OR = [
              { placaPrimaria: { contains: search, mode: 'insensitive' } },
              { placaSecundaria: { contains: search, mode: 'insensitive' } }
            ];
            break;
          case 'vale':
            where.pagamentosPedidos = {
              some: { referenciaExterna: { contains: search, mode: 'insensitive' } }
            };
            break;
          case 'fornecedor':
            where.frutasPedidos = {
              some: {
                areas: {
                  some: {
                    areaFornecedor: {
                      fornecedor: { nome: { contains: search, mode: 'insensitive' } }
                    }
                  }
                }
              }
            };
            break;
          case 'area':
            where.frutasPedidos = {
              some: {
                areas: {
                  some: {
                    OR: [
                      { areaPropria: { nome: { contains: search, mode: 'insensitive' } } },
                      { areaFornecedor: { nome: { contains: search, mode: 'insensitive' } } }
                    ]
                  }
                }
              }
            };
            break;
          case 'fruta':
            where.frutasPedidos = {
              some: { fruta: { nome: { contains: search, mode: 'insensitive' } } }
            };
            break;
          case 'pesagem':
            where.pesagem = { contains: search, mode: 'insensitive' };
            break;
          default:
            // Fallback para busca geral
            where.OR = [
              { numeroPedido: { contains: search, mode: 'insensitive' } },
              { cliente: { nome: { contains: search, mode: 'insensitive' } } },
              { frutasPedidos: { some: { fruta: { nome: { contains: search, mode: 'insensitive' } } } } },
            ];
        }
      } else {
        // Busca geral se não há searchType
        where.OR = [
          { numeroPedido: { contains: search, mode: 'insensitive' } },
          { cliente: { nome: { contains: search, mode: 'insensitive' } } },
          { frutasPedidos: { some: { fruta: { nome: { contains: search, mode: 'insensitive' } } } } },
        ];
      }
    }

    if (status) {
      // Unificação de status: mapear status equivalentes
      let statusArray: string[] = [];

      switch (status) {
        case 'PEDIDO_CRIADO':
        case 'AGUARDANDO_COLHEITA':
          statusArray = ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA'];
          break;
        case 'COLHEITA_REALIZADA':
        case 'AGUARDANDO_PRECIFICACAO':
          statusArray = ['COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO'];
          break;
        case 'PRECIFICACAO_REALIZADA':
        case 'AGUARDANDO_PAGAMENTO':
          statusArray = ['PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO'];
          break;
        case 'PAGAMENTO_PARCIAL':
          // PAGAMENTO_PARCIAL é único, mas pode ser agrupado com AGUARDANDO_PAGAMENTO
          statusArray = ['PAGAMENTO_PARCIAL'];
          break;
        case 'PEDIDO_FINALIZADO':
        case 'CANCELADO':
          // Estes status são únicos
          statusArray = [status];
          break;
        default:
          statusArray = [status];
      }

      where.status = {
        in: statusArray as any[]
      };
    }

    if (clienteId) {
      where.clienteId = clienteId;
    }

    if (dataInicio && dataFim) {
      // Ajustar as datas para comparar apenas o dia, ignorando horários
      const startOfDay = new Date(dataInicio);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(dataFim);
      endOfDay.setHours(23, 59, 59, 999);

      where.createdAt = {
        gte: startOfDay,
        lte: endOfDay,
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
            select: { id: true, nome: true, industria: true }
          },
          frutasPedidos: {
            include: {
              fruta: {
                select: { id: true, nome: true }
              },
              areas: {
                include: {
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
              fitas: {
                include: {
                  fitaBanana: {
                    select: {
                      id: true,
                      nome: true,
                      corHex: true
                    }
                  },
                  controleBanana: {
                    select: {
                      id: true,
                      areaAgricola: {
                        select: {
                          id: true,
                          nome: true
                        }
                      }
                    }
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
      data: pedidos.map(pedido => this.adaptPedidoResponse(this.convertNullToUndefined(pedido))),
      total,
      page: page || 1,
      limit: take,
    };
  }

  async findByCliente(clienteId: number, statusFilter?: string): Promise<{
    data: PedidoResponseDto[];
    total: number;
    statusFiltrados?: string[];
  }> {
    // Verificar se o cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, nome: true, industria: true }
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    // Construir filtros
    const where: any = { clienteId };
    let statusFiltrados: string[] = [];

    if (statusFilter) {
      statusFiltrados = statusFilter.split(',').map(s => s.trim()).filter(Boolean);
      if (statusFiltrados.length > 0) {
        where.status = {
          in: statusFiltrados
        };
      }
    }

    // Buscar pedidos do cliente com filtros
    const [pedidos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        orderBy: { dataPedido: 'desc' },
        include: {
          cliente: {
            select: { id: true, nome: true, industria: true }
          },
          frutasPedidos: {
            include: {
              fruta: {
                select: { id: true, nome: true }
              },
              areas: {
                include: {
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
              fitas: {
                include: {
                  fitaBanana: {
                    select: { id: true, corHex: true, nome: true }
                  },
                  controleBanana: {
                    select: { id: true, quantidadeFitas: true }
                  }
                }
              }
            }
          },
          pagamentosPedidos: true
        }
      }),
      this.prisma.pedido.count({ where })
    ]);

    return {
      data: pedidos.map(pedido => this.adaptPedidoResponse(this.convertNullToUndefined(pedido))),
      total,
      statusFiltrados: statusFiltrados.length > 0 ? statusFiltrados : undefined
    };
  }

  async findOne(id: number): Promise<PedidoResponseDto> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nome: true, industria: true }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: { id: true, nome: true }
            },
            areas: {
              include: {
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
            fitas: {
              include: {
                fitaBanana: {
                  select: {
                    id: true,
                    nome: true,
                    corHex: true
                  }
                },
                controleBanana: {
                  select: {
                    id: true,
                    areaAgricola: {
                      select: {
                        id: true,
                        nome: true
                      }
                    }
                  }
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

    const pedidoAdaptado = this.adaptPedidoResponse(pedido);
    return this.convertNullToUndefined(pedidoAdaptado);
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
          select: { id: true, nome: true, industria: true }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: { id: true, nome: true }
            },
            areas: {
              include: {
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
            fitas: {
              include: {
                fitaBanana: {
                  select: {
                    id: true,
                    nome: true,
                    corHex: true
                  }
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

  async updateColheita(id: number, updateColheitaDto: UpdateColheitaDto, usuarioId: number): Promise<PedidoResponseDto> {
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

    // Validações das áreas e fitas
    for (const fruta of updateColheitaDto.frutas) {
      // Validar que cada fruta tem pelo menos uma área
      if (!fruta.areas || fruta.areas.length === 0) {
        throw new BadRequestException(`Fruta ${fruta.frutaPedidoId} deve ter pelo menos uma área associada`);
      }

      // Validar áreas e fitas
      for (const area of fruta.areas) {
        const temAreaPropria = !!area.areaPropriaId;
        const temAreaFornecedor = !!area.areaFornecedorId;
        
        if (temAreaPropria && temAreaFornecedor) {
          throw new BadRequestException('Área não pode ser própria E de fornecedor simultaneamente');
        }
        if (!temAreaPropria && !temAreaFornecedor) {
          throw new BadRequestException('Área deve ser própria OU de fornecedor');
        }

        // Verificar se área própria existe
        if (temAreaPropria) {
          const areaPropriaExiste = await this.prisma.areaAgricola.findUnique({
            where: { id: area.areaPropriaId },
          });
          if (!areaPropriaExiste) {
            throw new NotFoundException(`Área própria com ID ${area.areaPropriaId} não encontrada`);
          }
        }

        // Verificar se área de fornecedor existe
        if (temAreaFornecedor) {
          const areaFornecedorExiste = await this.prisma.areaFornecedor.findUnique({
            where: { id: area.areaFornecedorId },
          });
          if (!areaFornecedorExiste) {
            throw new NotFoundException(`Área de fornecedor com ID ${area.areaFornecedorId} não encontrada`);
          }
        }
      }

      // Verificar se fitas existem e validar estoque (quando informadas)
      if (fruta.fitas && fruta.fitas.length > 0) {
        await this.validarEstoqueFitas(fruta.fitas, true); // true = edição de colheita existente
      }
    }

    // Atualizar o pedido com informações da colheita em transação
    const pedidoAtualizado = await this.prisma.$transaction(async (prisma) => {
      // Atualizar dados do pedido
      const pedidoUpdated = await prisma.pedido.update({
        where: { id },
        data: {
          dataColheita: updateColheitaDto.dataColheita,
          observacoesColheita: updateColheitaDto.observacoesColheita,
          status: 'COLHEITA_REALIZADA',
          // Campos de frete
          pesagem: updateColheitaDto.pesagem,
          placaPrimaria: updateColheitaDto.placaPrimaria,
          placaSecundaria: updateColheitaDto.placaSecundaria,
          nomeMotorista: updateColheitaDto.nomeMotorista,
        },
      });

      // Atualizar frutas e suas áreas/fitas
      for (const fruta of updateColheitaDto.frutas) {
        // Atualizar FrutasPedidos
        await prisma.frutasPedidos.update({
          where: { id: fruta.frutaPedidoId },
          data: {
            quantidadeReal: fruta.quantidadeReal,
            quantidadeReal2: fruta.quantidadeReal2,
          },
        });

        // Gerenciar áreas da fruta
        // IMPORTANTE: Deletar todas as áreas antigas primeiro (incluindo placeholders)
        await prisma.frutasPedidosAreas.deleteMany({
          where: { frutaPedidoId: fruta.frutaPedidoId },
        });

        // Criar todas as novas áreas (substituindo completamente as antigas)
        for (const area of fruta.areas) {
          await prisma.frutasPedidosAreas.create({
            data: {
              frutaPedidoId: fruta.frutaPedidoId,
              areaPropriaId: area.areaPropriaId || null,
              areaFornecedorId: area.areaFornecedorId || null,
              observacoes: area.observacoes,
            },
          });
        }

        // Gerenciar fitas da fruta (se informadas)
        if (fruta.fitas && fruta.fitas.length > 0) {
          console.log(`🔍 Processando fitas para fruta ${fruta.frutaPedidoId}:`, JSON.stringify(fruta.fitas, null, 2));
          
          // IMPORTANTE: Deletar todas as fitas antigas primeiro
          await prisma.frutasPedidosFitas.deleteMany({
            where: { frutaPedidoId: fruta.frutaPedidoId },
          });

          // Processar cada fita com seus detalhes de área
          for (const fita of fruta.fitas) {
            console.log(`🔍 Processando fita ${fita.fitaBananaId} para fruta ${fruta.frutaPedidoId}:`, JSON.stringify(fita, null, 2));
            
            if (fita.detalhesAreas && fita.detalhesAreas.length > 0) {
              console.log(`✅ Fita ${fita.fitaBananaId} tem detalhesAreas, criando registros...`);
              
              // Para cada área, criar um registro específico com controleBananaId
              for (const detalhe of fita.detalhesAreas) {
                console.log(`🔍 Processando detalhe:`, JSON.stringify(detalhe, null, 2));
                
                // NOVA LÓGICA: Usar controleBananaId diretamente se disponível
                let controleBananaId = fita.controleBananaId;
                
                if (!controleBananaId) {
                  // Fallback: Buscar o controle específico desta fita nesta área
                  const controle = await prisma.controleBanana.findFirst({
                    where: {
                      fitaBananaId: detalhe.fitaBananaId,
                      areaAgricolaId: detalhe.areaId,
                      quantidadeFitas: { gt: 0 }
                    },
                    orderBy: {
                      quantidadeFitas: 'desc'
                    }
                  });
                  
                  if (controle) {
                    controleBananaId = controle.id;
                  }
                }

                console.log(`🔍 ControleBananaId a usar:`, controleBananaId || 'NENHUM');

                if (controleBananaId) {
                  const registroCriado = await prisma.frutasPedidosFitas.create({
                    data: {
                      frutaPedidoId: fruta.frutaPedidoId,
                      fitaBananaId: fita.fitaBananaId,
                      controleBananaId: controleBananaId, // ✅ LOTE ESPECÍFICO
                      quantidadeFita: detalhe.quantidade,
                      observacoes: fita.observacoes,
                    },
                  });
                  console.log(`✅ Registro criado:`, JSON.stringify(registroCriado, null, 2));
                } else {
                  console.warn(`❌ Nenhum controleBananaId disponível para fita ${detalhe.fitaBananaId} na área ${detalhe.areaId}`);
                }
              }
            } else {
              console.warn(`❌ Fita ${fita.fitaBananaId} sem detalhesAreas - não será processada`);
            }
          }
        } else {
          console.log(`ℹ️ Nenhuma fita informada para fruta ${fruta.frutaPedidoId}`);
        }
      }

      return pedidoUpdated;
    });

    // Atualizar estoque das fitas utilizadas (edição = true)
    for (const fruta of updateColheitaDto.frutas) {
      if (fruta.fitas && fruta.fitas.length > 0) {
        // NOVA LÓGICA: Usar subtração por área específica
        await this.processarFitasComAreas(fruta.fitas, usuarioId);
      }
    }

    // Buscar dados completos para retorno
    const pedidoCompleto = await this.findOne(pedidoAtualizado.id);
    return this.adaptPedidoResponse(pedidoCompleto);
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
          // Campos específicos para clientes indústria
          indDataEntrada: updatePrecificacaoDto.indDataEntrada ? new Date(updatePrecificacaoDto.indDataEntrada) : null,
          indDataDescarga: updatePrecificacaoDto.indDataDescarga ? new Date(updatePrecificacaoDto.indDataDescarga) : null,
          indPesoMedio: updatePrecificacaoDto.indPesoMedio,
          indMediaMililitro: updatePrecificacaoDto.indMediaMililitro,
          indNumeroNf: updatePrecificacaoDto.indNumeroNf,
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

      let novoStatus: 'PEDIDO_FINALIZADO' | 'PAGAMENTO_PARCIAL' | 'AGUARDANDO_PAGAMENTO';

      if (valorRecebidoConsolidado >= (pedido?.valorFinal || 0)) {
        novoStatus = 'PEDIDO_FINALIZADO';
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

      let novoStatus: 'PEDIDO_FINALIZADO' | 'PAGAMENTO_PARCIAL' | 'AGUARDANDO_PAGAMENTO';

      if (valorRecebidoConsolidado >= (pedido?.valorFinal || 0)) {
        novoStatus = 'PEDIDO_FINALIZADO';
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

      let novoStatus: 'PEDIDO_FINALIZADO' | 'PAGAMENTO_PARCIAL' | 'AGUARDANDO_PAGAMENTO';

      if (valorRecebidoConsolidado >= (pedido?.valorFinal || 0)) {
        novoStatus = 'PEDIDO_FINALIZADO';
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

  // TODO: Este método precisa ser atualizado para suportar múltiplas áreas e fitas
  // Por ora, comentando funcionalidades que usam campos removidos
  async updateCompleto(id: number, updatePedidoCompletoDto: UpdatePedidoCompletoDto, usuarioId: number): Promise<PedidoResponseDto> {
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
          dataPedido: updatePedidoCompletoDto.dataPedido,
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
          // Campos específicos para clientes indústria
          indDataEntrada: updatePedidoCompletoDto.indDataEntrada ? new Date(updatePedidoCompletoDto.indDataEntrada) : null,
          indDataDescarga: updatePedidoCompletoDto.indDataDescarga ? new Date(updatePedidoCompletoDto.indDataDescarga) : null,
          indPesoMedio: updatePedidoCompletoDto.indPesoMedio,
          indMediaMililitro: updatePedidoCompletoDto.indMediaMililitro,
          indNumeroNf: updatePedidoCompletoDto.indNumeroNf,
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
                // fitaColheita removido - agora está em FrutasPedidosFitas
              },
            });

            // Atualizar áreas vinculadas (se fornecidas)
            if (fruta.areas && fruta.areas.length > 0) {
              // Remover áreas existentes
              await prisma.frutasPedidosAreas.deleteMany({
                where: { frutaPedidoId: fruta.frutaPedidoId }
              });

              // Adicionar novas áreas
              for (const area of fruta.areas) {
                if (area.areaPropriaId || area.areaFornecedorId) {
                  await prisma.frutasPedidosAreas.create({
                    data: {
                      frutaPedidoId: fruta.frutaPedidoId,
                      areaPropriaId: area.areaPropriaId || undefined,
                      areaFornecedorId: area.areaFornecedorId || undefined,
                      observacoes: area.observacoes || ''
                    }
                  });
                }
              }
            }

            // Atualizar fitas vinculadas (se fornecidas) - NOVA LÓGICA com detalhesAreas
            if (fruta.fitas && fruta.fitas.length > 0) {
              // ✅ CAPTURAR FITAS ANTIGAS ANTES DE DELETAR (para liberar estoque depois)
              const fitasAntigas = await prisma.frutasPedidosFitas.findMany({
                where: { frutaPedidoId: fruta.frutaPedidoId },
                include: {
                  controleBanana: {
                    select: {
                      areaAgricolaId: true
                    }
                  }
                }
              });

              // ✅ VALIDAÇÃO DE ESTOQUE PARA EDIÇÃO (considera fitas já vinculadas ao pedido atual)
              await this.validarEstoqueParaEdicao(fruta.fitas, id, prisma);
              
              // ✅ NOVA LÓGICA: Atualização inteligente de fitas (sem deletar/recriar)
              await this.atualizarFitasInteligentemente(fruta.frutaPedidoId, fruta.fitas, fitasAntigas, usuarioId, prisma);
            }

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
                // fitaColheita removido - agora está em FrutasPedidosFitas
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

    // ✅ REMOVIDO: Atualização do estoque agora acontece DENTRO da transação

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
          select: { id: true, nome: true, industria: true }
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
          select: { id: true, nome: true, industria: true }
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

  /**
   * Valida se há estoque suficiente para as fitas solicitadas
   * @param fitas Array de fitas com quantidadeFita
   * @param isEdicao Se true, não valida estoque (para edições de colheita existente)
   * @param pedidoId ID do pedido (para excluir fitas já vinculadas ao pedido atual)
   */
  private async validarEstoqueFitas(fitas: any[], isEdicao: boolean = false, pedidoId?: number): Promise<void> {
    // Se é edição de colheita existente, não validar estoque
    if (isEdicao) {
      return;
    }

    for (const fita of fitas) {
      // Verificar se a fita existe
      const fitaExiste = await this.prisma.fitaBanana.findUnique({
        where: { id: fita.fitaBananaId },
        select: { id: true, nome: true }
      });

      if (!fitaExiste) {
        throw new NotFoundException(`Fita de banana com ID ${fita.fitaBananaId} não encontrada`);
      }

      // Calcular estoque disponível
      const estoqueTotal = await this.prisma.controleBanana.aggregate({
        where: { fitaBananaId: fita.fitaBananaId },
        _sum: { quantidadeFitas: true }
      });

      // ✅ NOVA LÓGICA: Calcular fitas utilizadas EXCLUINDO as do pedido atual (se for edição)
      const whereClause: any = { fitaBananaId: fita.fitaBananaId };
      
      // Se é uma edição de pedido, excluir as fitas já vinculadas ao pedido atual
      if (pedidoId) {
        whereClause.frutaPedido = {
          pedidoId: { not: pedidoId }
        };
      }

      const fitasUtilizadas = await this.prisma.frutasPedidosFitas.aggregate({
        where: whereClause,
        _sum: { quantidadeFita: true }
      });

      const estoqueDisponivel = (estoqueTotal._sum.quantidadeFitas || 0) - 
                               (fitasUtilizadas._sum.quantidadeFita || 0);

      // Validar se há estoque suficiente
      if (fita.quantidadeFita > estoqueDisponivel) {
        throw new BadRequestException(
          `Estoque insuficiente para fita "${fitaExiste.nome}". ` +
          `Disponível: ${estoqueDisponivel}, ` +
          `Solicitado: ${fita.quantidadeFita}`
        );
      }
    }
  }

  /**
   * Valida estoque para edição de pedidos (considera fitas já vinculadas ao pedido atual)
   * @param fitas Array de fitas com detalhesAreas
   * @param pedidoId ID do pedido sendo editado
   * @param prisma Instância do Prisma para transação
   */
  private async validarEstoqueParaEdicao(fitas: any[], pedidoId: number, prisma: any): Promise<void> {
    for (const fita of fitas) {
      if (fita.detalhesAreas && fita.detalhesAreas.length > 0) {
        for (const detalhe of fita.detalhesAreas) {
          // ✅ CORREÇÃO: Buscar controle específico pelo controleBananaId (não por estoque > 0)
          let controle;
          
          if (detalhe.controleBananaId) {
            // Buscar pelo controleBananaId específico (modo edição com lote selecionado)
            controle = await prisma.controleBanana.findUnique({
              where: { id: detalhe.controleBananaId }
            });
          } else {
            // Fallback: buscar por fitaBananaId + areaId (modo criação)
            controle = await prisma.controleBanana.findFirst({
              where: {
                fitaBananaId: detalhe.fitaBananaId,
                areaAgricolaId: detalhe.areaId,
                quantidadeFitas: { gt: 0 }
              },
              orderBy: {
                quantidadeFitas: 'desc'
              }
            });
          }

          if (!controle) {
            // ✅ MELHORIA: Buscar nome da fita para mensagem mais intuitiva
            const fitaBanana = await prisma.fitaBanana.findUnique({
              where: { id: detalhe.fitaBananaId },
              select: { nome: true }
            });
            
            const areaAgricola = await prisma.areaAgricola.findUnique({
              where: { id: detalhe.areaId },
              select: { nome: true }
            });
            
            const nomeFita = fitaBanana?.nome || `Fita ID ${detalhe.fitaBananaId}`;
            const nomeArea = areaAgricola?.nome || `Área ID ${detalhe.areaId}`;
            
            throw new BadRequestException(`Não há estoque suficiente da fita "${nomeFita}" na área "${nomeArea}"`);
          }

          // Calcular estoque disponível considerando fitas já vinculadas ao pedido atual
          const fitasJaVinculadas = await prisma.frutasPedidosFitas.findMany({
            where: {
              fitaBananaId: detalhe.fitaBananaId,
              frutaPedido: {
                pedidoId: pedidoId
              }
            },
            select: {
              quantidadeFita: true,
              controleBananaId: true
            }
          });
          
          // Filtrar apenas as fitas que pertencem ao mesmo controle (mesma área)
          const fitasDesteControle = fitasJaVinculadas.filter(fita => fita.controleBananaId === controle.id);
          
          const totalJaVinculado = fitasDesteControle.reduce((total, fita) => total + (fita.quantidadeFita || 0), 0);
          const estoqueDisponivel = controle.quantidadeFitas + totalJaVinculado;
          
          if (estoqueDisponivel < detalhe.quantidade) {
            // ✅ MELHORIA: Buscar nomes para mensagem mais intuitiva
            const fitaBanana = await prisma.fitaBanana.findUnique({
              where: { id: detalhe.fitaBananaId },
              select: { nome: true }
            });
            
            const areaAgricola = await prisma.areaAgricola.findUnique({
              where: { id: detalhe.areaId },
              select: { nome: true }
            });
            
            const nomeFita = fitaBanana?.nome || `Fita ID ${detalhe.fitaBananaId}`;
            const nomeArea = areaAgricola?.nome || `Área ID ${detalhe.areaId}`;
            
            throw new BadRequestException(`Estoque insuficiente para edição da fita "${nomeFita}" na área "${nomeArea}". Estoque atual: ${controle.quantidadeFitas}, Já vinculado ao pedido: ${totalJaVinculado}, Total disponível: ${estoqueDisponivel}, Solicitado: ${detalhe.quantidade}`);
          }
        }
      }
    }
  }

  /**
   * Atualização inteligente de fitas - compara fitas atuais vs novas e faz apenas as operações necessárias
   * @param frutaPedidoId ID da fruta do pedido
   * @param fitasNovas Array de fitas novas enviadas pelo frontend
   * @param fitasAntigas Array de fitas atuais do banco
   * @param usuarioId ID do usuário
   * @param prisma Instância do Prisma para transação
   */
  private async atualizarFitasInteligentemente(
    frutaPedidoId: number, 
    fitasNovas: any[], 
    fitasAntigas: any[], 
    usuarioId: number, 
    prisma: any
  ): Promise<void> {
    // 1. Converter fitas novas para formato padronizado
    const fitasNovasPadronizadas = this.padronizarFitasParaComparacao(fitasNovas);
    
    // 2. Converter fitas antigas para formato padronizado
    const fitasAntigasPadronizadas = fitasAntigas.map(fita => ({
      id: fita.id,
      fitaBananaId: fita.fitaBananaId,
      controleBananaId: fita.controleBananaId,
      quantidade: fita.quantidadeFita || 0,
      areaId: fita.controleBanana.areaAgricolaId,
      observacoes: fita.observacoes
    }));

    // 3. Identificar operações necessárias
    const operacoes = this.calcularOperacoesFitas(fitasAntigasPadronizadas, fitasNovasPadronizadas);

    // 4. Processar ajuste de estoque apenas para as mudanças reais
    if (operacoes.paraLiberar.length > 0 || operacoes.paraSubtrair.length > 0) {
      await this.controleBananaService.processarAjusteEstoqueParaEdicao(
        operacoes.paraLiberar,
        operacoes.paraSubtrair,
        usuarioId
      );
    }

    // 5. Executar operações no banco
    // Atualizar quantidades existentes
    for (const atualizacao of operacoes.paraAtualizar) {
      await prisma.frutasPedidosFitas.update({
        where: { id: atualizacao.id },
        data: {
          quantidadeFita: atualizacao.quantidade,
          observacoes: atualizacao.observacoes,
        },
      });
    }

    // Adicionar novas fitas
    for (const novaFita of operacoes.paraAdicionar) {
      await prisma.frutasPedidosFitas.create({
        data: {
          frutaPedidoId,
          fitaBananaId: novaFita.fitaBananaId,
          controleBananaId: novaFita.controleBananaId,
          quantidadeFita: novaFita.quantidade,
          observacoes: novaFita.observacoes,
        },
      });
    }

    // Remover fitas que não existem mais
    if (operacoes.paraRemover.length > 0) {
      await prisma.frutasPedidosFitas.deleteMany({
        where: {
          id: { in: operacoes.paraRemover.map(f => f.id) }
        },
      });
    }
  }

  /**
   * Padroniza fitas para comparação (converte estrutura aninhada em array simples)
   */
  private padronizarFitasParaComparacao(fitas: any[]): any[] {
    const padronizadas: any[] = [];
    
    for (const fita of fitas) {
      if (fita.detalhesAreas && fita.detalhesAreas.length > 0) {
        for (const detalhe of fita.detalhesAreas) {
          padronizadas.push({
            fitaBananaId: detalhe.fitaBananaId,
            controleBananaId: detalhe.controleBananaId,
            quantidade: detalhe.quantidade,
            areaId: detalhe.areaId,
            observacoes: fita.observacoes
          });
        }
      }
    }
    
    return padronizadas;
  }

  /**
   * Calcula operações necessárias comparando fitas antigas vs novas
   */
  private calcularOperacoesFitas(fitasAntigas: any[], fitasNovas: any[]): {
    paraAtualizar: any[],
    paraAdicionar: any[],
    paraRemover: any[],
    paraLiberar: any[],
    paraSubtrair: any[]
  } {
    const paraAtualizar: any[] = [];
    const paraAdicionar: any[] = [];
    const paraRemover: any[] = [];
    const paraLiberar: any[] = [];
    const paraSubtrair: any[] = [];

    // Criar mapas para comparação eficiente
    const mapaAntigas = new Map();
    const mapaNovas = new Map();

    // Mapear fitas antigas por chave única (fitaBananaId + controleBananaId)
    fitasAntigas.forEach(fita => {
      const chave = `${fita.fitaBananaId}-${fita.controleBananaId}`;
      mapaAntigas.set(chave, fita);
    });

    // Mapear fitas novas por chave única
    fitasNovas.forEach(fita => {
      const chave = `${fita.fitaBananaId}-${fita.controleBananaId}`;
      mapaNovas.set(chave, fita);
    });

    // Processar fitas antigas
    for (const [chave, fitaAntiga] of mapaAntigas) {
      const fitaNova = mapaNovas.get(chave);
      
      if (fitaNova) {
        // Fita existe em ambos - verificar se precisa atualizar
        if (fitaAntiga.quantidade !== fitaNova.quantidade || fitaAntiga.observacoes !== fitaNova.observacoes) {
          paraAtualizar.push({
            id: fitaAntiga.id,
            quantidade: fitaNova.quantidade,
            observacoes: fitaNova.observacoes
          });
        }
        
        // Processar ajuste de estoque se quantidade mudou
        if (fitaAntiga.quantidade !== fitaNova.quantidade) {
          const diferenca = fitaNova.quantidade - fitaAntiga.quantidade;
          
          if (diferenca > 0) {
            // Aumentou quantidade - subtrair do estoque
            paraSubtrair.push({
              fitaBananaId: fitaAntiga.fitaBananaId,
              areaId: fitaAntiga.areaId,
              quantidade: diferenca,
              controleBananaId: fitaAntiga.controleBananaId
            });
          } else if (diferenca < 0) {
            // Diminuiu quantidade - liberar estoque
            paraLiberar.push({
              fitaBananaId: fitaAntiga.fitaBananaId,
              areaId: fitaAntiga.areaId,
              quantidade: Math.abs(diferenca),
              controleBananaId: fitaAntiga.controleBananaId
            });
          }
        }
      } else {
        // Fita antiga não existe mais - remover e liberar estoque
        paraRemover.push(fitaAntiga);
        paraLiberar.push({
          fitaBananaId: fitaAntiga.fitaBananaId,
          areaId: fitaAntiga.areaId,
          quantidade: fitaAntiga.quantidade,
          controleBananaId: fitaAntiga.controleBananaId
        });
      }
    }

    // Processar fitas novas que não existiam antes
    for (const [chave, fitaNova] of mapaNovas) {
      if (!mapaAntigas.has(chave)) {
        paraAdicionar.push(fitaNova);
        paraSubtrair.push({
          fitaBananaId: fitaNova.fitaBananaId,
          areaId: fitaNova.areaId,
          quantidade: fitaNova.quantidade,
          controleBananaId: fitaNova.controleBananaId
        });
      }
    }

    return {
      paraAtualizar,
      paraAdicionar,
      paraRemover,
      paraLiberar,
      paraSubtrair
    };
  }

  /**
   * Valida estoque para criação de pedidos (não considera fitas já vinculadas)
   * @param fitas Array de fitas com detalhesAreas
   * @param prisma Instância do Prisma para transação
   */
  private async validarEstoqueParaCriacao(fitas: any[], prisma: any): Promise<void> {
    for (const fita of fitas) {
      if (fita.detalhesAreas && fita.detalhesAreas.length > 0) {
        for (const detalhe of fita.detalhesAreas) {
          // Buscar controle específico para validação
          const controle = await prisma.controleBanana.findFirst({
            where: {
              fitaBananaId: detalhe.fitaBananaId,
              areaAgricolaId: detalhe.areaId,
              quantidadeFitas: { gt: 0 }
            },
            orderBy: {
              quantidadeFitas: 'desc'
            }
          });

          if (!controle) {
            throw new BadRequestException(`Não há estoque suficiente da fita ${detalhe.fitaBananaId} na área ${detalhe.areaId}`);
          }

          if (controle.quantidadeFitas < detalhe.quantidade) {
            throw new BadRequestException(`Estoque insuficiente. Disponível: ${controle.quantidadeFitas}, Solicitado: ${detalhe.quantidade}`);
          }
        }
      }
    }
  }

  /**
   * Processa fitas usando subtração por área específica
   * @param fitas Array de fitas com detalhesAreas
   * @param usuarioId ID do usuário que está realizando a operação
   */
  private async processarFitasComAreas(fitas: any[], usuarioId: number): Promise<void> {
    for (const fita of fitas) {
      if (fita.detalhesAreas && fita.detalhesAreas.length > 0) {
        // Usar nova lógica por área específica
        await this.controleBananaService.processarSubtracaoFitas(fita.detalhesAreas, usuarioId);
      }
    }
  }

  /**
   * Busca inteligente que retorna sugestões categorizadas baseadas no termo de pesquisa
   * @param term Termo de busca (mínimo 2 caracteres)
   * @returns Array de sugestões categorizadas
   */
  async buscaInteligente(term: string): Promise<any[]> {
    if (!term || term.length < 2) {
      return [];
    }

    const suggestions: any[] = [];
    const lowerTerm = term.toLowerCase();

    try {
      // 1. Buscar por número do pedido
      if (lowerTerm.includes('ped') || /^\d+/.test(term)) {
        const pedidosNumero = await this.prisma.pedido.findMany({
          where: {
            numeroPedido: {
              contains: term,
              mode: 'insensitive'
            }
          },
          select: {
            id: true,
            numeroPedido: true,
            status: true,
            dataPrevistaColheita: true,
            cliente: {
              select: { nome: true }
            }
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        });

        pedidosNumero.forEach(pedido => {
          suggestions.push({
            type: 'numero',
            label: 'Nº Pedido',
            value: pedido.numeroPedido,
            icon: '📋',
            color: '#1890ff',
            description: `${pedido.numeroPedido} - ${pedido.cliente.nome} (${pedido.status.replace(/_/g, ' ')})`,
            metadata: {
              id: pedido.id,
              status: pedido.status,
              clienteNome: pedido.cliente.nome
            }
          });
        });
      }

      // 2. Buscar por nome do cliente
      const clientes = await this.prisma.cliente.findMany({
        where: {
          OR: [
            { nome: { contains: term, mode: 'insensitive' } },
            { razaoSocial: { contains: term, mode: 'insensitive' } },
            { cnpj: { contains: term.replace(/[^0-9]/g, ''), mode: 'insensitive' } },
            { cpf: { contains: term.replace(/[^0-9]/g, ''), mode: 'insensitive' } }
          ]
        },
        select: {
          id: true,
          nome: true,
          razaoSocial: true,
          cnpj: true,
          cpf: true,
          email1: true,
          _count: {
            select: { pedidos: true }
          }
        },
        take: 3,
        orderBy: { nome: 'asc' }
      });

      clientes.forEach(cliente => {
        const documento = cliente.cnpj || cliente.cpf || 'N/A';
        suggestions.push({
          type: 'cliente',
          label: 'Cliente',
          value: cliente.nome,
          icon: '👤',
          color: '#52c41a',
          description: `${cliente.nome}${cliente.razaoSocial && cliente.razaoSocial !== cliente.nome ? ` (${cliente.razaoSocial})` : ''} - ${cliente._count.pedidos} pedidos`,
          metadata: {
            id: cliente.id,
            documento: documento,
            email: cliente.email1,
            totalPedidos: cliente._count.pedidos
          }
        });
      });

      // 3. Buscar por motorista (campo: nomeMotorista)
      if (term.length >= 3) {
        const motoristasUnicos = await this.prisma.pedido.groupBy({
          by: ['nomeMotorista'],
          where: {
            AND: [
              { nomeMotorista: { not: null } },
              { nomeMotorista: { contains: term, mode: 'insensitive' } }
            ]
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 3
        });

        motoristasUnicos.forEach(motorista => {
          if (motorista.nomeMotorista) {
            suggestions.push({
              type: 'motorista',
              label: 'Motorista',
              value: motorista.nomeMotorista,
              icon: '🚛',
              color: '#fa8c16',
              description: `${motorista.nomeMotorista} - ${motorista._count.id} pedidos`,
              metadata: {
                nome: motorista.nomeMotorista,
                totalPedidos: motorista._count.id
              }
            });
          }
        });
      }

      // 4. Buscar por placas (placaPrimaria e placaSecundaria) - buscar sempre por placas se termo >= 3 caracteres
      if (term.length >= 3) {
        const placaTerm = term.toUpperCase().trim();

        const placasPrimarias = await this.prisma.pedido.groupBy({
          by: ['placaPrimaria'],
          where: {
            AND: [
              { placaPrimaria: { not: null } },
              { placaPrimaria: { contains: placaTerm, mode: 'insensitive' } }
            ]
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 2
        });

        const placasSecundarias = await this.prisma.pedido.groupBy({
          by: ['placaSecundaria'],
          where: {
            AND: [
              { placaSecundaria: { not: null } },
              { placaSecundaria: { contains: placaTerm, mode: 'insensitive' } }
            ]
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 2
        });

        placasPrimarias.forEach(placa => {
          if (placa.placaPrimaria) {
            suggestions.push({
              type: 'placa',
              label: 'Placa Principal',
              value: placa.placaPrimaria,
              icon: '🚗',
              color: '#eb2f96',
              description: `Placa ${placa.placaPrimaria} - ${placa._count.id} pedidos`,
              metadata: {
                placa: placa.placaPrimaria,
                totalPedidos: placa._count.id,
                tipo: 'primaria'
              }
            });
          }
        });

        placasSecundarias.forEach(placa => {
          if (placa.placaSecundaria) {
            suggestions.push({
              type: 'placa',
              label: 'Placa Reboque',
              value: placa.placaSecundaria,
              icon: '🚛',
              color: '#eb2f96',
              description: `Placa ${placa.placaSecundaria} - ${placa._count.id} pedidos`,
              metadata: {
                placa: placa.placaSecundaria,
                totalPedidos: placa._count.id,
                tipo: 'secundaria'
              }
            });
          }
        });
      }

      // 5. Buscar por referência externa (vale) - Campo existe em PagamentosPedidos.referenciaExterna
      if (/^\d+/.test(term)) {
        const vales = await this.prisma.pagamentosPedidos.findMany({
          where: {
            AND: [
              { referenciaExterna: { not: null } },
              { referenciaExterna: { contains: term, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            referenciaExterna: true,
            metodoPagamento: true,
            valorRecebido: true,
            pedido: {
              select: {
                id: true,
                numeroPedido: true,
                status: true,
                cliente: {
                  select: { nome: true }
                }
              }
            }
          },
          take: 3,
          orderBy: { createdAt: 'desc' }
        });

        vales.forEach(vale => {
          if (vale.referenciaExterna) {
            // Definir ícone baseado no método de pagamento (placeholders para substituição no frontend)
            let metodoIcon = 'PIX_ICON'; // default PIX
            switch (vale.metodoPagamento) {
              case 'PIX':
                metodoIcon = 'PIX_ICON'; // Será substituído pelo PixIcon no frontend
                break;
              case 'BOLETO':
                metodoIcon = 'BOLETO_ICON'; // Será substituído pelo BoletoIcon no frontend
                break;
              case 'TRANSFERENCIA':
                metodoIcon = 'TRANSFERENCIA_ICON'; // Será substituído pelo TransferenciaIcon no frontend
                break;
              case 'DINHEIRO':
                metodoIcon = 'DINHEIRO_ICON'; // Será substituído por emoji no frontend
                break;
              case 'CHEQUE':
                metodoIcon = 'CHEQUE_ICON'; // Será substituído por emoji no frontend
                break;
            }

            suggestions.push({
              type: 'vale',
              label: 'Referência/Vale',
              value: vale.referenciaExterna,
              icon: '💳',
              color: '#722ed1',
              description: `${metodoIcon} ${vale.metodoPagamento} 💰 R$ ${vale.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 👤 ${vale.pedido.cliente.nome} (${vale.pedido.numeroPedido})`,
              metadata: {
                id: vale.id,
                pedidoId: vale.pedido.id,
                numeroPedido: vale.pedido.numeroPedido,
                status: vale.pedido.status,
                metodoPagamento: vale.metodoPagamento,
                clienteNome: vale.pedido.cliente.nome,
                valor: vale.valorRecebido,
                metodoIcon: metodoIcon // Adicionar o ícone para processamento no frontend
              }
            });
          }
        });
      }

      // 6. Buscar por fornecedor
      if (term.length >= 3) {
        const fornecedores = await this.prisma.fornecedor.findMany({
          where: {
            nome: {
              contains: term,
              mode: 'insensitive'
            }
          },
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
            _count: {
              select: { areas: true }
            }
          },
          take: 3,
          orderBy: { nome: 'asc' }
        });

        fornecedores.forEach(fornecedor => {
          const documento = fornecedor.cnpj || fornecedor.cpf || 'N/A';
          suggestions.push({
            type: 'fornecedor',
            label: 'Fornecedor',
            value: fornecedor.nome,
            icon: '🏭',
            color: '#722ed1',
            description: `${fornecedor.nome} - ${documento} (${fornecedor._count.areas} áreas)`,
            metadata: {
              id: fornecedor.id,
              documento: documento,
              totalAreas: fornecedor._count.areas
            }
          });
        });
      }

      // 7. Buscar por áreas (próprias e de fornecedores)
      if (term.length >= 3) {
        // Buscar áreas próprias
        const areasAgricolas = await this.prisma.areaAgricola.findMany({
          where: {
            nome: {
              contains: term,
              mode: 'insensitive'
            }
          },
          select: {
            id: true,
            nome: true,
            categoria: true,
            areaTotal: true
          },
          take: 2,
          orderBy: { nome: 'asc' }
        });

        areasAgricolas.forEach(area => {
          suggestions.push({
            type: 'area',
            label: 'Área Própria',
            value: area.nome,
            icon: '🌾',
            color: '#52c41a',
            description: `${area.nome} (${area.categoria}) - ${area.areaTotal}ha`,
            metadata: {
              id: area.id,
              categoria: area.categoria,
              areaTotal: area.areaTotal,
              tipo: 'propria'
            }
          });
        });

        // Buscar áreas de fornecedores
        const areasFornecedores = await this.prisma.areaFornecedor.findMany({
          where: {
            nome: {
              contains: term,
              mode: 'insensitive'
            }
          },
          select: {
            id: true,
            nome: true,
            fornecedor: {
              select: {
                id: true,
                nome: true
              }
            }
          },
          take: 2,
          orderBy: { nome: 'asc' }
        });

        areasFornecedores.forEach(area => {
          suggestions.push({
            type: 'area',
            label: 'Área Fornecedor',
            value: area.nome,
            icon: '🏭',
            color: '#fa8c16',
            description: `${area.nome} - ${area.fornecedor.nome}`,
            metadata: {
              id: area.id,
              fornecedorId: area.fornecedor.id,
              fornecedorNome: area.fornecedor.nome,
              tipo: 'fornecedor'
            }
          });
        });
      }

      // 8. Buscar por fruta
      if (term.length >= 3) {
        const frutas = await this.prisma.fruta.findMany({
          where: {
            OR: [
              { nome: { contains: term, mode: 'insensitive' } },
              { codigo: { contains: term, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            nome: true,
            codigo: true,
            categoria: true,
            _count: {
              select: { frutasPedidos: true }
            }
          },
          take: 3,
          orderBy: { nome: 'asc' }
        });

        frutas.forEach(fruta => {
          suggestions.push({
            type: 'fruta',
            label: 'Fruta',
            value: fruta.nome,
            icon: '🍎',
            color: '#f5222d',
            description: `${fruta.nome}${fruta.categoria ? ` (${fruta.categoria})` : ''} - ${fruta._count.frutasPedidos} pedidos`,
            metadata: {
              id: fruta.id,
              codigo: fruta.codigo,
              categoria: fruta.categoria,
              totalPedidos: fruta._count.frutasPedidos
            }
          });
        });
      }

      // 9. Buscar por pesagem (campo string flexível)
      if (term.length >= 3) {
        const pesagens = await this.prisma.pedido.findMany({
          where: {
            AND: [
              { pesagem: { not: null } },
              { pesagem: { contains: term, mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            numeroPedido: true,
            pesagem: true,
            status: true,
            cliente: {
              select: { nome: true }
            }
          },
          take: 2,
          orderBy: { updatedAt: 'desc' }
        });

        pesagens.forEach(pesagem => {
          if (pesagem.pesagem) {
            suggestions.push({
              type: 'pesagem',
              label: 'Pesagem',
              value: pesagem.pesagem,
              icon: '⚖️',
              color: '#fa541c',
              description: `${pesagem.numeroPedido} - ${pesagem.cliente.nome}: ${pesagem.pesagem}`,
              metadata: {
                id: pesagem.id,
                numeroPedido: pesagem.numeroPedido,
                status: pesagem.status,
                clienteNome: pesagem.cliente.nome,
                pesagem: pesagem.pesagem
              }
            });
          }
        });
      }

      // Remover duplicatas e limitar resultados
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) =>
        index === self.findIndex(s => s.type === suggestion.type && s.value === suggestion.value)
      );

      return uniqueSuggestions.slice(0, 10); // Máximo 10 sugestões

    } catch (error) {
      console.error('Erro na busca inteligente:', error);
      return [];
    }
  }

}
