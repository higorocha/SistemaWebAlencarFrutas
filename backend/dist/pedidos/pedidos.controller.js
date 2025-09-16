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
exports.PedidosController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const pedidos_service_1 = require("./pedidos.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let PedidosController = class PedidosController {
    pedidosService;
    constructor(pedidosService) {
        this.pedidosService = pedidosService;
    }
    getDashboardStats(paginaFinalizados, limitFinalizados) {
        return this.pedidosService.getDashboardStats(paginaFinalizados ? parseInt(paginaFinalizados) : 1, limitFinalizados ? parseInt(limitFinalizados) : 10);
    }
    buscaInteligente(term) {
        if (!term || term.length < 2) {
            throw new Error('Termo de busca deve ter pelo menos 2 caracteres');
        }
        return this.pedidosService.buscaInteligente(term);
    }
    create(createPedidoDto) {
        return this.pedidosService.create(createPedidoDto);
    }
    createPagamento(createPagamentoDto) {
        return this.pedidosService.createPagamento(createPagamentoDto);
    }
    findPagamentosByPedido(id) {
        return this.pedidosService.findPagamentosByPedido(+id);
    }
    updatePagamentoIndividual(id, updatePagamentoDto) {
        return this.pedidosService.updatePagamentoIndividual(+id, updatePagamentoDto);
    }
    removePagamento(id) {
        return this.pedidosService.removePagamento(+id);
    }
    findAll(page, limit, search, searchType, status, clienteId, dataInicio, dataFim) {
        const dataInicioDate = dataInicio ? new Date(dataInicio) : undefined;
        const dataFimDate = dataFim ? new Date(dataFim) : undefined;
        return this.pedidosService.findAll(page, limit, search, searchType, status, clienteId, dataInicioDate, dataFimDate);
    }
    findByCliente(clienteId, status) {
        return this.pedidosService.findByCliente(+clienteId, status);
    }
    findOne(id) {
        return this.pedidosService.findOne(+id);
    }
    update(id, updatePedidoDto) {
        return this.pedidosService.update(+id, updatePedidoDto);
    }
    updateColheita(id, updateColheitaDto, req) {
        const usuarioId = req.user.id;
        return this.pedidosService.updateColheita(+id, updateColheitaDto, usuarioId);
    }
    updatePrecificacao(id, updatePrecificacaoDto) {
        return this.pedidosService.updatePrecificacao(+id, updatePrecificacaoDto);
    }
    updatePagamento(id, updatePagamentoDto) {
        return this.pedidosService.updatePagamento(+id, updatePagamentoDto);
    }
    updateCompleto(id, updatePedidoCompletoDto, req) {
        const usuarioId = req.user.id;
        return this.pedidosService.updateCompleto(+id, updatePedidoCompletoDto, usuarioId);
    }
    finalizar(id) {
        return this.pedidosService.finalizar(+id);
    }
    cancelar(id) {
        return this.pedidosService.cancelar(+id);
    }
    remove(id) {
        return this.pedidosService.remove(+id);
    }
};
exports.PedidosController = PedidosController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Obter estatísticas da dashboard de pedidos' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Estatísticas da dashboard obtidas com sucesso',
    }),
    __param(0, (0, common_1.Query)('paginaFinalizados')),
    __param(1, (0, common_1.Query)('limitFinalizados')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "getDashboardStats", null);
__decorate([
    (0, common_1.Get)('busca-inteligente'),
    (0, swagger_1.ApiOperation)({ summary: 'Busca inteligente de pedidos com sugestões categorizadas' }),
    (0, swagger_1.ApiQuery)({
        name: 'term',
        required: true,
        type: String,
        description: 'Termo de busca (mínimo 2 caracteres)',
        example: 'João'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Sugestões encontradas com sucesso',
        schema: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    type: { type: 'string', example: 'cliente' },
                    label: { type: 'string', example: 'Cliente' },
                    value: { type: 'string', example: 'João Silva' },
                    icon: { type: 'string', example: '👤' },
                    color: { type: 'string', example: '#52c41a' },
                    description: { type: 'string', example: 'João Silva - CPF: 123.456.789-00' },
                    metadata: {
                        type: 'object',
                        example: { id: 1, documento: '12345678900' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Termo de busca deve ter pelo menos 2 caracteres',
    }),
    __param(0, (0, common_1.Query)('term')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "buscaInteligente", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar um novo pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Pedido criado com sucesso',
        type: dto_1.PedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Cliente ou fruta não encontrados',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePedidoDto]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('pagamentos'),
    (0, swagger_1.ApiOperation)({ summary: 'Criar um novo pagamento para um pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Pagamento criado com sucesso',
        type: dto_1.PagamentoPedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Status do pedido não permite pagamento ou valor excede o limite',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreatePagamentoDto]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "createPagamento", null);
__decorate([
    (0, common_1.Get)(':id/pagamentos'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar todos os pagamentos de um pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pagamentos encontrados com sucesso',
        type: [dto_1.PagamentoPedidoResponseDto],
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "findPagamentosByPedido", null);
__decorate([
    (0, common_1.Patch)('pagamentos/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar um pagamento existente' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pagamento atualizado com sucesso',
        type: dto_1.PagamentoPedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pagamento não encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Status do pedido não permite atualização ou valor excede o limite',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePagamentoDto]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "updatePagamentoIndividual", null);
__decorate([
    (0, common_1.Delete)('pagamentos/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover um pagamento existente' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pagamento removido com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pagamento não encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Status do pedido não permite remoção',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "removePagamento", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos os pedidos com paginação e filtros' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Número da página' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Itens por página' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Termo de busca' }),
    (0, swagger_1.ApiQuery)({ name: 'searchType', required: false, type: String, description: 'Tipo de busca (numero, cliente, motorista, placa, vale, etc.)' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String, description: 'Filtrar por status' }),
    (0, swagger_1.ApiQuery)({ name: 'clienteId', required: false, type: Number, description: 'Filtrar por cliente' }),
    (0, swagger_1.ApiQuery)({ name: 'dataInicio', required: false, type: String, description: 'Data início (ISO 8601)' }),
    (0, swagger_1.ApiQuery)({ name: 'dataFim', required: false, type: String, description: 'Data fim (ISO 8601)' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de pedidos retornada com sucesso',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PedidoResponseDto' },
                },
                total: { type: 'number' },
                page: { type: 'number' },
                limit: { type: 'number' },
            },
        },
    }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __param(3, (0, common_1.Query)('searchType')),
    __param(4, (0, common_1.Query)('status')),
    __param(5, (0, common_1.Query)('clienteId')),
    __param(6, (0, common_1.Query)('dataInicio')),
    __param(7, (0, common_1.Query)('dataFim')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String, Number, String, String]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('cliente/:clienteId'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar pedidos por cliente' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String, description: 'Filtrar por status (separados por vírgula)' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de pedidos do cliente retornada com sucesso',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/PedidoResponseDto' },
                },
                total: { type: 'number' },
                statusFiltrados: { type: 'array', items: { type: 'string' } },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Cliente não encontrado',
    }),
    __param(0, (0, common_1.Param)('clienteId')),
    __param(1, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], PedidosController.prototype, "findByCliente", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar um pedido por ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pedido encontrado com sucesso',
        type: dto_1.PedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar dados básicos do pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pedido atualizado com sucesso',
        type: dto_1.PedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Não é possível atualizar pedidos finalizados ou cancelados',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePedidoDto]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(':id/colheita'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar dados da colheita do pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Colheita atualizada com sucesso',
        type: dto_1.PedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido ou área agrícola não encontrados',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Status do pedido não permite atualizar colheita',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateColheitaDto, Object]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "updateColheita", null);
__decorate([
    (0, common_1.Patch)(':id/precificacao'),
    (0, swagger_1.ApiOperation)({ summary: 'Definir precificação do pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Precificação definida com sucesso',
        type: dto_1.PedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Status do pedido não permite precificação',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePrecificacaoDto]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "updatePrecificacao", null);
__decorate([
    (0, common_1.Patch)(':id/pagamento'),
    (0, swagger_1.ApiOperation)({ summary: 'Registrar pagamento do pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pagamento registrado com sucesso',
        type: dto_1.PedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Status do pedido não permite registrar pagamento',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePagamentoDto]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "updatePagamento", null);
__decorate([
    (0, common_1.Patch)(':id/editar-completo'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar todas as informações do pedido em uma única chamada' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pedido atualizado com sucesso',
        type: dto_1.PedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Dados inválidos para atualização completa',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdatePedidoCompletoDto, Object]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "updateCompleto", null);
__decorate([
    (0, common_1.Patch)(':id/finalizar'),
    (0, swagger_1.ApiOperation)({ summary: 'Finalizar pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pedido finalizado com sucesso',
        type: dto_1.PedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Status do pedido não permite finalização',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "finalizar", null);
__decorate([
    (0, common_1.Patch)(':id/cancelar'),
    (0, swagger_1.ApiOperation)({ summary: 'Cancelar pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pedido cancelado com sucesso',
        type: dto_1.PedidoResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Não é possível cancelar pedidos finalizados',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "cancelar", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover um pedido' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Pedido removido com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Pedido não encontrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Só é possível remover pedidos cancelados ou recém criados',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], PedidosController.prototype, "remove", null);
exports.PedidosController = PedidosController = __decorate([
    (0, swagger_1.ApiTags)('Pedidos'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/pedidos'),
    __metadata("design:paramtypes", [pedidos_service_1.PedidosService])
], PedidosController);
//# sourceMappingURL=pedidos.controller.js.map