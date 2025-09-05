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
exports.AreasFornecedoresController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const areas_fornecedores_service_1 = require("./areas-fornecedores.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let AreasFornecedoresController = class AreasFornecedoresController {
    areasFornecedoresService;
    constructor(areasFornecedoresService) {
        this.areasFornecedoresService = areasFornecedoresService;
    }
    create(createAreaFornecedorDto) {
        return this.areasFornecedoresService.create(createAreaFornecedorDto);
    }
    findAll() {
        return this.areasFornecedoresService.findAll();
    }
    findByFornecedor(fornecedorId) {
        return this.areasFornecedoresService.findByFornecedor(+fornecedorId);
    }
    findOne(id) {
        return this.areasFornecedoresService.findOne(+id);
    }
    update(id, updateAreaFornecedorDto) {
        return this.areasFornecedoresService.update(+id, updateAreaFornecedorDto);
    }
    remove(id) {
        return this.areasFornecedoresService.remove(+id);
    }
};
exports.AreasFornecedoresController = AreasFornecedoresController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar nova área de fornecedor' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Área criada com sucesso', type: dto_1.AreaFornecedorResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Fornecedor não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Área com mesmo nome já existe para este fornecedor' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateAreaFornecedorDto]),
    __metadata("design:returntype", Promise)
], AreasFornecedoresController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todas as áreas de fornecedores' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de áreas', type: [dto_1.AreaFornecedorResponseDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AreasFornecedoresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('fornecedor/:fornecedorId'),
    (0, swagger_1.ApiOperation)({ summary: 'Listar áreas de um fornecedor específico' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de áreas do fornecedor', type: [dto_1.AreaFornecedorResponseDto] }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Fornecedor não encontrado' }),
    __param(0, (0, common_1.Param)('fornecedorId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AreasFornecedoresController.prototype, "findByFornecedor", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar área por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Área encontrada', type: dto_1.AreaFornecedorResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Área não encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AreasFornecedoresController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar área de fornecedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Área atualizada com sucesso', type: dto_1.AreaFornecedorResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Área não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Área com mesmo nome já existe para este fornecedor' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateAreaFornecedorDto]),
    __metadata("design:returntype", Promise)
], AreasFornecedoresController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover área de fornecedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Área removida com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Área não encontrada' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AreasFornecedoresController.prototype, "remove", null);
exports.AreasFornecedoresController = AreasFornecedoresController = __decorate([
    (0, swagger_1.ApiTags)('Áreas dos Fornecedores'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/areas-fornecedores'),
    __metadata("design:paramtypes", [areas_fornecedores_service_1.AreasFornecedoresService])
], AreasFornecedoresController);
//# sourceMappingURL=areas-fornecedores.controller.js.map