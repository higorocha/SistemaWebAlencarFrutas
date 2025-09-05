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
exports.NotificacoesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const dto_1 = require("./dto");
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
let NotificacoesService = class NotificacoesService {
    prisma;
    server;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createNotificacaoDto, userId) {
        const data = {
            ...createNotificacaoDto,
            usuarioId: createNotificacaoDto.usuarioId || userId,
            expirarEm: createNotificacaoDto.expirarEm ? new Date(createNotificacaoDto.expirarEm) : null,
        };
        const notificacao = await this.prisma.notificacao.create({
            data,
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                    },
                },
            },
        });
        this.emitNovaNotificacao(notificacao);
        return this.mapToResponseDto(notificacao);
    }
    async findAll(userId) {
        const where = {
            AND: [
                {
                    OR: [
                        { usuarioId: null },
                        { usuarioId: userId },
                    ],
                },
                {
                    OR: [
                        { expirarEm: null },
                        { expirarEm: { gt: new Date() } },
                    ],
                },
                {
                    status: {
                        not: dto_1.StatusNotificacao.DESCARTADA,
                    },
                },
            ],
        };
        const [notificacoes, naoLidas] = await Promise.all([
            this.prisma.notificacao.findMany({
                where,
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
            }),
            this.prisma.notificacao.count({
                where: {
                    ...where,
                    status: dto_1.StatusNotificacao.NAO_LIDA,
                },
            }),
        ]);
        return {
            notificacoes: notificacoes.map(this.mapToResponseDto),
            nao_lidas: naoLidas,
        };
    }
    async findOne(id, userId) {
        const notificacao = await this.prisma.notificacao.findFirst({
            where: {
                id,
                OR: [
                    { usuarioId: null },
                    { usuarioId: userId },
                ],
            },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                    },
                },
            },
        });
        if (!notificacao) {
            throw new common_1.NotFoundException('Notificação não encontrada');
        }
        return this.mapToResponseDto(notificacao);
    }
    async update(id, updateNotificacaoDto, userId) {
        const existingNotificacao = await this.prisma.notificacao.findFirst({
            where: {
                id,
                OR: [
                    { usuarioId: null },
                    { usuarioId: userId },
                ],
            },
        });
        if (!existingNotificacao) {
            throw new common_1.NotFoundException('Notificação não encontrada');
        }
        const data = {
            ...updateNotificacaoDto,
            expirarEm: updateNotificacaoDto.expirarEm ? new Date(updateNotificacaoDto.expirarEm) : undefined,
        };
        const notificacao = await this.prisma.notificacao.update({
            where: { id },
            data,
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                    },
                },
            },
        });
        return this.mapToResponseDto(notificacao);
    }
    async remove(id, userId) {
        const notificacao = await this.prisma.notificacao.findFirst({
            where: {
                id,
                OR: [
                    { usuarioId: null },
                    { usuarioId: userId },
                ],
            },
        });
        if (!notificacao) {
            throw new common_1.NotFoundException('Notificação não encontrada');
        }
        await this.prisma.notificacao.delete({
            where: { id },
        });
    }
    async marcarComoLida(id, userId) {
        const notificacao = await this.prisma.notificacao.findFirst({
            where: {
                id,
                OR: [
                    { usuarioId: null },
                    { usuarioId: userId },
                ],
            },
        });
        if (!notificacao) {
            throw new common_1.NotFoundException('Notificação não encontrada');
        }
        const updatedNotificacao = await this.prisma.notificacao.update({
            where: { id },
            data: { status: dto_1.StatusNotificacao.LIDA },
            include: {
                usuario: {
                    select: {
                        id: true,
                        nome: true,
                        email: true,
                    },
                },
            },
        });
        this.emitNotificacaoLida(id);
        return this.mapToResponseDto(updatedNotificacao);
    }
    async marcarTodasComoLidas(userId) {
        await this.prisma.notificacao.updateMany({
            where: {
                OR: [
                    { usuarioId: null },
                    { usuarioId: userId },
                ],
                status: dto_1.StatusNotificacao.NAO_LIDA,
            },
            data: { status: dto_1.StatusNotificacao.LIDA },
        });
        this.emitTodasNotificacoesLidas();
    }
    async descartarNotificacao(id, userId) {
        const notificacao = await this.prisma.notificacao.findFirst({
            where: {
                id,
                OR: [
                    { usuarioId: null },
                    { usuarioId: userId },
                ],
            },
        });
        if (!notificacao) {
            throw new common_1.NotFoundException('Notificação não encontrada');
        }
        const eraNaoLida = notificacao.status === dto_1.StatusNotificacao.NAO_LIDA;
        await this.prisma.notificacao.update({
            where: { id },
            data: { status: dto_1.StatusNotificacao.DESCARTADA },
        });
        this.emitNotificacaoDescartada(id, eraNaoLida);
    }
    async criarNotificacaoSistema(titulo, conteudo, dadosAdicionais) {
        return this.create({
            titulo,
            conteudo,
            tipo: dto_1.TipoNotificacao.SISTEMA,
            dadosAdicionais,
        });
    }
    async criarNotificacaoPagamento(nomeCliente, valor, tipo) {
        const conteudo = `O Irrigante ${nomeCliente} pagou um ${tipo.toLowerCase()} no valor de R$ ${valor.toFixed(2).replace('.', ',')}`;
        return this.create({
            titulo: `Pagamento ${tipo} recebido`,
            conteudo,
            tipo: tipo === 'PIX' ? dto_1.TipoNotificacao.PIX : dto_1.TipoNotificacao.BOLETO,
            dadosAdicionais: {
                cliente: nomeCliente,
                valor,
                tipo_pagamento: tipo,
            },
        });
    }
    async limparNotificacoesExpiradas() {
        await this.prisma.notificacao.deleteMany({
            where: {
                expirarEm: {
                    not: null,
                    lt: new Date(),
                },
            },
        });
    }
    mapToResponseDto(notificacao) {
        return {
            id: notificacao.id,
            titulo: notificacao.titulo,
            conteudo: notificacao.conteudo,
            tipo: notificacao.tipo,
            status: notificacao.status,
            prioridade: notificacao.prioridade,
            usuarioId: notificacao.usuarioId,
            dadosAdicionais: notificacao.dadosAdicionais,
            link: notificacao.link,
            expirarEm: notificacao.expirarEm,
            createdAt: notificacao.createdAt,
            updatedAt: notificacao.updatedAt,
        };
    }
    emitNovaNotificacao(notificacao) {
        if (this.server) {
            this.server.emit('nova_notificacao', {
                notificacao: this.mapToResponseDto(notificacao),
            });
        }
    }
    emitNotificacaoLida(notificacaoId) {
        if (this.server) {
            this.server.emit('notificacao_lida', {
                notificacaoId,
            });
        }
    }
    emitTodasNotificacoesLidas() {
        if (this.server) {
            this.server.emit('todas_notificacoes_lidas', {});
        }
    }
    emitNotificacaoDescartada(notificacaoId, eraNaoLida) {
        if (this.server) {
            this.server.emit('notificacao_descartada', {
                notificacaoId,
                eraNaoLida,
            });
        }
    }
};
exports.NotificacoesService = NotificacoesService;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], NotificacoesService.prototype, "server", void 0);
exports.NotificacoesService = NotificacoesService = __decorate([
    (0, common_1.Injectable)(),
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: "*",
        },
    }),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotificacoesService);
//# sourceMappingURL=notificacoes.service.js.map