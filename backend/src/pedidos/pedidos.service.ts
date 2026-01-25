import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ControleBananaService } from '../controle-banana/controle-banana.service';
import { TurmaColheitaService } from '../turma-colheita/turma-colheita.service';
import { CreateTurmaColheitaPedidoCustoDto } from '../turma-colheita/dto/create-colheita-pedido.dto';
import { StatusPedido, Prisma, StatusBoleto } from '@prisma/client';
import { capitalizeName } from '../utils/formatters';
import {
  CreatePedidoDto,
  UpdatePedidoDto,
  UpdateColheitaDto,
  UpdatePrecificacaoDto,
  UpdatePagamentoDto,
  UpdatePagamentoValeDto,
  PedidoResponseDto,
  UpdatePedidoCompletoDto,
  CreatePagamentoDto,
  UpdateAjustesPrecificacaoDto
} from './dto';

import { HistoricoService } from '../historico/historico.service';
import { TipoAcaoHistorico } from '../historico/types/historico.types';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { LancamentoExtratoService } from '../extratos/lancamento-extrato.service';

@Injectable()
export class PedidosService {
  constructor(
    private prisma: PrismaService,
    private controleBananaService: ControleBananaService,
    private turmaColheitaService: TurmaColheitaService,
    private historicoService: HistoricoService,
    private notificacoesService: NotificacoesService,
    private lancamentoExtratoService: LancamentoExtratoService
  ) {}

  async getDashboardStats(
    paginaFinalizados: number = 1,
    limitFinalizados: number = 10,
    usuarioNivel?: string,
    usuarioCulturaId?: number,
  ): Promise<any> {
    // Validar e garantir que os parâmetros sejam números válidos
    const paginaValida = Math.max(1, Math.floor(paginaFinalizados) || 1);
    const limitValido = Math.max(1, Math.floor(limitFinalizados) || 10);

    // ✅ FILTRO BASE PARA PEDIDOS ATIVOS
    const whereAtivos: any = {
      status: {
        notIn: [StatusPedido.PEDIDO_FINALIZADO, StatusPedido.CANCELADO]
      }
    };

    // ✅ FILTRO POR CULTURA PARA GERENTE_CULTURA
    if (usuarioNivel === 'GERENTE_CULTURA' && usuarioCulturaId) {
      whereAtivos.frutasPedidos = {
        some: {
          fruta: {
            culturaId: usuarioCulturaId
          }
        }
      };
      // Gerentes de cultura só veem pedidos em fases específicas
      whereAtivos.status = {
        in: [StatusPedido.AGUARDANDO_COLHEITA, StatusPedido.COLHEITA_PARCIAL, StatusPedido.COLHEITA_REALIZADA]
      };
    }

    // Buscar pedidos ativos (não finalizados) com dados completos para dashboard
    const pedidosAtivos = await this.prisma.pedido.findMany({
      where: whereAtivos,
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
            industria: true,
            dias: true
          }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: {
                id: true,
                nome: true,
                dePrimeira: true,
                culturaId: true,
                cultura: {
                  select: {
                    id: true,
                    descricao: true
                  }
                }
              }
            },
            areas: {
              select: {
                id: true,
                areaPropriaId: true,
                areaFornecedorId: true,
                observacoes: true,
                quantidadeColhidaUnidade1: true,
                quantidadeColhidaUnidade2: true,
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
                    cultura: {
                      select: {
                        id: true,
                        descricao: true
                      }
                    },
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
        },
        custosColheita: {
          include: {
            turmaColheita: {
              select: {
                id: true,
                nomeColhedor: true,
                chavePix: true,
                responsavelChavePix: true,
                observacoes: true,
                dataCadastro: true
              }
            },
            fruta: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      },
      orderBy: [
        { dataPrevistaColheita: 'asc' },
        { id: 'desc' }
      ]
    });

    // ✅ FILTRO BASE PARA TODOS OS PEDIDOS (ESTATÍSTICAS)
    const whereTodos: any = {};

    // ✅ FILTRO POR CULTURA PARA GERENTE_CULTURA (estatísticas)
    if (usuarioNivel === 'GERENTE_CULTURA' && usuarioCulturaId) {
      whereTodos.frutasPedidos = {
        some: {
          fruta: {
            culturaId: usuarioCulturaId
          }
        }
      };
      // Gerentes de cultura só veem pedidos em fases específicas
      whereTodos.status = {
        in: ['AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL', 'COLHEITA_REALIZADA']
      };
    }

    // Buscar todos os pedidos apenas para estatísticas
    const todosPedidos = await this.prisma.pedido.findMany({
      where: whereTodos,
      select: {
        id: true,
        status: true,
        valorFinal: true,
        valorRecebido: true,
        dataPrevistaColheita: true,
        dataPedido: true,
        dataColheita: true // ✅ Necessário para cálculo de pedidos vencidos
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
      const { status, valorFinal, valorRecebido, dataColheita } = pedido;

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

      // ✅ LÓGICA UNIFICADA: Pedidos vencidos = dataColheita > 30 dias + saldo devedor
      // Considera vencido quando:
      // 1. Tem data de colheita
      // 2. Passou 30 dias da colheita
      // 3. Tem valor final
      // 4. Tem saldo devedor (valor não pago completamente)
      if (dataColheita && dataColheita < trintaDiasAtras && valorFinal && valorFinal > 0) {
        const saldoDevedor = valorFinal - (valorRecebido || 0);
        if (saldoDevedor > 0) {
          stats.pedidosVencidos++;
        }
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
            nome: true,
            industria: true,
            dias: true
          }
        },
          frutasPedidos: {
            include: {
              fruta: {
                select: {
                  id: true,
                  nome: true,
                  cultura: {
                    select: {
                      id: true,
                      descricao: true
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

    // ✅ CORREÇÃO: Processar pedidos ativos usando adaptPedidoResponse para garantir mapeamento correto de maoObra
    const pedidosAtivosFomatados = pedidosAtivos.map(pedido => this.adaptPedidoResponse(pedido));

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
    if (typeof obj === 'bigint') {
      return Number(obj);
    }
    if (obj && typeof obj === 'object' && typeof obj.toNumber === 'function') {
      try {
        return obj.toNumber();
      } catch (error) {
        const value = obj.valueOf?.();
        return typeof value === 'number' ? value : Number(value);
      }
    }
    if (Array.isArray(obj)) {
      return obj.map(item => this.convertNullToUndefined(item));
    }
    if (typeof obj === 'object') {
      const converted = { ...obj };
      for (const key in converted) {
        if (converted[key] === null) {
          converted[key] = undefined;
        } else if (converted[key] instanceof Date) {
          converted[key] = converted[key].toISOString();
        } else {
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
              quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 || null,
              quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 || null
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
      }) || [],
      // ✅ NOVO: Adaptar mão de obra (custos de colheita)
      maoObra: pedido.custosColheita?.map(custo => ({
        id: custo.id,
        turmaColheitaId: custo.turmaColheitaId,
        frutaId: custo.frutaId, // ✅ Corrigido: usar frutaId ao invés de frutaPedidoId
        quantidadeColhida: custo.quantidadeColhida,
        valorColheita: custo.valorColheita,
        observacoes: custo.observacoes
      })) || [],
      lancamentosExtratoVinculos: pedido.lancamentosExtratoVinculos?.map((vinculo) => ({
        id: vinculo.id ? Number(vinculo.id) : vinculo.id,
        lancamentoExtratoId: vinculo.lancamentoExtratoId ? Number(vinculo.lancamentoExtratoId) : undefined,
        valorVinculado: vinculo.valorVinculado !== undefined && vinculo.valorVinculado !== null
          ? Number(vinculo.valorVinculado)
          : undefined,
        createdAt: vinculo.createdAt,
        updatedAt: vinculo.updatedAt,
        lancamentoExtrato: vinculo.lancamentoExtrato
          ? {
              id: vinculo.lancamentoExtrato.id ? Number(vinculo.lancamentoExtrato.id) : vinculo.lancamentoExtrato.id,
              textoDescricaoHistorico: vinculo.lancamentoExtrato.textoDescricaoHistorico || undefined,
              categoriaOperacao: vinculo.lancamentoExtrato.categoriaOperacao || undefined,
              nomeContrapartida: vinculo.lancamentoExtrato.nomeContrapartida || undefined,
              agenciaConta: vinculo.lancamentoExtrato.agenciaConta || undefined,
              numeroConta: vinculo.lancamentoExtrato.numeroConta || undefined,
              textoInformacaoComplementar: vinculo.lancamentoExtrato.textoInformacaoComplementar || undefined,
            }
          : undefined,
      })) || [],
      // ✅ NOVO: Incluir usuário criador do pedido (primeiro registro CRIACAO_PEDIDO)
      usuarioCriador: (() => {
        const historicoCriacao = pedido.historico?.find(h => h.acao === 'CRIACAO_PEDIDO');
        return historicoCriacao?.usuario ? {
          id: historicoCriacao.usuario.id,
          nome: historicoCriacao.usuario.nome,
          email: historicoCriacao.usuario.email
        } : undefined;
      })(),
      // ✅ NOVO: Incluir histórico completo do pedido
      historicoCompleto: pedido.historico?.map(h => ({
        id: h.id,
        acao: h.acao,
        statusAnterior: h.statusAnterior,
        statusNovo: h.statusNovo,
        detalhes: h.detalhes,
        createdAt: h.createdAt,
        usuario: h.usuario ? {
          id: h.usuario.id,
          nome: h.usuario.nome,
          email: h.usuario.email
        } : null
      })) || []
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

  // NOVO: Função para calcular o valor total de boletos pendentes de um pedido
  private async calcularValorBoletosPendentes(pedidoId: number, prismaClient?: any): Promise<number> {
    const prisma = prismaClient || this.prisma;
    
    const boletosPendentes = await prisma.boleto.findMany({
      where: {
        pedidoId: pedidoId,
        statusBoleto: {
          in: [StatusBoleto.ABERTO, StatusBoleto.PROCESSANDO, StatusBoleto.VENCIDO]
        }
      },
      select: { valorOriginal: true },
    });
    
    const valorTotal = boletosPendentes.reduce((total, boleto) => {
      return total + Number(boleto.valorOriginal || 0);
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

    let novoStatus: StatusPedido;

    if (valorRecebido >= pedido.valorFinal) {
      novoStatus = StatusPedido.PEDIDO_FINALIZADO;
    } else if (valorRecebido > 0) {
      novoStatus = StatusPedido.PAGAMENTO_PARCIAL;
    } else {
      novoStatus = StatusPedido.AGUARDANDO_PAGAMENTO;
    }

    // Só atualiza se o status mudou
    if (pedido.status !== novoStatus) {
      await this.prisma.pedido.update({
        where: { id: pedidoId },
        data: { status: novoStatus }
      });
    }
  }

  /**
   * Valida se já existe um pedido duplicado para o mesmo cliente, fruta e data prevista de colheita
   * @param createPedidoDto DTO do pedido a ser criado
   * @returns Informações sobre pedidos duplicados encontrados ou null se não houver duplicidade
   */
  private async validarDuplicidadePedido(createPedidoDto: CreatePedidoDto): Promise<any[] | null> {
    const dataPrevistaColheita = new Date(createPedidoDto.dataPrevistaColheita);
    // Normalizar para início do dia para comparação apenas da data
    const inicioDia = new Date(dataPrevistaColheita);
    inicioDia.setHours(0, 0, 0, 0);
    const fimDia = new Date(dataPrevistaColheita);
    fimDia.setHours(23, 59, 59, 999);

    // Buscar pedidos com mesmo cliente e mesma data prevista de colheita
    const pedidosCandidatos = await this.prisma.pedido.findMany({
      where: {
        clienteId: createPedidoDto.clienteId,
        dataPrevistaColheita: {
          gte: inicioDia,
          lte: fimDia,
        },
        // Excluir pedidos cancelados
        status: {
          not: StatusPedido.CANCELADO,
        },
      },
      include: {
        cliente: {
          select: {
            id: true,
            nome: true,
          },
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: {
                id: true,
                nome: true,
              },
            },
          },
        },
      },
    });

    if (pedidosCandidatos.length === 0) {
      return null;
    }

    // Verificar se alguma fruta do novo pedido já existe em algum pedido candidato
    const frutaIdsNovoPedido = createPedidoDto.frutas.map((f) => f.frutaId);
    const pedidosDuplicados: any[] = [];

    for (const pedido of pedidosCandidatos) {
      const frutaIdsPedidoExistente = pedido.frutasPedidos.map((fp) => fp.frutaId);
      
      // Verificar se há interseção entre as frutas
      const frutasDuplicadas = frutaIdsNovoPedido.filter((frutaId) =>
        frutaIdsPedidoExistente.includes(frutaId)
      );

      if (frutasDuplicadas.length > 0) {
        // Buscar nomes das frutas duplicadas
        const frutasInfo = pedido.frutasPedidos
          .filter((fp) => frutasDuplicadas.includes(fp.frutaId))
          .map((fp) => ({
            id: fp.frutaId,
            nome: fp.fruta.nome,
            quantidadePrevista: fp.quantidadePrevista,
            unidadeMedida1: fp.unidadeMedida1,
          }));

        pedidosDuplicados.push({
          pedidoId: pedido.id,
          numeroPedido: pedido.numeroPedido,
          cliente: {
            id: pedido.cliente.id,
            nome: pedido.cliente.nome,
          },
          dataPrevistaColheita: pedido.dataPrevistaColheita,
          dataPedido: pedido.dataPedido,
          frutas: frutasInfo,
          status: pedido.status,
        });
      }
    }

    return pedidosDuplicados.length > 0 ? pedidosDuplicados : null;
  }

  async create(createPedidoDto: CreatePedidoDto, usuarioId: number, origem: 'web' | 'mobile' = 'web', confirmarDuplicado: boolean = false): Promise<PedidoResponseDto> {
    // ✅ Validar se usuarioId foi fornecido
    if (!usuarioId) {
      throw new BadRequestException('ID do usuário não fornecido');
    }

    // Verificar se o usuário existe
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException(`Usuário com ID ${usuarioId} não encontrado`);
    }

    // Verificar se cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: createPedidoDto.clienteId },
    });
    if (!cliente) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // ✅ NOVA VALIDAÇÃO: Verificar duplicidade de pedido (apenas se não confirmado pelo usuário)
    if (!confirmarDuplicado) {
      const pedidosDuplicados = await this.validarDuplicidadePedido(createPedidoDto);
      if (pedidosDuplicados && pedidosDuplicados.length > 0) {
        // Lançar exceção especial com código de erro e dados dos pedidos duplicados
        throw new BadRequestException({
          code: 'PEDIDO_DUPLICADO',
          message: 'Já existe um pedido registrado para este cliente, fruta(s) e data prevista de colheita',
          pedidosDuplicados: pedidosDuplicados,
        });
      }
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

    const frutasCatalogo = await this.prisma.fruta.findMany({
      where: { id: { in: Array.from(frutasUnicas) } },
      select: { id: true, culturaId: true, dePrimeira: true },
    });

    const frutaCatalogoPorId = new Map<number, { culturaId: number; dePrimeira: boolean }>();
    const culturaComFrutaDePrimeira = new Map<number, boolean>();

    for (const frutaInfo of frutasCatalogo) {
      frutaCatalogoPorId.set(frutaInfo.id, {
        culturaId: frutaInfo.culturaId,
        dePrimeira: frutaInfo.dePrimeira ?? false,
      });
    }

    for (const frutaPedido of createPedidoDto.frutas) {
      const info = frutaCatalogoPorId.get(frutaPedido.frutaId);
      if (info?.dePrimeira) {
        culturaComFrutaDePrimeira.set(info.culturaId, true);
      }
    }

    // Verificar se todas as frutas existem e validar áreas/fitas
    for (const fruta of createPedidoDto.frutas) {
      const frutaInfo = frutaCatalogoPorId.get(fruta.frutaId);
      if (!frutaInfo) {
        throw new NotFoundException(`Fruta com ID ${fruta.frutaId} não encontrada`);
      }

      const isFrutaDePrimeira = frutaInfo.dePrimeira === true;
      const existeFrutaDePrimeiraNaCultura =
        culturaComFrutaDePrimeira.get(frutaInfo.culturaId) === true;

      const deveExigirArea = isFrutaDePrimeira || !existeFrutaDePrimeiraNaCultura;

      if (deveExigirArea && (!fruta.areas || fruta.areas.length === 0)) {
        throw new BadRequestException(
          `A fruta ${fruta.frutaId} precisa ter pelo menos uma área vinculada porque não existe outra fruta de primeira para a cultura selecionada.`
        );
      }

      if (fruta.areas && fruta.areas.length > 0) {
        // Validar que cada área é ou própria OU de fornecedor OU placeholder (não ambas)
        for (const area of fruta.areas) {
          const temAreaPropria = !!area.areaPropriaId;
          const temAreaFornecedor = !!area.areaFornecedorId;

          if (temAreaPropria && temAreaFornecedor) {
            throw new BadRequestException('Área não pode ser própria E de fornecedor simultaneamente');
          }

          // Permitir áreas placeholder durante criação (sem área definida)
          if (!temAreaPropria && !temAreaFornecedor) {
            continue;
          }

          if (temAreaPropria) {
            const areaPropriaExiste = await this.prisma.areaAgricola.findUnique({
              where: { id: area.areaPropriaId },
            });
            if (!areaPropriaExiste) {
              throw new NotFoundException(`Área própria com ID ${area.areaPropriaId} não encontrada`);
            }
          }

          if (temAreaFornecedor) {
            const areaFornecedorExiste = await this.prisma.areaFornecedor.findUnique({
              where: { id: area.areaFornecedorId },
            });
            if (!areaFornecedorExiste) {
              throw new NotFoundException(`Área de fornecedor com ID ${area.areaFornecedorId} não encontrada`);
            }
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
          // Campos de frete (opcionais - usados principalmente no app mobile)
          placaPrimaria: createPedidoDto.placaPrimaria || undefined,
          placaSecundaria: createPedidoDto.placaSecundaria || undefined,
          // Campos específicos para clientes indústria
          indDataEntrada: createPedidoDto.indDataEntrada ? new Date(createPedidoDto.indDataEntrada) : null,
          indDataDescarga: createPedidoDto.indDataDescarga ? new Date(createPedidoDto.indDataDescarga) : null,
          indPesoMedio: createPedidoDto.indPesoMedio,
          indMediaMililitro: createPedidoDto.indMediaMililitro,
          indNumeroNf: createPedidoDto.indNumeroNf,
          // Campo de número NF do pedido (controle interno)
          numeroNf: createPedidoDto.numeroNf,
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
        if (fruta.areas && fruta.areas.length > 0) {
          for (const area of fruta.areas) {
            await prisma.frutasPedidosAreas.create({
              data: {
                frutaPedidoId: frutaPedido.id,
                areaPropriaId: area.areaPropriaId || null,
                areaFornecedorId: area.areaFornecedorId || null,
                observacoes: area.observacoes,
                quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 || null,
                quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 || null
              },
            });
          }
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

    // ✅ CORREÇÃO: Registrar histórico APÓS a transação ser commitada
    await this.historicoService.registrarAcao(
      pedido.id,
      usuarioId,
      TipoAcaoHistorico.CRIACAO_PEDIDO,
      {
        statusNovo: pedido.status,
        mensagem: `Pedido ${pedido.numeroPedido} criado`,
      }
    );

    // Criar notificações para criação do pedido (não bloqueante)
    // Não aguardamos para não impactar a resposta da API
    // Excluímos o criador do pedido das notificações (já sabe que criou)
    this.notificacoesService
      .criarNotificacaoPedidoCriado(pedido.id, origem, usuarioId)
      .catch((error) => {
        // Log erro mas não interromper o fluxo
        console.error(`[PedidosService] Erro ao criar notificações para pedido ${pedido.id}:`, error);
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
    status?: string[],
    clienteId?: number,
    dataInicio?: Date,
    dataFim?: Date,
    tipoData?: 'criacao' | 'colheita',
    filters?: string[],
    usuarioNivel?: string,
    usuarioCulturaId?: number,
  ): Promise<{ data: PedidoResponseDto[]; total: number; page: number; limit: number }> {
    // Converter page/limit para números de forma segura, pois podem chegar como string via @Query
    const pageNum = (() => {
      if (typeof (page as unknown) === 'string') {
        const parsed = parseInt(page as unknown as string, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
      }
      if (typeof page === 'number') {
        return page > 0 ? page : 1;
      }
      return 1;
    })();

    const limitNum = (() => {
      if (typeof (limit as unknown) === 'string') {
        const parsed = parseInt(limit as unknown as string, 10);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
      }
      if (typeof limit === 'number') {
        return limit > 0 ? limit : 10;
      }
        return 10;
    })();

    const skip = pageNum && limitNum ? (pageNum - 1) * limitNum : 0;
    const take = limitNum;

    const where: any = {};

    // ✅ FILTRO POR CULTURA PARA GERENTE_CULTURA

    if (usuarioNivel === 'GERENTE_CULTURA' && usuarioCulturaId) {
      const isPendentes = status?.includes('AGUARDANDO_COLHEITA') || status?.includes('PEDIDO_CRIADO');
      const isRealizadas = status?.includes('COLHEITA_REALIZADA') || status?.includes('AGUARDANDO_PRECIFICACAO');

      // Logic for "Pendentes" tab
      if (isPendentes) {
        where.AND = [
          {
            // Order must have at least one fruit of the manager's culture that is not yet harvested
            frutasPedidos: {
              some: {
                fruta: { culturaId: usuarioCulturaId },
                quantidadeReal: null,
              },
            },
          },
          {
            // And the order status must be one that is still open for harvesting
            status: { in: ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL'] },
          },
        ];
        // We've handled the status filtering, so clear the original status parameter
        // to prevent it from interfering later in the function.
        status = undefined;
      } 
      // Logic for "Realizadas" tab
      else if (isRealizadas) {
        where.AND = [
          {
            // Order must have at least one fruit of the manager's culture that has been harvested
            frutasPedidos: {
              some: {
                fruta: { culturaId: usuarioCulturaId },
                quantidadeReal: { not: null },
              },
            },
          },
          {
            // And the order status must be one of the "realizadas" states
            status: { in: ['COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO', 'COLHEITA_PARCIAL'] },
          }
        ];
        // Clear the original status parameter
        status = undefined;
      } 
      // Default logic if no specific tab/status is provided
      else {
        where.frutasPedidos = {
          some: {
            fruta: { culturaId: usuarioCulturaId },
          },
        };
      }
    }

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
            if (/^\d+$/.test(search)) {
              // Se for um ID numérico, filtrar por ID
              where.frutasPedidos = {
                some: { frutaId: parseInt(search) }
              };
            } else {
              // Fallback: se for um nome, filtrar por nome
              where.frutasPedidos = {
                some: { fruta: { nome: { contains: search, mode: 'insensitive' } } }
              };
            }
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

    // ✅ Processar filtros de status (suporta string única ou array)
    if (status && usuarioNivel !== 'GERENTE_CULTURA') {
      // Aceitar tanto array quanto string CSV em status
      const normalized = (Array.isArray(status) ? status : [status])
        .flatMap((s) => (typeof s === 'string' ? s.split(',') : []))
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      if (normalized.length > 0) {
        where.status = { in: normalized as any[] };
      }
    }

    // ✅ NOVA LÓGICA: Processar filtros aninhados
    if (filters) {
      // Garantir que filters seja um array
      const filtersArray = Array.isArray(filters) ? filters : [filters];

      const groupedFilters = filtersArray.reduce<Record<string, string[]>>((acc, filter) => {
        if (!filter || !filter.includes(':')) {
          return acc;
        }

        const [type, rawValue] = filter.split(':', 2);

        if (!type || rawValue === undefined) {
          return acc;
        }

        const decodedValue = decodeURIComponent(rawValue).trim();

        if (!decodedValue) {
          return acc;
        }

        if (!acc[type]) {
          acc[type] = [];
        }

        acc[type].push(decodedValue);
        return acc;
      }, {});

      const buildFilterCondition = (type: string, value: string): Prisma.PedidoWhereInput | null => {
        switch (type) {
          case 'semLancamento':
          case 'semVinculoExtrato':
          case 'semVinculo': {
            const truthy = ['1', 'true', 'sim', 'yes'].includes(String(value).toLowerCase());
            return truthy ? { lancamentosExtratoVinculos: { none: {} } } : null;
          }
          case 'comLancamento':
          case 'comVinculoExtrato':
          case 'comVinculo': {
            const truthy = ['1', 'true', 'sim', 'yes'].includes(String(value).toLowerCase());
            return truthy ? { lancamentosExtratoVinculos: { some: {} } } : null;
          }
          case 'cliente':
            if (/^\d+$/.test(value)) {
              return { clienteId: parseInt(value, 10) };
            }
            return { cliente: { nome: { equals: value, mode: 'insensitive' } } };
          case 'numero':
            return { numeroPedido: { equals: value, mode: 'insensitive' } };
          case 'motorista':
            return { nomeMotorista: { contains: value, mode: 'insensitive' } };
          case 'placa':
            return {
              OR: [
                { placaPrimaria: { contains: value, mode: 'insensitive' } },
                { placaSecundaria: { contains: value, mode: 'insensitive' } },
              ],
            };
          case 'vale':
            return {
              pagamentosPedidos: {
                some: { referenciaExterna: { equals: value, mode: 'insensitive' } },
              },
            };
          case 'fornecedor':
            return {
              frutasPedidos: {
                some: {
                  areas: {
                    some: {
                      areaFornecedor: {
                        fornecedor: { nome: { contains: value, mode: 'insensitive' } },
                      },
                    },
                  },
                },
              },
            };
          case 'area':
            if (/^\d+$/.test(value)) {
              const areaId = parseInt(value, 10);
              return {
                frutasPedidos: {
                  some: {
                    areas: {
                      some: {
                        OR: [
                          { areaPropriaId: areaId },
                          { areaFornecedorId: areaId },
                        ],
                      },
                    },
                  },
                },
              };
            }
            return {
              frutasPedidos: {
                some: {
                  areas: {
                    some: {
                      OR: [
                        { areaPropria: { nome: { contains: value, mode: 'insensitive' } } },
                        { areaFornecedor: { nome: { contains: value, mode: 'insensitive' } } },
                      ],
                    },
                  },
                },
              },
            };
          case 'fruta':
            if (/^\d+$/.test(value)) {
              return {
                frutasPedidos: {
                  some: { frutaId: parseInt(value, 10) },
                },
              };
            }
            return {
              frutasPedidos: {
                some: { fruta: { nome: { contains: value, mode: 'insensitive' } } },
              },
            };
          case 'cultura':
            if (/^\d+$/.test(value)) {
              return {
                frutasPedidos: {
                  some: { fruta: { culturaId: parseInt(value, 10) } },
                },
              };
            }
            return {
              frutasPedidos: {
                some: {
                  fruta: {
                    cultura: { descricao: { contains: value, mode: 'insensitive' } },
                  },
                },
              },
            };
          case 'pesagem':
            return { pesagem: { contains: value, mode: 'insensitive' } };
          case 'indNumeroNf':
            if (/^\d+$/.test(value)) {
              return { indNumeroNf: parseInt(value, 10) };
            }
            return null;
          case 'numeroNf':
            if (/^\d+$/.test(value)) {
              return { numeroNf: parseInt(value, 10) };
            }
            return null;
          case 'turma':
            if (/^\d+$/.test(value)) {
              return {
                custosColheita: {
                  some: { turmaColheitaId: parseInt(value, 10) },
                },
              };
            }
            return {
              custosColheita: {
                some: {
                  turmaColheita: {
                    nomeColhedor: { contains: value, mode: 'insensitive' },
                  },
                },
              },
            };
          default:
            return null;
        }
      };

      const filterConditions: Prisma.PedidoWhereInput[] = [];

      Object.entries(groupedFilters).forEach(([type, values]) => {
        const conditions: Prisma.PedidoWhereInput[] = [];

        values.forEach((value) => {
          const condition = buildFilterCondition(type, value);
          if (condition) {
            conditions.push(condition);
          }
        });

        if (conditions.length === 1) {
          filterConditions.push(conditions[0]);
        } else if (conditions.length > 1) {
          filterConditions.push({ OR: conditions });
        }
      });

      if (filterConditions.length > 0) {
        if (where.AND) {
          where.AND = [...where.AND, ...filterConditions];
        } else {
          where.AND = filterConditions;
        }
      }
    }

    if (clienteId) {
      // Garantir que clienteId seja numérico
      const clienteIdNum = typeof (clienteId as unknown) === 'string'
        ? parseInt(clienteId as unknown as string, 10)
        : (clienteId as number);
      if (Number.isFinite(clienteIdNum)) {
        where.clienteId = clienteIdNum as number;
      }
    }

    if (dataInicio && dataFim) {
      // Ajustar as datas para comparar apenas o dia, ignorando horários
      const startOfDay = new Date(dataInicio);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(dataFim);
      endOfDay.setHours(23, 59, 59, 999);

      // Filtrar por tipo de data: criacao (dataPedido) ou colheita (dataPrevistaColheita)
      if (tipoData === 'colheita') {
        // Quando filtrar por colheita, usar dataPrevistaColheita
        where.dataPrevistaColheita = {
          gte: startOfDay,
          lte: endOfDay,
        };
      } else {
        // Padrão: filtrar por data de criação (dataPedido)
        where.dataPedido = {
          gte: startOfDay,
          lte: endOfDay,
        };
      }
    }

    const [pedidos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        skip,
        take,
        orderBy: { updatedAt: 'desc' },
        include: {
          cliente: {
            select: { id: true, nome: true, industria: true, dias: true }
          },
          frutasPedidos: {
            include: {
              fruta: {
                select: { 
                  id: true, 
                  nome: true,
                  dePrimeira: true,
                  culturaId: true,
                  cultura: {
                    select: {
                      id: true,
                      descricao: true
                    }
                  }
                }
              },
              areas: {
                select: {
                  id: true,
                  areaPropriaId: true,
                  areaFornecedorId: true,
                  observacoes: true,
                  quantidadeColhidaUnidade1: true,
                  quantidadeColhidaUnidade2: true,
                  areaPropria: {
                    select: { id: true, nome: true }
                  },
                  areaFornecedor: {
                    select: { 
                      id: true, 
                      nome: true,
                      cultura: {
                        select: {
                          id: true,
                          descricao: true
                        }
                      },
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
          pagamentosPedidos: true,
          custosColheita: {
            include: {
              turmaColheita: {
                select: {
                  id: true,
                  nomeColhedor: true,
                  chavePix: true,
                  responsavelChavePix: true,
                  observacoes: true,
                  dataCadastro: true
                }
              },
              fruta: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          },
          lancamentosExtratoVinculos: {
            select: {
              id: true,
              lancamentoExtratoId: true,
              valorVinculado: true,
              createdAt: true,
              updatedAt: true,
            lancamentoExtrato: {
              select: {
                id: true,
                textoDescricaoHistorico: true,
                categoriaOperacao: true,
                nomeContrapartida: true,
                agenciaConta: true,
                numeroConta: true,
                textoInformacaoComplementar: true,
              },
            },
            },
          }
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

  async findByCliente(
    clienteId: number,
    statusFilter?: string,
    usuarioNivel?: string,
    usuarioCulturaId?: number,
  ): Promise<{
    data: PedidoResponseDto[];
    total: number;
    statusFiltrados?: string[];
  }> {
    // Verificar se o cliente existe
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: clienteId },
      select: { id: true, nome: true, industria: true, dias: true }
    });

    if (!cliente) {
      throw new NotFoundException(`Cliente com ID ${clienteId} não encontrado`);
    }

    // Construir filtros
    const where: any = { clienteId };
    let statusFiltrados: string[] = [];

    // ✅ FILTRO POR CULTURA PARA GERENTE_CULTURA
    if (usuarioNivel === 'GERENTE_CULTURA' && usuarioCulturaId) {
      where.frutasPedidos = {
        some: {
          fruta: {
            culturaId: usuarioCulturaId
          }
        }
      };
    }

    if (statusFilter) {
      statusFiltrados = statusFilter.split(',').map(s => s.trim()).filter(Boolean);
      if (statusFiltrados.length > 0) {
        // Se é GERENTE_CULTURA, garantir que os status filtrados sejam apenas os permitidos
        if (usuarioNivel === 'GERENTE_CULTURA') {
          const statusPermitidos = ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL', 'COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO'];
          statusFiltrados = statusFiltrados.filter(s => statusPermitidos.includes(s));
        }

        if (statusFiltrados.length > 0) {
          where.status = {
            in: statusFiltrados
          };
        }
      }
    } else if (usuarioNivel === 'GERENTE_CULTURA') {
      // Se não há filtro de status, aplicar filtro padrão para GERENTE_CULTURA
      where.status = {
        in: ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL', 'COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO']
      };
    }

    // Buscar pedidos do cliente com filtros
    const [pedidos, total] = await Promise.all([
      this.prisma.pedido.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        include: {
          cliente: {
            select: { id: true, nome: true, industria: true, dias: true }
          },
          frutasPedidos: {
            include: {
              fruta: {
                select: { 
                  id: true, 
                  nome: true,
                  cultura: {
                    select: {
                      id: true,
                      descricao: true
                    }
                  }
                }
              },
              areas: {
                select: {
                  id: true,
                  areaPropriaId: true,
                  areaFornecedorId: true,
                  observacoes: true,
                  quantidadeColhidaUnidade1: true,
                  quantidadeColhidaUnidade2: true,
                  areaPropria: {
                    select: { id: true, nome: true }
                  },
                  areaFornecedor: {
                    select: {
                      id: true,
                      nome: true,
                      cultura: {
                        select: {
                          id: true,
                          descricao: true
                        }
                      },
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
          pagamentosPedidos: true,
          custosColheita: {
            include: {
              turmaColheita: {
                select: {
                  id: true,
                  nomeColhedor: true,
                  chavePix: true,
                  responsavelChavePix: true,
                  observacoes: true,
                  dataCadastro: true
                }
              },
              fruta: {
                select: {
                  id: true,
                  nome: true
                }
              }
            }
          },
          lancamentosExtratoVinculos: {
            select: {
              id: true,
              lancamentoExtratoId: true,
              valorVinculado: true,
              createdAt: true,
              updatedAt: true,
            lancamentoExtrato: {
              select: {
                id: true,
                textoDescricaoHistorico: true,
                categoriaOperacao: true,
                nomeContrapartida: true,
                agenciaConta: true,
                numeroConta: true,
                textoInformacaoComplementar: true,
              },
            },
            }
          }
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

  async findOne(id: number, usuarioNivel?: string, usuarioCulturaId?: number): Promise<PedidoResponseDto> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        cliente: {
          select: { id: true, nome: true, industria: true, dias: true }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: {
                id: true,
                nome: true,
                dePrimeira: true,
                culturaId: true,
                cultura: {
                  select: {
                    id: true,
                    descricao: true
                  }
                }
              }
            },
            areas: {
              select: {
                id: true,
                areaPropriaId: true,
                areaFornecedorId: true,
                observacoes: true,
                quantidadeColhidaUnidade1: true,
                quantidadeColhidaUnidade2: true,
                areaPropria: {
                  select: { id: true, nome: true }
                },
                areaFornecedor: {
                  select: {
                    id: true,
                    nome: true,
                    cultura: {
                      select: {
                        id: true,
                        descricao: true
                      }
                    },
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
        pagamentosPedidos: true,
        custosColheita: {
          include: {
            turmaColheita: {
              select: {
                id: true,
                nomeColhedor: true,
                chavePix: true,
                responsavelChavePix: true,
                observacoes: true,
                dataCadastro: true
              }
            },
            fruta: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        },
        lancamentosExtratoVinculos: {
          select: {
            id: true,
            lancamentoExtratoId: true,
            valorVinculado: true,
            createdAt: true,
            updatedAt: true,
            lancamentoExtrato: {
              select: {
                id: true,
                textoDescricaoHistorico: true,
                categoriaOperacao: true,
                nomeContrapartida: true,
                agenciaConta: true,
                numeroConta: true,
                textoInformacaoComplementar: true,
              },
            },
          },
        },
        historico: {
          include: {
            usuario: {
              select: {
                id: true,
                nome: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      }
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // ✅ VALIDAÇÃO DE PERMISSÃO PARA GERENTE_CULTURA
    if (usuarioNivel === 'GERENTE_CULTURA' && usuarioCulturaId) {
      // Verificar se o pedido contém frutas da cultura do usuário
      const temFrutaDaCultura = pedido.frutasPedidos.some(
        fp => fp.fruta.cultura?.id === usuarioCulturaId
      );

      if (!temFrutaDaCultura) {
        throw new ForbiddenException('Você não tem permissão para acessar este pedido');
      }

      // Verificar se o pedido está em uma fase permitida
      const statusPermitidos = ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL', 'COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO'];
      if (!statusPermitidos.includes(pedido.status)) {
        throw new ForbiddenException('Você não tem permissão para acessar pedidos nesta fase');
      }
    }

    const pedidoAdaptado = this.adaptPedidoResponse(pedido);
    return this.convertNullToUndefined(pedidoAdaptado);
  }

  async update(id: number, updatePedidoDto: UpdatePedidoDto, usuarioId: number): Promise<PedidoResponseDto> {
    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const statusAnterior = existingPedido.status;

    // Só permite atualizar pedidos que ainda não foram finalizados
    if (existingPedido.status === 'PEDIDO_FINALIZADO' || existingPedido.status === 'CANCELADO') {
      throw new BadRequestException('Não é possível atualizar pedidos finalizados ou cancelados');
    }

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: updatePedidoDto,
      include: {
        cliente: {
          select: { id: true, nome: true, industria: true, dias: true }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: { 
                id: true, 
                nome: true,
                dePrimeira: true,
                culturaId: true,
                cultura: {
                  select: {
                    id: true,
                    descricao: true
                  }
                }
              }
            },
            areas: {
              select: {
                id: true,
                areaPropriaId: true,
                areaFornecedorId: true,
                observacoes: true,
                quantidadeColhidaUnidade1: true,
                quantidadeColhidaUnidade2: true,
                areaPropria: {
                  select: { id: true, nome: true }
                },
                areaFornecedor: {
                  select: { 
                    id: true, 
                    nome: true,
                    cultura: {
                      select: {
                        id: true,
                        descricao: true
                      }
                    },
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
        pagamentosPedidos: true,
        custosColheita: {
          include: {
            turmaColheita: {
              select: {
                id: true,
                nomeColhedor: true,
                chavePix: true,
                responsavelChavePix: true,
                observacoes: true,
                dataCadastro: true
              }
            },
            fruta: {
              select: {
                id: true,
                nome: true
              }
            }
          }
        }
      }
    });

    await this.historicoService.registrarAcao(
      id,
      usuarioId,
      TipoAcaoHistorico.EDICAO_GERAL,
      {
        statusAnterior: statusAnterior,
        statusNovo: pedido.status,
        mensagem: 'Dados básicos do pedido atualizados',
      }
    );

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
    const statusAnterior = existingPedido.status;

    // Verificar se o status permite atualizar colheita
    if (existingPedido.status !== 'PEDIDO_CRIADO' &&
        existingPedido.status !== 'AGUARDANDO_COLHEITA' &&
        existingPedido.status !== 'COLHEITA_PARCIAL') {
      throw new BadRequestException('Status do pedido não permite atualizar colheita');
    }

    const frutasPedidoMeta = await this.prisma.frutasPedidos.findMany({
      where: { pedidoId: id },
      include: {
        fruta: {
          select: {
            culturaId: true,
            dePrimeira: true,
            nome: true,
          },
        },
      },
    });

    const frutaMetaPorId = new Map<number, { culturaId: number | null; dePrimeira: boolean; nome: string }>();
    const culturaPossuiPrimeira = new Map<number, boolean>();

    for (const frutaPedido of frutasPedidoMeta) {
      const culturaId = frutaPedido.fruta?.culturaId ?? null;
      const dePrimeira = frutaPedido.fruta?.dePrimeira ?? false;
      const nome = frutaPedido.fruta?.nome ?? `Fruta ${frutaPedido.id}`;

      frutaMetaPorId.set(frutaPedido.id, {
        culturaId,
        dePrimeira,
        nome,
      });

      if (culturaId !== null) {
        if (dePrimeira) {
          culturaPossuiPrimeira.set(culturaId, true);
        } else if (!culturaPossuiPrimeira.has(culturaId)) {
          culturaPossuiPrimeira.set(culturaId, false);
        }
      }
    }

    // ✅ NOVA VALIDAÇÃO: Validar apenas frutas que estão sendo colhidas (colheita parcial)
    const frutasSendoColhidas = updateColheitaDto.frutas.filter(fruta =>
      fruta.quantidadeReal !== undefined && fruta.quantidadeReal !== null && fruta.quantidadeReal > 0
    );

    // Validar que pelo menos UMA fruta está sendo colhida
    if (frutasSendoColhidas.length === 0) {
      throw new BadRequestException('Informe a quantidade colhida de pelo menos uma fruta');
    }

    // Validações das áreas e fitas APENAS para frutas sendo colhidas
    for (const fruta of frutasSendoColhidas) {
      const meta = frutaMetaPorId.get(fruta.frutaPedidoId);
      if (!meta) {
        throw new BadRequestException(`Fruta ${fruta.frutaPedidoId} não pertence ao pedido informado.`);
      }

      const { culturaId, dePrimeira, nome } = meta;
      const existeFrutaDePrimeiraNaCultura = culturaId !== null && culturaPossuiPrimeira.get(culturaId) === true;
      const herdaVinculosDaPrimeira = existeFrutaDePrimeiraNaCultura && !dePrimeira;

      if (herdaVinculosDaPrimeira) {
        if (fruta.areas && fruta.areas.some(area => area.areaPropriaId || area.areaFornecedorId)) {
          throw new BadRequestException(`A fruta ${nome} herda as áreas da fruta de primeira da cultura e não deve possuir áreas próprias vinculadas.`);
        }
        if (fruta.fitas && fruta.fitas.length > 0) {
          throw new BadRequestException(`A fruta ${nome} herda as fitas da fruta de primeira da cultura e não deve possuir fitas vinculadas.`);
        }
        continue;
      }

      // Validar que cada fruta tem pelo menos uma área
      if (!fruta.areas || fruta.areas.length === 0) {
        throw new BadRequestException(`A fruta ${nome} deve ter pelo menos uma área associada`);
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
      // ✅ NOVA LÓGICA: Calcular status dinamicamente baseado nas frutas colhidas

      // Buscar todas as frutas do pedido
      const todasFrutasPedido = await prisma.frutasPedidos.findMany({
        where: { pedidoId: id },
        select: { id: true, quantidadeReal: true }
      });

      // ✅ CORREÇÃO: IDs apenas das frutas que ESTÃO SENDO COLHIDAS AGORA (com quantidadeReal)
      const frutasColhidasAgoraIds = frutasSendoColhidas.map(f => f.frutaPedidoId);

      // Verificar quantas frutas terão colheita após esta atualização
      const frutasComColheita = todasFrutasPedido.filter(fp =>
        // Fruta já tinha colheita OU está sendo colhida agora
        fp.quantidadeReal !== null || frutasColhidasAgoraIds.includes(fp.id)
      );

      // Determinar o status adequado
      let novoStatus: StatusPedido;
      if (frutasComColheita.length === 0) {
        // Nenhuma fruta colhida (não deveria acontecer, mas por segurança)
        novoStatus = StatusPedido.AGUARDANDO_COLHEITA;
      } else if (frutasComColheita.length === todasFrutasPedido.length) {
        // Todas as frutas foram colhidas
        novoStatus = StatusPedido.COLHEITA_REALIZADA;
      } else {
        // Apenas algumas frutas foram colhidas
        novoStatus = StatusPedido.COLHEITA_PARCIAL;
      }

      // Atualizar dados do pedido com status calculado
      const pedidoUpdated = await prisma.pedido.update({
        where: { id },
        data: {
          dataColheita: updateColheitaDto.dataColheita,
          observacoesColheita: updateColheitaDto.observacoesColheita,
          status: novoStatus, // ← Status dinâmico
          // Campos de frete
          pesagem: updateColheitaDto.pesagem,
          placaPrimaria: updateColheitaDto.placaPrimaria,
          placaSecundaria: updateColheitaDto.placaSecundaria,
          nomeMotorista: updateColheitaDto.nomeMotorista,
          // Campo de número NF do pedido (controle interno)
          numeroNf: updateColheitaDto.numeroNf,
        },
      });

      // ✅ NOVA LÓGICA: Atualizar apenas frutas que estão sendo colhidas
      for (const fruta of frutasSendoColhidas) {
        const meta = frutaMetaPorId.get(fruta.frutaPedidoId);
        const culturaIdMeta = meta?.culturaId ?? null;
        const dePrimeiraMeta = meta?.dePrimeira ?? false;
        const herdaVinculosDaPrimeira =
          culturaIdMeta !== null && culturaPossuiPrimeira.get(culturaIdMeta) === true && !dePrimeiraMeta;

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
        if (!herdaVinculosDaPrimeira && fruta.areas && fruta.areas.length > 0) {
          for (const area of fruta.areas) {
            await prisma.frutasPedidosAreas.create({
              data: {
                frutaPedidoId: fruta.frutaPedidoId,
                areaPropriaId: area.areaPropriaId || null,
                areaFornecedorId: area.areaFornecedorId || null,
                observacoes: area.observacoes,
                quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 || null,
                quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 || null
              }
            });
          }
        }

        // Gerenciar fitas da fruta
        const fitasAntigas = await prisma.frutasPedidosFitas.findMany({
          where: { frutaPedidoId: fruta.frutaPedidoId },
          include: {
            controleBanana: true,
          },
        });

        if (fitasAntigas.length > 0) {
          for (const fitaAntiga of fitasAntigas) {
            if (fitaAntiga.controleBananaId) {
              await prisma.controleBanana.update({
                where: { id: fitaAntiga.controleBananaId },
                data: {
                  quantidadeFitas: {
                    increment: fitaAntiga.quantidadeFita || 0,
                  },
                },
              });
            }
          }
        }

        await prisma.frutasPedidosFitas.deleteMany({
          where: { frutaPedidoId: fruta.frutaPedidoId },
        });

        if (!herdaVinculosDaPrimeira && fruta.fitas && fruta.fitas.length > 0) {
          // Processar cada fita com seus detalhes de área
          for (const fita of fruta.fitas) {
            if (fita.detalhesAreas && fita.detalhesAreas.length > 0) {
              // Para cada área, criar um registro específico com controleBananaId
              for (const detalhe of fita.detalhesAreas) {
                // NOVA LÓGICA: Usar controleBananaId diretamente se disponível
                let controleBananaId = fita.controleBananaId;

                if (!controleBananaId) {
                  // Fallback: Buscar o controle específico desta fita nesta área
                  const controle = await prisma.controleBanana.findFirst({
                    where: {
                      fitaBananaId: detalhe.fitaBananaId,
                      areaAgricolaId: detalhe.areaId,
                      quantidadeFitas: { gt: 0 },
                    },
                    orderBy: {
                      quantidadeFitas: 'desc',
                    },
                  });

                  if (controle) {
                    controleBananaId = controle.id;
                  }
                }

                if (controleBananaId) {
                  await prisma.frutasPedidosFitas.create({
                    data: {
                      frutaPedidoId: fruta.frutaPedidoId,
                      fitaBananaId: fita.fitaBananaId,
                      controleBananaId: controleBananaId, // ✅ LOTE ESPECÍFICO
                      quantidadeFita: detalhe.quantidade,
                      observacoes: fita.observacoes,
                    },
                  });
                } else {
                  console.warn(`❌ Nenhum controleBananaId disponível para fita ${detalhe.fitaBananaId} na área ${detalhe.areaId}`);
                }
              }
            } else {
              console.warn(`❌ Fita ${fita.fitaBananaId} sem detalhesAreas - não será processada`);
            }
          }
        }
      }

      // Registrar histórico de atualização de colheita
      await this.historicoService.registrarAcao(
        id,
        usuarioId,
        TipoAcaoHistorico.ATUALIZACAO_COLHEITA,
        {
          statusAnterior: statusAnterior,
          statusNovo: novoStatus,
          mensagem: `Colheita atualizada - ${frutasSendoColhidas.length} fruta(s) processada(s)`,
        }
      );

      // ✅ NOVO: Registrar explicitamente quando colheita é completada
      if (statusAnterior === StatusPedido.COLHEITA_PARCIAL && novoStatus === StatusPedido.COLHEITA_REALIZADA) {
        await this.historicoService.registrarAcao(
          id,
          usuarioId,
          TipoAcaoHistorico.COLHEITA_COMPLETADA,
          {
            statusAnterior: StatusPedido.COLHEITA_PARCIAL,
            statusNovo: StatusPedido.COLHEITA_REALIZADA,
            mensagem: 'Todas as frutas do pedido foram colhidas',
          }
        );
      }

      // ✅ NOVO: Registrar transição automática para AGUARDANDO_PRECIFICACAO
      if (novoStatus === StatusPedido.COLHEITA_REALIZADA) {
        await this.historicoService.registrarAcao(
          id,
          usuarioId,
          TipoAcaoHistorico.TRANSICAO_AGUARDANDO_PRECIFICACAO,
          {
            statusAnterior: StatusPedido.COLHEITA_REALIZADA,
            statusNovo: StatusPedido.AGUARDANDO_PRECIFICACAO,
            mensagem: 'Pedido aguardando precificação após conclusão da colheita',
          }
        );
      }

      return pedidoUpdated;
    });

    // Atualizar estoque das fitas utilizadas (edição = true)
    for (const fruta of updateColheitaDto.frutas) {
      const meta = frutaMetaPorId.get(fruta.frutaPedidoId);
      const culturaIdMeta = meta?.culturaId ?? null;
      const dePrimeiraMeta = meta?.dePrimeira ?? false;
      const herdaVinculosDaPrimeira =
        culturaIdMeta !== null && culturaPossuiPrimeira.get(culturaIdMeta) === true && !dePrimeiraMeta;

      if (herdaVinculosDaPrimeira) {
        continue;
      }

      if (fruta.fitas && fruta.fitas.length > 0) {
        // NOVA LÓGICA: Usar subtração por área específica
        await this.processarFitasComAreas(fruta.fitas, usuarioId);
      }
    }

    // ✅ NOVO: Processar mão de obra (se fornecida)
    if (updateColheitaDto.maoObra && updateColheitaDto.maoObra.length > 0) {
      // Buscar dados das frutas do pedido para obter unidadeMedida quando não informada
      const frutasPedido = await this.prisma.frutasPedidos.findMany({
        where: { pedidoId: id },
        include: { fruta: true }
      });

      for (const itemMaoObra of updateColheitaDto.maoObra) {
        // Buscar unidadeMedida da fruta se não foi informada
        let unidadeMedida = itemMaoObra.unidadeMedida;
        if (!unidadeMedida) {
          const frutaPedido = frutasPedido.find(fp => fp.frutaId === itemMaoObra.frutaId);
          if (frutaPedido) {
            // Extrair sigla da unidade (ex: "KG" de "KG - Quilograma")
            const unidadeCompleta = frutaPedido.unidadeMedida1 || 'KG';
            const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
            const unidadeEncontrada = unidadesValidas.find(u => unidadeCompleta.includes(u));
            unidadeMedida = (unidadeEncontrada || 'KG') as 'KG' | 'TON' | 'CX' | 'UND' | 'ML' | 'LT';
          } else {
            unidadeMedida = 'KG'; // Default
          }
        }

        // Criar DTO para o TurmaColheitaService
        const custoDto: CreateTurmaColheitaPedidoCustoDto = {
          turmaColheitaId: itemMaoObra.turmaColheitaId,
          pedidoId: id,
          frutaId: itemMaoObra.frutaId,
          quantidadeColhida: itemMaoObra.quantidadeColhida,
          unidadeMedida: unidadeMedida,
          valorColheita: itemMaoObra.valorColheita,
          dataColheita: itemMaoObra.dataColheita || updateColheitaDto.dataColheita.toISOString(),
          pagamentoEfetuado: itemMaoObra.pagamentoEfetuado ?? false,
          observacoes: itemMaoObra.observacoes,
        };

        // Salvar mão de obra (o service já trata duplicatas fazendo update)
        try {
          await this.turmaColheitaService.createCustoColheita(custoDto);
        } catch (error) {
          // Log do erro mas não falha a colheita se mão de obra der erro
          console.error(`Erro ao salvar mão de obra para turma ${itemMaoObra.turmaColheitaId}, fruta ${itemMaoObra.frutaId}:`, error);
          // Não lançar erro para não quebrar o fluxo de colheita
        }
      }
    }

    // Buscar dados completos para retorno
    const pedidoCompleto = await this.findOne(pedidoAtualizado.id);
    return this.adaptPedidoResponse(pedidoCompleto);
  }

  async updatePrecificacao(id: number, updatePrecificacaoDto: UpdatePrecificacaoDto, usuarioId: number): Promise<PedidoResponseDto> {

    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const statusAnterior = existingPedido.status;

    // Verificar se o status permite precificação
    // ✅ IMPORTANTE: NÃO permitir precificação em COLHEITA_PARCIAL
    if (existingPedido.status !== 'COLHEITA_REALIZADA') {
      throw new BadRequestException('Status do pedido não permite precificação. Todas as frutas devem ser colhidas antes de precificar.');
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
          status: StatusPedido.PRECIFICACAO_REALIZADA,
          dataPrecificacaoRealizada: new Date(),
          // Campos específicos para clientes indústria
          indDataEntrada: updatePrecificacaoDto.indDataEntrada ? new Date(updatePrecificacaoDto.indDataEntrada) : null,
          indDataDescarga: updatePrecificacaoDto.indDataDescarga ? new Date(updatePrecificacaoDto.indDataDescarga) : null,
          indPesoMedio: updatePrecificacaoDto.indPesoMedio,
          indMediaMililitro: updatePrecificacaoDto.indMediaMililitro,
          indNumeroNf: updatePrecificacaoDto.indNumeroNf,
          // Campo de número NF do pedido (controle interno)
          numeroNf: updatePrecificacaoDto.numeroNf,
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

        // ✅ CORREÇÃO: Priorizar SEMPRE quantidadePrecificada informada pelo usuário
        // Se não foi informada, usar a quantidade colhida correspondente à unidade efetiva
        let quantidadeParaCalculo = 0;
        
        if (fruta.quantidadePrecificada !== undefined && fruta.quantidadePrecificada !== null) {
          // ✅ SEMPRE usar a quantidade precificada informada pelo usuário
          quantidadeParaCalculo = fruta.quantidadePrecificada;
        } else {
          // Fallback: usar quantidade colhida correspondente à unidade efetiva
          if (unidadeEfetiva === unidadeMedida1) {
            quantidadeParaCalculo = frutaPedido.quantidadeReal || 0;
          } else if (unidadeEfetiva === unidadeMedida2) {
            quantidadeParaCalculo = frutaPedido.quantidadeReal2 || 0;
          } else {
            // Fallback seguro
            quantidadeParaCalculo = frutaPedido.quantidadeReal || 0;
          }
        }

        const valores = this.calcularValoresFruta(
          quantidadeParaCalculo,
          fruta.valorUnitario
        );

        // Preparar dados de atualização
        const dataUpdate: any = {
          valorUnitario: fruta.valorUnitario,
          valorTotal: valores.valorTotal,
          unidadePrecificada: unidadeEfetiva as any,
          quantidadePrecificada: quantidadeParaCalculo,
        };

        // Se quantidadeReal ou quantidadeReal2 foram fornecidas, atualizar (apenas para clientes indústria)
        // IMPORTANTE: Aceitar valores 0 também, pois o usuário pode querer zerar a quantidade
        if (fruta.quantidadeReal !== undefined && fruta.quantidadeReal !== null && !isNaN(Number(fruta.quantidadeReal))) {
          dataUpdate.quantidadeReal = Number(fruta.quantidadeReal);
          console.log(`[updatePrecificacao] Atualizando quantidadeReal para fruta ${fruta.frutaPedidoId}: ${dataUpdate.quantidadeReal}`);
        }
        if (fruta.quantidadeReal2 !== undefined && fruta.quantidadeReal2 !== null && !isNaN(Number(fruta.quantidadeReal2))) {
          dataUpdate.quantidadeReal2 = Number(fruta.quantidadeReal2);
          console.log(`[updatePrecificacao] Atualizando quantidadeReal2 para fruta ${fruta.frutaPedidoId}: ${dataUpdate.quantidadeReal2}`);
        }

        await prisma.frutasPedidos.update({
          where: { id: fruta.frutaPedidoId },
          data: dataUpdate,
        });
      }

      // Calcular valor final consolidado a partir do estado persistido (garantir consistência)
      // ✅ CORREÇÃO: Usar quantidadePrecificada que já foi salva no loop anterior
      const frutasDoPedido = await prisma.frutasPedidos.findMany({ where: { pedidoId: id } });
      let valorTotalFrutas = 0;
      for (const fp of frutasDoPedido) {
        // ✅ SEMPRE usar quantidadePrecificada (já salva no loop anterior)
        // Se não houver quantidadePrecificada salva, usar fallback das quantidades colhidas
        let qtd = fp.quantidadePrecificada;
        
        if (qtd === null || qtd === undefined) {
          // Fallback: usar quantidade colhida baseada na unidade precificada
          const unidadePrec = fp.unidadePrecificada?.toString().trim().toUpperCase();
          const um1 = fp.unidadeMedida1?.toString().trim().toUpperCase();
          const um2 = fp.unidadeMedida2?.toString().trim().toUpperCase();
          
          if (unidadePrec === um2) {
            qtd = fp.quantidadeReal2 || 0;
          } else {
            // padrão: um1
            qtd = fp.quantidadeReal || 0;
          }
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

      // Registrar histórico de atualização de precificação
      await this.historicoService.registrarAcao(
        id,
        usuarioId,
        TipoAcaoHistorico.ATUALIZACAO_PRECIFICACAO,
        {
          statusAnterior: statusAnterior,
          statusNovo: StatusPedido.PRECIFICACAO_REALIZADA,
          mensagem: `Precificação realizada - Valor final: R$ ${pedidoAtualizado.valorFinal?.toFixed(2)}`,
        }
      );

      // ✅ NOVO: Registrar transição automática para AGUARDANDO_PAGAMENTO
      await this.historicoService.registrarAcao(
        id,
        usuarioId,
        TipoAcaoHistorico.TRANSICAO_AGUARDANDO_PAGAMENTO,
        {
          statusAnterior: StatusPedido.PRECIFICACAO_REALIZADA,
          statusNovo: StatusPedido.AGUARDANDO_PAGAMENTO,
          mensagem: 'Pedido aguardando pagamento após conclusão da precificação',
          valor: pedidoAtualizado.valorFinal ?? undefined,
        }
      );

      return pedidoAtualizado;
    });

    // Buscar dados completos para retorno
    const pedidoCompleto = await this.findOne(id);
    return pedidoCompleto;
  }

  async updateAjustesPrecificacao(id: number, dto: UpdateAjustesPrecificacaoDto, usuarioId: number): Promise<PedidoResponseDto> {
    const pedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: { frutasPedidos: true },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const statusAnterior = pedido.status;

    if (['CANCELADO', 'PEDIDO_FINALIZADO'].includes(pedido.status)) {
      throw new BadRequestException('Não é possível ajustar valores de um pedido finalizado ou cancelado.');
    }

    const pedidoAtualizado = await this.prisma.$transaction(async (prisma) => {
      // 1. Calcula o valor total das frutas, que é a base para o cálculo.
      const valorTotalFrutas = pedido.frutasPedidos.reduce((total, fruta) => {
        return total + (fruta.valorTotal || 0);
      }, 0);

      // 2. Define os novos valores, usando os valores do DTO ou mantendo os existentes.
      const novoFrete = dto.frete ?? pedido.frete;
      const novoIcms = dto.icms ?? pedido.icms;
      const novoDesconto = dto.desconto ?? pedido.desconto;
      const novaAvaria = dto.avaria ?? pedido.avaria;

      // 3. Recalcula o valor final do pedido.
      const novoValorFinal = valorTotalFrutas + (novoFrete || 0) + (novoIcms || 0) - (novoDesconto || 0) - (novaAvaria || 0);

      // 4. Atualiza o pedido no banco de dados com os novos valores.
      const pedidoAtualizadoInterno = await prisma.pedido.update({
        where: { id },
        data: {
          frete: novoFrete,
          icms: novoIcms,
          desconto: novoDesconto,
          avaria: novaAvaria,
          valorFinal: Number(novoValorFinal.toFixed(2)),
        },
      });

      let statusNovo = pedido.status;

      // 5. Recalcular status de pagamento (se estiver nas fases de pagamento)
      const statusPagamento = ['PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL', 'PAGAMENTO_REALIZADO'];
      if (statusPagamento.includes(pedido.status)) {
        // Calcular valor total recebido
        const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(id, prisma);

        // Arredondar ambos os valores para 2 casas decimais antes de comparar para evitar problemas de precisão
        const valorRecebidoArredondado = Number(valorRecebidoConsolidado.toFixed(2));
        const valorFinalArredondado = Number(novoValorFinal.toFixed(2));

        // Determinar novo status baseado no valor recebido vs valor final
        let novoStatusCalculado: StatusPedido | undefined;

        if (valorRecebidoArredondado >= valorFinalArredondado) {
          novoStatusCalculado = StatusPedido.PEDIDO_FINALIZADO;
        } else if (valorRecebidoArredondado > 0) {
          novoStatusCalculado = StatusPedido.PAGAMENTO_PARCIAL;
        } else {
          novoStatusCalculado = StatusPedido.AGUARDANDO_PAGAMENTO;
        }

        // Só atualizar se o status mudou
        if (pedido.status !== novoStatusCalculado) {
          await prisma.pedido.update({
            where: { id },
            data: {
              status: novoStatusCalculado,
              valorRecebido: valorRecebidoArredondado
            },
          });
          statusNovo = novoStatusCalculado;
        }
      }

      await this.historicoService.registrarAcao(
        id,
        usuarioId,
        TipoAcaoHistorico.AJUSTE_PRECIFICACAO,
        {
          statusAnterior: statusAnterior,
          statusNovo: statusNovo,
          mensagem: 'Precificação ajustada (frete, ICMS ou desconto)',
        }
      );

      // 6. Retorna o pedido completo e atualizado.
      return this.findOne(id);
    });

    return pedidoAtualizado;
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
      include: {
        lancamentoExtratoPedido: {
          select: { lancamentoExtratoId: true },
        },
      },
    });

    const pagamentosFormatados = pagamentos.map((pagamento) =>
      this.mapPagamentoComLancamento(pagamento),
    );

    return this.convertNullToUndefined(pagamentosFormatados);
  }

  private mapPagamentoComLancamento(pagamento: any) {
    const { lancamentoExtratoPedido, ...restoPagamento } = pagamento || {};

    return {
      ...restoPagamento,
      lancamentoExtratoId: lancamentoExtratoPedido?.lancamentoExtratoId
        ? lancamentoExtratoPedido.lancamentoExtratoId.toString()
        : undefined,
    };
  }

  // NOVA: Criar pagamento individual
  async createPagamento(createPagamentoDto: CreatePagamentoDto, usuarioId: number): Promise<any> {
    // Verificar se o pedido existe
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: createPagamentoDto.pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const statusAnterior = pedido.status;

    // Verificar se o status permite pagamento
    if (pedido.status !== 'PRECIFICACAO_REALIZADA' && pedido.status !== 'AGUARDANDO_PAGAMENTO' && pedido.status !== 'PAGAMENTO_PARCIAL') {
      throw new BadRequestException('Status do pedido não permite registrar pagamento');
    }

    if (createPagamentoDto.lancamentoExtratoPedidoId) {
      const vinculoLancamento = await this.prisma.lancamentoExtratoPedido.findUnique({
        where: { id: createPagamentoDto.lancamentoExtratoPedidoId },
        select: { id: true, pedidoId: true },
      });

      if (!vinculoLancamento) {
        throw new BadRequestException('Vínculo do lançamento não encontrado');
      }

      if (vinculoLancamento.pedidoId !== createPagamentoDto.pedidoId) {
        throw new BadRequestException('Vínculo informado não pertence ao pedido');
      }

      const pagamentoJaVinculado = await this.prisma.pagamentosPedidos.findFirst({
        where: { lancamentoExtratoPedidoId: createPagamentoDto.lancamentoExtratoPedidoId },
        select: { id: true },
      });

      if (pagamentoJaVinculado) {
        throw new BadRequestException('Este vínculo já possui um pagamento associado');
      }
    }

    // Verificar se o valor do pagamento é válido (maior que zero)
    if (createPagamentoDto.valorRecebido <= 0) {
      throw new BadRequestException('Valor do pagamento deve ser maior que zero');
    }

    // Verificar se o valor do pagamento não excede o valor final
    // IMPORTANTE: Considerar também boletos pendentes no cálculo
    const valorRecebidoAtual = await this.calcularValorRecebidoConsolidado(createPagamentoDto.pedidoId);
    const valorBoletosPendentes = await this.calcularValorBoletosPendentes(createPagamentoDto.pedidoId);
    const valorTotalReservado = valorRecebidoAtual + valorBoletosPendentes + createPagamentoDto.valorRecebido;
    
    if (valorTotalReservado > (pedido.valorFinal || 0)) {
      throw new BadRequestException(
        `Valor do pagamento excede o valor restante do pedido. Valor recebido: R$ ${valorRecebidoAtual.toFixed(2)}, Boletos pendentes: R$ ${valorBoletosPendentes.toFixed(2)}, Valor disponível: R$ ${((pedido.valorFinal || 0) - valorRecebidoAtual - valorBoletosPendentes).toFixed(2)}`
      );
    }

    // Criar pagamento usando Prisma ORM
    const pagamento = await this.prisma.$transaction(async (prisma) => {
      const novoPagamento = await prisma.pagamentosPedidos.create({
        data: {
          pedidoId: createPagamentoDto.pedidoId,
          lancamentoExtratoPedidoId: createPagamentoDto.lancamentoExtratoPedidoId,
          dataPagamento: new Date(createPagamentoDto.dataPagamento),
          valorRecebido: createPagamentoDto.valorRecebido,
          metodoPagamento: createPagamentoDto.metodoPagamento,
          contaDestino: createPagamentoDto.contaDestino,
          observacoesPagamento: createPagamentoDto.observacoesPagamento,
          chequeCompensado: createPagamentoDto.chequeCompensado,
          referenciaExterna: createPagamentoDto.referenciaExterna,
        },
        include: {
          lancamentoExtratoPedido: {
            select: { lancamentoExtratoId: true },
          },
        },
      });

      // Atualizar valor recebido consolidado no pedido (APÓS criar o pagamento)
      const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(createPagamentoDto.pedidoId, prisma);
      
      // Atualizar status do pedido baseado no valor recebido
      const pedido = await prisma.pedido.findUnique({
        where: { id: createPagamentoDto.pedidoId },
        select: { valorFinal: true, status: true }
      });

      let novoStatus: StatusPedido;

      // Arredondar ambos os valores para 2 casas decimais antes de comparar para evitar problemas de precisão
      const valorRecebidoArredondado = Number(valorRecebidoConsolidado.toFixed(2));
      const valorFinalArredondado = Number((pedido?.valorFinal || 0).toFixed(2));

      if (valorRecebidoArredondado >= valorFinalArredondado) {
        novoStatus = StatusPedido.PEDIDO_FINALIZADO;
      } else if (valorRecebidoArredondado > 0) {
        novoStatus = StatusPedido.PAGAMENTO_PARCIAL;
      } else {
        novoStatus = StatusPedido.AGUARDANDO_PAGAMENTO;
      }

      await prisma.pedido.update({
        where: { id: createPagamentoDto.pedidoId },
        data: { 
          valorRecebido: valorRecebidoConsolidado,
          status: novoStatus
        }
      });

      await this.historicoService.registrarAcao(
        createPagamentoDto.pedidoId,
        usuarioId,
        TipoAcaoHistorico.PAGAMENTO_ADICIONADO,
        {
          statusAnterior: statusAnterior,
          statusNovo: novoStatus,
          mensagem: `Pagamento adicionado via ${createPagamentoDto.metodoPagamento}`,
          valor: createPagamentoDto.valorRecebido,
          metodoPagamento: createPagamentoDto.metodoPagamento,
        }
      );

      return this.mapPagamentoComLancamento(novoPagamento);
    });

    return this.convertNullToUndefined(pagamento);
  }

  // NOVA: Atualizar pagamento individual
  async updatePagamentoIndividual(id: number, updatePagamentoDto: UpdatePagamentoDto, usuarioId: number): Promise<any> {
    // Verificar se o pagamento existe
    const pagamento = await this.prisma.pagamentosPedidos.findUnique({
      where: { id },
      include: { pedido: true },
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    const statusAnterior = pagamento.pedido.status;

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
        include: {
          lancamentoExtratoPedido: {
            select: { lancamentoExtratoId: true },
          },
        },
      });

      // Atualizar valor recebido consolidado no pedido
      const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(pagamento.pedidoId, prisma);
      
      // Atualizar status do pedido baseado no valor recebido
      const pedido = await prisma.pedido.findUnique({
        where: { id: pagamento.pedidoId },
        select: { valorFinal: true, status: true }
      });

      let novoStatus: StatusPedido;

      // Arredondar ambos os valores para 2 casas decimais antes de comparar para evitar problemas de precisão
      const valorRecebidoArredondado = Number(valorRecebidoConsolidado.toFixed(2));
      const valorFinalArredondado = Number((pedido?.valorFinal || 0).toFixed(2));

      if (valorRecebidoArredondado >= valorFinalArredondado) {
        novoStatus = StatusPedido.PEDIDO_FINALIZADO;
      } else if (valorRecebidoArredondado > 0) {
        novoStatus = StatusPedido.PAGAMENTO_PARCIAL;
      } else {
        novoStatus = StatusPedido.AGUARDANDO_PAGAMENTO;
      }

      await prisma.pedido.update({
        where: { id: pagamento.pedidoId },
        data: { 
          valorRecebido: valorRecebidoConsolidado,
          status: novoStatus
        }
      });

      await this.historicoService.registrarAcao(
        pagamento.pedidoId,
        usuarioId,
        TipoAcaoHistorico.PAGAMENTO_ATUALIZADO,
        {
          statusAnterior: statusAnterior,
          statusNovo: novoStatus,
          mensagem: 'Pagamento atualizado',
          pagamentoId: id,
          valor: updatePagamentoDto.valorRecebido,
        }
      );

      return this.mapPagamentoComLancamento(pagamentoAtualizado);
    });

    return this.convertNullToUndefined(pagamentoAtualizado);
  }

  // NOVA: Atualizar apenas o vale (referência externa) do pagamento
  async updatePagamentoVale(id: number, updatePagamentoValeDto: UpdatePagamentoValeDto, usuarioId: number): Promise<any> {
    const pagamento = await this.prisma.pagamentosPedidos.findUnique({
      where: { id },
      include: { pedido: true },
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    const pagamentoAtualizado = await this.prisma.pagamentosPedidos.update({
      where: { id },
      data: {
        referenciaExterna: updatePagamentoValeDto.referenciaExterna ?? null,
      },
      include: {
        lancamentoExtratoPedido: {
          select: { lancamentoExtratoId: true },
        },
      },
    });

    await this.historicoService.registrarAcao(
      pagamento.pedidoId,
      usuarioId,
      TipoAcaoHistorico.PAGAMENTO_ATUALIZADO,
      {
        statusAnterior: pagamento.pedido.status,
        statusNovo: pagamento.pedido.status,
        mensagem: 'Vale atualizado',
        pagamentoId: id,
        campo: 'referenciaExterna',
        valorAnterior: pagamento.referenciaExterna ?? null,
        valorNovo: updatePagamentoValeDto.referenciaExterna ?? null,
      }
    );

    return this.convertNullToUndefined(this.mapPagamentoComLancamento(pagamentoAtualizado));
  }

  async removePagamentoPorVinculo(
    vinculoId: number,
    lancamentoExtratoId: string,
    usuarioId: number,
  ): Promise<void> {
    console.log('[removePagamentoPorVinculo] Solicitação recebida', {
      vinculoId,
      lancamentoExtratoId,
      usuarioId,
    });
    const pagamento = await this.prisma.pagamentosPedidos.findFirst({
      where: { lancamentoExtratoPedidoId: vinculoId },
      select: { id: true },
    });

    if (pagamento?.id) {
      console.log('[removePagamentoPorVinculo] Pagamento encontrado, removendo pagamento', {
        pagamentoId: pagamento.id,
      });
      await this.removePagamento(pagamento.id, usuarioId);
      return;
    }

    if (!lancamentoExtratoId) {
      throw new BadRequestException('Informe o lançamento para remover o vínculo');
    }

    console.log('[removePagamentoPorVinculo] Nenhum pagamento associado, removendo vínculo direto');
    await this.lancamentoExtratoService.removerVinculo(
      BigInt(lancamentoExtratoId),
      vinculoId
    );
  }

  // NOVA: Remover pagamento individual
  async removePagamento(id: number, usuarioId: number): Promise<void> {
    // Verificar se o pagamento existe
    const pagamento = await this.prisma.pagamentosPedidos.findUnique({
      where: { id },
      include: {
        pedido: true,
        lancamentoExtratoPedido: {
          select: { id: true, lancamentoExtratoId: true },
        },
      },
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }
    const statusAnterior = pagamento.pedido.status;

    // Verificar se o status do pedido permite remoção
    if (pagamento.pedido.status === 'PEDIDO_FINALIZADO') {
      throw new BadRequestException('Não é possível remover pagamentos de pedidos finalizados');
    }

    if (pagamento.lancamentoExtratoPedidoId && pagamento.lancamentoExtratoPedido?.lancamentoExtratoId) {
      await this.lancamentoExtratoService.removerVinculo(
        pagamento.lancamentoExtratoPedido.lancamentoExtratoId,
        pagamento.lancamentoExtratoPedidoId
      );
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

      let novoStatus: StatusPedido;

      // Arredondar ambos os valores para 2 casas decimais antes de comparar para evitar problemas de precisão
      const valorRecebidoArredondado = Number(valorRecebidoConsolidado.toFixed(2));
      const valorFinalArredondado = Number((pedido?.valorFinal || 0).toFixed(2));

      if (valorRecebidoArredondado >= valorFinalArredondado) {
        novoStatus = StatusPedido.PEDIDO_FINALIZADO;
      } else if (valorRecebidoArredondado > 0) {
        novoStatus = StatusPedido.PAGAMENTO_PARCIAL;
      } else {
        novoStatus = StatusPedido.AGUARDANDO_PAGAMENTO;
      }

      await prisma.pedido.update({
        where: { id: pagamento.pedidoId },
        data: { 
          valorRecebido: valorRecebidoConsolidado,
          status: novoStatus
        }
      });

      await this.historicoService.registrarAcao(
        pagamento.pedidoId,
        usuarioId,
        TipoAcaoHistorico.PAGAMENTO_REMOVIDO,
        {
          statusAnterior: statusAnterior,
          statusNovo: novoStatus,
          mensagem: 'Pagamento removido',
          pagamentoId: id,
          valor: pagamento.valorRecebido,
        }
      );
    });
  }

  // MÉTODO LEGADO: updatePagamento - mantido para compatibilidade
  async updatePagamento(id: number, updatePagamentoDto: UpdatePagamentoDto, usuarioId: number): Promise<PedidoResponseDto> {
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

    await this.createPagamento(createPagamentoDto, usuarioId);

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

    // 🔍 DEBUG: Buscar frutas atuais do pedido
    const frutasAtuaisBanco = await this.prisma.frutasPedidos.findMany({
      where: { pedidoId: id },
      select: {
        id: true,
        frutaId: true,
        quantidadePrevista: true,
        unidadeMedida1: true,
        unidadeMedida2: true
      }
    });


    // ✅ NOVA VALIDAÇÃO: Verificar se há pagamentos que impedem redução da precificação
    if (updatePedidoCompletoDto.frutas && updatePedidoCompletoDto.frutas.length > 0) {
      // Calcular novo valor final do pedido
      let novoValorTotalFrutas = 0;
      
      for (const fruta of updatePedidoCompletoDto.frutas) {
        if (fruta.frutaPedidoId) {
          // Buscar dados atuais da fruta para calcular novo valor
          const frutaAtual = await this.prisma.frutasPedidos.findUnique({ 
            where: { id: fruta.frutaPedidoId } 
          });
          
          if (frutaAtual) {
            // Usar valores atualizados ou manter os existentes
            const valorUnitario = fruta.valorUnitario ?? frutaAtual.valorUnitario ?? 0;
            const quantidadeReal = fruta.quantidadeReal ?? frutaAtual.quantidadeReal ?? 0;
            const quantidadeReal2 = fruta.quantidadeReal2 ?? frutaAtual.quantidadeReal2 ?? 0;
            const unidadePrecificada = fruta.unidadePrecificada ?? frutaAtual.unidadePrecificada ?? frutaAtual.unidadeMedida1;
            
            // Determinar quantidade para cálculo baseada na unidade precificada
            let quantidadeParaCalculo = 0;
            const unidadeEfetiva = unidadePrecificada?.toString().trim().toUpperCase();
            const unidadeMedida1 = frutaAtual.unidadeMedida1?.toString().trim().toUpperCase();
            const unidadeMedida2 = frutaAtual.unidadeMedida2?.toString().trim().toUpperCase();
            
            if (unidadeEfetiva === unidadeMedida2) {
              quantidadeParaCalculo = quantidadeReal2;
            } else {
              quantidadeParaCalculo = quantidadeReal;
            }
            
            const valorTotalFruta = quantidadeParaCalculo * valorUnitario;
            novoValorTotalFrutas += valorTotalFruta;
          }
        }
      }
      
      // Calcular novo valor final considerando frete, ICMS, desconto e avaria
      const frete = updatePedidoCompletoDto.frete ?? existingPedido.frete ?? 0;
      const icms = updatePedidoCompletoDto.icms ?? existingPedido.icms ?? 0;
      const desconto = updatePedidoCompletoDto.desconto ?? existingPedido.desconto ?? 0;
      const avaria = updatePedidoCompletoDto.avaria ?? existingPedido.avaria ?? 0;
      
      const novoValorFinal = novoValorTotalFrutas + frete + icms - desconto - avaria;
      
      // Verificar valor já recebido em pagamentos
      const valorJaRecebido = await this.calcularValorRecebidoConsolidado(id);
      
      // Se valor recebido > novo valor final, impedir a operação
      if (valorJaRecebido > novoValorFinal && valorJaRecebido > 0) {
        const diferenca = valorJaRecebido - novoValorFinal;
        // Formatar valores no padrão brasileiro (ponto para milhar, vírgula para decimal)
        const formatarValor = (valor: number): string => {
          return valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        };

        throw new BadRequestException(
          `Não é possível reduzir a precificação para R$ ${formatarValor(novoValorFinal)} pois já foram recebidos R$ ${formatarValor(valorJaRecebido)} em pagamentos. ` +
          `Isso resultaria em uma sobra de R$ ${formatarValor(diferenca)}. ` +
          `Para continuar, você deve primeiro editar ou remover pagamentos do pedido, deixando o valor recebido menor ou igual ao novo valor da precificação.`
        );
      }
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
          dataPrecificacaoRealizada: updatePedidoCompletoDto.dataPrecificacaoRealizada ? new Date(updatePedidoCompletoDto.dataPrecificacaoRealizada) : undefined,
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
          // Campo de número NF do pedido (controle interno)
          numeroNf: updatePedidoCompletoDto.numeroNf,
        },
      });

      // Atualizar frutas se fornecidas e recalcular valorTotal conforme unidadePrecificada
      let houveAlteracaoFrutas = false;
      if (updatePedidoCompletoDto.frutas) {
        // ✅ PRIMEIRO: Remover frutas que não estão mais no array enviado
        const frutasPedidoIdsEnviadas = updatePedidoCompletoDto.frutas
          .filter(f => f.frutaPedidoId)
          .map(f => f.frutaPedidoId);
        
        const frutasParaRemover = frutasAtuaisBanco.filter(
          frutaBanco => !frutasPedidoIdsEnviadas.includes(frutaBanco.id)
        );


        // ✅ IMPLEMENTAR: Remover frutas que não estão mais no array
        if (frutasParaRemover.length > 0) {
          console.log('🗑️ DEBUG updateCompleto - Removendo frutas:', frutasParaRemover);
          
          for (const frutaParaRemover of frutasParaRemover) {
            // Remover áreas vinculadas primeiro
            await prisma.frutasPedidosAreas.deleteMany({
              where: { frutaPedidoId: frutaParaRemover.id }
            });

            // Remover fitas vinculadas primeiro
            await prisma.frutasPedidosFitas.deleteMany({
              where: { frutaPedidoId: frutaParaRemover.id }
            });

            // Remover a fruta do pedido
            await prisma.frutasPedidos.delete({
              where: { id: frutaParaRemover.id }
            });

            console.log(`✅ Fruta ${frutaParaRemover.id} removida com sucesso`);
          }
          
          houveAlteracaoFrutas = true;
        }
        for (const fruta of updatePedidoCompletoDto.frutas) {


          // Atualização por frutaPedidoId (quando informado)
          if (fruta.frutaPedidoId) {
            
            // Aplicar a mesma lógica do updatePrecificacao para unidade precificada
            const frutaPedidoAtual = await prisma.frutasPedidos.findUnique({ where: { id: fruta.frutaPedidoId } });
            if (!frutaPedidoAtual) {
              throw new NotFoundException(`Fruta do pedido com ID ${fruta.frutaPedidoId} não encontrada`);
            }

            // ✅ NOVA LÓGICA: Verificar se a fruta mudou de tipo
            const frutaMudouTipo = frutaPedidoAtual.frutaId !== fruta.frutaId;
            
            if (frutaMudouTipo) {

              // Remover fruta antiga completamente (áreas, fitas e fruta)
              await prisma.frutasPedidosAreas.deleteMany({
                where: { frutaPedidoId: fruta.frutaPedidoId }
              });

              await prisma.frutasPedidosFitas.deleteMany({
                where: { frutaPedidoId: fruta.frutaPedidoId }
              });

              await prisma.frutasPedidos.delete({
                where: { id: fruta.frutaPedidoId }
              });

              console.log(`🗑️ Fruta antiga ${fruta.frutaPedidoId} removida, será recriada como nova fruta`);

              // Marcar como nova fruta para ser criada
              fruta.frutaPedidoId = undefined;


              // ✅ CORREÇÃO: Remover 'continue' para que a fruta seja criada na sequência
              // O fluxo continua para a seção de criação (linha 2339)
            }

            // ✅ SEÇÃO DE ATUALIZAÇÃO: Só executa se frutaPedidoId existe (fruta não mudou de tipo)
            if (fruta.frutaPedidoId) {
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

              // ✅ CORREÇÃO: Priorizar SEMPRE quantidadePrecificada informada pelo usuário
              // Se não foi informada, usar a quantidade colhida correspondente à unidade efetiva
              let quantidadeParaCalculo = 0;
              
              if (fruta.quantidadePrecificada !== undefined && fruta.quantidadePrecificada !== null) {
                // ✅ SEMPRE usar a quantidade precificada informada pelo usuário
                quantidadeParaCalculo = fruta.quantidadePrecificada;
              } else {
                // Fallback: usar quantidade colhida correspondente à unidade efetiva
                if (unidadeEfetiva === unidadeMedida1) {
                  quantidadeParaCalculo = (fruta.quantidadeReal ?? frutaPedidoAtual.quantidadeReal) || 0;
                } else if (unidadeEfetiva === unidadeMedida2) {
                  quantidadeParaCalculo = (fruta.quantidadeReal2 ?? frutaPedidoAtual.quantidadeReal2) || 0;
                } else {
                  // Fallback seguro
                  quantidadeParaCalculo = (fruta.quantidadeReal ?? frutaPedidoAtual.quantidadeReal) || 0;
                }
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
                  quantidadePrecificada: quantidadeParaCalculo,
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
                        observacoes: area.observacoes || '',
                        quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 || null,
                        quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 || null
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
            } // ✅ FIM DA SEÇÃO DE ATUALIZAÇÃO
          }

          // ========================================
          // 🆕 LÓGICA DE CREATE: Nova fruta adicionada durante edição
          // ========================================
          if (fruta.frutaId && !fruta.frutaPedidoId) {
            console.log('🆕 DEBUG updateCompleto - Criando nova fruta:', {
              pedidoId: id,
              frutaId: fruta.frutaId,
              quantidadePrevista: fruta.quantidadePrevista,
              unidadeMedida1: fruta.unidadeMedida1,
            });

            console.log('🆕 DEBUG updateCompleto - ENTRANDO NA LÓGICA DE CRIAÇÃO DE NOVA FRUTA:', {
              frutaPedidoId: fruta.frutaPedidoId,
              frutaId: fruta.frutaId,
              status: 'CRIANDO_NOVA_FRUTA'
            });

            // ✅ Validações obrigatórias
            if (!fruta.quantidadePrevista || fruta.quantidadePrevista <= 0) {
              throw new BadRequestException(
                `Nova fruta (ID ${fruta.frutaId}) deve ter quantidade prevista válida`
              );
            }
            if (!fruta.unidadeMedida1) {
              throw new BadRequestException(
                `Nova fruta (ID ${fruta.frutaId}) deve ter unidade de medida principal`
              );
            }

            // ✅ Verificar se fruta já existe no pedido
            const frutaExistente = await prisma.frutasPedidos.findFirst({
              where: {
                pedidoId: id,
                frutaId: fruta.frutaId
              }
            });

            if (frutaExistente) {
              throw new BadRequestException(
                `Fruta ${fruta.frutaId} já existe no pedido. Use frutaPedidoId para atualizar.`
              );
            }

            // ========================================
            // ✅ VALIDAÇÃO POR FASE: Verificar se nova fruta tem dados obrigatórios para a fase atual
            // ========================================
            const pedidoAtual = await prisma.pedido.findUnique({
              where: { id },
              select: { status: true }
            });

            if (!pedidoAtual) {
              throw new BadRequestException('Pedido não encontrado');
            }

            // ✅ REGRA 1º/2º POR CULTURA (igual ao createPedido):
            // Se existe fruta de primeira na cultura, frutas de segunda herdam áreas/fitas e não exigem área própria.
            const frutaCatalogo = await prisma.fruta.findUnique({
              where: { id: fruta.frutaId },
              select: { id: true, culturaId: true, dePrimeira: true, nome: true },
            });

            if (!frutaCatalogo) {
              throw new BadRequestException(`Fruta com ID ${fruta.frutaId} não encontrada`);
            }

            const existePrimeiraNaCultura = await prisma.frutasPedidos.findFirst({
              where: {
                pedidoId: id,
                fruta: {
                  culturaId: frutaCatalogo.culturaId,
                  dePrimeira: true,
                },
              },
              select: { id: true },
            });

            const isFrutaDePrimeira = frutaCatalogo.dePrimeira === true;
            const deveExigirArea = isFrutaDePrimeira || !existePrimeiraNaCultura;

            console.log('🌿 DEBUG nova fruta - regra 1º/2º por cultura:', {
              pedidoId: id,
              frutaId: fruta.frutaId,
              nome: frutaCatalogo.nome,
              culturaId: frutaCatalogo.culturaId,
              dePrimeira: isFrutaDePrimeira,
              existePrimeiraNaCultura: !!existePrimeiraNaCultura,
              deveExigirArea,
              status: pedidoAtual.status,
            });

            const requereColheita = [
              'COLHEITA_PARCIAL',
              'COLHEITA_REALIZADA',
              'AGUARDANDO_PRECIFICACAO',
              'PRECIFICACAO_REALIZADA',
              'AGUARDANDO_PAGAMENTO',
              'PAGAMENTO_PARCIAL',
              'PAGAMENTO_REALIZADO'
            ].includes(pedidoAtual.status);

            const requerePrecificacao = [
              'PRECIFICACAO_REALIZADA',
              'AGUARDANDO_PAGAMENTO',
              'PAGAMENTO_PARCIAL',
              'PAGAMENTO_REALIZADO'
            ].includes(pedidoAtual.status);

            console.log(`🔍 Validando nova fruta para fase ${pedidoAtual.status}:`, {
              requereColheita,
              requerePrecificacao,
              temQuantidadeReal: !!fruta.quantidadeReal,
              temAreas: fruta.areas?.length && fruta.areas.length > 0,
              temValorUnitario: !!fruta.valorUnitario
            });

            // Validar dados de colheita se fase requer
            if (requereColheita) {
              if (!fruta.quantidadeReal || fruta.quantidadeReal <= 0) {
                throw new BadRequestException(
                  `Nova fruta (ID ${fruta.frutaId}) requer quantidade real porque pedido está em fase ${pedidoAtual.status}. ` +
                  `Acesse a aba de Colheita para preencher os dados obrigatórios.`
                );
              }

              // ✅ Exigir área apenas quando NÃO herda da fruta de primeira da cultura
              if (deveExigirArea && (!fruta.areas || fruta.areas.length === 0)) {
                throw new BadRequestException(
                  `Nova fruta (ID ${fruta.frutaId}) requer pelo menos uma área de origem porque pedido está em fase ${pedidoAtual.status}. ` +
                  `Acesse a aba de Colheita para vincular áreas.`
                );
              }

              // ✅ Segurança: se herda, nunca criar áreas/fitas na fruta de segunda
              if (!deveExigirArea) {
                fruta.areas = [];
                fruta.fitas = [];
              }

              console.log(`✅ Nova fruta possui dados de colheita obrigatórios`);
            }

            // Validar dados de precificação se fase requer
            if (requerePrecificacao) {
              if (!fruta.valorUnitario || fruta.valorUnitario <= 0) {
                throw new BadRequestException(
                  `Nova fruta (ID ${fruta.frutaId}) requer valor unitário porque pedido está em fase ${pedidoAtual.status}. ` +
                  `Acesse a aba de Precificação para preencher os dados obrigatórios.`
                );
              }

              if (!fruta.unidadePrecificada) {
                throw new BadRequestException(
                  `Nova fruta (ID ${fruta.frutaId}) requer unidade de precificação porque pedido está em fase ${pedidoAtual.status}. ` +
                  `Acesse a aba de Precificação para definir a unidade.`
                );
              }

              if (!fruta.quantidadePrecificada || fruta.quantidadePrecificada <= 0) {
                throw new BadRequestException(
                  `Nova fruta (ID ${fruta.frutaId}) requer quantidade precificada porque pedido está em fase ${pedidoAtual.status}. ` +
                  `Acesse a aba de Precificação para definir a quantidade.`
                );
              }

              console.log(`✅ Nova fruta possui dados de precificação obrigatórios`);
            }

            // ✅ Criar registro FrutasPedidos
            const novaFrutaPedido = await prisma.frutasPedidos.create({
              data: {
                pedidoId: id,
                frutaId: fruta.frutaId,
                quantidadePrevista: fruta.quantidadePrevista,
                unidadeMedida1: fruta.unidadeMedida1,
                unidadeMedida2: fruta.unidadeMedida2 || null,
                quantidadeReal: fruta.quantidadeReal || null,
                quantidadeReal2: fruta.quantidadeReal2 || null,
                valorUnitario: fruta.valorUnitario || 0,
                unidadePrecificada: fruta.unidadePrecificada || fruta.unidadeMedida1,
                quantidadePrecificada: fruta.quantidadePrecificada || 0,
                valorTotal: fruta.valorTotal || 0,
              },
            });

            console.log(`✅ Nova fruta criada com ID: ${novaFrutaPedido.id}`);

            // ✅ Criar FrutasPedidosAreas (se fornecidas)
            if (fruta.areas && fruta.areas.length > 0) {
              console.log(`📍 Criando ${fruta.areas.length} áreas para fruta ${novaFrutaPedido.id}`);

              for (const area of fruta.areas) {
                if (area.areaPropriaId || area.areaFornecedorId) {
                  await prisma.frutasPedidosAreas.create({
                    data: {
                      frutaPedidoId: novaFrutaPedido.id,
                      areaPropriaId: area.areaPropriaId || null,
                      areaFornecedorId: area.areaFornecedorId || null,
                      observacoes: area.observacoes || '',
                      quantidadeColhidaUnidade1: area.quantidadeColhidaUnidade1 || null,
                      quantidadeColhidaUnidade2: area.quantidadeColhidaUnidade2 || null
                    }
                  });
                }
              }
            }

            // ✅ Criar FrutasPedidosFitas (se fornecidas)
            if (fruta.fitas && fruta.fitas.length > 0) {
              console.log(`🍌 Criando fitas para fruta ${novaFrutaPedido.id}`);

              // Validar estoque antes de processar
              await this.validarEstoqueParaEdicao(fruta.fitas, id, prisma);

              for (const fita of fruta.fitas) {
                if (fita.fitaBananaId && fita.detalhesAreas && fita.detalhesAreas.length > 0) {
                  for (const detalheArea of fita.detalhesAreas) {
                    // Criar relacionamento de fita
                    await prisma.frutasPedidosFitas.create({
                      data: {
                        frutaPedidoId: novaFrutaPedido.id,
                        fitaBananaId: detalheArea.fitaBananaId,
                        controleBananaId: detalheArea.controleBananaId,
                        quantidadeFita: detalheArea.quantidade,
                        observacoes: fita.observacoes || ''
                      }
                    });

                    // Subtrair do estoque
                    await this.controleBananaService.subtrairEstoquePorControle(
                      detalheArea.controleBananaId,
                      detalheArea.quantidade,
                      usuarioId
                    );

                    console.log(`✅ Fita ${detalheArea.fitaBananaId} vinculada (${detalheArea.quantidade} unidades)`);
                  }
                }
              }
            }

            console.log(`🎯 Nova fruta completamente criada no pedido ${id}`);
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
                quantidadePrecificada: fruta.quantidadePrecificada,
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

      // ========================================
      // 🆕 PROCESSAMENTO DE MÃO DE OBRA (CUSTOS DE COLHEITA)
      // ========================================
      if (updatePedidoCompletoDto.maoObra) {
        console.log('🛠️ Processando mão de obra do pedido...');

        // Buscar custos atuais do pedido (incluindo flag de pagamento)
        const custosAtuais = await prisma.turmaColheitaPedidoCusto.findMany({
          where: { pedidoId: id },
          select: {
            id: true,
            turmaColheitaId: true,
            frutaId: true,
            quantidadeColhida: true,
            valorColheita: true,
            observacoes: true,
            statusPagamento: true,
            pagamentoEfetuado: true,
            _count: {
              select: {
                pagamentoApiItemColheitas: true,
              },
            },
          },
        });

        // ✅ Custos protegidos: não podem ser alterados nem removidos
        // - PROCESSANDO/PAGO, ou
        // - vinculados ao PIX-API (PagamentoApiItemColheita)
        const custosProtegidos = custosAtuais.filter((c: any) => {
          const status = (c.statusPagamento || '').toString().trim().toUpperCase();
          const vinculadoPix = (c?._count?.pagamentoApiItemColheitas ?? 0) > 0;
          return (
            c.pagamentoEfetuado === true ||
            status === 'PROCESSANDO' ||
            status === 'PAGO' ||
            vinculadoPix
          );
        });
        const idsCustosProtegidos = new Set<number>(custosProtegidos.map((c: any) => c.id));

        // ✅ LOG: Detalhar colheitas protegidas que não serão alteradas
        if (custosProtegidos.length > 0) {
          // Buscar informações adicionais das colheitas protegidas para o log
          const custosProtegidosComDetalhes = await Promise.all(
            custosProtegidos.map(async (c: any) => {
              const detalhes = await prisma.turmaColheitaPedidoCusto.findUnique({
                where: { id: c.id },
                select: {
                  id: true,
                  turmaColheitaId: true,
                  valorColheita: true,
                  statusPagamento: true,
                  pagamentoEfetuado: true,
                  quantidadeColhida: true,
                  turmaColheita: {
                    select: {
                      nomeColhedor: true,
                      responsavelChavePix: true,
                    },
                  },
                  fruta: {
                    select: {
                      nome: true,
                    },
                  },
                  _count: {
                    select: {
                      pagamentoApiItemColheitas: true,
                    },
                  },
                },
              });

              const status = (detalhes?.statusPagamento || c.statusPagamento || '').toString().trim().toUpperCase();
              const vinculadoPix = (detalhes?._count?.pagamentoApiItemColheitas ?? 0) > 0;
              
              // Determinar motivo da proteção
              const motivos: string[] = [];
              if (detalhes?.pagamentoEfetuado === true || c.pagamentoEfetuado === true) motivos.push('pagamentoEfetuado=true');
              if (status === 'PROCESSANDO') motivos.push('statusPagamento=PROCESSANDO');
              if (status === 'PAGO') motivos.push('statusPagamento=PAGO');
              if (vinculadoPix) motivos.push('vinculadoPixApi=true');

              return {
                id: detalhes?.id || c.id,
                turmaColheitaId: detalhes?.turmaColheitaId || c.turmaColheitaId,
                turmaNome: detalhes?.turmaColheita?.nomeColhedor || 'N/A',
                responsavelChavePix: detalhes?.turmaColheita?.responsavelChavePix || 'N/A',
                frutaNome: detalhes?.fruta?.nome || 'N/A',
                valorColheita: detalhes?.valorColheita || c.valorColheita || 0,
                quantidadeColhida: detalhes?.quantidadeColhida || c.quantidadeColhida || 0,
                statusPagamento: detalhes?.statusPagamento || c.statusPagamento || 'N/A',
                pagamentoEfetuado: detalhes?.pagamentoEfetuado || c.pagamentoEfetuado || false,
                vinculadoPixApi: vinculadoPix,
                motivo: motivos.join(' | '),
              };
            })
          );

          console.log('🔒 COLHEITAS PROTEGIDAS (não serão alteradas):');
          console.log(`   Total: ${custosProtegidosComDetalhes.length} colheita(s) protegida(s)`);
          custosProtegidosComDetalhes.forEach((colheita) => {
            console.log(
              `   - ID ${colheita.id} | Turma: ${colheita.turmaNome} (${colheita.responsavelChavePix}) | ` +
              `Fruta: ${colheita.frutaNome} | Valor: R$ ${Number(colheita.valorColheita).toFixed(2)} | ` +
              `Qtd: ${colheita.quantidadeColhida} | Status: ${colheita.statusPagamento} | ` +
              `Motivo: ${colheita.motivo}`
            );
          });
        }

        // Verificar se há custos já pagos OU protegidos (equivale a "não posso substituir tudo")
        const possuiPagamentosOuProtegidos =
          custosProtegidos.length > 0 ||
          custosAtuais.some((c: any) => c.pagamentoEfetuado === true);

        // =====================================================
        // CASO 1: Não há pagamentos efetuados -> substituir tudo
        //         (mais simples e garante que frutaId acompanha
        //          exatamente o que veio do frontend)
        // =====================================================
        // ✅ Porém, se existir qualquer custo protegido (PROCESSANDO/PAGO ou vinculado PIX-API),
        // NÃO podemos deletar/recriar, senão perdemos vínculos por cascade.
        if (!possuiPagamentosOuProtegidos) {
          // Remover todos os custos atuais do pedido
          if (custosAtuais.length > 0) {
            console.log(
              '🗑️ Removendo todos os custos de colheita do pedido (sem pagamentos efetuados):',
              custosAtuais.map((c) => c.id),
            );
            await prisma.turmaColheitaPedidoCusto.deleteMany({
              where: { pedidoId: id },
            });
          }

          // Recriar custos exatamente conforme enviado pelo frontend
          for (const maoObra of updatePedidoCompletoDto.maoObra) {
            // Buscar dados da fruta para fallback (se unidadeMedida não for fornecido)
            const frutaPedido = await prisma.frutasPedidos.findFirst({
              where: {
                pedidoId: id,
                frutaId: maoObra.frutaId,
              },
              select: {
                unidadeMedida1: true,
                unidadeMedida2: true,
              },
            });

            if (!frutaPedido) {
              console.log(
                `⚠️ Fruta ${maoObra.frutaId} não encontrada no pedido, pulando...`,
              );
              continue;
            }

            // Determinar unidade de medida
            let unidadeMedida: string = 'KG';
            if (
              maoObra.unidadeMedida &&
              ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'].includes(maoObra.unidadeMedida)
            ) {
              unidadeMedida = maoObra.unidadeMedida;
            } else {
              const unidadeCompleta = frutaPedido.unidadeMedida1 || 'KG';
              const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
              const unidadeEncontrada = unidadesValidas.find((u) =>
                unidadeCompleta.includes(u),
              );
              unidadeMedida = unidadeEncontrada || 'KG';
            }

            console.log(
              '🆕 Criando custo de colheita (substituição completa):',
              {
                turmaColheitaId: maoObra.turmaColheitaId,
                frutaId: maoObra.frutaId,
                quantidadeColhida: maoObra.quantidadeColhida,
                unidadeMedida,
                valorColheita: maoObra.valorColheita || 0,
              },
            );

            await prisma.turmaColheitaPedidoCusto.create({
              data: {
                turmaColheitaId: maoObra.turmaColheitaId,
                pedidoId: id,
                frutaId: maoObra.frutaId,
                quantidadeColhida: maoObra.quantidadeColhida,
                unidadeMedida: unidadeMedida as any,
                valorColheita: maoObra.valorColheita || 0,
                observacoes: maoObra.observacoes || null,
                dataColheita: maoObra.dataColheita
                  ? new Date(maoObra.dataColheita)
                  : undefined,
              },
            });
          }
        } else {
          // =====================================================
          // CASO 2: Há pagamentos efetuados OU custos protegidos -> fluxo incremental
          //         (não removemos tudo para não quebrar vínculos)
          // =====================================================

          // Identificar custos a remover (não estão mais no array enviado)
          const custosIdsEnviados = updatePedidoCompletoDto.maoObra
            .filter((m) => m.id)
            .map((m) => m.id);

          const custosParaRemover = custosAtuais.filter(
            (custo) => !custosIdsEnviados.includes(custo.id),
          );

          // Remover custos obsoletos (apenas os que não têm pagamento efetuado)
          const idsParaRemover = custosParaRemover
            .filter(
              (c) =>
                !c.pagamentoEfetuado &&
                c.statusPagamento !== 'PROCESSANDO' &&
                c.statusPagamento !== 'PAGO',
            )
            .map((c) => c.id);

          if (idsParaRemover.length > 0) {
            console.log(
              '🗑️ Removendo custos obsoletos (sem pagamento):',
              idsParaRemover,
            );
            await prisma.turmaColheitaPedidoCusto.deleteMany({
              where: {
                id: { in: idsParaRemover },
                statusPagamento: { notIn: ['PROCESSANDO', 'PAGO'] } as any,
                pagamentoApiItemColheitas: { none: {} },
              },
            });
          }
        }

        // Processar cada item de mão de obra
        // - Quando NÃO há pagamentos efetuados, toda a substituição já foi feita acima
        //   (deleteMany + creates), então não precisamos (nem devemos) rodar a lógica
        //   de update por ID aqui.
        // - Quando HÁ pagamentos efetuados, usamos o fluxo incremental abaixo.
        if (possuiPagamentosOuProtegidos) {
        for (const maoObra of updatePedidoCompletoDto.maoObra) {
          // Buscar dados da fruta para fallback (se unidadeMedida não for fornecido)
          const frutaPedido = await prisma.frutasPedidos.findFirst({
            where: {
              pedidoId: id,
              frutaId: maoObra.frutaId
            },
            select: {
              unidadeMedida1: true,
              unidadeMedida2: true
            }
          });

          if (!frutaPedido) {
            console.log(`⚠️ Fruta ${maoObra.frutaId} não encontrada no pedido, pulando...`);
            continue;
          }

          // ✅ SIMPLIFICADO: Usar unidadeMedida do DTO se fornecido, senão usar unidadeMedida1 como fallback
          let unidadeMedida: string = 'KG';
          
          if (maoObra.unidadeMedida && ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'].includes(maoObra.unidadeMedida)) {
            unidadeMedida = maoObra.unidadeMedida;
          } else {
            // Fallback: usar unidadeMedida1 da fruta
            const unidadeCompleta = frutaPedido.unidadeMedida1 || 'KG';
            const unidadesValidas = ['KG', 'CX', 'TON', 'UND', 'ML', 'LT'];
            const unidadeEncontrada = unidadesValidas.find(u => unidadeCompleta.includes(u));
            unidadeMedida = unidadeEncontrada || 'KG';
          }

          if (maoObra.id) {
            // ✅ Se o custo é protegido, não permitir update (mantém integridade do vínculo PIX-API)
            if (idsCustosProtegidos.has(maoObra.id)) {
              // Buscar informações da colheita protegida para o log
              const colheitaProtegida = await prisma.turmaColheitaPedidoCusto.findUnique({
                where: { id: maoObra.id },
                select: {
                  id: true,
                  turmaColheitaId: true,
                  valorColheita: true,
                  statusPagamento: true,
                  pagamentoEfetuado: true,
                  turmaColheita: {
                    select: {
                      nomeColhedor: true,
                      responsavelChavePix: true,
                    },
                  },
                  fruta: {
                    select: {
                      nome: true,
                    },
                  },
                  _count: {
                    select: {
                      pagamentoApiItemColheitas: true,
                    },
                  },
                },
              });

              if (colheitaProtegida) {
                const status = (colheitaProtegida.statusPagamento || '').toString().trim().toUpperCase();
                const vinculadoPix = (colheitaProtegida?._count?.pagamentoApiItemColheitas ?? 0) > 0;
                const motivos: string[] = [];
                if (colheitaProtegida.pagamentoEfetuado === true) motivos.push('pagamentoEfetuado=true');
                if (status === 'PROCESSANDO') motivos.push('statusPagamento=PROCESSANDO');
                if (status === 'PAGO') motivos.push('statusPagamento=PAGO');
                if (vinculadoPix) motivos.push('vinculadoPixApi=true');

                console.log(
                  `⚠️ IGNORANDO atualização de colheita protegida: ` +
                  `ID ${colheitaProtegida.id} | Turma: ${colheitaProtegida.turmaColheita?.nomeColhedor || 'N/A'} ` +
                  `(${colheitaProtegida.turmaColheita?.responsavelChavePix || 'N/A'}) | ` +
                  `Fruta: ${colheitaProtegida.fruta?.nome || 'N/A'} | ` +
                  `Valor: R$ ${Number(colheitaProtegida.valorColheita || 0).toFixed(2)} | ` +
                  `Motivo: ${motivos.join(' | ')}`
                );
              }
              continue;
            }
            // Atualizar custo existente
            // ✅ IMPORTANTE: também permitir alteração da fruta vinculada à mão de obra
            await prisma.turmaColheitaPedidoCusto.update({
              where: { id: maoObra.id },
              data: {
                turmaColheitaId: maoObra.turmaColheitaId,
                frutaId: maoObra.frutaId,
                quantidadeColhida: maoObra.quantidadeColhida,
                unidadeMedida: unidadeMedida as any,
                valorColheita: maoObra.valorColheita || 0,
                observacoes: maoObra.observacoes || null,
                dataColheita: maoObra.dataColheita ? new Date(maoObra.dataColheita) : undefined
              }
            });
          } else {
            // Criar novo custo
            console.log(`🆕 Criando novo custo de colheita...`);
            await prisma.turmaColheitaPedidoCusto.create({
              data: {
                turmaColheitaId: maoObra.turmaColheitaId,
                pedidoId: id,
                frutaId: maoObra.frutaId,
                quantidadeColhida: maoObra.quantidadeColhida,
                unidadeMedida: unidadeMedida as any,
                valorColheita: maoObra.valorColheita || 0,
                observacoes: maoObra.observacoes || null,
                dataColheita: maoObra.dataColheita ? new Date(maoObra.dataColheita) : undefined
              }
            });
          }
        }
        }

        console.log('✅ Mão de obra processada com sucesso!');
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
        // ✅ CORREÇÃO: Usar quantidadePrecificada que já foi salva no loop anterior
        const frutasDoPedido = await prisma.frutasPedidos.findMany({ where: { pedidoId: id } });
        let valorTotalFrutas = 0;
        
        for (const fp of frutasDoPedido) {
          // ✅ SEMPRE usar quantidadePrecificada (já salva no loop anterior)
          // Se não houver quantidadePrecificada salva, usar fallback das quantidades colhidas
          let qtd = fp.quantidadePrecificada;
          
          if (qtd === null || qtd === undefined) {
            // Fallback: usar quantidade colhida baseada na unidade precificada
            const unidadePrec = fp.unidadePrecificada?.toString().trim().toUpperCase();
            const um1 = fp.unidadeMedida1?.toString().trim().toUpperCase();
            const um2 = fp.unidadeMedida2?.toString().trim().toUpperCase();
            
            if (unidadePrec === um2) {
              qtd = fp.quantidadeReal2 || 0;
            } else {
              // padrão: um1
              qtd = fp.quantidadeReal || 0;
            }
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
            // Arredondar ambos os valores para 2 casas decimais antes de comparar para evitar problemas de precisão
            const valorRecebidoArredondado = Number(valorRecebidoConsolidado.toFixed(2));
            const valorFinalArredondado = Number((pedidoAtualizado.valorFinal || 0).toFixed(2));

            if (valorRecebidoArredondado >= valorFinalArredondado) {
              novoStatus = 'PEDIDO_FINALIZADO';
            } else if (valorRecebidoArredondado > 0) {
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
    
    // 🔍 DEBUG: Verificar resultado final
    const frutasFinaisBanco = await this.prisma.frutasPedidos.findMany({
      where: { pedidoId: id },
      select: {
        id: true,
        frutaId: true,
        quantidadePrevista: true
      }
    });


    return pedidoCompleto;
  }

  async finalizar(id: number, usuarioId: number): Promise<PedidoResponseDto> {
    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const statusAnterior = existingPedido.status;

    // Verificar se o status permite finalização
    // Permitir finalizar se o pedido estiver 100% pago (valorRecebido >= valorFinal)
    const valorRecebidoArredondado = Number((existingPedido.valorRecebido || 0).toFixed(2));
    const valorFinalArredondado = Number((existingPedido.valorFinal || 0).toFixed(2));

    if (valorRecebidoArredondado < valorFinalArredondado) {
      throw new BadRequestException('O pedido só pode ser finalizado quando o valor total for recebido');
    }

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        status: 'PEDIDO_FINALIZADO',
      },
      include: {
        cliente: {
          select: { id: true, nome: true, industria: true, dias: true }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: { 
                id: true, 
                nome: true,
                dePrimeira: true,
                culturaId: true,
                cultura: {
                  select: {
                    id: true,
                    descricao: true
                  }
                }
              }
            }
          }
        },
        pagamentosPedidos: true
      }
    });

    await this.historicoService.registrarAcao(
      id,
      usuarioId,
      TipoAcaoHistorico.FINALIZAR_PEDIDO,
      {
        statusAnterior: statusAnterior,
        statusNovo: StatusPedido.PEDIDO_FINALIZADO,
        mensagem: 'Pedido finalizado pelo usuário',
      }
    );

    return this.convertNullToUndefined(pedido);
  }

  async cancelar(id: number, usuarioId: number): Promise<PedidoResponseDto> {
    // Verificar se o pedido existe
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }
    const statusAnterior = existingPedido.status;

    // Verificar se o status permite cancelamento
    if (existingPedido.status === 'PEDIDO_FINALIZADO') {
      throw new BadRequestException('Não é possível cancelar pedidos finalizados');
    }

    const pedido = await this.prisma.pedido.update({
      where: { id },
      data: {
        status: StatusPedido.CANCELADO,
      },
      include: {
        cliente: {
          select: { id: true, nome: true, industria: true, dias: true }
        },
        frutasPedidos: {
          include: {
            fruta: {
              select: { 
                id: true, 
                nome: true,
                dePrimeira: true,
                culturaId: true,
                cultura: {
                  select: {
                    id: true,
                    descricao: true
                  }
                }
              }
            }
          }
        },
        pagamentosPedidos: true
      }
    });

    await this.historicoService.registrarAcao(
      id,
      usuarioId,
      TipoAcaoHistorico.CANCELAR_PEDIDO,
      {
        statusAnterior: statusAnterior,
        statusNovo: StatusPedido.CANCELADO,
        mensagem: 'Pedido cancelado pelo usuário',
        motivo: 'Cancelamento manual',
      }
    );

    return this.convertNullToUndefined(pedido);
  }

  async remove(id: number, usuarioId: number): Promise<void> {
    // Verificar se o pedido existe e buscar dados completos
    const existingPedido = await this.prisma.pedido.findUnique({
      where: { id },
      include: {
        frutasPedidos: {
          include: {
            fitas: true, // Incluir fitas para liberar estoque
            areas: true
          }
        },
        custosColheita: true, // Incluir mão de obra
        pagamentosPedidos: true
      }
    });

    if (!existingPedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // ✅ PERMITIR EXCLUSÃO: CANCELADO, PEDIDO_CRIADO, AGUARDANDO_COLHEITA e COLHEITA_PARCIAL
    const statusPermitidos = ['CANCELADO', 'PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_PARCIAL'];
    if (!statusPermitidos.includes(existingPedido.status)) {
      throw new BadRequestException(
        'Só é possível remover pedidos cancelados, recém criados, aguardando colheita ou com colheita parcial'
      );
    }

    await this.historicoService.registrarAcao(
      id,
      usuarioId,
      TipoAcaoHistorico.REMOVER_PEDIDO,
      {
        statusAnterior: existingPedido.status,
        statusNovo: StatusPedido.CANCELADO,
        mensagem: 'Pedido removido pelo usuário',
        motivo: 'Remoção completa do sistema',
      }
    );

    // Remover em transação para garantir integridade
    await this.prisma.$transaction(async (prisma) => {
      // ✅ 1. LIBERAR ESTOQUE DE FITAS (se houver)
      for (const frutaPedido of existingPedido.frutasPedidos) {
        if (frutaPedido.fitas && frutaPedido.fitas.length > 0) {
          for (const fita of frutaPedido.fitas) {
            // Liberar estoque adicionando de volta ao controle de banana
            await this.controleBananaService.adicionarEstoquePorControle(
              fita.controleBananaId,
              fita.quantidadeFita || 0,
              1 // usuarioId padrão para operação de sistema
            );
          }
        }
      }

      // ✅ 2. REMOVER MÃO DE OBRA (TurmaColheitaPedidoCusto) - Cascade automático via schema
      // O Prisma já tem onDelete: Cascade configurado, mas deletamos explicitamente para garantir
      await prisma.turmaColheitaPedidoCusto.deleteMany({
        where: { pedidoId: id },
      });

      // ✅ 3. REMOVER FITAS DE PEDIDOS (FrutasPedidosFitas) - Cascade automático via schema
      // Já será removido pelo cascade, mas podemos fazer explicitamente
      for (const frutaPedido of existingPedido.frutasPedidos) {
        await prisma.frutasPedidosFitas.deleteMany({
          where: { frutaPedidoId: frutaPedido.id },
        });
      }

      // ✅ 4. REMOVER ÁREAS DE PEDIDOS (FrutasPedidosAreas) - Cascade automático via schema
      for (const frutaPedido of existingPedido.frutasPedidos) {
        await prisma.frutasPedidosAreas.deleteMany({
          where: { frutaPedidoId: frutaPedido.id },
        });
      }

      // ✅ 5. REMOVER FRUTAS DO PEDIDO (FrutasPedidos) - Cascade automático via schema
      await prisma.frutasPedidos.deleteMany({
        where: { pedidoId: id },
      });

      // ✅ 6. REMOVER PAGAMENTOS DO PEDIDO (PagamentosPedidos) - Cascade automático via schema
      await prisma.pagamentosPedidos.deleteMany({
        where: { pedidoId: id },
      });

      // ✅ 7. REMOVER O PEDIDO
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
   * Normaliza string removendo acentos para busca case-insensitive e accent-insensitive
   * @param str String a ser normalizada
   * @returns String sem acentos em minúsculas
   */
  private normalizeForSearch(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
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
    const normalizedTerm = this.normalizeForSearch(term);

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
            description: `${pedido.numeroPedido} - ${capitalizeName(pedido.cliente.nome)} (${pedido.status.replace(/_/g, ' ')})`,
            metadata: {
              id: pedido.id,
              status: pedido.status,
              clienteNome: pedido.cliente.nome
            }
          });
        });
      }

      // 2. Buscar por nome do cliente (ignorando acentos)
      const numericTerm = term.replace(/[^0-9]/g, '');
      
      // Buscar mais resultados para filtrar por acentos
      const clienteWhereConditions: any[] = [];
      
      if (numericTerm && numericTerm.length >= 2) {
        // Se há termo numérico significativo, buscar por CNPJ/CPF
        clienteWhereConditions.push({ cnpj: { contains: numericTerm } });
        clienteWhereConditions.push({ cpf: { contains: numericTerm } });
      }

      // Buscar clientes (sempre buscar um conjunto limitado para filtrar depois)
      const clientesRaw = await this.prisma.cliente.findMany({
        where: numericTerm && numericTerm.length >= 2 ? {
          OR: clienteWhereConditions
        } : {
          // Se não há termo numérico, buscar por nome/razão social com contains (pré-filtro)
          OR: [
            { nome: { contains: term.substring(0, 2), mode: 'insensitive' } }, // Pré-filtro com 2 primeiros caracteres
            { razaoSocial: { contains: term.substring(0, 2), mode: 'insensitive' } }
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
        take: 20, // Buscar mais para garantir que teremos resultados após filtrar por acentos
        orderBy: { nome: 'asc' }
      });

      // Filtrar clientes que correspondem ao termo normalizado (sem acentos)
      const clientes = clientesRaw.filter(cliente => {
        if (numericTerm) {
          // Se há termo numérico, já foi filtrado pelo Prisma
          return true;
        }
        const nomeNormalizado = this.normalizeForSearch(cliente.nome);
        const razaoSocialNormalizada = cliente.razaoSocial ? this.normalizeForSearch(cliente.razaoSocial) : '';
        return nomeNormalizado.includes(normalizedTerm) || razaoSocialNormalizada.includes(normalizedTerm);
      }).slice(0, 3); // Limitar a 3 resultados finais

      clientes.forEach(cliente => {
        const documento = cliente.cnpj || cliente.cpf || 'N/A';
        suggestions.push({
          type: 'cliente',
          label: 'Cliente',
          value: capitalizeName(cliente.nome),
          icon: '👤',
          color: '#52c41a',
          description: `${capitalizeName(cliente.nome)}${cliente.razaoSocial && cliente.razaoSocial !== cliente.nome ? ` (${capitalizeName(cliente.razaoSocial)})` : ''} - ${cliente._count.pedidos} pedidos`,
          metadata: {
            id: cliente.id,
            documento: documento,
            email: cliente.email1,
            totalPedidos: cliente._count.pedidos
          }
        });
      });

      // 3. Buscar por motorista (campo: nomeMotorista) - ignorando acentos
      if (term.length >= 3) {
        // Buscar mais resultados para filtrar por acentos
        const motoristasUnicos = await this.prisma.pedido.groupBy({
          by: ['nomeMotorista'],
          where: {
            AND: [
              { nomeMotorista: { not: null } },
              { nomeMotorista: { contains: term.substring(0, 2), mode: 'insensitive' } } // Pré-filtro
            ]
          },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 20 // Aumentar para capturar todas as variações incluindo acentos
        });

        // ✅ AGRUPAR MOTORISTAS POR NOME NORMALIZADO (sem acentos e case-insensitive)
        const motoristasAgrupados = new Map();
        
        motoristasUnicos.forEach(motorista => {
          if (motorista.nomeMotorista) {
            const nomeNormalizadoSemAcentos = this.normalizeForSearch(motorista.nomeMotorista);
            
            if (motoristasAgrupados.has(nomeNormalizadoSemAcentos)) {
              // Somar contadores se já existe
              const existente = motoristasAgrupados.get(nomeNormalizadoSemAcentos);
              existente.totalPedidos += motorista._count.id;
              // Manter o nome com capitalização original mais comum
              if (motorista._count.id > existente.contadorOriginal) {
                existente.nomeOriginal = motorista.nomeMotorista;
                existente.contadorOriginal = motorista._count.id;
              }
            } else {
              motoristasAgrupados.set(nomeNormalizadoSemAcentos, {
                nomeOriginal: motorista.nomeMotorista,
                totalPedidos: motorista._count.id,
                contadorOriginal: motorista._count.id
              });
            }
          }
        });

        // Filtrar motoristas que correspondem ao termo normalizado (sem acentos)
        const motoristasFiltrados = Array.from(motoristasAgrupados.values())
          .filter(motorista => {
            const nomeNormalizado = this.normalizeForSearch(motorista.nomeOriginal);
            return nomeNormalizado.includes(normalizedTerm);
          });

        // Converter para array e ordenar por total de pedidos
        const motoristasFinal = motoristasFiltrados
          .sort((a, b) => b.totalPedidos - a.totalPedidos)
          .slice(0, 3); // Limitar a 3 resultados

        motoristasFinal.forEach(motorista => {
          suggestions.push({
            type: 'motorista',
            label: 'Motorista',
            value: motorista.nomeOriginal,
            icon: '🚛',
            color: '#fa8c16',
            description: `${motorista.nomeOriginal} - ${motorista.totalPedidos} pedidos`,
            metadata: {
              nome: motorista.nomeOriginal,
              totalPedidos: motorista.totalPedidos
            }
          });
        });
      }

    // 3.1. Buscar por turmas de colheita
    if (term.length >= 2) {
      const trimmedTerm = term.trim();
      const prefilterTerm = trimmedTerm.substring(0, Math.min(2, trimmedTerm.length));

      const turmasWhereConditions: any[] = [];

      if (trimmedTerm.length >= 2) {
        turmasWhereConditions.push({
          nomeColhedor: {
            contains: trimmedTerm,
            mode: 'insensitive',
          },
        });
      }

      if (prefilterTerm.length >= 2) {
        turmasWhereConditions.push({
          nomeColhedor: {
            contains: prefilterTerm,
            mode: 'insensitive',
          },
        });
      }

      const turmasRaw = await this.prisma.turmaColheita.findMany({
        where: turmasWhereConditions.length > 0 ? { OR: turmasWhereConditions } : undefined,
        select: {
          id: true,
          nomeColhedor: true,
          responsavelChavePix: true,
          chavePix: true,
          custosColheita: {
            select: {
              pedidoId: true,
            },
          },
          _count: {
            select: { custosColheita: true },
          },
        },
        take: 20,
        orderBy: { nomeColhedor: 'asc' },
      });

      const turmasFiltradas = turmasRaw
        .filter((turma) => {
          const nomeNormalizado = this.normalizeForSearch(turma.nomeColhedor);
          return nomeNormalizado.includes(normalizedTerm);
        })
        .slice(0, 3);

      turmasFiltradas.forEach((turma) => {
        const pedidosUnicos = new Set(
          (turma.custosColheita || []).map((custo) => custo.pedidoId),
        ).size;

        suggestions.push({
          type: 'turma',
          label: 'Turma de Colheita',
          value: capitalizeName(turma.nomeColhedor),
          icon: '🧑‍🌾',
          color: '#13c2c2',
          description: `Pedidos vinculados: ${pedidosUnicos}`,
          metadata: {
            id: turma.id,
            nome: turma.nomeColhedor,
            responsavel: turma.responsavelChavePix,
            chavePix: turma.chavePix,
            totalPedidos: pedidosUnicos,
          },
        });
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
          take: 5 // Aumentar para capturar variações
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
          take: 5 // Aumentar para capturar variações
        });

        // ✅ AGRUPAR PLACAS POR VALOR NORMALIZADO (case-insensitive)
        const placasAgrupadas = new Map();

        // Processar placas primárias
        placasPrimarias.forEach(placa => {
          if (placa.placaPrimaria) {
            const placaNormalizada = placa.placaPrimaria.toUpperCase();
            
            if (placasAgrupadas.has(placaNormalizada)) {
              const existente = placasAgrupadas.get(placaNormalizada);
              existente.totalPedidos += placa._count.id;
              if (placa._count.id > existente.contadorOriginal) {
                existente.placaOriginal = placa.placaPrimaria;
                existente.contadorOriginal = placa._count.id;
              }
            } else {
              placasAgrupadas.set(placaNormalizada, {
                placaOriginal: placa.placaPrimaria,
                totalPedidos: placa._count.id,
                contadorOriginal: placa._count.id,
                tipo: 'primaria'
              });
            }
          }
        });

        // Processar placas secundárias
        placasSecundarias.forEach(placa => {
          if (placa.placaSecundaria) {
            const placaNormalizada = placa.placaSecundaria.toUpperCase();
            
            if (placasAgrupadas.has(placaNormalizada)) {
              const existente = placasAgrupadas.get(placaNormalizada);
              existente.totalPedidos += placa._count.id;
              if (placa._count.id > existente.contadorOriginal) {
                existente.placaOriginal = placa.placaSecundaria;
                existente.contadorOriginal = placa._count.id;
                existente.tipo = 'secundaria';
              }
            } else {
              placasAgrupadas.set(placaNormalizada, {
                placaOriginal: placa.placaSecundaria,
                totalPedidos: placa._count.id,
                contadorOriginal: placa._count.id,
                tipo: 'secundaria'
              });
            }
          }
        });

        // Converter para array e ordenar por total de pedidos
        const placasFinal = Array.from(placasAgrupadas.values())
          .sort((a, b) => b.totalPedidos - a.totalPedidos)
          .slice(0, 3); // Limitar a 3 resultados

        placasFinal.forEach(placa => {
          suggestions.push({
            type: 'placa',
            label: placa.tipo === 'primaria' ? 'Placa Principal' : 'Placa Reboque',
            value: placa.placaOriginal,
            icon: placa.tipo === 'primaria' ? '🚗' : '🚛',
            color: '#eb2f96',
            description: `Placa ${placa.placaOriginal} - ${placa.totalPedidos} pedidos`,
            metadata: {
              placa: placa.placaOriginal,
              totalPedidos: placa.totalPedidos,
              tipo: placa.tipo
            }
          });
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

      // 6. Buscar por fornecedor - ignorando acentos
      if (term.length >= 3) {
        // Buscar mais resultados para filtrar por acentos
        const fornecedoresRaw = await this.prisma.fornecedor.findMany({
          where: {
            nome: {
              contains: term.substring(0, 2), // Pré-filtro com 2 primeiros caracteres
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
          take: 10, // Buscar mais para filtrar depois
          orderBy: { nome: 'asc' }
        });

        // Filtrar fornecedores que correspondem ao termo normalizado (sem acentos)
        const fornecedores = fornecedoresRaw.filter(fornecedor => {
          const nomeNormalizado = this.normalizeForSearch(fornecedor.nome);
          return nomeNormalizado.includes(normalizedTerm);
        }).slice(0, 3); // Limitar a 3 resultados finais

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

      // 7. Buscar por áreas (próprias e de fornecedores) - ignorando acentos
      if (term.length >= 3) {
        // Buscar áreas próprias (pré-filtrar e depois filtrar por acentos)
        const areasAgricolasRaw = await this.prisma.areaAgricola.findMany({
          where: {
            nome: {
              contains: term.substring(0, 2), // Pré-filtro com 2 primeiros caracteres
              mode: 'insensitive'
            }
          },
          select: {
            id: true,
            nome: true,
            categoria: true,
            areaTotal: true
          },
          take: 10, // Buscar mais para filtrar depois
          orderBy: { nome: 'asc' }
        });

        // Filtrar áreas que correspondem ao termo normalizado (sem acentos)
        const areasAgricolas = areasAgricolasRaw.filter(area => {
          const nomeNormalizado = this.normalizeForSearch(area.nome);
          return nomeNormalizado.includes(normalizedTerm);
        }).slice(0, 2); // Limitar a 2 resultados finais

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

        // Buscar áreas de fornecedores (pré-filtrar e depois filtrar por acentos)
        const areasFornecedoresRaw = await this.prisma.areaFornecedor.findMany({
          where: {
            nome: {
              contains: term.substring(0, 2), // Pré-filtro com 2 primeiros caracteres
              mode: 'insensitive'
            }
          },
          select: {
            id: true,
            nome: true,
            cultura: {
              select: {
                id: true,
                descricao: true
              }
            },
            fornecedor: {
              select: {
                id: true,
                nome: true
              }
            }
          },
          take: 10, // Buscar mais para filtrar depois
          orderBy: { nome: 'asc' }
        });

        // Filtrar áreas que correspondem ao termo normalizado (sem acentos)
        const areasFornecedores = areasFornecedoresRaw.filter(area => {
          const nomeNormalizado = this.normalizeForSearch(area.nome);
          return nomeNormalizado.includes(normalizedTerm);
        }).slice(0, 2); // Limitar a 2 resultados finais

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

      // 8. Buscar por fruta (ignorando acentos)
      if (term.length >= 3) {
        // Buscar mais resultados para filtrar por acentos
        const frutasRaw = await this.prisma.fruta.findMany({
          where: {
            OR: [
              { nome: { contains: term.substring(0, 2), mode: 'insensitive' } }, // Pré-filtro com 2 primeiros caracteres
              { codigo: { contains: term.substring(0, 2), mode: 'insensitive' } }
            ]
          },
          select: {
            id: true,
            nome: true,
            codigo: true,
            cultura: {
              select: {
                id: true,
                descricao: true
              }
            },
            _count: {
              select: { frutasPedidos: true }
            }
          },
          take: 20, // Buscar mais para filtrar depois
          orderBy: { nome: 'asc' }
        });

        // Filtrar frutas que correspondem ao termo normalizado (sem acentos)
        const frutas = frutasRaw.filter(fruta => {
          const nomeNormalizado = this.normalizeForSearch(fruta.nome);
          const codigoNormalizado = fruta.codigo ? this.normalizeForSearch(fruta.codigo) : '';
          return nomeNormalizado.includes(normalizedTerm) || codigoNormalizado.includes(normalizedTerm);
        }).slice(0, 3); // Limitar a 3 resultados finais

        frutas.forEach(fruta => {
          suggestions.push({
            type: 'fruta',
            label: 'Fruta',
            value: fruta.nome,
            icon: '🍎',
            color: '#f5222d',
            description: `${fruta.nome}${fruta.cultura ? ` (${fruta.cultura.descricao})` : ''} - ${fruta._count.frutasPedidos} pedidos`,
            metadata: {
              id: fruta.id,
              codigo: fruta.codigo,
              culturaDescricao: fruta.cultura?.descricao,
              totalPedidos: fruta._count.frutasPedidos
            }
          });
        });
      }

      // 8b. Buscar por cultura (descrição) - ignorando acentos
      if (term.length >= 2) {
        // Buscar mais resultados para filtrar por acentos
        const culturasRaw = await this.prisma.cultura.findMany({
          select: {
            id: true,
            descricao: true,
            _count: {
              select: { frutas: true }
            }
          },
          take: 10, // Buscar mais para filtrar depois
          orderBy: { descricao: 'asc' }
        });

        // Filtrar culturas que correspondem ao termo normalizado (sem acentos)
        const culturas = culturasRaw.filter(cultura => {
          const descricaoNormalizada = this.normalizeForSearch(cultura.descricao);
          return descricaoNormalizada.includes(normalizedTerm);
        }).slice(0, 3); // Limitar a 3 resultados finais

        culturas.forEach(cultura => {
          suggestions.push({
            type: 'cultura',
            label: 'Cultura',
            value: cultura.descricao,
            icon: '🌱',
            color: '#13c2c2',
            description: `${cultura.descricao} - ${cultura._count.frutas} frutas cadastradas`,
            metadata: {
              id: cultura.id,
              totalFrutas: cultura._count.frutas
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

      // 10. Buscar por NF da indústria (indNumeroNf) - busca parcial
      if (/^\d+/.test(term)) {
        // Buscar todos os pedidos com NF da indústria e filtrar por correspondência parcial
        const nfIndustriaRaw = await this.prisma.pedido.findMany({
          where: {
            indNumeroNf: { not: null }
          },
          select: {
            id: true,
            numeroPedido: true,
            indNumeroNf: true,
            status: true,
            cliente: {
              select: { nome: true, industria: true }
            }
          },
          take: 50, // Buscar mais para filtrar depois
          orderBy: { updatedAt: 'desc' }
        });

        // Filtrar por correspondência parcial (o número da NF contém o termo digitado)
        const nfIndustria = nfIndustriaRaw.filter(pedido => {
          if (!pedido.indNumeroNf) return false;
          return pedido.indNumeroNf.toString().includes(term);
        }).slice(0, 3); // Limitar a 3 resultados

        nfIndustria.forEach(pedido => {
          if (pedido.indNumeroNf) {
            suggestions.push({
              type: 'indNumeroNf',
              label: 'NF Indústria',
              value: pedido.indNumeroNf.toString(),
              icon: '📄',
              color: '#722ed1',
              description: `NF Indústria #${pedido.indNumeroNf} - ${pedido.numeroPedido} - ${pedido.cliente.nome}`,
              metadata: {
                id: pedido.id,
                numeroPedido: pedido.numeroPedido,
                status: pedido.status,
                clienteNome: pedido.cliente.nome,
                indNumeroNf: pedido.indNumeroNf
              }
            });
          }
        });
      }

      // 11. Buscar por nossa NF (numeroNf) - busca parcial
      if (/^\d+/.test(term)) {
        // Buscar todos os pedidos com nossa NF e filtrar por correspondência parcial
        const nfNossaRaw = await this.prisma.pedido.findMany({
          where: {
            numeroNf: { not: null }
          },
          select: {
            id: true,
            numeroPedido: true,
            numeroNf: true,
            status: true,
            cliente: {
              select: { nome: true }
            }
          },
          take: 50, // Buscar mais para filtrar depois
          orderBy: { updatedAt: 'desc' }
        });

        // Filtrar por correspondência parcial (o número da NF contém o termo digitado)
        const nfNossa = nfNossaRaw.filter(pedido => {
          if (!pedido.numeroNf) return false;
          return pedido.numeroNf.toString().includes(term);
        }).slice(0, 3); // Limitar a 3 resultados

        nfNossa.forEach(pedido => {
          if (pedido.numeroNf) {
            suggestions.push({
              type: 'numeroNf',
              label: 'NF Pedido',
              value: pedido.numeroNf.toString(),
              icon: '📋',
              color: '#1890ff',
              description: `NF Pedido #${pedido.numeroNf} - ${pedido.numeroPedido} - ${pedido.cliente.nome}`,
              metadata: {
                id: pedido.id,
                numeroPedido: pedido.numeroPedido,
                status: pedido.status,
                clienteNome: pedido.cliente.nome,
                numeroNf: pedido.numeroNf
              }
            });
          }
        });
      }

      // Remover duplicatas e limitar resultados
      const uniqueSuggestions = suggestions.filter((suggestion, index, self) => {
        const suggestionKey = `${suggestion.type}-${suggestion.metadata?.id ?? suggestion.value}`;
        return (
          index ===
          self.findIndex((s) => {
            const key = `${s.type}-${s.metadata?.id ?? s.value}`;
            return key === suggestionKey;
          })
        );
      });

      const typePriority = [
        'numero',
        'cliente',
        'turma',
        'motorista',
        'placa',
        'vale',
        'fornecedor',
        'area',
        'fruta',
        'cultura',
        'pesagem',
        'numeroNf',
        'indNumeroNf',
      ];

      const orderedSuggestions = uniqueSuggestions.sort((a, b) => {
        const indexA = typePriority.indexOf(a.type);
        const indexB = typePriority.indexOf(b.type);
        const priorityA = indexA === -1 ? Number.MAX_SAFE_INTEGER : indexA;
        const priorityB = indexB === -1 ? Number.MAX_SAFE_INTEGER : indexB;

        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }

        return a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' });
      });

      return orderedSuggestions.slice(0, 10); // Máximo 10 sugestões

    } catch (error) {
      console.error('Erro na busca inteligente:', error);
      return [];
    }
  }

}
