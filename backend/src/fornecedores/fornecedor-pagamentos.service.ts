import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFornecedorPagamentoDto, UpdateFornecedorPagamentoDto, FornecedorPagamentoResponseDto, CreateManyFornecedorPagamentoDto } from './dto';
import { StatusPagamentoFornecedor } from '@prisma/client';

@Injectable()
export class FornecedorPagamentosService {
  constructor(private readonly prisma: PrismaService) {}

  // Função auxiliar para gerar data com horário fixo (meio-dia)
  private gerarDataComHorarioFixo(data?: Date): Date {
    const dataBase = data || new Date();
    const dataAjustada = new Date(dataBase);
    dataAjustada.setHours(12, 0, 0, 0);
    return dataAjustada;
  }

  // Função auxiliar para converter null para undefined
  private convertNullToUndefined(obj: any): any {
    if (obj === null) return undefined;
    if (typeof obj === 'object') {
      const converted = { ...obj };
      for (const key in converted) {
        if (converted[key] === null) {
          converted[key] = undefined;
        }
      }
      return converted;
    }
    return obj;
  }

  // Função auxiliar para mapear pagamento para DTO de resposta
  private mapToResponseDto(pagamento: any): FornecedorPagamentoResponseDto {
    return {
      id: pagamento.id,
      fornecedorId: pagamento.fornecedorId,
      areaFornecedorId: pagamento.areaFornecedorId,
      pedidoId: pagamento.pedidoId,
      frutaId: pagamento.frutaId,
      frutaPedidoId: pagamento.frutaPedidoId,
      frutaPedidoAreaId: pagamento.frutaPedidoAreaId,
      quantidade: pagamento.quantidade,
      unidadeMedida: pagamento.unidadeMedida,
      valorUnitario: pagamento.valorUnitario,
      valorTotal: pagamento.valorTotal,
      dataColheita: pagamento.dataColheita || undefined,
      status: pagamento.status,
      dataPagamento: pagamento.dataPagamento,
      formaPagamento: pagamento.formaPagamento,
      observacoes: pagamento.observacoes || undefined,
      createdAt: pagamento.createdAt,
      updatedAt: pagamento.updatedAt,
      fornecedor: pagamento.fornecedor ? {
        id: pagamento.fornecedor.id,
        nome: pagamento.fornecedor.nome,
        cnpj: pagamento.fornecedor.cnpj || undefined,
        cpf: pagamento.fornecedor.cpf || undefined,
      } : undefined,
      areaFornecedor: pagamento.areaFornecedor ? {
        id: pagamento.areaFornecedor.id,
        nome: pagamento.areaFornecedor.nome,
      } : undefined,
      pedido: pagamento.pedido ? {
        id: pagamento.pedido.id,
        numeroPedido: pagamento.pedido.numeroPedido,
        cliente: {
          nome: pagamento.pedido.cliente.nome,
          razaoSocial: pagamento.pedido.cliente.razaoSocial || undefined,
        },
      } : undefined,
      fruta: pagamento.fruta ? {
        id: pagamento.fruta.id,
        nome: pagamento.fruta.nome,
      } : undefined,
    };
  }

  /**
   * Criar um novo pagamento de fornecedor
   * Pagamento é criado já com status = PAGO
   */
  async create(fornecedorId: number, dto: CreateFornecedorPagamentoDto): Promise<FornecedorPagamentoResponseDto> {
    // Validar que o fornecedor existe
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id: fornecedorId },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // Validar que a área pertence ao fornecedor
    const areaFornecedor = await this.prisma.areaFornecedor.findFirst({
      where: {
        id: dto.areaFornecedorId,
        fornecedorId: fornecedorId,
      },
    });

    if (!areaFornecedor) {
      throw new NotFoundException('Área do fornecedor não encontrada ou não pertence ao fornecedor');
    }

    // Validar que o pedido existe
    const pedido = await this.prisma.pedido.findUnique({
      where: { id: dto.pedidoId },
    });

    if (!pedido) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Validar que a fruta existe
    const fruta = await this.prisma.fruta.findUnique({
      where: { id: dto.frutaId },
    });

    if (!fruta) {
      throw new NotFoundException('Fruta não encontrada');
    }

    // Validar que FrutasPedidos existe
    const frutaPedido = await this.prisma.frutasPedidos.findFirst({
      where: {
        id: dto.frutaPedidoId,
        pedidoId: dto.pedidoId,
        frutaId: dto.frutaId,
      },
    });

    if (!frutaPedido) {
      throw new NotFoundException('Relação fruta-pedido não encontrada');
    }

    // Validar que FrutasPedidosAreas existe e tem areaFornecedorId não null
    const frutaPedidoArea = await this.prisma.frutasPedidosAreas.findFirst({
      where: {
        id: dto.frutaPedidoAreaId,
        frutaPedidoId: dto.frutaPedidoId,
        areaFornecedorId: dto.areaFornecedorId,
      },
    });

    if (!frutaPedidoArea) {
      throw new NotFoundException('Relação área não encontrada ou não pertence à área do fornecedor');
    }

    if (!frutaPedidoArea.areaFornecedorId) {
      throw new BadRequestException('A área não é de fornecedor');
    }

    // Validar que não existe pagamento duplicado
    const pagamentoExistente = await this.prisma.fornecedorPagamento.findUnique({
      where: {
        frutaPedidoAreaId_pedidoId_frutaId: {
          frutaPedidoAreaId: dto.frutaPedidoAreaId,
          pedidoId: dto.pedidoId,
          frutaId: dto.frutaId,
        },
      },
    });

    if (pagamentoExistente) {
      throw new ConflictException('Já existe um pagamento para esta combinação de área, pedido e fruta');
    }

    // Validar data de pagamento (não pode ser futura)
    const dataPagamento = new Date(dto.dataPagamento);
    if (Number.isNaN(dataPagamento.getTime())) {
      throw new BadRequestException('Data de pagamento inválida');
    }

    const limite = new Date();
    limite.setHours(23, 59, 59, 999);

    if (dataPagamento.getTime() > limite.getTime()) {
      throw new BadRequestException('Data de pagamento não pode ser futura');
    }

    const dataPagamentoAjustada = this.gerarDataComHorarioFixo(dataPagamento);

    // Calcular valorTotal se não informado
    let valorTotal = dto.valorTotal;
    if (!valorTotal || valorTotal === 0) {
      valorTotal = dto.quantidade * dto.valorUnitario;
    }

    // Preparar data de colheita
    let dataColheita: Date | undefined;
    if (dto.dataColheita) {
      const dataColheitaInformada = new Date(dto.dataColheita);
      if (!Number.isNaN(dataColheitaInformada.getTime())) {
        dataColheita = this.gerarDataComHorarioFixo(dataColheitaInformada);
      }
    } else if (pedido.dataColheita) {
      dataColheita = pedido.dataColheita;
    }

    // Criar pagamento (status padrão: PAGO, mas pode ser informado)
    const statusPagamento = dto.status || StatusPagamentoFornecedor.PAGO;
    const pagamento = await this.prisma.fornecedorPagamento.create({
      data: {
        fornecedorId: fornecedorId,
        areaFornecedorId: dto.areaFornecedorId,
        pedidoId: dto.pedidoId,
        frutaId: dto.frutaId,
        frutaPedidoId: dto.frutaPedidoId,
        frutaPedidoAreaId: dto.frutaPedidoAreaId,
        quantidade: dto.quantidade,
        unidadeMedida: dto.unidadeMedida,
        valorUnitario: dto.valorUnitario,
        valorTotal: valorTotal,
        dataColheita: dataColheita,
        status: statusPagamento,
        dataPagamento: dataPagamentoAjustada,
        formaPagamento: dto.formaPagamento,
        observacoes: dto.observacoes,
      },
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        areaFornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
        pedido: {
          select: {
            id: true,
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
            id: true,
            nome: true,
          },
        },
      },
    });

    return this.mapToResponseDto(pagamento);
  }

  /**
   * Criar múltiplos pagamentos de uma vez
   */
  async createMany(fornecedorId: number, dto: CreateManyFornecedorPagamentoDto): Promise<FornecedorPagamentoResponseDto[]> {
    // Validar que o fornecedor existe
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id: fornecedorId },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // Validar que todos os pagamentos pertencem ao fornecedor
    for (const pagamentoDto of dto.pagamentos) {
      if (pagamentoDto.fornecedorId !== fornecedorId) {
        throw new BadRequestException('Todos os pagamentos devem pertencer ao mesmo fornecedor');
      }
    }

    // Criar todos os pagamentos em transação
    const pagamentos = await this.prisma.$transaction(
      async (prisma) => {
        const pagamentosCriados: FornecedorPagamentoResponseDto[] = [];

        for (const pagamentoDto of dto.pagamentos) {
          // Validar cada pagamento (mesmas validações do create)
          const areaFornecedor = await prisma.areaFornecedor.findFirst({
            where: {
              id: pagamentoDto.areaFornecedorId,
              fornecedorId: fornecedorId,
            },
          });

          if (!areaFornecedor) {
            throw new NotFoundException(`Área do fornecedor ${pagamentoDto.areaFornecedorId} não encontrada`);
          }

          const pedido = await prisma.pedido.findUnique({
            where: { id: pagamentoDto.pedidoId },
          });

          if (!pedido) {
            throw new NotFoundException(`Pedido ${pagamentoDto.pedidoId} não encontrado`);
          }

          const frutaPedidoArea = await prisma.frutasPedidosAreas.findFirst({
            where: {
              id: pagamentoDto.frutaPedidoAreaId,
              frutaPedidoId: pagamentoDto.frutaPedidoId,
              areaFornecedorId: pagamentoDto.areaFornecedorId,
            },
          });

          if (!frutaPedidoArea || !frutaPedidoArea.areaFornecedorId) {
            throw new NotFoundException(`Relação área ${pagamentoDto.frutaPedidoAreaId} não encontrada ou não é de fornecedor`);
          }

          // Validar que não existe pagamento duplicado
          const pagamentoExistente = await prisma.fornecedorPagamento.findUnique({
            where: {
              frutaPedidoAreaId_pedidoId_frutaId: {
                frutaPedidoAreaId: pagamentoDto.frutaPedidoAreaId,
                pedidoId: pagamentoDto.pedidoId,
                frutaId: pagamentoDto.frutaId,
              },
            },
          });

          if (pagamentoExistente) {
            throw new ConflictException(`Já existe pagamento para área ${pagamentoDto.frutaPedidoAreaId}, pedido ${pagamentoDto.pedidoId}, fruta ${pagamentoDto.frutaId}`);
          }

          // Validar data de pagamento
          const dataPagamento = new Date(pagamentoDto.dataPagamento);
          if (Number.isNaN(dataPagamento.getTime())) {
            throw new BadRequestException(`Data de pagamento inválida para pagamento ${pagamentoDto.frutaPedidoAreaId}`);
          }

          const limite = new Date();
          limite.setHours(23, 59, 59, 999);

          if (dataPagamento.getTime() > limite.getTime()) {
            throw new BadRequestException(`Data de pagamento não pode ser futura para pagamento ${pagamentoDto.frutaPedidoAreaId}`);
          }

          const dataPagamentoAjustada = this.gerarDataComHorarioFixo(dataPagamento);

          // Calcular valorTotal se não informado
          let valorTotal = pagamentoDto.valorTotal;
          if (!valorTotal || valorTotal === 0) {
            valorTotal = pagamentoDto.quantidade * pagamentoDto.valorUnitario;
          }

          // Preparar data de colheita
          let dataColheita: Date | undefined;
          if (pagamentoDto.dataColheita) {
            const dataColheitaInformada = new Date(pagamentoDto.dataColheita);
            if (!Number.isNaN(dataColheitaInformada.getTime())) {
              dataColheita = this.gerarDataComHorarioFixo(dataColheitaInformada);
            }
          } else if (pedido.dataColheita) {
            dataColheita = pedido.dataColheita;
          }

          // Criar pagamento (status padrão: PAGO, mas pode ser informado)
          const statusPagamento = pagamentoDto.status || StatusPagamentoFornecedor.PAGO;
          const pagamento = await prisma.fornecedorPagamento.create({
            data: {
              fornecedorId: fornecedorId,
              areaFornecedorId: pagamentoDto.areaFornecedorId,
              pedidoId: pagamentoDto.pedidoId,
              frutaId: pagamentoDto.frutaId,
              frutaPedidoId: pagamentoDto.frutaPedidoId,
              frutaPedidoAreaId: pagamentoDto.frutaPedidoAreaId,
              quantidade: pagamentoDto.quantidade,
              unidadeMedida: pagamentoDto.unidadeMedida,
              valorUnitario: pagamentoDto.valorUnitario,
              valorTotal: valorTotal,
              dataColheita: dataColheita,
              status: statusPagamento,
              dataPagamento: dataPagamentoAjustada,
              formaPagamento: pagamentoDto.formaPagamento,
              observacoes: pagamentoDto.observacoes,
            },
            include: {
              fornecedor: {
                select: {
                  id: true,
                  nome: true,
                  cnpj: true,
                  cpf: true,
                },
              },
              areaFornecedor: {
                select: {
                  id: true,
                  nome: true,
                },
              },
              pedido: {
                select: {
                  id: true,
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
                  id: true,
                  nome: true,
                },
              },
            },
          });

          pagamentosCriados.push(this.mapToResponseDto(pagamento));
        }

        return pagamentosCriados;
      },
      {
        timeout: 30000, // 30 segundos de timeout
      }
    );

    return pagamentos;
  }

  /**
   * Listar pagamentos com filtros
   */
  async findAll(fornecedorId: number, filters?: {
    pedidoId?: number;
    frutaId?: number;
    status?: StatusPagamentoFornecedor;
  }): Promise<FornecedorPagamentoResponseDto[]> {
    const where: any = {
      fornecedorId: fornecedorId,
    };

    if (filters?.pedidoId) {
      where.pedidoId = filters.pedidoId;
    }

    if (filters?.frutaId) {
      where.frutaId = filters.frutaId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    const pagamentos = await this.prisma.fornecedorPagamento.findMany({
      where,
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        areaFornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
        pedido: {
          select: {
            id: true,
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
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return pagamentos.map(p => this.mapToResponseDto(p));
  }

  /**
   * Buscar um pagamento específico
   */
  async findOne(fornecedorId: number, id: number): Promise<FornecedorPagamentoResponseDto> {
    const pagamento = await this.prisma.fornecedorPagamento.findFirst({
      where: {
        id: id,
        fornecedorId: fornecedorId,
      },
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        areaFornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
        pedido: {
          select: {
            id: true,
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
            id: true,
            nome: true,
          },
        },
      },
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    return this.mapToResponseDto(pagamento);
  }

  /**
   * Atualizar um pagamento
   * Limitado - não permite alterar valores ou status de pagamentos já pagos
   */
  async update(fornecedorId: number, id: number, dto: UpdateFornecedorPagamentoDto): Promise<FornecedorPagamentoResponseDto> {
    const pagamento = await this.prisma.fornecedorPagamento.findFirst({
      where: {
        id: id,
        fornecedorId: fornecedorId,
      },
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Se o pagamento está pago, apenas permitir atualizar observações
    if (pagamento.status === StatusPagamentoFornecedor.PAGO) {
      if (dto.valorUnitario !== undefined || dto.valorTotal !== undefined || 
          dto.quantidade !== undefined || dto.dataPagamento !== undefined || 
          dto.formaPagamento !== undefined || dto.status !== undefined) {
        throw new BadRequestException('Não é possível alterar valores, quantidade, data pagamento, forma pagamento ou status de um pagamento já pago. Apenas observações podem ser alteradas.');
      }
    }

    // Preparar dados para atualização
    const updateData: any = {};

    if (dto.observacoes !== undefined) {
      updateData.observacoes = dto.observacoes;
    }

    // Se não está pago, permitir atualizar outros campos
    if (pagamento.status !== StatusPagamentoFornecedor.PAGO) {
      if (dto.quantidade !== undefined) {
        updateData.quantidade = dto.quantidade;
      }

      if (dto.unidadeMedida !== undefined) {
        updateData.unidadeMedida = dto.unidadeMedida;
      }

      if (dto.valorUnitario !== undefined) {
        updateData.valorUnitario = dto.valorUnitario;
      }

      if (dto.valorTotal !== undefined) {
        updateData.valorTotal = dto.valorTotal;
      } else if (dto.valorUnitario !== undefined && dto.quantidade !== undefined) {
        // Recalcular valorTotal se quantidade ou valorUnitario mudaram
        updateData.valorTotal = (dto.quantidade || pagamento.quantidade) * dto.valorUnitario;
      } else if (dto.valorUnitario !== undefined) {
        updateData.valorTotal = pagamento.quantidade * dto.valorUnitario;
      } else if (dto.quantidade !== undefined) {
        updateData.valorTotal = dto.quantidade * pagamento.valorUnitario;
      }

      if (dto.dataColheita !== undefined) {
        if (dto.dataColheita) {
          const dataColheitaInformada = new Date(dto.dataColheita);
          if (!Number.isNaN(dataColheitaInformada.getTime())) {
            updateData.dataColheita = this.gerarDataComHorarioFixo(dataColheitaInformada);
          }
        } else {
          updateData.dataColheita = null;
        }
      }

      if (dto.dataPagamento !== undefined) {
        const dataPagamento = new Date(dto.dataPagamento);
        if (Number.isNaN(dataPagamento.getTime())) {
          throw new BadRequestException('Data de pagamento inválida');
        }

        const limite = new Date();
        limite.setHours(23, 59, 59, 999);

        if (dataPagamento.getTime() > limite.getTime()) {
          throw new BadRequestException('Data de pagamento não pode ser futura');
        }

        updateData.dataPagamento = this.gerarDataComHorarioFixo(dataPagamento);
      }

      if (dto.formaPagamento !== undefined) {
        updateData.formaPagamento = dto.formaPagamento;
      }

      if (dto.status !== undefined) {
        // Permitir atualizar status (já validado que não está PAGO no início)
        updateData.status = dto.status;
      }
    }

    const pagamentoAtualizado = await this.prisma.fornecedorPagamento.update({
      where: { id: id },
      data: updateData,
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        areaFornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
        pedido: {
          select: {
            id: true,
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
            id: true,
            nome: true,
          },
        },
      },
    });

    return this.mapToResponseDto(pagamentoAtualizado);
  }

  /**
   * Deletar um pagamento
   * Por enquanto, não permitir deletar pagamentos (manter histórico)
   */
  async delete(fornecedorId: number, id: number): Promise<void> {
    const pagamento = await this.prisma.fornecedorPagamento.findFirst({
      where: {
        id: id,
        fornecedorId: fornecedorId,
      },
    });

    if (!pagamento) {
      throw new NotFoundException('Pagamento não encontrado');
    }

    // Não permitir deletar pagamentos pagos
    if (pagamento.status === StatusPagamentoFornecedor.PAGO) {
      throw new BadRequestException('Não é possível deletar um pagamento já pago. Mantenha o histórico.');
    }

    // Não permitir deletar pagamentos em processamento
    if (pagamento.status === StatusPagamentoFornecedor.PROCESSANDO) {
      throw new BadRequestException('Não é possível deletar um pagamento em processamento');
    }

    // Por enquanto, não permitir deletar (manter histórico)
    throw new BadRequestException('Deleção de pagamentos não é permitida. Mantenha o histórico.');
  }

  /**
   * Buscar pagamentos efetuados de um fornecedor
   */
  async getPagamentosEfetuados(fornecedorId: number): Promise<FornecedorPagamentoResponseDto[]> {
    const pagamentos = await this.prisma.fornecedorPagamento.findMany({
      where: {
        fornecedorId: fornecedorId,
        status: StatusPagamentoFornecedor.PAGO,
      },
      include: {
        fornecedor: {
          select: {
            id: true,
            nome: true,
            cnpj: true,
            cpf: true,
          },
        },
        areaFornecedor: {
          select: {
            id: true,
            nome: true,
          },
        },
        pedido: {
          select: {
            id: true,
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
            id: true,
            nome: true,
          },
        },
      },
      orderBy: {
        dataPagamento: 'desc',
      },
    });

    return pagamentos.map(p => this.mapToResponseDto(p));
  }

  /**
   * Buscar detalhes de colheitas e pagamentos de um fornecedor
   * Endpoint especial para o modal do frontend
   */
  async getColheitasPagamentos(fornecedorId: number): Promise<{
    fornecedor: {
      id: number;
      nome: string;
      cnpj?: string | null;
      cpf?: string | null;
    };
    colheitas: Array<{
      pedidoId: number;
      pedidoNumero: string;
      cliente: string;
      frutaId: number;
      fruta: string;
      areaNome: string;
      quantidade: number;
      unidade: string;
      valorProporcional: number;
      valorTotalFruta: number;
      statusPedido: string;
      dataColheita?: Date;
      frutaPedidoId: number;
      frutaPedidoAreaId: number;
      pagamentoId?: number;
      valorUnitario?: number;
      valorTotal?: number;
      dataPagamento?: Date;
      formaPagamento?: string;
    }>;
    pagamentosEfetuados: FornecedorPagamentoResponseDto[];
    resumo: {
      totalColheitas: number;
      colheitasPagas: number;
      colheitasEmAberto: number;
      totalPago: number;
      quantidadePedidos: number;
      quantidadeFrutas: number;
      quantidadeAreas: number;
      distribuicaoPorUnidade: Array<{
        unidade: string;
        quantidadePaga: number;
        quantidadePendente: number;
        quantidadeTotal: number;
        valorPago: number;
        valorPendente: number;
        valorTotal: number;
      }>;
    };
  }> {
    // Validar que o fornecedor existe
    const fornecedor = await this.prisma.fornecedor.findUnique({
      where: { id: fornecedorId },
      select: {
        id: true,
        nome: true,
        cnpj: true,
        cpf: true,
      },
    });

    if (!fornecedor) {
      throw new NotFoundException('Fornecedor não encontrado');
    }

    // Buscar áreas do fornecedor com colheitas
    const areas = await this.prisma.areaFornecedor.findMany({
      where: { fornecedorId: fornecedorId },
      include: {
        frutasPedidosAreas: {
          where: {
            areaFornecedorId: { not: null },
          },
          include: {
            frutaPedido: {
              include: {
                fruta: {
                  select: {
                    id: true,
                    nome: true,
                  },
                },
                pedido: {
                  select: {
                    id: true,
                    numeroPedido: true,
                    status: true,
                    dataColheita: true,
                    cliente: {
                      select: {
                        nome: true,
                        razaoSocial: true,
                      },
                    },
                  },
                },
                areas: {
                  select: {
                    id: true,
                    areaFornecedorId: true,
                    quantidadeColhidaUnidade1: true,
                    quantidadeColhidaUnidade2: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Buscar pagamentos efetuados
    const pagamentosEfetuados = await this.getPagamentosEfetuados(fornecedorId);
    const pagamentosMap = new Map<number, FornecedorPagamentoResponseDto>();
    pagamentosEfetuados.forEach(p => {
      pagamentosMap.set(p.frutaPedidoAreaId, p);
    });

    // Processar colheitas
    const colheitas: Array<{
      pedidoId: number;
      pedidoNumero: string;
      cliente: string;
      frutaId: number;
      fruta: string;
      areaNome: string;
      quantidade: number;
      unidade: string;
      valorProporcional: number;
      valorTotalFruta: number;
      statusPedido: string;
      dataColheita?: Date;
      frutaPedidoId: number;
      frutaPedidoAreaId: number;
      pagamentoId?: number;
      valorUnitario?: number;
      valorTotal?: number;
      dataPagamento?: Date;
      formaPagamento?: string;
    }> = [];

    areas.forEach((area) => {
      area.frutasPedidosAreas.forEach((relacaoArea) => {
        if (!relacaoArea.areaFornecedorId || !relacaoArea.frutaPedido) {
          return;
        }

        const frutaPedido = relacaoArea.frutaPedido;
        const pedido = frutaPedido.pedido;
        if (!pedido) {
          return;
        }

        const clienteNome = pedido.cliente?.razaoSocial || pedido.cliente?.nome || 'Cliente não informado';
        const frutaNome = frutaPedido.fruta?.nome || 'Fruta não identificada';
        const unidade = frutaPedido.unidadeMedida1;

        const quantidadeArea =
          relacaoArea.quantidadeColhidaUnidade1 ??
          relacaoArea.quantidadeColhidaUnidade2 ??
          frutaPedido.quantidadeReal ??
          frutaPedido.quantidadePrecificada ??
          frutaPedido.quantidadePrevista ??
          0;

        const somaAreasRelacionadas = frutaPedido.areas.reduce((acc, areaRelacionada) => {
          const quantidadeRelacionada =
            areaRelacionada.quantidadeColhidaUnidade1 ??
            areaRelacionada.quantidadeColhidaUnidade2 ??
            0;
          return acc + quantidadeRelacionada;
        }, 0);

        const quantidadeReferencia =
          (frutaPedido.quantidadeReal ?? frutaPedido.quantidadePrecificada ?? frutaPedido.quantidadePrevista ?? somaAreasRelacionadas) || 0;

        const valorTotalFruta = frutaPedido.valorTotal ?? 0;
        let valorProporcional = 0;
        if (valorTotalFruta > 0 && quantidadeReferencia > 0) {
          valorProporcional = (valorTotalFruta * quantidadeArea) / quantidadeReferencia;
        }

        // Verificar se existe pagamento para esta colheita
        const pagamento = pagamentosMap.get(relacaoArea.id);

        colheitas.push({
          pedidoId: pedido.id,
          pedidoNumero: pedido.numeroPedido,
          cliente: clienteNome,
          frutaId: frutaPedido.frutaId,
          fruta: frutaNome,
          quantidade: Number(quantidadeArea) || 0,
          unidade,
          valorProporcional: Number(valorProporcional.toFixed(2)),
          valorTotalFruta: Number(valorTotalFruta),
          areaNome: area.nome,
          statusPedido: pedido.status,
          dataColheita: pedido.dataColheita ?? undefined,
          frutaPedidoId: frutaPedido.id,
          frutaPedidoAreaId: relacaoArea.id,
          pagamentoId: pagamento?.id,
          valorUnitario: pagamento?.valorUnitario,
          valorTotal: pagamento?.valorTotal,
          dataPagamento: pagamento?.dataPagamento,
          formaPagamento: pagamento?.formaPagamento,
        });
      });
    });

    // Calcular resumo
    const quantidadePedidos = new Set(colheitas.map((c) => c.pedidoId)).size;
    const quantidadeFrutas = new Set(colheitas.map((c) => c.frutaId)).size;
    const quantidadeAreas = new Set(colheitas.map((c) => c.areaNome)).size;
    const totalPago = pagamentosEfetuados.reduce((acc, p) => acc + (p.valorTotal || 0), 0);
    
    // Calcular colheitas pagas e em aberto
    const colheitasPagas = colheitas.filter(c => c.pagamentoId !== undefined).length;
    const colheitasEmAberto = colheitas.filter(c => c.pagamentoId === undefined).length;
    
    // Calcular distribuição por unidade (pago, pendente, total)
    const distribuicaoPorUnidade = new Map<string, {
      unidade: string;
      quantidadePaga: number;
      quantidadePendente: number;
      quantidadeTotal: number;
      valorPago: number;
      valorPendente: number;
      valorTotal: number;
    }>();
    
    colheitas.forEach((colheita) => {
      const unidade = colheita.unidade || 'UN';
      if (!distribuicaoPorUnidade.has(unidade)) {
        distribuicaoPorUnidade.set(unidade, {
          unidade,
          quantidadePaga: 0,
          quantidadePendente: 0,
          quantidadeTotal: 0,
          valorPago: 0,
          valorPendente: 0,
          valorTotal: 0,
        });
      }
      
      const distribuicao = distribuicaoPorUnidade.get(unidade)!;
      distribuicao.quantidadeTotal += colheita.quantidade || 0;
      distribuicao.valorTotal += colheita.valorProporcional || 0;
      
      if (colheita.pagamentoId !== undefined) {
        // Colheita paga - usar valorTotal do pagamento se disponível, senão usar valorProporcional
        distribuicao.quantidadePaga += colheita.quantidade || 0;
        // Para colheitas pagas, usar o valorTotal do pagamento (que é o valor informado pelo usuário)
        distribuicao.valorPago += colheita.valorTotal || colheita.valorProporcional || 0;
      } else {
        // Colheita pendente - usar valorProporcional (valor ainda não foi informado)
        distribuicao.quantidadePendente += colheita.quantidade || 0;
        distribuicao.valorPendente += colheita.valorProporcional || 0;
      }
    });
    
    const distribuicaoPorUnidadeArray = Array.from(distribuicaoPorUnidade.values()).map(d => ({
      ...d,
      quantidadePaga: Number(d.quantidadePaga.toFixed(2)),
      quantidadePendente: Number(d.quantidadePendente.toFixed(2)),
      quantidadeTotal: Number(d.quantidadeTotal.toFixed(2)),
      valorPago: Number(d.valorPago.toFixed(2)),
      valorPendente: Number(d.valorPendente.toFixed(2)),
      valorTotal: Number(d.valorTotal.toFixed(2)),
    }));

    return {
      fornecedor: {
        id: fornecedor.id,
        nome: fornecedor.nome,
        cnpj: fornecedor.cnpj || undefined,
        cpf: fornecedor.cpf || undefined,
      },
      colheitas,
      pagamentosEfetuados,
      resumo: {
        totalColheitas: colheitas.length,
        colheitasPagas,
        colheitasEmAberto,
        totalPago: Number(totalPago.toFixed(2)),
        quantidadePedidos,
        quantidadeFrutas,
        quantidadeAreas,
        distribuicaoPorUnidade: distribuicaoPorUnidadeArray,
      },
    };
  }
}

