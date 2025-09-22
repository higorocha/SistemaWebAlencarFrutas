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
exports.ControleBananaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const historico_fitas_service_1 = require("../historico-fitas/historico-fitas.service");
let ControleBananaService = class ControleBananaService {
    prisma;
    historicoFitasService;
    constructor(prisma, historicoFitasService) {
        this.prisma = prisma;
        this.historicoFitasService = historicoFitasService;
    }
    parseDataRegistro(dataStr) {
        if (dataStr.includes('T') || dataStr.includes(' ')) {
            return new Date(dataStr);
        }
        return new Date(dataStr + 'T12:00:00.000Z');
    }
    calcularTempoDesdeData(dataRegistro) {
        const hoje = new Date();
        const dataInicio = new Date(dataRegistro);
        hoje.setHours(0, 0, 0, 0);
        dataInicio.setHours(0, 0, 0, 0);
        const diferencaMs = hoje.getTime() - dataInicio.getTime();
        const dias = Math.floor(diferencaMs / (1000 * 60 * 60 * 24));
        const semanas = Math.floor(dias / 7);
        return { dias, semanas };
    }
    async create(createControleBananaDto, usuarioId) {
        try {
            const fita = await this.prisma.fitaBanana.findUnique({
                where: { id: createControleBananaDto.fitaBananaId }
            });
            if (!fita) {
                throw new common_1.NotFoundException('Fita de banana não encontrada');
            }
            const area = await this.prisma.areaAgricola.findUnique({
                where: { id: createControleBananaDto.areaAgricolaId }
            });
            if (!area) {
                throw new common_1.NotFoundException('Área agrícola não encontrada');
            }
            const dataRegistro = createControleBananaDto.dataRegistro
                ? this.parseDataRegistro(createControleBananaDto.dataRegistro)
                : new Date();
            const inicioDia = new Date(dataRegistro);
            inicioDia.setUTCHours(0, 0, 0, 0);
            const fimDia = new Date(dataRegistro);
            fimDia.setUTCHours(23, 59, 59, 999);
            const registroExistente = await this.prisma.controleBanana.findFirst({
                where: {
                    fitaBananaId: createControleBananaDto.fitaBananaId,
                    areaAgricolaId: createControleBananaDto.areaAgricolaId,
                    dataRegistro: {
                        gte: inicioDia,
                        lte: fimDia
                    }
                },
                include: {
                    fitaBanana: {
                        select: {
                            nome: true,
                            corHex: true
                        }
                    }
                }
            });
            if (registroExistente) {
                throw new common_1.ConflictException(`Não é possível cadastrar outro lote da fita "${registroExistente.fitaBanana.nome}" para a área "${area.nome}" no mesmo dia (${dataRegistro.toLocaleDateString('pt-BR')}). ` +
                    `Já existe um registro cadastrado hoje. Por favor, edite o lote existente ao invés de criar um novo.`);
            }
            const controle = await this.prisma.controleBanana.create({
                data: {
                    ...createControleBananaDto,
                    dataRegistro,
                    usuarioId,
                    quantidadeInicialFitas: createControleBananaDto.quantidadeFitas,
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
            await this.historicoFitasService.registrarAcao(controle.id, usuarioId, 'CRIADO', null, {
                fitaBananaId: controle.fitaBananaId,
                areaAgricolaId: controle.areaAgricolaId,
                quantidadeFitas: controle.quantidadeFitas,
                dataRegistro: controle.dataRegistro,
                observacoes: controle.observacoes
            });
            return controle;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao criar controle de banana');
        }
    }
    async findAll(page, limit) {
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
    async findOne(id) {
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
            throw new common_1.NotFoundException('Controle de banana não encontrado');
        }
        return controle;
    }
    async update(id, updateControleBananaDto, usuarioId) {
        try {
            const controleAtual = await this.findOne(id);
            if (updateControleBananaDto.fitaBananaId) {
                const fita = await this.prisma.fitaBanana.findUnique({
                    where: { id: updateControleBananaDto.fitaBananaId }
                });
                if (!fita) {
                    throw new common_1.NotFoundException('Fita de banana não encontrada');
                }
            }
            if (updateControleBananaDto.areaAgricolaId) {
                const area = await this.prisma.areaAgricola.findUnique({
                    where: { id: updateControleBananaDto.areaAgricolaId }
                });
                if (!area) {
                    throw new common_1.NotFoundException('Área agrícola não encontrada');
                }
            }
            const dataRegistro = updateControleBananaDto.dataRegistro
                ? this.parseDataRegistro(updateControleBananaDto.dataRegistro)
                : undefined;
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
            await this.historicoFitasService.registrarAcao(id, usuarioId, 'EDITADO', {
                fitaBananaId: controleAtual.fitaBanana.id,
                areaAgricolaId: controleAtual.areaAgricola.id,
                quantidadeFitas: controleAtual.quantidadeFitas,
                dataRegistro: controleAtual.dataRegistro,
                observacoes: controleAtual.observacoes
            }, {
                fitaBananaId: controleAtualizado.fitaBanana.id,
                areaAgricolaId: controleAtualizado.areaAgricola.id,
                quantidadeFitas: controleAtualizado.quantidadeFitas,
                dataRegistro: controleAtualizado.dataRegistro,
                observacoes: controleAtualizado.observacoes
            });
            return controleAtualizado;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao atualizar controle de banana');
        }
    }
    async remove(id, usuarioId) {
        try {
            const controleAtual = await this.findOne(id);
            await this.historicoFitasService.registrarAcao(id, usuarioId, 'REMOVIDO', {
                fitaBananaId: controleAtual.fitaBanana.id,
                areaAgricolaId: controleAtual.areaAgricola.id,
                quantidadeFitas: controleAtual.quantidadeFitas,
                dataRegistro: controleAtual.dataRegistro,
                observacoes: controleAtual.observacoes
            }, null);
            await this.prisma.controleBanana.delete({
                where: { id }
            });
            return { message: 'Controle de banana excluído com sucesso' };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao excluir controle de banana');
        }
    }
    async findByArea(areaId) {
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
        const dadosAgregados = await this.prisma.controleBanana.groupBy({
            by: ['areaAgricolaId'],
            _sum: {
                quantidadeFitas: true
            },
            _count: {
                _all: true
            }
        });
        const areasComTotais = dadosPorArea.map(area => {
            const totais = dadosAgregados.find(d => d.areaAgricolaId === area.id);
            const fitasComTempo = area.controlesBanana.reduce((acc, controle) => {
                const fita = controle.fitaBanana;
                const fitaExiste = acc.find(f => f.id === fita.id);
                if (fitaExiste) {
                    fitaExiste.quantidadeFitas += controle.quantidadeFitas;
                    if (controle.dataRegistro < fitaExiste.dataMaisAntiga) {
                        fitaExiste.dataMaisAntiga = controle.dataRegistro;
                        fitaExiste.tempoDesdeData = this.calcularTempoDesdeData(controle.dataRegistro);
                    }
                }
                else {
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
    async getDetalhesArea(areaId) {
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
            throw new common_1.NotFoundException('Área não encontrada');
        }
        const controlesDetalhados = area.controlesBanana
            .filter(controle => controle.quantidadeFitas > 0)
            .map(controle => {
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
                dataRegistro: dataRegistroCorrigida,
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
    async getDetalhesFita(fitaId) {
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
            throw new common_1.NotFoundException('Fita não encontrada');
        }
        const controlesDetalhados = fita.controles
            .filter(controle => controle.quantidadeFitas > 0)
            .map(controle => {
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
                dataRegistro: dataRegistroCorrigida,
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
        const areasComFitas = await this.prisma.areaAgricola.findMany({
            where: {
                controlesBanana: {
                    some: {}
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
        return areasComFitas.map(area => {
            const fitasComQuantidade = area.controlesBanana.reduce((acc, controle) => {
                const fita = controle.fitaBanana;
                const fitaExiste = acc.find(f => f.id === fita.id);
                if (fitaExiste) {
                    fitaExiste.quantidadeFitas += controle.quantidadeFitas;
                    if (controle.dataRegistro < fitaExiste.dataMaisAntiga) {
                        fitaExiste.dataMaisAntiga = controle.dataRegistro;
                        fitaExiste.tempoDesdeData = this.calcularTempoDesdeData(controle.dataRegistro);
                    }
                }
                else {
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
    async getFitasComAreas() {
        try {
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
                        orderBy: {
                            dataRegistro: 'desc'
                        }
                    }
                },
                orderBy: {
                    nome: 'asc'
                }
            });
            const fitasComAreas = [];
            fitas.forEach((fita, fitaIndex) => {
                const areasMap = new Map();
                fita.controles.forEach((controle, controleIndex) => {
                    const area = controle.areaAgricola;
                    const culturas = area.lotes
                        .map(lote => lote.cultura?.descricao)
                        .filter(Boolean)
                        .join(', ') || 'Não informado';
                    const quantidadeDisponivel = controle.quantidadeFitas;
                    if (!areasMap.has(area.id)) {
                        areasMap.set(area.id, {
                            areaId: area.id,
                            areaPropriaId: area.id,
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
                        id: controle.id,
                        quantidadeFitas: controle.quantidadeFitas,
                        dataRegistro: controle.dataRegistro,
                        observacoes: controle.observacoes,
                        tempoDesdeData: this.calcularTempoDesdeData(controle.dataRegistro)
                    });
                });
                const areas = Array.from(areasMap.values())
                    .sort((a, b) => a.nome.localeCompare(b.nome));
                if (areas.length > 0) {
                    const fitaComArea = {
                        id: fita.id,
                        fitaBananaId: fita.id,
                        nome: fita.nome,
                        corHex: fita.corHex,
                        totalDisponivel: areas.reduce((total, area) => total + area.quantidadeDisponivel, 0),
                        areas: areas
                    };
                    fitasComAreas.push(fitaComArea);
                }
            });
            fitasComAreas.sort((a, b) => a.nome.localeCompare(b.nome));
            return fitasComAreas;
        }
        catch (error) {
            throw new common_1.BadRequestException('Erro ao buscar fitas disponíveis');
        }
    }
    async subtrairEstoquePorControle(controleBananaId, quantidade, usuarioId) {
        const controle = await this.prisma.controleBanana.findUnique({
            where: { id: controleBananaId }
        });
        if (!controle) {
            throw new common_1.NotFoundException(`Lote de controle com ID ${controleBananaId} não encontrado`);
        }
        if (controle.quantidadeFitas < quantidade) {
            throw new common_1.BadRequestException(`Estoque insuficiente no lote ${controleBananaId}. Disponível: ${controle.quantidadeFitas}, Solicitado: ${quantidade}`);
        }
        await this.historicoFitasService.registrarAcao(controleBananaId, usuarioId, 'USADO_PEDIDO', {
            quantidadeFitas: controle.quantidadeFitas,
            observacoes: controle.observacoes
        }, {
            quantidadeFitas: controle.quantidadeFitas - quantidade,
            observacoes: controle.observacoes
        });
        await this.prisma.controleBanana.update({
            where: { id: controleBananaId },
            data: {
                quantidadeFitas: controle.quantidadeFitas - quantidade
            }
        });
    }
    async adicionarEstoquePorControle(controleBananaId, quantidade, usuarioId) {
        const controle = await this.prisma.controleBanana.findUnique({
            where: { id: controleBananaId }
        });
        if (!controle) {
            throw new common_1.NotFoundException(`Lote de controle com ID ${controleBananaId} não encontrado`);
        }
        await this.historicoFitasService.registrarAcao(controleBananaId, usuarioId, 'LIBERADO_EDICAO', {
            quantidadeFitas: controle.quantidadeFitas,
            observacoes: controle.observacoes
        }, {
            quantidadeFitas: controle.quantidadeFitas + quantidade,
            observacoes: controle.observacoes
        });
        await this.prisma.controleBanana.update({
            where: { id: controleBananaId },
            data: {
                quantidadeFitas: controle.quantidadeFitas + quantidade
            }
        });
    }
    async processarSubtracaoFitas(detalhesAreas, usuarioId) {
        for (const detalhe of detalhesAreas) {
            await this.subtrairEstoquePorControle(detalhe.controleBananaId, detalhe.quantidade, usuarioId);
        }
    }
    async processarAjusteEstoqueParaEdicao(fitasAntigas, fitasNovas, usuarioId) {
        for (const fita of fitasAntigas) {
            await this.adicionarEstoquePorControle(fita.controleBananaId, fita.quantidade, usuarioId);
        }
        for (const fita of fitasNovas) {
            await this.subtrairEstoquePorControle(fita.controleBananaId, fita.quantidade, usuarioId);
        }
    }
};
exports.ControleBananaService = ControleBananaService;
exports.ControleBananaService = ControleBananaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        historico_fitas_service_1.HistoricoFitasService])
], ControleBananaService);
//# sourceMappingURL=controle-banana.service.js.map