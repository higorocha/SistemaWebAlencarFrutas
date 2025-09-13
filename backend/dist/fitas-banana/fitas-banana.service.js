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
exports.FitasBananaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FitasBananaService = class FitasBananaService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createFitaBananaDto, usuarioId) {
        try {
            const fitaExistente = await this.prisma.fitaBanana.findUnique({
                where: { nome: createFitaBananaDto.nome }
            });
            if (fitaExistente) {
                throw new common_1.ConflictException('Já existe uma fita com esse nome');
            }
            if (!createFitaBananaDto.corHex.startsWith('#')) {
                throw new common_1.BadRequestException('Cor deve começar com #');
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
        }
        catch (error) {
            if (error instanceof common_1.ConflictException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao criar fita de banana');
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
        return fitas.map(fita => ({
            ...fita,
            _count: {
                controles: fita.controles.length
            },
            _sum: {
                quantidadeFitas: fita.controles.reduce((total, controle) => total + controle.quantidadeFitas, 0)
            },
            controles: undefined
        }));
    }
    async findOne(id) {
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
            throw new common_1.NotFoundException('Fita de banana não encontrada');
        }
        return fita;
    }
    async update(id, updateFitaBananaDto, usuarioId) {
        try {
            const fitaExistente = await this.findOne(id);
            if (updateFitaBananaDto.nome && updateFitaBananaDto.nome !== fitaExistente.nome) {
                const nomeConflitante = await this.prisma.fitaBanana.findUnique({
                    where: { nome: updateFitaBananaDto.nome }
                });
                if (nomeConflitante) {
                    throw new common_1.ConflictException('Já existe uma fita com esse nome');
                }
            }
            if (updateFitaBananaDto.corHex && !updateFitaBananaDto.corHex.startsWith('#')) {
                throw new common_1.BadRequestException('Cor deve começar com #');
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
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao atualizar fita de banana');
        }
    }
    async remove(id) {
        try {
            await this.findOne(id);
            const controlesAtivos = await this.prisma.controleBanana.count({
                where: { fitaBananaId: id }
            });
            if (controlesAtivos > 0) {
                throw new common_1.ConflictException('Não é possível excluir esta fita pois ela está sendo usada em registros de controle');
            }
            await this.prisma.fitaBanana.delete({
                where: { id }
            });
            return { message: 'Fita de banana excluída com sucesso' };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao excluir fita de banana');
        }
    }
    async findByUsuario(usuarioId) {
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
    async getEstoqueFita(fitaId) {
        try {
            const fita = await this.prisma.fitaBanana.findUnique({
                where: { id: fitaId },
                select: { id: true, nome: true, corHex: true }
            });
            if (!fita) {
                throw new common_1.NotFoundException('Fita de banana não encontrada');
            }
            const lotes = await this.prisma.controleBanana.findMany({
                where: {
                    fitaBananaId: fitaId,
                    quantidadeFitas: { gt: 0 }
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
                    dataRegistro: 'desc'
                }
            });
            const fitasUtilizadas = await this.prisma.frutasPedidosFitas.aggregate({
                where: { fitaBananaId: fitaId },
                _sum: { quantidadeFita: true }
            });
            const estoqueTotalCalculado = lotes.reduce((total, lote) => total + lote.quantidadeFitas, 0);
            const fitasUtilizadasCalculadas = fitasUtilizadas._sum.quantidadeFita || 0;
            const estoqueDisponivel = estoqueTotalCalculado - fitasUtilizadasCalculadas;
            let status;
            if (estoqueDisponivel <= 0) {
                status = 'esgotado';
            }
            else if (estoqueDisponivel <= 10) {
                status = 'baixo';
            }
            else {
                status = 'disponivel';
            }
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
                lotes: lotesProcessados,
                ultimaAtualizacao: new Date()
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.BadRequestException('Erro ao consultar estoque da fita');
        }
    }
};
exports.FitasBananaService = FitasBananaService;
exports.FitasBananaService = FitasBananaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FitasBananaService);
//# sourceMappingURL=fitas-banana.service.js.map