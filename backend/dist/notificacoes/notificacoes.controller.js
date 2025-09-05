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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificacoesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const notificacoes_service_1 = require("./notificacoes.service");
const dto_1 = require("./dto");
let NotificacoesController = class NotificacoesController {
    notificacoesService;
    constructor(notificacoesService) {
        this.notificacoesService = notificacoesService;
    }
    create(createNotificacaoDto, req) {
        return this.notificacoesService.create(createNotificacaoDto, req.user?.id);
    }
    findAll(req) {
        return this.notificacoesService.findAll(req.user?.id);
    }
    findOne(id, req) {
        return this.notificacoesService.findOne(+id, req.user?.id);
    }
    update(id, updateNotificacaoDto, req) {
        return this.notificacoesService.update(+id, updateNotificacaoDto, req.user?.id);
    }
    remove(id, req) {
        return this.notificacoesService.remove(+id, req.user?.id);
    }
    marcarComoLida(id, req) {
        return this.notificacoesService.marcarComoLida(+id, req.user?.id);
    }
    marcarTodasComoLidas(req) {
        return this.notificacoesService.marcarTodasComoLidas(req.user?.id);
    }
    descartarNotificacao(id, req) {
        return this.notificacoesService.descartarNotificacao(+id, req.user?.id);
    }
    criarNotificacaoSistema(body, req) {
        return this.notificacoesService.criarNotificacaoSistema(body.titulo, body.conteudo, body.dadosAdicionais);
    }
    criarNotificacaoPagamento(body, req) {
        return this.notificacoesService.criarNotificacaoPagamento(body.nomeCliente, body.valor, body.tipo);
    }
};
exports.NotificacoesController = NotificacoesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar uma nova notificação' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notificação criada com sucesso', type: dto_1.NotificacaoResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateNotificacaoDto, Object]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar todas as notificações do usuário' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Lista de notificações retornada com sucesso',
        schema: {
            type: 'object',
            properties: {
                notificacoes: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/NotificacaoResponseDto' }
                },
                nao_lidas: {
                    type: 'number',
                    description: 'Quantidade de notificações não lidas'
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar uma notificação específica' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notificação encontrada', type: dto_1.NotificacaoResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Notificação não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar uma notificação' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notificação atualizada com sucesso', type: dto_1.NotificacaoResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Notificação não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateNotificacaoDto, Object]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir uma notificação' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notificação excluída com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Notificação não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "remove", null);
__decorate([
    (0, common_1.Patch)(':id/ler'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar notificação como lida' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notificação marcada como lida', type: dto_1.NotificacaoResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Notificação não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "marcarComoLida", null);
__decorate([
    (0, common_1.Patch)('ler-todas'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Marcar todas as notificações como lidas' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Todas as notificações foram marcadas como lidas' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "marcarTodasComoLidas", null);
__decorate([
    (0, common_1.Patch)(':id/descartar'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Descartar uma notificação' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notificação descartada com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Notificação não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "descartarNotificacao", null);
__decorate([
    (0, common_1.Post)('sistema'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar notificação do sistema' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notificação do sistema criada', type: dto_1.NotificacaoResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "criarNotificacaoSistema", null);
__decorate([
    (0, common_1.Post)('pagamento'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar notificação de pagamento' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Notificação de pagamento criada', type: dto_1.NotificacaoResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Não autorizado' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], NotificacoesController.prototype, "criarNotificacaoPagamento", null);
exports.NotificacoesController = NotificacoesController = __decorate([
    (0, swagger_1.ApiTags)('Notificações'),
    (0, common_1.Controller)('api/notificacoes'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [notificacoes_service_1.NotificacoesService])
], NotificacoesController);
//# sourceMappingURL=notificacoes.controller.js.map