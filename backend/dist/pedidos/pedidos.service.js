"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PedidosService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PedidosService = class PedidosService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDashboardStats(paginaFinalizados = 1, limitFinalizados = 10) {
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
            pedidosVencidos: 0,
        };
        todosPedidos.forEach(pedido => {
            const { status, valorFinal, valorRecebido } = pedido;
            if (!['PEDIDO_FINALIZADO', 'CANCELADO'].includes(status)) {
                stats.pedidosAtivos++;
                if (valorFinal)
                    stats.valorTotalAberto += valorFinal;
            }
            if (['PAGAMENTO_REALIZADO', 'PEDIDO_FINALIZADO'].includes(status)) {
                stats.pedidosFinalizados++;
            }
            if (valorRecebido)
                stats.valorRecebido += valorRecebido;
        });
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
        const pedidosAtivosFomatados = pedidosAtivos.map(pedido => this.convertNullToUndefined({
            ...pedido,
            numeroPedido: pedido.numeroPedido,
            dataPrevistaColheita: pedido.dataPrevistaColheita?.toISOString().split('T')[0],
            dataColheita: pedido.dataColheita?.toISOString().split('T')[0],
            createdAt: pedido.createdAt?.toISOString(),
            updatedAt: pedido.updatedAt?.toISOString(),
        }));
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
    convertNullToUndefined(obj) {
        if (obj === null)
            return undefined;
        if (Array.isArray(obj)) {
            return obj.map(item => this.convertNullToUndefined(item));
        }
        if (typeof obj === 'object') {
            const converted = { ...obj };
            for (const key in converted) {
                if (converted[key] === null) {
                    converted[key] = undefined;
                }
                else if (converted[key] instanceof Date) {
                    converted[key] = converted[key].toISOString();
                }
                else if (typeof converted[key] === 'object') {
                    converted[key] = this.convertNullToUndefined(converted[key]);
                }
            }
            return converted;
        }
        return obj;
    }
    async gerarNumeroPedido() {
        const ano = new Date().getFullYear();
        const prefixo = `PED-${ano}-`;
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
            const ultimoSequencial = ultimoPedido.numeroPedido.replace(prefixo, '');
            proximoNumero = parseInt(ultimoSequencial) + 1;
        }
        const sequencial = proximoNumero.toString().padStart(4, '0');
        return `${prefixo}${sequencial}`;
    }
    calcularValoresConsolidados(frutasPedidos, frete, icms, desconto, avaria) {
        const valorTotalFrutas = frutasPedidos.reduce((total, fruta) => {
            return total + (fruta.valorTotal || 0);
        }, 0);
        const valorFinal = valorTotalFrutas + (frete || 0) + (icms || 0) - (desconto || 0) - (avaria || 0);
        return {
            valorFinal: Number(valorFinal.toFixed(2))
        };
    }
    calcularValoresFruta(quantidadeReal, valorUnitario) {
        const valorTotal = quantidadeReal * valorUnitario;
        return {
            valorTotal: Number(valorTotal.toFixed(2))
        };
    }
    async calcularValorRecebidoConsolidado(pedidoId, prismaClient) {
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
    async atualizarStatusPagamento(pedidoId) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { id: pedidoId },
            select: { valorFinal: true, status: true }
        });
        if (!pedido || !pedido.valorFinal)
            return;
        const valorRecebido = await this.calcularValorRecebidoConsolidado(pedidoId);
        let novoStatus;
        if (valorRecebido >= pedido.valorFinal) {
            novoStatus = 'PAGAMENTO_REALIZADO';
        }
        else if (valorRecebido > 0) {
            novoStatus = 'PAGAMENTO_PARCIAL';
        }
        else {
            novoStatus = 'AGUARDANDO_PAGAMENTO';
        }
        if (pedido.status !== novoStatus) {
            await this.prisma.pedido.update({
                where: { id: pedidoId },
                data: { status: novoStatus }
            });
        }
    }
    async create(createPedidoDto) {
        const cliente = await this.prisma.cliente.findUnique({
            where: { id: createPedidoDto.clienteId },
        });
        if (!cliente) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        for (const fruta of createPedidoDto.frutas) {
            const frutaExiste = await this.prisma.fruta.findUnique({
                where: { id: fruta.frutaId },
            });
            if (!frutaExiste) {
                throw new common_1.NotFoundException(`Fruta com ID ${fruta.frutaId} não encontrada`);
            }
        }
        const numeroPedido = await this.gerarNumeroPedido();
        const pedido = await this.prisma.$transaction(async (prisma) => {
            const novoPedido = await prisma.pedido.create({
                data: {
                    numeroPedido,
                    clienteId: createPedidoDto.clienteId,
                    dataPrevistaColheita: createPedidoDto.dataPrevistaColheita,
                    observacoes: createPedidoDto.observacoes,
                },
            });
            const frutasPedidos = await Promise.all(createPedidoDto.frutas.map(fruta => prisma.frutasPedidos.create({
                data: {
                    pedidoId: novoPedido.id,
                    frutaId: fruta.frutaId,
                    quantidadePrevista: fruta.quantidadePrevista,
                    unidadeMedida1: fruta.unidadeMedida1,
                    unidadeMedida2: fruta.unidadeMedida2,
                },
            })));
            return { ...novoPedido, frutasPedidos };
        });
        const pedidoCompleto = await this.findOne(pedido.id);
        return pedidoCompleto;
    }
    async findAll(page, limit, search, status, clienteId, dataInicio, dataFim) {
        const skip = page && limit ? (page - 1) * limit : 0;
        const take = limit || 10;
        const where = {};
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        return this.convertNullToUndefined(pedido);
    }
    async update(id, updatePedidoDto) {
        const existingPedido = await this.prisma.pedido.findUnique({
            where: { id },
        });
        if (!existingPedido) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        if (existingPedido.status === 'PEDIDO_FINALIZADO' || existingPedido.status === 'CANCELADO') {
            throw new common_1.BadRequestException('Não é possível atualizar pedidos finalizados ou cancelados');
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
    async updateColheita(id, updateColheitaDto) {
        const existingPedido = await this.prisma.pedido.findUnique({
            where: { id },
        });
        if (!existingPedido) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        if (existingPedido.status !== 'PEDIDO_CRIADO' && existingPedido.status !== 'AGUARDANDO_COLHEITA') {
            throw new common_1.BadRequestException('Status do pedido não permite atualizar colheita');
        }
        for (const fruta of updateColheitaDto.frutas) {
            const hasAreaPropria = fruta.areaPropriaId !== undefined && fruta.areaPropriaId !== null;
            const hasAreaFornecedor = fruta.areaFornecedorId !== undefined && fruta.areaFornecedorId !== null;
            if (!hasAreaPropria && !hasAreaFornecedor) {
                throw new common_1.BadRequestException(`Fruta ${fruta.frutaPedidoId}: É obrigatório selecionar uma área de origem (própria ou fornecedor)`);
            }
            if (hasAreaPropria && hasAreaFornecedor) {
                throw new common_1.BadRequestException(`Fruta ${fruta.frutaPedidoId}: Não é possível selecionar área própria e de fornecedor simultaneamente`);
            }
            if (fruta.areaPropriaId) {
                const areaPropria = await this.prisma.areaAgricola.findUnique({
                    where: { id: fruta.areaPropriaId },
                });
                if (!areaPropria) {
                    throw new common_1.NotFoundException(`Área própria ${fruta.areaPropriaId} não encontrada`);
                }
            }
            if (fruta.areaFornecedorId) {
                const areaFornecedor = await this.prisma.areaFornecedor.findUnique({
                    where: { id: fruta.areaFornecedorId },
                });
                if (!areaFornecedor) {
                    throw new common_1.NotFoundException(`Área de fornecedor ${fruta.areaFornecedorId} não encontrada`);
                }
            }
        }
        const pedido = await this.prisma.$transaction(async (prisma) => {
            const pedidoAtualizado = await prisma.pedido.update({
                where: { id },
                data: {
                    dataColheita: updateColheitaDto.dataColheita,
                    observacoesColheita: updateColheitaDto.observacoesColheita,
                    status: 'COLHEITA_REALIZADA',
                    pesagem: updateColheitaDto.pesagem,
                    placaPrimaria: updateColheitaDto.placaPrimaria,
                    placaSecundaria: updateColheitaDto.placaSecundaria,
                    nomeMotorista: updateColheitaDto.nomeMotorista,
                },
            });
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
        const pedidoCompleto = await this.findOne(id);
        return pedidoCompleto;
    }
    async updatePrecificacao(id, updatePrecificacaoDto) {
        const existingPedido = await this.prisma.pedido.findUnique({
            where: { id },
        });
        if (!existingPedido) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        if (existingPedido.status !== 'COLHEITA_REALIZADA') {
            throw new common_1.BadRequestException('Status do pedido não permite precificação');
        }
        const pedido = await this.prisma.$transaction(async (prisma) => {
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
            for (const fruta of updatePrecificacaoDto.frutas) {
                const frutaPedido = await prisma.frutasPedidos.findUnique({
                    where: { id: fruta.frutaPedidoId },
                });
                if (!frutaPedido) {
                    throw new common_1.NotFoundException(`Fruta do pedido com ID ${fruta.frutaPedidoId} não encontrada`);
                }
                const unidadeInput = fruta.unidadePrecificada?.trim()?.toUpperCase();
                const unidadeSalva = frutaPedido.unidadePrecificada?.toString().trim().toUpperCase();
                const unidadeMedida1 = frutaPedido.unidadeMedida1?.toString().trim().toUpperCase();
                const unidadeMedida2 = frutaPedido.unidadeMedida2?.toString().trim().toUpperCase();
                let unidadeEfetiva = unidadeInput || unidadeSalva || undefined;
                if (!unidadeEfetiva) {
                    if (unidadeMedida2 && (frutaPedido.quantidadeReal2 || 0) > 0) {
                        unidadeEfetiva = unidadeMedida2;
                    }
                    else {
                        unidadeEfetiva = unidadeMedida1;
                    }
                }
                let quantidadeParaCalculo = 0;
                if (unidadeEfetiva === unidadeMedida1) {
                    quantidadeParaCalculo = frutaPedido.quantidadeReal || 0;
                }
                else if (unidadeEfetiva === unidadeMedida2) {
                    quantidadeParaCalculo = frutaPedido.quantidadeReal2 || 0;
                }
                else {
                    quantidadeParaCalculo = frutaPedido.quantidadeReal || 0;
                }
                const valores = this.calcularValoresFruta(quantidadeParaCalculo, fruta.valorUnitario);
                await prisma.frutasPedidos.update({
                    where: { id: fruta.frutaPedidoId },
                    data: {
                        valorUnitario: fruta.valorUnitario,
                        valorTotal: valores.valorTotal,
                        unidadePrecificada: unidadeEfetiva,
                    },
                });
            }
            const frutasDoPedido = await prisma.frutasPedidos.findMany({ where: { pedidoId: id } });
            let valorTotalFrutas = 0;
            for (const fp of frutasDoPedido) {
                const unidadePrec = fp.unidadePrecificada?.toString().trim().toUpperCase();
                const um1 = fp.unidadeMedida1?.toString().trim().toUpperCase();
                const um2 = fp.unidadeMedida2?.toString().trim().toUpperCase();
                let qtd = 0;
                if (unidadePrec === um2) {
                    qtd = fp.quantidadeReal2 || 0;
                }
                else {
                    qtd = fp.quantidadeReal || 0;
                }
                const vt = Number(((qtd || 0) * (fp.valorUnitario || 0)).toFixed(2));
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
        const pedidoCompleto = await this.findOne(id);
        return pedidoCompleto;
    }
    async findPagamentosByPedido(pedidoId) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { id: pedidoId },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        const pagamentos = await this.prisma.pagamentosPedidos.findMany({
            where: { pedidoId: pedidoId },
            orderBy: { dataPagamento: 'asc' },
        });
        return this.convertNullToUndefined(pagamentos);
    }
    async createPagamento(createPagamentoDto) {
        const pedido = await this.prisma.pedido.findUnique({
            where: { id: createPagamentoDto.pedidoId },
        });
        if (!pedido) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        if (pedido.status !== 'PRECIFICACAO_REALIZADA' && pedido.status !== 'AGUARDANDO_PAGAMENTO' && pedido.status !== 'PAGAMENTO_PARCIAL') {
            throw new common_1.BadRequestException('Status do pedido não permite registrar pagamento');
        }
        if (createPagamentoDto.valorRecebido <= 0) {
            throw new common_1.BadRequestException('Valor do pagamento deve ser maior que zero');
        }
        const valorRecebidoAtual = await this.calcularValorRecebidoConsolidado(createPagamentoDto.pedidoId);
        if (valorRecebidoAtual + createPagamentoDto.valorRecebido > (pedido.valorFinal || 0)) {
            throw new common_1.BadRequestException('Valor do pagamento excede o valor final do pedido');
        }
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
            const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(createPagamentoDto.pedidoId, prisma);
            const pedido = await prisma.pedido.findUnique({
                where: { id: createPagamentoDto.pedidoId },
                select: { valorFinal: true, status: true }
            });
            let novoStatus;
            if (valorRecebidoConsolidado >= (pedido?.valorFinal || 0)) {
                novoStatus = 'PAGAMENTO_REALIZADO';
            }
            else if (valorRecebidoConsolidado > 0) {
                novoStatus = 'PAGAMENTO_PARCIAL';
            }
            else {
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
    async updatePagamentoIndividual(id, updatePagamentoDto) {
        const pagamento = await this.prisma.pagamentosPedidos.findUnique({
            where: { id },
            include: { pedido: true },
        });
        if (!pagamento) {
            throw new common_1.NotFoundException('Pagamento não encontrado');
        }
        if (pagamento.pedido.status !== 'PRECIFICACAO_REALIZADA' && pagamento.pedido.status !== 'AGUARDANDO_PAGAMENTO' && pagamento.pedido.status !== 'PAGAMENTO_PARCIAL') {
            throw new common_1.BadRequestException('Status do pedido não permite atualizar pagamento');
        }
        if (updatePagamentoDto.valorRecebido !== undefined) {
            if (updatePagamentoDto.valorRecebido <= 0) {
                throw new common_1.BadRequestException('Valor do pagamento deve ser maior que zero');
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
                throw new common_1.BadRequestException('Valor total dos pagamentos excede o valor final do pedido');
            }
        }
        const pagamentoAtualizado = await this.prisma.$transaction(async (prisma) => {
            const dadosAtualizacao = {};
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
            const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(pagamento.pedidoId, prisma);
            const pedido = await prisma.pedido.findUnique({
                where: { id: pagamento.pedidoId },
                select: { valorFinal: true, status: true }
            });
            let novoStatus;
            if (valorRecebidoConsolidado >= (pedido?.valorFinal || 0)) {
                novoStatus = 'PAGAMENTO_REALIZADO';
            }
            else if (valorRecebidoConsolidado > 0) {
                novoStatus = 'PAGAMENTO_PARCIAL';
            }
            else {
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
    async removePagamento(id) {
        const pagamento = await this.prisma.pagamentosPedidos.findUnique({
            where: { id },
            include: { pedido: true },
        });
        if (!pagamento) {
            throw new common_1.NotFoundException('Pagamento não encontrado');
        }
        if (pagamento.pedido.status === 'PEDIDO_FINALIZADO') {
            throw new common_1.BadRequestException('Não é possível remover pagamentos de pedidos finalizados');
        }
        await this.prisma.$transaction(async (prisma) => {
            await prisma.pagamentosPedidos.delete({
                where: { id },
            });
            const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(pagamento.pedidoId, prisma);
            const pedido = await prisma.pedido.findUnique({
                where: { id: pagamento.pedidoId },
                select: { valorFinal: true, status: true }
            });
            let novoStatus;
            if (valorRecebidoConsolidado >= (pedido?.valorFinal || 0)) {
                novoStatus = 'PAGAMENTO_REALIZADO';
            }
            else if (valorRecebidoConsolidado > 0) {
                novoStatus = 'PAGAMENTO_PARCIAL';
            }
            else {
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
    async updatePagamento(id, updatePagamentoDto) {
        const existingPedido = await this.prisma.pedido.findUnique({
            where: { id },
        });
        if (!existingPedido) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        if (existingPedido.status !== 'PRECIFICACAO_REALIZADA' && existingPedido.status !== 'AGUARDANDO_PAGAMENTO' && existingPedido.status !== 'PAGAMENTO_PARCIAL') {
            throw new common_1.BadRequestException('Status do pedido não permite registrar pagamento');
        }
        const createPagamentoDto = {
            pedidoId: id,
            dataPagamento: updatePagamentoDto.dataPagamento || new Date().toISOString(),
            valorRecebido: updatePagamentoDto.valorRecebido || 0,
            metodoPagamento: updatePagamentoDto.metodoPagamento || 'PIX',
            contaDestino: updatePagamentoDto.contaDestino || 'ALENCAR',
            observacoesPagamento: updatePagamentoDto.observacoesPagamento
        };
        await this.createPagamento(createPagamentoDto);
        return this.findOne(id);
    }
    async updateCompleto(id, updatePedidoCompletoDto) {
        const existingPedido = await this.prisma.pedido.findUnique({
            where: { id },
        });
        if (!existingPedido) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        if (existingPedido.status === 'PEDIDO_FINALIZADO' || existingPedido.status === 'CANCELADO') {
            throw new common_1.BadRequestException('Não é possível atualizar pedidos finalizados ou cancelados');
        }
        const pedido = await this.prisma.$transaction(async (prisma) => {
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
                    pesagem: updatePedidoCompletoDto.pesagem,
                    placaPrimaria: updatePedidoCompletoDto.placaPrimaria,
                    placaSecundaria: updatePedidoCompletoDto.placaSecundaria,
                    nomeMotorista: updatePedidoCompletoDto.nomeMotorista,
                },
            });
            let houveAlteracaoFrutas = false;
            if (updatePedidoCompletoDto.frutas) {
                for (const fruta of updatePedidoCompletoDto.frutas) {
                    if (fruta.frutaPedidoId) {
                        const frutaPedidoAtual = await prisma.frutasPedidos.findUnique({ where: { id: fruta.frutaPedidoId } });
                        if (!frutaPedidoAtual) {
                            throw new common_1.NotFoundException(`Fruta do pedido com ID ${fruta.frutaPedidoId} não encontrada`);
                        }
                        const unidadeInput = fruta.unidadePrecificada?.trim()?.toUpperCase();
                        const unidadeSalva = frutaPedidoAtual.unidadePrecificada?.toString().trim().toUpperCase();
                        const unidadeMedida1 = frutaPedidoAtual.unidadeMedida1?.toString().trim().toUpperCase();
                        const unidadeMedida2 = frutaPedidoAtual.unidadeMedida2?.toString().trim().toUpperCase();
                        let unidadeEfetiva = unidadeInput || unidadeSalva || undefined;
                        if (!unidadeEfetiva) {
                            const quantidadeReal2Atualizada = fruta.quantidadeReal2 ?? frutaPedidoAtual.quantidadeReal2;
                            if (unidadeMedida2 && (quantidadeReal2Atualizada || 0) > 0) {
                                unidadeEfetiva = unidadeMedida2;
                            }
                            else {
                                unidadeEfetiva = unidadeMedida1;
                            }
                        }
                        let quantidadeParaCalculo = 0;
                        if (unidadeEfetiva === unidadeMedida1) {
                            quantidadeParaCalculo = (fruta.quantidadeReal ?? frutaPedidoAtual.quantidadeReal) || 0;
                        }
                        else if (unidadeEfetiva === unidadeMedida2) {
                            quantidadeParaCalculo = (fruta.quantidadeReal2 ?? frutaPedidoAtual.quantidadeReal2) || 0;
                        }
                        else {
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
                                unidadePrecificada: unidadeEfetiva,
                                valorTotal: valorTotalCalculado,
                                fitaColheita: fruta.fitaColheita,
                            },
                        });
                        houveAlteracaoFrutas = true;
                        continue;
                    }
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
                            }
                            else if (unidadePrecificadaEfetiva === unidadeMedida2) {
                                quantidadeParaCalculo = (fruta.quantidadeReal2 ?? frutaPedidoAtual.quantidadeReal2) || 0;
                            }
                            else {
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
            if (houveAlteracaoFrutas ||
                updatePedidoCompletoDto.frete !== undefined ||
                updatePedidoCompletoDto.icms !== undefined ||
                updatePedidoCompletoDto.desconto !== undefined ||
                updatePedidoCompletoDto.avaria !== undefined) {
                const frutasDoPedido = await prisma.frutasPedidos.findMany({ where: { pedidoId: id } });
                let valorTotalFrutas = 0;
                for (const fp of frutasDoPedido) {
                    const unidadePrec = fp.unidadePrecificada?.toString().trim().toUpperCase();
                    const um1 = fp.unidadeMedida1?.toString().trim().toUpperCase();
                    const um2 = fp.unidadeMedida2?.toString().trim().toUpperCase();
                    let qtd = 0;
                    if (unidadePrec === um1) {
                        qtd = fp.quantidadeReal || 0;
                    }
                    else if (unidadePrec === um2) {
                        qtd = fp.quantidadeReal2 || 0;
                    }
                    else {
                        qtd = fp.quantidadeReal || 0;
                    }
                    const vt = Number(((qtd || 0) * (fp.valorUnitario || 0)).toFixed(2));
                    if ((fp.valorTotal || 0) !== vt) {
                        await prisma.frutasPedidos.update({
                            where: { id: fp.id },
                            data: { valorTotal: vt },
                        });
                    }
                    valorTotalFrutas += vt;
                }
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
            const valorRecebidoConsolidado = await this.calcularValorRecebidoConsolidado(id, prisma);
            if (valorRecebidoConsolidado > 0) {
                await prisma.pedido.update({
                    where: { id },
                    data: {
                        valorRecebido: valorRecebidoConsolidado,
                    },
                });
                const pedidoAtualizado = await prisma.pedido.findUnique({
                    where: { id },
                    select: { valorFinal: true, status: true }
                });
                if (pedidoAtualizado) {
                    let novoStatus;
                    const statusPagamento = ['PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL', 'PAGAMENTO_REALIZADO'];
                    if (statusPagamento.includes(pedidoAtualizado.status)) {
                        if (valorRecebidoConsolidado >= (pedidoAtualizado.valorFinal || 0)) {
                            novoStatus = 'PAGAMENTO_REALIZADO';
                        }
                        else if (valorRecebidoConsolidado > 0) {
                            novoStatus = 'PAGAMENTO_PARCIAL';
                        }
                        else {
                            novoStatus = 'AGUARDANDO_PAGAMENTO';
                        }
                        if (pedidoAtualizado.status !== novoStatus) {
                            await prisma.pedido.update({
                                where: { id },
                                data: { status: novoStatus },
                            });
                        }
                    }
                }
            }
            return pedidoAtualizado;
        });
        const pedidoCompleto = await this.findOne(id);
        return pedidoCompleto;
    }
    async finalizar(id) {
        const existingPedido = await this.prisma.pedido.findUnique({
            where: { id },
        });
        if (!existingPedido) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        if (existingPedido.status !== 'PAGAMENTO_REALIZADO') {
            throw new common_1.BadRequestException('Status do pedido não permite finalização');
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
    async cancelar(id) {
        const existingPedido = await this.prisma.pedido.findUnique({
            where: { id },
        });
        if (!existingPedido) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        if (existingPedido.status === 'PEDIDO_FINALIZADO') {
            throw new common_1.BadRequestException('Não é possível cancelar pedidos finalizados');
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
    async remove(id) {
        const existingPedido = await this.prisma.pedido.findUnique({
            where: { id },
        });
        if (!existingPedido) {
            throw new common_1.NotFoundException('Pedido não encontrado');
        }
        if (existingPedido.status !== 'CANCELADO' && existingPedido.status !== 'PEDIDO_CRIADO') {
            throw new common_1.BadRequestException('Só é possível remover pedidos cancelados ou recém criados');
        }
        await this.prisma.$transaction(async (prisma) => {
            await prisma.frutasPedidos.deleteMany({
                where: { pedidoId: id },
            });
            await prisma.pagamentosPedidos.deleteMany({
                where: { pedidoId: id },
            });
            await prisma.pedido.delete({
                where: { id },
            });
        });
    }
};
exports.PedidosService = PedidosService;
exports.PedidosService = PedidosService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PedidosService);
//# sourceMappingURL=pedidos.service.js.map