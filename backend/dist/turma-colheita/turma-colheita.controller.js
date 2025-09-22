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
exports.TurmaColheitaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const turma_colheita_service_1 = require("./turma-colheita.service");
const create_turma_colheita_dto_1 = require("./dto/create-turma-colheita.dto");
const update_turma_colheita_dto_1 = require("./dto/update-turma-colheita.dto");
const turma_colheita_response_dto_1 = require("./dto/turma-colheita-response.dto");
const create_colheita_pedido_dto_1 = require("./dto/create-colheita-pedido.dto");
const update_colheita_pedido_dto_1 = require("./dto/update-colheita-pedido.dto");
const colheita_pedido_response_dto_1 = require("./dto/colheita-pedido-response.dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let TurmaColheitaController = class TurmaColheitaController {
    turmaColheitaService;
    constructor(turmaColheitaService) {
        this.turmaColheitaService = turmaColheitaService;
    }
    create(createTurmaColheitaDto) {
        return this.turmaColheitaService.create(createTurmaColheitaDto);
    }
    findAll() {
        return this.turmaColheitaService.findAll();
    }
    getRelatorio() {
        return this.turmaColheitaService.getRelatorio();
    }
    createColheitaPedido(createCustoDto) {
        return this.turmaColheitaService.createCustoColheita(createCustoDto);
    }
    findAllColheitasPedidos() {
        return this.turmaColheitaService.findAllColheitasPedidos();
    }
    findOneColheitaPedido(id) {
        return this.turmaColheitaService.findOneColheitaPedido(+id);
    }
    updateColheitaPedido(id, updateColheitaPedidoDto) {
        return this.turmaColheitaService.updateColheitaPedido(+id, updateColheitaPedidoDto);
    }
    removeColheitaPedido(id) {
        return this.turmaColheitaService.removeColheitaPedido(+id);
    }
    findColheitasByPedido(pedidoId) {
        return this.turmaColheitaService.findColheitasByPedido(+pedidoId);
    }
    findColheitasByTurma(turmaId) {
        return this.turmaColheitaService.findColheitasByTurma(+turmaId);
    }
    findByPedido(pedidoId) {
        return this.turmaColheitaService.findByPedido(+pedidoId);
    }
    findByFruta(frutaId) {
        return this.turmaColheitaService.findByFruta(+frutaId);
    }
    getEstatisticas(id) {
        return this.turmaColheitaService.getEstatisticasPorTurma(+id);
    }
    getPagamentosPendentes(id) {
        return this.turmaColheitaService.getPagamentosPendentesDetalhado(+id);
    }
    getPagamentosEfetuados() {
        return this.turmaColheitaService.getPagamentosEfetuadosAgrupados();
    }
    processarPagamentos(id, dadosPagamento) {
        return this.turmaColheitaService.processarPagamentosSeletivos(+id, dadosPagamento);
    }
    findOne(id) {
        return this.turmaColheitaService.findOne(+id);
    }
    update(id, updateTurmaColheitaDto) {
        return this.turmaColheitaService.update(+id, updateTurmaColheitaDto);
    }
    remove(id) {
        return this.turmaColheitaService.remove(+id);
    }
};
exports.TurmaColheitaController = TurmaColheitaController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar uma nova turma de colheita' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Turma de colheita criada com sucesso',
        type: turma_colheita_response_dto_1.TurmaColheitaResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido ou fruta não encontrados',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Fruta não encontrada no pedido especificado',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_turma_colheita_dto_1.CreateTurmaColheitaDto]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas as turmas de colheita' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de turmas de colheita obtida com sucesso',
        type: [turma_colheita_response_dto_1.TurmaColheitaResponseDto],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('relatorio'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter relatório das turmas de colheita' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Relatório obtido com sucesso',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TurmaColheitaController.prototype, "getRelatorio", null);
__decorate([
    (0, common_1.Post)('custo-colheita'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar um novo custo de colheita' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Custo de colheita criado com sucesso',
        type: colheita_pedido_response_dto_1.TurmaColheitaPedidoCustoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Turma de colheita, pedido ou fruta não encontrados',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Fruta não encontrada no pedido especificado',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_colheita_pedido_dto_1.CreateTurmaColheitaPedidoCustoDto]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "createColheitaPedido", null);
__decorate([
    (0, common_1.Get)('colheita-pedido'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas as colheitas de pedidos' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de colheitas de pedidos obtida com sucesso',
        type: [colheita_pedido_response_dto_1.TurmaColheitaPedidoCustoResponseDto],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "findAllColheitasPedidos", null);
__decorate([
    (0, common_1.Get)('colheita-pedido/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar uma colheita de pedido por ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Colheita de pedido encontrada com sucesso',
        type: colheita_pedido_response_dto_1.TurmaColheitaPedidoCustoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Colheita de pedido não encontrada',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "findOneColheitaPedido", null);
__decorate([
    (0, common_1.Patch)('colheita-pedido/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar uma colheita de pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Colheita de pedido atualizada com sucesso',
        type: colheita_pedido_response_dto_1.TurmaColheitaPedidoCustoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Colheita de pedido não encontrada',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_colheita_pedido_dto_1.UpdateTurmaColheitaPedidoCustoDto]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "updateColheitaPedido", null);
__decorate([
    (0, common_1.Delete)('colheita-pedido/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover uma colheita de pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: 'Colheita de pedido removida com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Colheita de pedido não encontrada',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "removeColheitaPedido", null);
__decorate([
    (0, common_1.Get)('colheita-pedido/pedido/:pedidoId'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar colheitas de pedidos por pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Colheitas de pedidos do pedido obtidas com sucesso',
        type: [colheita_pedido_response_dto_1.TurmaColheitaPedidoCustoResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    __param(0, (0, common_1.Param)('pedidoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "findColheitasByPedido", null);
__decorate([
    (0, common_1.Get)('colheita-pedido/turma/:turmaId'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar colheitas de pedidos por turma' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Colheitas de pedidos da turma obtidas com sucesso',
        type: [colheita_pedido_response_dto_1.TurmaColheitaPedidoCustoResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Turma de colheita não encontrada',
    }),
    __param(0, (0, common_1.Param)('turmaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "findColheitasByTurma", null);
__decorate([
    (0, common_1.Get)('pedido/:pedidoId'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar turmas de colheita por pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Turmas de colheita do pedido obtidas com sucesso',
        type: [turma_colheita_response_dto_1.TurmaColheitaResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    __param(0, (0, common_1.Param)('pedidoId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "findByPedido", null);
__decorate([
    (0, common_1.Get)('fruta/:frutaId'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar turmas de colheita por fruta' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Turmas de colheita da fruta obtidas com sucesso',
        type: [turma_colheita_response_dto_1.TurmaColheitaResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Fruta não encontrada',
    }),
    __param(0, (0, common_1.Param)('frutaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "findByFruta", null);
__decorate([
    (0, common_1.Get)(':id/estatisticas'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas detalhadas de uma turma de colheita' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Estatísticas da turma obtidas com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Turma de colheita não encontrada',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TurmaColheitaController.prototype, "getEstatisticas", null);
__decorate([
    (0, common_1.Get)(':id/pagamentos-pendentes'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar detalhamento de pagamentos pendentes de uma turma' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Detalhamento de pagamentos pendentes retornado com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Turma de colheita não encontrada',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], TurmaColheitaController.prototype, "getPagamentosPendentes", null);
__decorate([
    (0, common_1.Get)('pagamentos-efetuados'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar todos os pagamentos efetuados agrupados por turma' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de pagamentos efetuados retornada com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.INTERNAL_SERVER_ERROR,
        description: 'Erro interno do servidor',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], TurmaColheitaController.prototype, "getPagamentosEfetuados", null);
__decorate([
    (0, common_1.Patch)(':id/processar-pagamentos'),
    (0, swagger_1.ApiOperation)({ summary: 'Processar pagamentos seletivos de uma turma' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pagamentos processados com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Turma de colheita não encontrada',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Dados inválidos para processamento',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], TurmaColheitaController.prototype, "processarPagamentos", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar uma turma de colheita por ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Turma de colheita encontrada com sucesso',
        type: turma_colheita_response_dto_1.TurmaColheitaResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Turma de colheita não encontrada',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar uma turma de colheita' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Turma de colheita atualizada com sucesso',
        type: turma_colheita_response_dto_1.TurmaColheitaResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Turma de colheita não encontrada',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Fruta não encontrada no pedido especificado',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_turma_colheita_dto_1.UpdateTurmaColheitaDto]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover uma turma de colheita' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: 'Turma de colheita removida com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Turma de colheita não encontrada',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TurmaColheitaController.prototype, "remove", null);
exports.TurmaColheitaController = TurmaColheitaController = __decorate([
    (0, swagger_1.ApiTags)('Turma de Colheita'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/turma-colheita'),
    __metadata("design:paramtypes", [turma_colheita_service_1.TurmaColheitaService])
], TurmaColheitaController);
//# sourceMappingURL=turma-colheita.controller.js.map