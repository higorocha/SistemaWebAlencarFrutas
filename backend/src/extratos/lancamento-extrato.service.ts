import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ExtratosService } from './extratos.service';
import { ContaCorrenteService } from '../conta-corrente/conta-corrente.service';
import {
  CreateLancamentoExtratoDto,
  UpdateLancamentoExtratoDto,
  VincularLancamentoPedidoDto,
  QueryLancamentoExtratoDto,
  LancamentoExtratoResponseDto,
  BuscarProcessarExtratosDto,
  BuscarProcessarExtratosResponseDto,
  BuscarProcessarExtratosTodosClientesDto,
} from './dto/lancamento-extrato.dto';
import {
  VincularLancamentoPedidosDto,
  UpdateLancamentoExtratoPedidoDto,
  LancamentoExtratoPedidoResponseDto,
} from './dto/lancamento-extrato-pedido.dto';
import { Prisma, TipoOperacaoExtrato } from '@prisma/client';

const baseLancamentoInclude = Prisma.validator<Prisma.LancamentoExtratoInclude>()({
  cliente: {
    select: {
      id: true,
      nome: true,
      cnpj: true,
      cpf: true,
    },
  },
  pedido: {
    select: {
      id: true,
      numeroPedido: true,
      valorFinal: true,
      status: true,
      clienteId: true,
    },
  },
  vinculos: {
    include: {
      pedido: {
        select: {
          id: true,
          numeroPedido: true,
          valorFinal: true,
          status: true,
          clienteId: true,
        },
      },
    },
    orderBy: {
      createdAt: Prisma.SortOrder.asc,
    },
  },
});

type LancamentoWithRelations = Prisma.LancamentoExtratoGetPayload<{ include: typeof baseLancamentoInclude }>;

@Injectable()
export class LancamentoExtratoService {
  private readonly descricoesCreditoIgnorar = new Set<string>([
    'LIMITE DISPONIVEL',
    'LIMITE CONTRATADO',
    'SALDO DO DIA',
    'SALDO ANTERIOR',
    'SALDO DISPONIVEL',
    'Saldo Atual',
    'SALDO ATUAL',
    'S A L D O',
    'INVEST. RESGATE AUTOM',
    'BB RENDE FÁCIL',
  ]);
  private readonly VALOR_TOLERANCIA = 0.009;
  private readonly lancamentoInclude = baseLancamentoInclude;
  constructor(
    private prisma: PrismaService,
    private extratosService: ExtratosService,
    private contaCorrenteService: ContaCorrenteService
  ) {}

  /**
   * Cria um novo lançamento de extrato
   */
  async create(createDto: CreateLancamentoExtratoDto): Promise<LancamentoExtratoResponseDto> {
    const clienteIdInformado = createDto.clienteId ?? null;

    if (clienteIdInformado !== null) {
      const clienteExistente = await this.prisma.cliente.findUnique({
        where: { id: clienteIdInformado },
      });

      if (!clienteExistente) {
        throw new NotFoundException(`Cliente com ID ${clienteIdInformado} não encontrado`);
      }
    }

    let pedido: { id: number; clienteId: number } | null = null;
    if (createDto.pedidoId !== undefined && createDto.pedidoId !== null) {
      pedido = await this.prisma.pedido.findUnique({
        where: { id: createDto.pedidoId },
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido com ID ${createDto.pedidoId} não encontrado`);
      }

      if (clienteIdInformado !== null && pedido.clienteId !== clienteIdInformado) {
        throw new BadRequestException('O pedido não pertence ao cliente especificado');
      }
    }

    // Converter dataLancamento de string para Date
    const dataLancamento = new Date(createDto.dataLancamento);

    // Preparar dados para criação
    const clienteIdParaSalvar =
      clienteIdInformado !== null ? clienteIdInformado : (pedido?.clienteId ?? null);

    const dataToCreate: any = {
      ...createDto,
      dataLancamento,
      // Converter BigInt se necessário
      dataLancamentoRaw: createDto.dataLancamentoRaw ? BigInt(createDto.dataLancamentoRaw) : null,
      dataMovimento: createDto.dataMovimento ? BigInt(createDto.dataMovimento) : null,
      codigoAgenciaOrigem: createDto.codigoAgenciaOrigem ? BigInt(createDto.codigoAgenciaOrigem) : null,
      numeroLote: createDto.numeroLote ? BigInt(createDto.numeroLote) : null,
      codigoBancoContrapartida: createDto.codigoBancoContrapartida ? BigInt(createDto.codigoBancoContrapartida) : null,
      codigoAgenciaContrapartida: createDto.codigoAgenciaContrapartida ? BigInt(createDto.codigoAgenciaContrapartida) : null,
      processado: createDto.processado ?? false,
      vinculadoPedido: createDto.vinculadoPedido ?? false,
      vinculadoPagamento: createDto.vinculadoPagamento ?? false,
      vinculacaoAutomatica: createDto.vinculacaoAutomatica ?? false,
      valorDisponivel: createDto.valorDisponivel ?? createDto.valorLancamento,
      valorVinculadoTotal: createDto.valorVinculadoTotal ?? 0,
      estaLiquidado: createDto.estaLiquidado ?? false,
    };

    dataToCreate.clienteId = clienteIdParaSalvar;

    // Remover campos undefined
    Object.keys(dataToCreate).forEach(key => {
      if (dataToCreate[key] === undefined) {
        delete dataToCreate[key];
      }
    });

    const lancamento = await this.prisma.lancamentoExtrato.create({
      data: dataToCreate,
      include: this.lancamentoInclude,
    });

    return this.formatResponse(lancamento);
  }

  /**
   * Busca todos os lançamentos com filtros opcionais
   */
  async findAll(query?: QueryLancamentoExtratoDto): Promise<LancamentoExtratoResponseDto[]> {
    const where: any = {};

    if (query?.clienteId) {
      where.clienteId = query.clienteId;
    }

    if (query?.pedidoId !== undefined) {
      if (query.pedidoId === null) {
        where.pedidoId = null;
      } else {
        where.pedidoId = query.pedidoId;
      }
    }

    if (query?.dataInicio || query?.dataFim) {
      where.dataLancamento = {};
      if (query.dataInicio) {
        where.dataLancamento.gte = new Date(query.dataInicio);
      }
      if (query.dataFim) {
        const dataFim = new Date(query.dataFim);
        dataFim.setHours(23, 59, 59, 999); // Incluir todo o dia
        where.dataLancamento.lte = dataFim;
      }
    }

    if (query?.tipoOperacao) {
      where.tipoOperacao = query.tipoOperacao;
    }

    if (query?.categoriaOperacao) {
      where.categoriaOperacao = query.categoriaOperacao;
    }

    if (query?.processado !== undefined) {
      where.processado = query.processado;
    }

    if (query?.vinculadoPedido !== undefined) {
      where.vinculadoPedido = query.vinculadoPedido;
    }

    const lancamentos = await this.prisma.lancamentoExtrato.findMany({
      where,
      include: this.lancamentoInclude,
      orderBy: {
        dataLancamento: 'desc',
      },
    });

    return lancamentos.map(l => this.formatResponse(l));
  }

  /**
   * Busca um lançamento por ID
   */
  async findOne(id: bigint): Promise<LancamentoExtratoResponseDto> {
    const lancamento = await this.prisma.lancamentoExtrato.findUnique({
      where: { id },
      include: this.lancamentoInclude,
    });

    if (!lancamento) {
      throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
    }

    return this.formatResponse(lancamento);
  }

  /**
   * Atualiza um lançamento
   */
  async update(
    id: bigint,
    updateDto: UpdateLancamentoExtratoDto,
  ): Promise<LancamentoExtratoResponseDto> {
    // Verificar se o lançamento existe
    const lancamentoExistente = await this.prisma.lancamentoExtrato.findUnique({
      where: { id },
    });

    if (!lancamentoExistente) {
      throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
    }

    let clienteIdParaAtualizar: number | null | undefined = undefined;

    // Verificar se o pedido existe (se fornecido)
    if (updateDto.pedidoId !== undefined && updateDto.pedidoId !== null) {
      const pedido = await this.prisma.pedido.findUnique({
        where: { id: updateDto.pedidoId },
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido com ID ${updateDto.pedidoId} não encontrado`);
      }

      const clienteAtual = lancamentoExistente.clienteId ?? null;

      // Verificar se o pedido pertence ao cliente do lançamento (quando houver cliente definido)
      if (clienteAtual !== null && pedido.clienteId !== clienteAtual) {
        throw new BadRequestException('O pedido não pertence ao cliente do lançamento');
      }

      if (clienteAtual === null) {
        clienteIdParaAtualizar = pedido.clienteId;
      }
    }

    // Preparar dados para atualização
    const dataToUpdate: any = { ...updateDto };

    if (clienteIdParaAtualizar !== undefined) {
      dataToUpdate.clienteId = clienteIdParaAtualizar;
    }

    // Remover campos undefined
    Object.keys(dataToUpdate).forEach(key => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    const lancamento = await this.prisma.lancamentoExtrato.update({
      where: { id },
      data: dataToUpdate,
      include: this.lancamentoInclude,
    });

    return this.formatResponse(lancamento);
  }

  /**
   * Remove um lançamento
   */
  async remove(id: bigint): Promise<void> {
    const lancamento = await this.prisma.lancamentoExtrato.findUnique({
      where: { id },
    });

    if (!lancamento) {
      throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
    }

    await this.prisma.lancamentoExtrato.delete({
      where: { id },
    });
  }

  /**
   * Vincula manualmente um lançamento a um pedido
   */
  async vincularPedido(
    id: bigint,
    vincularDto: VincularLancamentoPedidoDto,
  ): Promise<LancamentoExtratoResponseDto> {
    return this.prisma.$transaction(async tx => {
      const lancamento = await tx.lancamentoExtrato.findUnique({
        where: { id },
      });

      if (!lancamento) {
        throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
      }

      const pedido = await tx.pedido.findUnique({
        where: { id: vincularDto.pedidoId },
        select: {
          id: true,
          clienteId: true,
        },
      });

      if (!pedido) {
        throw new NotFoundException(`Pedido com ID ${vincularDto.pedidoId} não encontrado`);
      }

      const clienteAtual = lancamento.clienteId ?? null;
      if (clienteAtual !== null && pedido.clienteId !== clienteAtual) {
        throw new BadRequestException('O pedido não pertence ao cliente do lançamento');
      }

      const saldoDisponivelBase =
        lancamento.valorDisponivel !== null && lancamento.valorDisponivel !== undefined
          ? Number(lancamento.valorDisponivel)
          : Number(lancamento.valorLancamento);

      const saldoDisponivel = Number(saldoDisponivelBase.toFixed(2));

      if (saldoDisponivel <= this.VALOR_TOLERANCIA) {
        throw new BadRequestException('Este lançamento não possui saldo disponível para vinculação');
      }

      const valorSolicitado = vincularDto.valorVinculado !== undefined
        ? Number(Number(vincularDto.valorVinculado).toFixed(2))
        : saldoDisponivel;

      if (valorSolicitado <= 0) {
        throw new BadRequestException('O valor a ser vinculado deve ser maior que zero');
      }

      if (valorSolicitado - saldoDisponivel > this.VALOR_TOLERANCIA) {
        throw new BadRequestException('O valor informado excede o saldo disponível do lançamento');
      }

      await tx.lancamentoExtrato.update({
        where: { id },
        data: {
          vinculos: {
            create: {
              pedidoId: vincularDto.pedidoId,
              valorVinculado: valorSolicitado,
              vinculacaoAutomatica: false,
              observacoes: vincularDto.observacoes ?? null,
            },
          },
        },
      });

      const options: { observacoes?: string | null; clienteId?: number | null } = {};
      if (vincularDto.observacoes !== undefined) {
        options.observacoes = vincularDto.observacoes;
      }
      if (clienteAtual === null && pedido.clienteId !== null) {
        options.clienteId = pedido.clienteId;
      }

      return this.atualizarSaldosLancamento(id, options, tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Desvincula um lançamento de um pedido
   */
  async desvincularPedido(id: bigint): Promise<LancamentoExtratoResponseDto> {
    return this.prisma.$transaction(async tx => {
      const lancamento = await tx.lancamentoExtrato.findUnique({
        where: { id },
        select: { id: true },
      });

      if (!lancamento) {
        throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
      }

      await tx.lancamentoExtrato.update({
        where: { id },
        data: {
          vinculos: {
            deleteMany: {},
          },
        },
      });

      return this.atualizarSaldosLancamento(id, { observacoes: null }, tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async listarVinculos(id: bigint): Promise<LancamentoExtratoPedidoResponseDto[]> {
    const lancamento = await this.prisma.lancamentoExtrato.findUnique({
      where: { id },
      include: {
        vinculos: {
          include: {
            pedido: {
              select: {
                numeroPedido: true,
              },
            },
          },
          orderBy: {
            createdAt: Prisma.SortOrder.asc,
          },
        },
      },
    });

    if (!lancamento) {
      throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
    }

    return (lancamento.vinculos ?? []).map(vinculo => ({
      id: vinculo.id,
      lancamentoExtratoId: id.toString(),
      pedidoId: vinculo.pedidoId,
      pedidoNumero: vinculo.pedido?.numeroPedido,
      valorVinculado: Number(vinculo.valorVinculado),
      vinculacaoAutomatica: vinculo.vinculacaoAutomatica,
      observacoes: vinculo.observacoes || undefined,
      createdAt: vinculo.createdAt,
      updatedAt: vinculo.updatedAt,
    }));
  }

  async vincularPedidos(
    id: bigint,
    dto: VincularLancamentoPedidosDto,
  ): Promise<LancamentoExtratoResponseDto> {
    if (!dto.itens || dto.itens.length === 0) {
      throw new BadRequestException('Informe ao menos um pedido para vincular');
    }

    return this.prisma.$transaction(async tx => {
      const lancamento = await tx.lancamentoExtrato.findUnique({
        where: { id },
        select: {
          clienteId: true,
          valorDisponivel: true,
          valorLancamento: true,
        },
      });

      if (!lancamento) {
        throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
      }

      const saldoBase =
        lancamento.valorDisponivel !== null && lancamento.valorDisponivel !== undefined
          ? Number(lancamento.valorDisponivel)
          : Number(lancamento.valorLancamento);
      const saldoDisponivel = Number(saldoBase.toFixed(2));

      const itensNormalizados = dto.itens.map(item => ({
        pedidoId: item.pedidoId,
        valorVinculado: Number(Number(item.valorVinculado).toFixed(2)),
      }));

      itensNormalizados.forEach(item => {
        if (item.valorVinculado <= 0) {
          throw new BadRequestException('Todos os valores precisam ser maiores que zero');
        }
      });

      const totalSolicitado = Number(
        itensNormalizados.reduce((acc, item) => acc + item.valorVinculado, 0).toFixed(2),
      );

      if (totalSolicitado - saldoDisponivel > this.VALOR_TOLERANCIA) {
        throw new BadRequestException('A soma dos valores excede o saldo disponível do lançamento');
      }

      const pedidoIds = Array.from(new Set(itensNormalizados.map(item => item.pedidoId)));
      const pedidos = await tx.pedido.findMany({
        where: { id: { in: pedidoIds } },
        select: {
          id: true,
          clienteId: true,
        },
      });

      if (pedidos.length !== pedidoIds.length) {
        const encontrados = new Set(pedidos.map(p => p.id));
        const faltantes = pedidoIds.filter(idPedido => !encontrados.has(idPedido));
        throw new NotFoundException(`Pedidos não encontrados: ${faltantes.join(', ')}`);
      }

      const clienteAtual = lancamento.clienteId ?? null;
      const clientesDosPedidos = new Set<number | null>(pedidos.map(p => p.clienteId ?? null));

      if (clienteAtual !== null && clientesDosPedidos.has(null)) {
        throw new BadRequestException('Um dos pedidos não possui cliente associado');
      }

      if (clienteAtual !== null) {
        const possuiClienteDiferente = pedidos.some(p => p.clienteId !== clienteAtual);
        if (possuiClienteDiferente) {
          throw new BadRequestException('Todos os pedidos precisam pertencer ao mesmo cliente do lançamento');
        }
      }

      await tx.lancamentoExtrato.update({
        where: { id },
        data: {
          vinculos: {
            create: itensNormalizados.map(item => ({
              pedidoId: item.pedidoId,
              valorVinculado: item.valorVinculado,
              vinculacaoAutomatica: false,
              observacoes: dto.observacoes ?? null,
            })),
          },
        },
      });

      const options: { observacoes?: string | null; clienteId?: number | null } = {};
      if (dto.observacoes !== undefined) {
        options.observacoes = dto.observacoes;
      }

      if (clienteAtual === null && clientesDosPedidos.size === 1) {
        const unicoClienteId = pedidos[0]?.clienteId ?? null;
        if (unicoClienteId !== null) {
          options.clienteId = unicoClienteId;
        }
      }

      return this.atualizarSaldosLancamento(id, options, tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async atualizarValorVinculo(
    id: bigint,
    vinculoId: number,
    dto: UpdateLancamentoExtratoPedidoDto,
  ): Promise<LancamentoExtratoResponseDto> {
    return this.prisma.$transaction(async tx => {
      const lancamento = await tx.lancamentoExtrato.findUnique({
        where: { id },
        select: {
          valorLancamento: true,
          vinculos: {
            select: {
              id: true,
              valorVinculado: true,
            },
          },
        },
      });

      if (!lancamento) {
        throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
      }

      const vinculoExistente = lancamento.vinculos.find(v => v.id === vinculoId);
      if (!vinculoExistente) {
        throw new NotFoundException(`Vínculo ${vinculoId} não encontrado para este lançamento`);
      }

      let novoValor = Number(vinculoExistente.valorVinculado);
      if (dto.valorVinculado !== undefined) {
        novoValor = Number(Number(dto.valorVinculado).toFixed(2));
        if (novoValor <= 0) {
          throw new BadRequestException('O valor vinculado deve ser maior que zero');
        }
      }

      const totalOutros = lancamento.vinculos
        .filter(v => v.id !== vinculoId)
        .reduce((acc, v) => acc + Number(v.valorVinculado || 0), 0);

      const valorLancamento = Number(lancamento.valorLancamento);
      const saldoDisponivel = Number((valorLancamento - totalOutros).toFixed(2));

      if (novoValor - saldoDisponivel > this.VALOR_TOLERANCIA) {
        throw new BadRequestException('O valor informado excede o saldo disponível para atualização');
      }

      await tx.lancamentoExtrato.update({
        where: { id },
        data: {
          vinculos: {
            update: {
              where: { id: vinculoId },
              data: (() => {
                const data: Record<string, any> = {
                  valorVinculado: novoValor,
                };

                if (dto.observacoes !== undefined) {
                  data.observacoes = dto.observacoes;
                }

                if (dto.vinculacaoAutomatica !== undefined) {
                  data.vinculacaoAutomatica = dto.vinculacaoAutomatica;
                }

                return data;
              })(),
            },
          },
        },
      });

      const options: { observacoes?: string | null } = {};
      if (dto.observacoes !== undefined) {
        options.observacoes = dto.observacoes;
      }

      return this.atualizarSaldosLancamento(id, options, tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  async removerVinculo(
    id: bigint,
    vinculoId: number,
  ): Promise<LancamentoExtratoResponseDto> {
    return this.prisma.$transaction(async tx => {
      const lancamento = await tx.lancamentoExtrato.findUnique({
        where: { id },
        include: {
          vinculos: {
            select: { id: true },
          },
        },
      });

      if (!lancamento) {
        throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
      }

      const vinculoExistente = lancamento.vinculos.find(v => v.id === vinculoId);
      if (!vinculoExistente) {
        throw new NotFoundException('Vínculo não encontrado para este lançamento');
      }

      await tx.lancamentoExtrato.update({
        where: { id },
        data: {
          vinculos: {
            deleteMany: { id: vinculoId },
          },
        },
      });

      return this.atualizarSaldosLancamento(id, undefined, tx);
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
  }

  /**
   * Busca e processa extratos da API BB, filtrando por cliente(s) e tipo crédito
   * Salva os pagamentos encontrados no banco de dados
   * Suporta múltiplos clientes para evitar múltiplas chamadas à API
   */
  async buscarEProcessarExtratos(
    dto: BuscarProcessarExtratosDto
  ): Promise<BuscarProcessarExtratosResponseDto> {
    // Determinar lista de IDs de clientes (suporta clienteId único ou clienteIds array)
    const clienteIds: number[] = dto.clienteIds && dto.clienteIds.length > 0 
      ? dto.clienteIds 
      : (dto.clienteId ? [dto.clienteId] : []);

    if (clienteIds.length === 0) {
      throw new BadRequestException('É necessário informar pelo menos um cliente (clienteId ou clienteIds)');
    }

    // Buscar todos os clientes
    const clientes = await this.prisma.cliente.findMany({
      where: { id: { in: clienteIds } },
    });

    if (clientes.length === 0) {
      throw new NotFoundException(`Nenhum cliente encontrado com os IDs fornecidos: ${clienteIds.join(', ')}`);
    }

    // Verificar se todos os IDs foram encontrados
    const idsEncontrados = clientes.map(c => c.id);
    const idsNaoEncontrados = clienteIds.filter(id => !idsEncontrados.includes(id));
    if (idsNaoEncontrados.length > 0) {
      throw new NotFoundException(`Clientes não encontrados: ${idsNaoEncontrados.join(', ')}`);
    }

    // Formatar data para exibição (antes de processar)
    const dataInicioExibicao = `${dto.dataInicio.slice(0, 2)}/${dto.dataInicio.slice(2, 4)}/${dto.dataInicio.slice(4)}`;
    const dataFimExibicao = `${dto.dataFim.slice(0, 2)}/${dto.dataFim.slice(2, 4)}/${dto.dataFim.slice(4)}`;
    const nomesClientes = clientes.map(c => c.nome || `ID ${c.id}`).join(', ');
    console.log(`📅 Buscando extratos para ${clientes.length} cliente(s): ${nomesClientes}, período ${dataInicioExibicao} a ${dataFimExibicao}`);

    // Validar e buscar conta corrente
    const contaCorrente = await this.contaCorrenteService.findOne(dto.contaCorrenteId);

    // Formatar datas para API do BB
    // Conforme documentação: Formato DDMMAAAA, omitir zeros à esquerda APENAS no DIA
    // Exemplo: 19042023 (dia 19, mês 04, ano 2023)
    // - DIA: 1 ou 2 dígitos (sem zero à esquerda se dia < 10)
    // - MÊS: SEMPRE 2 dígitos (com zero à esquerda se mês < 10)
    // - ANO: SEMPRE 4 dígitos
    const formatDateForAPI = (dateStr: string): string => {
      if (!/^\d{8}$/.test(dateStr)) {
        throw new BadRequestException(`Data inválida: ${dateStr}. Formato esperado: DDMMYYYY`);
      }
      
      const dia = parseInt(dateStr.slice(0, 2), 10);
      const mes = parseInt(dateStr.slice(2, 4), 10);
      const ano = parseInt(dateStr.slice(4), 10);
      
      // Dia: omitir zeros à esquerda (conforme documentação da API)
      // Mês: SEMPRE 2 dígitos (com zero à esquerda se < 10)
      // Ano: sempre 4 dígitos
      const diaFormatado = dia.toString(); // Sem zero à esquerda (ex: 1, 8, 19, 23)
      const mesFormatado = mes.toString().padStart(2, '0'); // Sempre 2 dígitos (ex: 01, 04, 09, 11)
      return `${diaFormatado}${mesFormatado}${ano}`;
    };

    const dataInicioFormatada = formatDateForAPI(dto.dataInicio);
    const dataFimFormatada = formatDateForAPI(dto.dataFim);

    // Log antes de buscar na API
    console.log(`🔍 [BUSCAR-PROCESSAR] Iniciando busca na API BB:`, {
      contaCorrenteId: dto.contaCorrenteId,
      agencia: contaCorrente.agencia,
      conta: contaCorrente.contaCorrente,
      dataInicio: dto.dataInicio,
      dataInicioFormatada,
      dataFim: dto.dataFim,
      dataFimFormatada,
      clientes: clientes.map(c => ({ id: c.id, nome: c.nome, cpf: c.cpf, cnpj: c.cnpj }))
    });

    // Buscar extratos brutos da API
    let extratosBrutos: any[] = [];
    try {
      extratosBrutos = await this.extratosService.consultarExtratosBrutos(
        dataInicioFormatada,
        dataFimFormatada,
        dto.contaCorrenteId
      );
      console.log(`✅ [BUSCAR-PROCESSAR] API retornou ${extratosBrutos.length} extratos brutos`);
    } catch (error) {
      console.error(`❌ [BUSCAR-PROCESSAR] Erro ao consultar extratos brutos na API BB:`, {
        error: error.message,
        stack: error.stack,
        contaCorrenteId: dto.contaCorrenteId,
        agencia: contaCorrente.agencia,
        conta: contaCorrente.contaCorrente,
        dataInicioFormatada,
        dataFimFormatada,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error; // Re-throw para o controller tratar
    }

    if (extratosBrutos && extratosBrutos.length > 0) {
      console.log('📋 [API RESPONSE] JSON completo dos extratos retornados (clientes específicos):');
      try {
        console.log(JSON.stringify(extratosBrutos, null, 2));
      } catch (error) {
        console.warn('⚠️ Não foi possível serializar extratosBrutos para JSON:', error);
      }
    }

    // Preparar mapa de CPF/CNPJ normalizados para cada cliente
    // Estrutura: { cpfCnpjNormalizado: { clienteId, tamanhoEsperado } }
    const mapaCpfCnpjClientes: Map<string, { clienteId: number; tamanhoEsperado: number }> = new Map();
    
    for (const cliente of clientes) {
      const cpfCnpjClienteRaw = (cliente.cnpj || cliente.cpf || '').replace(/\D/g, '');
      
      if (!cpfCnpjClienteRaw) {
        console.warn(`⚠️ Cliente ${cliente.id} (${cliente.nome}) não possui CPF ou CNPJ cadastrado. Será ignorado na busca.`);
        continue;
      }

      // Determinar tamanho esperado (CPF = 11 dígitos, CNPJ = 14 dígitos)
      const tamanhoEsperado = cliente.cnpj ? 14 : 11;
      
      // Normalizar CPF/CNPJ do cliente: adicionar zeros à esquerda se necessário
      const cpfCnpjCliente = cpfCnpjClienteRaw.padStart(tamanhoEsperado, '0');
      
      mapaCpfCnpjClientes.set(cpfCnpjCliente, { clienteId: cliente.id, tamanhoEsperado });
    }

    if (mapaCpfCnpjClientes.size === 0) {
      throw new BadRequestException('Nenhum dos clientes informados possui CPF ou CNPJ cadastrado');
    }

    // Função auxiliar para normalizar CPF/CNPJ do extrato
    const normalizarCpfCnpj = (cpfCnpj: string, tamanhoEsperado: number): string => {
      const numeros = cpfCnpj.replace(/\D/g, '');
      if (!numeros) return '';
      
      // Se já tem o tamanho esperado, retorna como está
      if (numeros.length === tamanhoEsperado) {
        return numeros;
      }
      
      // Adiciona zeros à esquerda até completar o tamanho esperado
      return numeros.padStart(tamanhoEsperado, '0');
    };

    // Função para extrair CPF/CNPJ do extrato
    const extrairCpfCnpjExtrato = (extrato: any): string => {
      let cpfCnpjExtratoOriginal = '';
      
      // 1. PRIMEIRA TENTATIVA: Verificar 'numeroCpfCnpjContrapartida' (campo direto)
      if (extrato.numeroCpfCnpjContrapartida && Number(extrato.numeroCpfCnpjContrapartida) !== 0) {
        cpfCnpjExtratoOriginal = String(extrato.numeroCpfCnpjContrapartida);
      }
      
      // 2. SEGUNDA TENTATIVA: Se não encontrou no campo direto, extrair do 'textoInformacaoComplementar'
      if (!cpfCnpjExtratoOriginal || cpfCnpjExtratoOriginal === '0') {
        const infoComplementar = extrato.textoInformacaoComplementar || '';
        const cpfCnpjMatch = infoComplementar.match(/\b(\d{11,14})\b/);
        if (cpfCnpjMatch) {
          cpfCnpjExtratoOriginal = cpfCnpjMatch[1];
        }
      }
      
      // 3. FALLBACK: Tentar outros campos possíveis
      if (!cpfCnpjExtratoOriginal || cpfCnpjExtratoOriginal === '0') {
        cpfCnpjExtratoOriginal = String(
          extrato.numeroCpfCnpj || 
          extrato.cpfCnpjContrapartida || 
          extrato.cpfCnpj || 
          extrato.numeroDocumentoContrapartida ||
          extrato.documentoContrapartida ||
          ''
        );
      }
      
      return cpfCnpjExtratoOriginal.replace(/\D/g, '');
    };

    // Filtrar: apenas créditos e identificar o cliente correspondente (quando houver)
    const extratosElegiveis: Array<{ extrato: any; clienteId: number; cpfCnpj?: string }> = [];

    for (const extrato of extratosBrutos) {
      if (extrato.indicadorSinalLancamento !== 'C') {
        continue;
      }

      const descricaoUpper = (extrato.textoDescricaoHistorico || '').toUpperCase().trim();
      if (this.descricoesCreditoIgnorar.has(descricaoUpper)) {
        continue;
      }

      const cpfCnpjExtratoRaw = extrairCpfCnpjExtrato(extrato);
      if (!cpfCnpjExtratoRaw) {
        continue;
      }

      const tentarObterCliente = (tamanho: number) => {
        const normalizado = normalizarCpfCnpj(cpfCnpjExtratoRaw, tamanho);
        return mapaCpfCnpjClientes.get(normalizado) || null;
      };

      let clienteEncontrado: { clienteId: number; tamanhoEsperado: number } | null = null;

      if (cpfCnpjExtratoRaw.length === 11) {
        clienteEncontrado = tentarObterCliente(11);
      } else if (cpfCnpjExtratoRaw.length === 14) {
        clienteEncontrado = tentarObterCliente(14);
      }

      if (!clienteEncontrado) {
        clienteEncontrado = tentarObterCliente(11) || tentarObterCliente(14);
      }

      if (!clienteEncontrado) {
        continue;
      }

      extratosElegiveis.push({
        extrato,
        clienteId: clienteEncontrado.clienteId,
        cpfCnpj: cpfCnpjExtratoRaw,
      });
    }

    let totalSalvos = 0;
    let totalDuplicados = 0;
    let totalErros = 0;
    let totalSalvosComCliente = 0;
    const clientesComLancamentosSalvos = new Set<number>();

    for (const item of extratosElegiveis) {
      const resultado = await this.salvarExtratoProcessado({
        extrato: item.extrato,
        clienteId: item.clienteId,
        contaCorrente,
        contaCorrenteId: dto.contaCorrenteId,
        cpfCnpjIdentificado: item.cpfCnpj,
      });

      if (resultado === 'salvo') {
        totalSalvos++;
        totalSalvosComCliente++;
        clientesComLancamentosSalvos.add(item.clienteId);
      } else if (resultado === 'duplicado') {
        totalDuplicados++;
      } else {
        totalErros++;
      }
    }

    const clientesComLancamentos = clientes.filter(c => clientesComLancamentosSalvos.has(c.id));
    const clientePrincipal = clientesComLancamentos[0] ?? clientes[0];

    console.log(`✅ Busca concluída: ${totalSalvos} salvos, ${totalDuplicados} duplicados, ${clientesComLancamentos.length} clientes únicos com lançamentos`);

    return {
      totalEncontrados: extratosBrutos.length,
      totalFiltrados: extratosElegiveis.length,
      totalSalvos,
      totalDuplicados,
      totalComClienteIdentificado: extratosElegiveis.length,
      totalSemClienteIdentificado: 0,
      totalSalvosComClienteIdentificado: totalSalvosComCliente,
      totalSalvosSemClienteIdentificado: 0,
      totalErros: totalErros > 0 ? totalErros : undefined,
      periodo: {
        inicio: dto.dataInicio,
        fim: dto.dataFim,
      },
      contaCorrente: {
        id: contaCorrente.id,
        agencia: contaCorrente.agencia,
        conta: contaCorrente.contaCorrente,
      },
      cliente: clientePrincipal
        ? {
            id: clientePrincipal.id,
            nome: clientePrincipal.nome,
          }
        : undefined,
      clientes: clientesComLancamentos.map(c => ({
        id: c.id,
        nome: c.nome,
      })),
    };
  }

  /**
   * Busca e processa extratos da API BB para TODOS os clientes com CPF/CNPJ cadastrado
   * Este método será reutilizado por jobs automáticos
   * Faz uma única chamada à API e filtra os lançamentos comparando com todos os CPF/CNPJ da base
   */
  async buscarEProcessarExtratosTodosClientes(
    dto: BuscarProcessarExtratosTodosClientesDto
  ): Promise<BuscarProcessarExtratosResponseDto> {
    const clientes = await this.prisma.cliente.findMany({
      where: {
        OR: [
          {
            AND: [
              { cpf: { not: null } },
              { cpf: { not: '' } },
            ],
          },
          {
            AND: [
              { cnpj: { not: null } },
              { cnpj: { not: '' } },
            ],
          },
        ],
      },
    });

    if (clientes.length === 0) {
      console.warn(
        '⚠️ Nenhum cliente com CPF ou CNPJ cadastrado encontrado. Os lançamentos serão salvos sem vínculo de cliente.'
      );
    }

    const dataInicioExibicao = `${dto.dataInicio.slice(0, 2)}/${dto.dataInicio.slice(2, 4)}/${dto.dataInicio.slice(4)}`;
    const dataFimExibicao = `${dto.dataFim.slice(0, 2)}/${dto.dataFim.slice(2, 4)}/${dto.dataFim.slice(4)}`;
    console.log(
      `📅 Buscando extratos para TODOS os ${clientes.length} clientes com CPF/CNPJ, período ${dataInicioExibicao} a ${dataFimExibicao}`
    );

    const contaCorrente = await this.contaCorrenteService.findOne(dto.contaCorrenteId);

    const formatDateForAPI = (dateStr: string): string => {
      if (!/^\d{8}$/.test(dateStr)) {
        throw new BadRequestException(`Data inválida: ${dateStr}. Formato esperado: DDMMYYYY`);
      }

      const dia = parseInt(dateStr.slice(0, 2), 10);
      const mes = parseInt(dateStr.slice(2, 4), 10);
      const ano = parseInt(dateStr.slice(4), 10);

      const diaFormatado = dia.toString();
      const mesFormatado = mes.toString().padStart(2, '0');
      return `${diaFormatado}${mesFormatado}${ano}`;
    };

    const dataInicioFormatada = formatDateForAPI(dto.dataInicio);
    const dataFimFormatada = formatDateForAPI(dto.dataFim);

    console.log(`🔍 [BUSCAR-TODOS-CLIENTES] Iniciando busca na API BB para todos os clientes:`, {
      contaCorrenteId: dto.contaCorrenteId,
      agencia: contaCorrente.agencia,
      conta: contaCorrente.contaCorrente,
      dataInicio: dto.dataInicio,
      dataInicioFormatada,
      dataFim: dto.dataFim,
      dataFimFormatada,
      totalClientes: clientes.length,
    });

    let extratosBrutos: any[] = [];
    try {
      extratosBrutos = await this.extratosService.consultarExtratosBrutos(
        dataInicioFormatada,
        dataFimFormatada,
        dto.contaCorrenteId
      );
      console.log(`✅ [BUSCAR-TODOS-CLIENTES] API retornou ${extratosBrutos.length} extratos brutos`);
    } catch (error) {
      console.error(`❌ [BUSCAR-TODOS-CLIENTES] Erro ao consultar extratos brutos na API BB:`, {
        error: error.message,
        stack: error.stack,
        contaCorrenteId: dto.contaCorrenteId,
        agencia: contaCorrente.agencia,
        conta: contaCorrente.contaCorrente,
        dataInicioFormatada,
        dataFimFormatada,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }

    if (extratosBrutos && extratosBrutos.length > 0) {
      console.log('📋 [API RESPONSE] JSON completo dos extratos retornados (todos os clientes):');
      try {
        console.log(JSON.stringify(extratosBrutos, null, 2));
      } catch (error) {
        console.warn('⚠️ Não foi possível serializar extratosBrutos para JSON:', error);
      }
    }

    const mapaCpfCnpjClientes: Map<string, { clienteId: number; tamanhoEsperado: number }> = new Map();

    for (const cliente of clientes) {
      const cpfCnpjClienteRaw = (cliente.cnpj || cliente.cpf || '').replace(/\D/g, '');
      if (!cpfCnpjClienteRaw) {
        continue;
      }

      const tamanhoEsperado = cliente.cnpj ? 14 : 11;
      const cpfCnpjCliente = cpfCnpjClienteRaw.padStart(tamanhoEsperado, '0');
      mapaCpfCnpjClientes.set(cpfCnpjCliente, { clienteId: cliente.id, tamanhoEsperado });
    }

    const normalizarCpfCnpj = (cpfCnpj: string, tamanhoEsperado: number): string => {
      const numeros = cpfCnpj.replace(/\D/g, '');
      if (!numeros) return '';
      if (numeros.length === tamanhoEsperado) {
        return numeros;
      }
      return numeros.padStart(tamanhoEsperado, '0');
    };

    const extrairCpfCnpjExtrato = (extrato: any): string => {
      let cpfCnpjExtratoOriginal = '';

      if (extrato.numeroCpfCnpjContrapartida && Number(extrato.numeroCpfCnpjContrapartida) !== 0) {
        cpfCnpjExtratoOriginal = String(extrato.numeroCpfCnpjContrapartida);
      }

      if (!cpfCnpjExtratoOriginal || cpfCnpjExtratoOriginal === '0') {
        const infoComplementar = extrato.textoInformacaoComplementar || '';
        const cpfCnpjMatch = infoComplementar.match(/\b(\d{11,14})\b/);
        if (cpfCnpjMatch) {
          cpfCnpjExtratoOriginal = cpfCnpjMatch[1];
        }
      }

      if (!cpfCnpjExtratoOriginal || cpfCnpjExtratoOriginal === '0') {
        cpfCnpjExtratoOriginal = String(
          extrato.numeroCpfCnpj ||
            extrato.cpfCnpjContrapartida ||
            extrato.cpfCnpj ||
            extrato.numeroDocumentoContrapartida ||
            extrato.documentoContrapartida ||
            ''
        );
      }

      return cpfCnpjExtratoOriginal.replace(/\D/g, '');
    };

    const extratosElegiveis: Array<{ extrato: any; clienteId: number | null; cpfCnpj?: string }> = [];

    for (const extrato of extratosBrutos) {
      if (extrato.indicadorSinalLancamento !== 'C') {
        continue;
      }

      const descricaoUpper = (extrato.textoDescricaoHistorico || '').toUpperCase().trim();
      if (this.descricoesCreditoIgnorar.has(descricaoUpper)) {
        continue;
      }

      const cpfCnpjExtratoRaw = extrairCpfCnpjExtrato(extrato);
      let clienteId: number | null = null;

      if (cpfCnpjExtratoRaw) {
        const tentarObterCliente = (tamanho: number) => {
          const normalizado = normalizarCpfCnpj(cpfCnpjExtratoRaw, tamanho);
          return mapaCpfCnpjClientes.get(normalizado) || null;
        };

        let clienteEncontrado: { clienteId: number; tamanhoEsperado: number } | null = null;

        if (cpfCnpjExtratoRaw.length === 11) {
          clienteEncontrado = tentarObterCliente(11);
        } else if (cpfCnpjExtratoRaw.length === 14) {
          clienteEncontrado = tentarObterCliente(14);
        }

        if (!clienteEncontrado) {
          clienteEncontrado = tentarObterCliente(11) || tentarObterCliente(14);
        }

        if (clienteEncontrado) {
          clienteId = clienteEncontrado.clienteId;
        }
      }

      extratosElegiveis.push({
        extrato,
        clienteId,
        cpfCnpj: cpfCnpjExtratoRaw || undefined,
      });
    }

    let totalSalvos = 0;
    let totalDuplicados = 0;
    let totalErros = 0;
    let totalComCliente = 0;
    let totalSemCliente = 0;
    let totalSalvosComCliente = 0;
    let totalSalvosSemCliente = 0;
    const clientesComLancamentosSalvos = new Set<number>();

    for (const item of extratosElegiveis) {
      if (item.clienteId !== null) {
        totalComCliente++;
      } else {
        totalSemCliente++;
      }

      const resultado = await this.salvarExtratoProcessado({
        extrato: item.extrato,
        clienteId: item.clienteId,
        contaCorrente,
        contaCorrenteId: dto.contaCorrenteId,
        cpfCnpjIdentificado: item.cpfCnpj,
      });

      if (resultado === 'salvo') {
        totalSalvos++;
        if (item.clienteId !== null) {
          totalSalvosComCliente++;
          clientesComLancamentosSalvos.add(item.clienteId);
        } else {
          totalSalvosSemCliente++;
        }
      } else if (resultado === 'duplicado') {
        totalDuplicados++;
      } else {
        totalErros++;
      }
    }

    const clientesComLancamentos = clientes.filter(c => clientesComLancamentosSalvos.has(c.id));
    const clientePrincipal = clientesComLancamentos[0] ?? clientes[0] ?? null;

    console.log(
      `✅ Busca concluída para todos os clientes: ${totalSalvos} salvos, ${totalDuplicados} duplicados, ${clientesComLancamentos.length} clientes com lançamentos, ${totalSalvosSemCliente} sem cliente identificado`
    );

    return {
      totalEncontrados: extratosBrutos.length,
      totalFiltrados: extratosElegiveis.length,
      totalSalvos,
      totalDuplicados,
      totalComClienteIdentificado: totalComCliente,
      totalSemClienteIdentificado: totalSemCliente,
      totalSalvosComClienteIdentificado: totalSalvosComCliente,
      totalSalvosSemClienteIdentificado: totalSalvosSemCliente,
      totalErros: totalErros > 0 ? totalErros : undefined,
      periodo: {
        inicio: dto.dataInicio,
        fim: dto.dataFim,
      },
      contaCorrente: {
        id: contaCorrente.id,
        agencia: contaCorrente.agencia,
        conta: contaCorrente.contaCorrente,
      },
      cliente: clientePrincipal
        ? {
            id: clientePrincipal.id,
            nome: clientePrincipal.nome,
          }
        : undefined,
      clientes: clientesComLancamentos.map(c => ({
        id: c.id,
        nome: c.nome,
      })),
    };
  }

  /**
   * Formata a resposta do lançamento
   */
  private async salvarExtratoProcessado(params: {
    extrato: any;
    clienteId: number | null;
    contaCorrente: { id: number; agencia: string; contaCorrente: string };
    contaCorrenteId: number;
    cpfCnpjIdentificado?: string;
  }): Promise<'salvo' | 'duplicado' | 'erro'> {
    const { extrato, clienteId, contaCorrente, contaCorrenteId, cpfCnpjIdentificado } = params;

    try {
      const dataLancamentoRaw = extrato.dataLancamento;

      if (dataLancamentoRaw === undefined || dataLancamentoRaw === null) {
        throw new Error('Extrato sem dataLancamento informado');
      }

      const dataLancamentoStr = String(dataLancamentoRaw);
      let dia: number;
      let mes: number;
      let ano: number;

      if (dataLancamentoStr.length === 7) {
        dia = parseInt(dataLancamentoStr.slice(0, 1), 10);
        mes = parseInt(dataLancamentoStr.slice(1, 3), 10);
        ano = parseInt(dataLancamentoStr.slice(3), 10);
      } else if (dataLancamentoStr.length === 8) {
        dia = parseInt(dataLancamentoStr.slice(0, 2), 10);
        mes = parseInt(dataLancamentoStr.slice(2, 4), 10);
        ano = parseInt(dataLancamentoStr.slice(4), 10);
      } else {
        throw new Error(`Formato de data inválido: ${dataLancamentoStr}`);
      }

      const dataLancamento = new Date(ano, mes - 1, dia);

      const infoComplementar = extrato.textoInformacaoComplementar || '';
      const horarioMatch = infoComplementar.match(/(\d{2}:\d{2})/);
      const horarioLancamento = horarioMatch ? horarioMatch[1] : undefined;

      let nomeContrapartida: string | undefined;
      if (infoComplementar) {
        const partes = infoComplementar.trim().split(/\s+/);
        let encontrouCPFCNPJ = false;
        const partesNome: string[] = [];

        for (const parte of partes) {
          if (!encontrouCPFCNPJ && /^\d{11,14}$/.test(parte)) {
            encontrouCPFCNPJ = true;
            continue;
          }

          if (encontrouCPFCNPJ && parte && !parte.match(/^\d{2}\/\d{2}/) && !parte.match(/^\d{2}:\d{2}$/)) {
            partesNome.push(parte);
          }
        }

        if (partesNome.length > 0) {
          nomeContrapartida = partesNome.join(' ');
        }
      }

      let categoriaOperacao: string | undefined;
      const descricao = (extrato.textoDescricaoHistorico || '').toUpperCase();
      if (descricao.includes('PIX') && descricao.includes('RECEBIDO')) {
        categoriaOperacao = 'PIX_RECEBIDO';
      } else if (descricao.includes('PIX') && descricao.includes('ENVIADO')) {
        categoriaOperacao = 'PIX_ENVIADO';
      } else if (descricao.includes('TRANSFERÊNCIA') || descricao.includes('TRANSFERENCIA')) {
        categoriaOperacao = 'TRANSFERENCIA';
      }

      const valorLancamento = Math.abs(Number(extrato.valorLancamento || 0));
      const numeroDocumento = String(extrato.numeroDocumento || '');
      const dataLancamentoBigInt = BigInt(dataLancamentoRaw);
      const numeroLoteBigInt = extrato.numeroLote ? BigInt(extrato.numeroLote) : BigInt(0);

      const numeroCpfCnpjContrapartida =
        cpfCnpjIdentificado ??
        (extrato.numeroCpfCnpjContrapartida !== undefined && extrato.numeroCpfCnpjContrapartida !== null
          ? String(extrato.numeroCpfCnpjContrapartida)
          : undefined);

      const dataToCreate: any = {
        indicadorTipoLancamento: extrato.indicadorTipoLancamento,
        dataLancamentoRaw: dataLancamentoBigInt,
        dataMovimento: extrato.dataMovimento !== undefined ? BigInt(extrato.dataMovimento) : null,
        codigoAgenciaOrigem: extrato.codigoAgenciaOrigem !== undefined ? BigInt(extrato.codigoAgenciaOrigem) : null,
        numeroLote: numeroLoteBigInt,
        numeroDocumento,
        codigoHistorico: extrato.codigoHistorico !== undefined ? Number(extrato.codigoHistorico) : null,
        textoDescricaoHistorico: extrato.textoDescricaoHistorico,
        valorLancamentoRaw: extrato.valorLancamento !== undefined ? Number(extrato.valorLancamento) : undefined,
        indicadorSinalLancamento: extrato.indicadorSinalLancamento,
        textoInformacaoComplementar: extrato.textoInformacaoComplementar,
        numeroCpfCnpjContrapartida,
        indicadorTipoPessoaContrapartida: extrato.indicadorTipoPessoaContrapartida,
        codigoBancoContrapartida: extrato.codigoBancoContrapartida !== undefined ? BigInt(extrato.codigoBancoContrapartida) : null,
        codigoAgenciaContrapartida: extrato.codigoAgenciaContrapartida !== undefined ? BigInt(extrato.codigoAgenciaContrapartida) : null,
        numeroContaContrapartida: extrato.numeroContaContrapartida,
        textoDvContaContrapartida: extrato.textoDvContaContrapartida,
        dataLancamento,
        valorLancamento,
        tipoOperacao: TipoOperacaoExtrato.CREDITO,
        categoriaOperacao,
        horarioLancamento,
        nomeContrapartida,
        clienteId: clienteId ?? null,
        contaCorrenteId,
        agenciaConta: contaCorrente.agencia,
        numeroConta: contaCorrente.contaCorrente,
        processado: false,
        vinculadoPedido: false,
        vinculadoPagamento: false,
        vinculacaoAutomatica: false,
        valorDisponivel: valorLancamento,
        valorVinculadoTotal: 0,
        estaLiquidado: false,
      };

      // Remover campos undefined
      Object.keys(dataToCreate).forEach(key => {
        if (dataToCreate[key] === undefined) {
          delete dataToCreate[key];
        }
      });

      // Tentar criar diretamente - a constraint única do banco impedirá duplicações
      // Se houver erro de constraint única (P2002), significa que já existe
      try {
        await this.prisma.lancamentoExtrato.create({
          data: dataToCreate,
        });
        return 'salvo';
      } catch (error: any) {
        // Erro P2002 = violação de constraint única (duplicado)
        if (error?.code === 'P2002') {
          return 'duplicado';
        }
        // Re-throw outros erros para serem tratados no catch externo
        throw error;
      }
    } catch (error) {
      console.error('Erro ao salvar lançamento de extrato processado:', {
        message: (error as Error).message,
        extrato: {
          numeroDocumento: extrato?.numeroDocumento,
          dataLancamento: extrato?.dataLancamento,
        },
      });
      return 'erro';
    }
  }

  /**
   * Formata a resposta do lançamento
   */
  private formatResponse(lancamento: any): LancamentoExtratoResponseDto {
    return {
      id: lancamento.id.toString(),
      indicadorTipoLancamento: lancamento.indicadorTipoLancamento || undefined,
      dataLancamentoRaw: lancamento.dataLancamentoRaw ? Number(lancamento.dataLancamentoRaw) : undefined,
      numeroDocumento: lancamento.numeroDocumento || undefined,
      textoDescricaoHistorico: lancamento.textoDescricaoHistorico || undefined,
      dataLancamento: lancamento.dataLancamento,
      valorLancamento: Number(lancamento.valorLancamento),
      tipoOperacao: lancamento.tipoOperacao,
      categoriaOperacao: lancamento.categoriaOperacao || undefined,
      nomeContrapartida: lancamento.nomeContrapartida || undefined,
      clienteId: lancamento.clienteId ?? undefined,
      pedidoId: lancamento.pedidoId || undefined,
      contaCorrenteId: lancamento.contaCorrenteId ?? undefined,
      agenciaConta: lancamento.agenciaConta || undefined,
      numeroConta: lancamento.numeroConta || undefined,
      processado: lancamento.processado,
      vinculadoPedido: lancamento.vinculadoPedido,
      vinculadoPagamento: lancamento.vinculadoPagamento,
      vinculacaoAutomatica: lancamento.vinculacaoAutomatica,
      valorDisponivel: Number(lancamento.valorDisponivel ?? 0),
      valorVinculadoTotal: Number(lancamento.valorVinculadoTotal ?? 0),
      estaLiquidado: Boolean(lancamento.estaLiquidado),
      createdAt: lancamento.createdAt,
      updatedAt: lancamento.updatedAt,
      // ✅ Incluir dados do cliente vinculado
      cliente: lancamento.cliente ? {
        id: lancamento.cliente.id,
        nome: lancamento.cliente.nome,
        cnpj: lancamento.cliente.cnpj || undefined,
        cpf: lancamento.cliente.cpf || undefined,
      } : undefined,
      // ✅ Incluir dados do pedido vinculado
      // Se pedidoId existe, o relacionamento deve estar carregado
      pedido: lancamento.pedido ? {
        id: lancamento.pedido.id,
        numeroPedido: lancamento.pedido.numeroPedido,
        valorFinal: lancamento.pedido.valorFinal ? Number(lancamento.pedido.valorFinal) : undefined,
        status: lancamento.pedido.status,
      } : undefined,
      vinculos: Array.isArray(lancamento.vinculos)
        ? lancamento.vinculos.map((vinculo: any) => ({
            id: vinculo.id,
            pedidoId: vinculo.pedidoId,
            pedidoNumero: vinculo.pedido?.numeroPedido,
            valorVinculado: Number(vinculo.valorVinculado),
            vinculacaoAutomatica: vinculo.vinculacaoAutomatica,
            observacoes: vinculo.observacoes || undefined,
            createdAt: vinculo.createdAt,
            updatedAt: vinculo.updatedAt,
          }))
        : undefined,
    };
  }

  private async atualizarSaldosLancamento(
    id: bigint,
    options?: { observacoes?: string | null; clienteId?: number | null },
    prismaClient: PrismaService | Prisma.TransactionClient = this.prisma,
  ): Promise<LancamentoExtratoResponseDto> {
    const lancamento = await prismaClient.lancamentoExtrato.findUnique({
      where: { id },
      include: this.lancamentoInclude,
    }) as LancamentoWithRelations | null;

    if (!lancamento) {
      throw new NotFoundException(`Lançamento com ID ${id} não encontrado`);
    }

    const totalVinculado = Number(
      (lancamento.vinculos || []).reduce(
        (acc: number, vinculo: any) => acc + Number(vinculo.valorVinculado || 0),
        0,
      ).toFixed(2),
    );
    const valorLancamento = Number(lancamento.valorLancamento);
    const valorDisponivelCalc = Math.max(valorLancamento - totalVinculado, 0);
    const valorDisponivel = Number(valorDisponivelCalc.toFixed(2));
    const estaLiquidado = valorDisponivel <= this.VALOR_TOLERANCIA;
    const vinculadoPedido = totalVinculado > this.VALOR_TOLERANCIA;

    let pedidoPrincipalId: number | null = null;
    if (estaLiquidado && lancamento.vinculos.length === 1) {
      pedidoPrincipalId = lancamento.vinculos[0].pedidoId;
    } else if (!vinculadoPedido) {
      pedidoPrincipalId = null;
    }

    let clienteId = lancamento.clienteId ?? null;
    if ((clienteId === null || clienteId === undefined) && lancamento.vinculos.length > 0) {
      const vinculoComCliente = lancamento.vinculos.find(v => v.pedido?.clienteId);
      if (vinculoComCliente?.pedido?.clienteId) {
        clienteId = vinculoComCliente.pedido.clienteId;
      }
    }

    if (options?.clienteId !== undefined) {
      clienteId = options.clienteId;
    }

    const dataAtualizacao: Record<string, any> = {
      valorDisponivel,
      valorVinculadoTotal: totalVinculado,
      estaLiquidado,
      vinculadoPedido,
      pedidoId: pedidoPrincipalId,
      vinculacaoAutomatica: false,
    };

    if (!vinculadoPedido) {
      dataAtualizacao.pedidoId = null;
      dataAtualizacao.vinculadoPagamento = false;
    }

    if (clienteId !== lancamento.clienteId) {
      dataAtualizacao.clienteId = clienteId;
    }

    if (options?.observacoes !== undefined) {
      dataAtualizacao.observacoesProcessamento = options.observacoes ?? null;
    }

    const lancamentoAtualizado = await prismaClient.lancamentoExtrato.update({
      where: { id },
      data: dataAtualizacao,
      include: this.lancamentoInclude,
    });

    return this.formatResponse(lancamentoAtualizado);
  }
}

