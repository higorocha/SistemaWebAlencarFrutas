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
exports.HistoricoFitasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let HistoricoFitasService = class HistoricoFitasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async registrarAcao(controleBananaId, usuarioId, acao, dadosAnteriores, dadosNovos) {
        return await this.prisma.historicoFitas.create({
            data: {
                controleBananaId,
                usuarioId,
                acao,
                dadosAnteriores: dadosAnteriores ? JSON.parse(JSON.stringify(dadosAnteriores)) : null,
                dadosNovos: dadosNovos ? JSON.parse(JSON.stringify(dadosNovos)) : null,
            }
        });
    }
    async findByControle(controleBananaId) {
        return await this.prisma.historicoFitas.findMany({
            where: { controleBananaId },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                    }
                },
                controleBanana: {
                    include: {
                        fitaBanana: {
                            select: {
                                id: true,
                                nome: true,
                                corHex: true,
                            }
                        },
                        areaAgricola: {
                            select: {
                                id: true,
                                nome: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
    }
    async findAll(page, limit) {
        const skip = page && limit ? (page - 1) * limit : undefined;
        const take = limit || undefined;
        const [historicos, total] = await Promise.all([
            this.prisma.historicoFitas.findMany({
                skip,
                take,
                include: {
                    usuario: {
                        select: {
                            id: true,
                            nome: true,
                        }
                    },
                    controleBanana: {
                        include: {
                            fitaBanana: {
                                select: {
                                    id: true,
                                    nome: true,
                                    corHex: true,
                                }
                            },
                            areaAgricola: {
                                select: {
                                    id: true,
                                    nome: true,
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.historicoFitas.count()
        ]);
        return {
            data: historicos,
            total,
            page: page || 1,
            limit: limit || total,
            totalPages: limit ? Math.ceil(total / limit) : 1
        };
    }
    async findOne(id) {
        const historico = await this.prisma.historicoFitas.findUnique({
            where: { id },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                    }
                },
                controleBanana: {
                    include: {
                        fitaBanana: {
                            select: {
                                id: true,
                                nome: true,
                                corHex: true,
                            }
                        },
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
        if (!historico) {
            throw new common_1.NotFoundException('Histórico não encontrado');
        }
        return historico;
    }
    async findByUsuario(usuarioId, page, limit) {
        const skip = page && limit ? (page - 1) * limit : undefined;
        const take = limit || undefined;
        const [historicos, total] = await Promise.all([
            this.prisma.historicoFitas.findMany({
                where: { usuarioId },
                skip,
                take,
                include: {
                    controleBanana: {
                        include: {
                            fitaBanana: {
                                select: {
                                    id: true,
                                    nome: true,
                                    corHex: true,
                                }
                            },
                            areaAgricola: {
                                select: {
                                    id: true,
                                    nome: true,
                                }
                            }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            }),
            this.prisma.historicoFitas.count({
                where: { usuarioId }
            })
        ]);
        return {
            data: historicos,
            total,
            page: page || 1,
            limit: limit || total,
            totalPages: limit ? Math.ceil(total / limit) : 1
        };
    }
    async getEstatisticas() {
        const totalHistorico = await this.prisma.historicoFitas.count();
        const acoesPorTipo = await this.prisma.historicoFitas.groupBy({
            by: ['acao'],
            _count: {
                _all: true
            }
        });
        const ultimasAcoes = await this.prisma.historicoFitas.findMany({
            take: 10,
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                    }
                },
                controleBanana: {
                    include: {
                        fitaBanana: {
                            select: {
                                id: true,
                                nome: true,
                                corHex: true,
                            }
                        },
                        areaAgricola: {
                            select: {
                                id: true,
                                nome: true,
                            }
                        }
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });
        return {
            totalHistorico,
            acoesPorTipo: acoesPorTipo.reduce((acc, curr) => {
                acc[curr.acao] = curr._count._all;
                return acc;
            }, {}),
            ultimasAcoes
        };
    }
};
exports.HistoricoFitasService = HistoricoFitasService;
exports.HistoricoFitasService = HistoricoFitasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], HistoricoFitasService);
//# sourceMappingURL=historico-fitas.service.js.map