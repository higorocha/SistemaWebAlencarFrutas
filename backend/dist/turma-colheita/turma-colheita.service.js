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
exports.TurmaColheitaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let TurmaColheitaService = class TurmaColheitaService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createTurmaColheitaDto) {
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
    async findAll() {
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
        const turmasComEstatisticas = await Promise.all(turmasColheita.map(async (turma) => {
            const estatisticas = await this.getEstatisticasPorTurma(turma.id);
            return {
                ...turma,
                estatisticas: {
                    totalGeral: estatisticas.totalGeral,
                    totaisPorUnidade: estatisticas.totaisPorUnidade,
                },
            };
        }));
        return turmasComEstatisticas;
    }
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Turma de colheita com ID ${id} não encontrada`);
        }
        return turmaColheita;
    }
    async update(id, updateTurmaColheitaDto) {
        const turmaExiste = await this.prisma.turmaColheita.findUnique({
            where: { id },
        });
        if (!turmaExiste) {
            throw new common_1.NotFoundException(`Turma de colheita com ID ${id} não encontrada`);
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
    async remove(id) {
        const turmaExiste = await this.prisma.turmaColheita.findUnique({
            where: { id },
        });
        if (!turmaExiste) {
            throw new common_1.NotFoundException(`Turma de colheita com ID ${id} não encontrada`);
        }
        await this.prisma.turmaColheita.delete({
            where: { id },
        });
    }
    async createCustoColheita(createCustoDto) {
        const { turmaColheitaId, pedidoId, frutaId, dataColheita, ...colheitaData } = createCustoDto;
        const turmaExiste = await this.prisma.turmaColheita.findUnique({
            where: { id: turmaColheitaId },
        });
        if (!turmaExiste) {
            throw new common_1.NotFoundException(`Turma de colheita com ID ${turmaColheitaId} não encontrada`);
        }
        const pedidoExiste = await this.prisma.pedido.findUnique({
            where: { id: pedidoId },
        });
        if (!pedidoExiste) {
            throw new common_1.NotFoundException(`Pedido com ID ${pedidoId} não encontrado`);
        }
        const frutaExiste = await this.prisma.fruta.findUnique({
            where: { id: frutaId },
        });
        if (!frutaExiste) {
            throw new common_1.NotFoundException(`Fruta com ID ${frutaId} não encontrada`);
        }
        const frutaNoPedido = await this.prisma.frutasPedidos.findFirst({
            where: {
                pedidoId: pedidoId,
                frutaId: frutaId,
            },
        });
        if (!frutaNoPedido) {
            throw new common_1.BadRequestException(`Fruta com ID ${frutaId} não encontrada no pedido ${pedidoId}`);
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
    async findAllColheitasPedidos() {
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
    async findOneColheitaPedido(id) {
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
            throw new common_1.NotFoundException(`Colheita de pedido com ID ${id} não encontrada`);
        }
        return colheitaPedido;
    }
    async updateColheitaPedido(id, updateColheitaPedidoDto) {
        const colheitaExiste = await this.prisma.turmaColheitaPedidoCusto.findUnique({
            where: { id },
        });
        if (!colheitaExiste) {
            throw new common_1.NotFoundException(`Colheita de pedido com ID ${id} não encontrada`);
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
    async removeColheitaPedido(id) {
        const colheitaExiste = await this.prisma.turmaColheitaPedidoCusto.findUnique({
            where: { id },
        });
        if (!colheitaExiste) {
            throw new common_1.NotFoundException(`Colheita de pedido com ID ${id} não encontrada`);
        }
        await this.prisma.turmaColheitaPedidoCusto.delete({
            where: { id },
        });
    }
    async findColheitasByPedido(pedidoId) {
        const pedidoExiste = await this.prisma.pedido.findUnique({
            where: { id: pedidoId },
        });
        if (!pedidoExiste) {
            throw new common_1.NotFoundException(`Pedido com ID ${pedidoId} não encontrado`);
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
    async findColheitasByTurma(turmaColheitaId) {
        const turmaExiste = await this.prisma.turmaColheita.findUnique({
            where: { id: turmaColheitaId },
        });
        if (!turmaExiste) {
            throw new common_1.NotFoundException(`Turma de colheita com ID ${turmaColheitaId} não encontrada`);
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
    async findByPedido(pedidoId) {
        const pedidoExiste = await this.prisma.pedido.findUnique({
            where: { id: pedidoId },
        });
        if (!pedidoExiste) {
            throw new common_1.NotFoundException(`Pedido com ID ${pedidoId} não encontrado`);
        }
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
    async findByFruta(frutaId) {
        const frutaExiste = await this.prisma.fruta.findUnique({
            where: { id: frutaId },
        });
        if (!frutaExiste) {
            throw new common_1.NotFoundException(`Fruta com ID ${frutaId} não encontrada`);
        }
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
    async getEstatisticasPorTurma(turmaId) {
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
        }, {});
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
};
exports.TurmaColheitaService = TurmaColheitaService;
exports.TurmaColheitaService = TurmaColheitaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TurmaColheitaService);
//# sourceMappingURL=turma-colheita.service.js.map