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
exports.FornecedoresController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const fornecedores_service_1 = require("./fornecedores.service");
const dto_1 = require("./dto");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
let FornecedoresController = class FornecedoresController {
    fornecedoresService;
    constructor(fornecedoresService) {
        this.fornecedoresService = fornecedoresService;
    }
    create(createFornecedorDto) {
        return this.fornecedoresService.create(createFornecedorDto);
    }
    findAll(search) {
        return this.fornecedoresService.findAll(search);
    }
    findOne(id) {
        return this.fornecedoresService.findOne(+id);
    }
    update(id, updateFornecedorDto) {
        return this.fornecedoresService.update(+id, updateFornecedorDto);
    }
    remove(id) {
        return this.fornecedoresService.remove(+id);
    }
};
exports.FornecedoresController = FornecedoresController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar novo fornecedor' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Fornecedor criado com sucesso', type: dto_1.FornecedorResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'CNPJ ou CPF já existe' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateFornecedorDto]),
    __metadata("design:returntype", Promise)
], FornecedoresController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Listar todos os fornecedores' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de fornecedores', type: [dto_1.FornecedorResponseDto] }),
    __param(0, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FornecedoresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar fornecedor por ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fornecedor encontrado', type: dto_1.FornecedorResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Fornecedor não encontrado' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FornecedoresController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar fornecedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fornecedor atualizado com sucesso', type: dto_1.FornecedorResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Fornecedor não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'CNPJ ou CPF já existe' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateFornecedorDto]),
    __metadata("design:returntype", Promise)
], FornecedoresController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Remover fornecedor' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Fornecedor removido com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Fornecedor não encontrado' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Fornecedor tem áreas associadas' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FornecedoresController.prototype, "remove", null);
exports.FornecedoresController = FornecedoresController = __decorate([
    (0, swagger_1.ApiTags)('Fornecedores'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('api/fornecedores'),
    __metadata("design:paramtypes", [fornecedores_service_1.FornecedoresService])
], FornecedoresController);
//# sourceMappingURL=fornecedores.controller.js.map