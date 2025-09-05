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
exports.FrutasController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const frutas_service_1 = require("./frutas.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let FrutasController = class FrutasController {
    frutasService;
    constructor(frutasService) {
        this.frutasService = frutasService;
    }
    create(createFrutaDto) {
        return this.frutasService.create(createFrutaDto);
    }
    findAll(page, limit, search, categoria, status) {
        return this.frutasService.findAll(page, limit, search, categoria, status);
    }
    findActive() {
        return this.frutasService.findActive();
    }
    findOne(id) {
        return this.frutasService.findOne(+id);
    }
    update(id, updateFrutaDto) {
        return this.frutasService.update(+id, updateFrutaDto);
    }
    remove(id) {
        return this.frutasService.remove(+id);
    }
};
exports.FrutasController = FrutasController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar uma nova fruta' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Fruta criada com sucesso',
        type: dto_1.FrutaResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: 'Já existe uma fruta com este código',
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateFrutaDto]),
    __metadata("design:returntype", Promise)
], FrutasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas as frutas com paginação e filtros' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number, description: 'Número da página' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Itens por página' }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String, description: 'Termo de busca' }),
    (0, swagger_1.ApiQuery)({ name: 'categoria', required: false, type: String, description: 'Filtrar por categoria' }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String, description: 'Filtrar por status' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de frutas retornada com sucesso',
        schema: {
            type: 'object',
            properties: {
                data: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/FrutaResponseDto' },
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
    __param(3, (0, common_1.Query)('categoria')),
    __param(4, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number, String, String, String]),
    __metadata("design:returntype", void 0)
], FrutasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('ativas'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar apenas frutas ativas para seleção' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de frutas ativas retornada com sucesso',
        type: [dto_1.FrutaResponseDto],
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FrutasController.prototype, "findActive", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar uma fruta por ID' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Fruta encontrada com sucesso',
        type: dto_1.FrutaResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Fruta não encontrada',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FrutasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar uma fruta' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Fruta atualizada com sucesso',
        type: dto_1.FrutaResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Fruta não encontrada',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: 'Já existe uma fruta com este código',
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateFrutaDto]),
    __metadata("design:returntype", Promise)
], FrutasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover uma fruta' }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Fruta removida com sucesso',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Fruta não encontrada',
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FrutasController.prototype, "remove", null);
exports.FrutasController = FrutasController = __decorate([
    (0, swagger_1.ApiTags)('Frutas'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/frutas'),
    __metadata("design:paramtypes", [frutas_service_1.FrutasService])
], FrutasController);
//# sourceMappingURL=frutas.controller.js.map