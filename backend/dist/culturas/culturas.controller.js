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
exports.CulturasController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const culturas_service_1 = require("./culturas.service");
const dto_1 = require("./dto");
let CulturasController = class CulturasController {
    culturasService;
    constructor(culturasService) {
        this.culturasService = culturasService;
    }
    create(createCulturaDto) {
        return this.culturasService.create(createCulturaDto);
    }
    findAll() {
        return this.culturasService.findAll();
    }
    findOne(id) {
        return this.culturasService.findOne(+id);
    }
    update(id, updateCulturaDto) {
        return this.culturasService.update(+id, updateCulturaDto);
    }
    remove(id) {
        return this.culturasService.remove(+id);
    }
};
exports.CulturasController = CulturasController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Criar uma nova cultura' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Cultura criada com sucesso', type: dto_1.CulturaResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Dados inválidos' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cultura com esta descrição já existe' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateCulturaDto]),
    __metadata("design:returntype", void 0)
], CulturasController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar todas as culturas' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Lista de culturas retornada com sucesso', type: [dto_1.CulturaResponseDto] }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], CulturasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Buscar uma cultura específica' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cultura encontrada', type: dto_1.CulturaResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cultura não encontrada' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CulturasController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Atualizar uma cultura' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cultura atualizada com sucesso', type: dto_1.CulturaResponseDto }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cultura não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Cultura com esta descrição já existe' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateCulturaDto]),
    __metadata("design:returntype", void 0)
], CulturasController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Excluir uma cultura' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Cultura excluída com sucesso' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Cultura não encontrada' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Não é possível excluir uma cultura que está sendo usada em áreas agrícolas' }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], CulturasController.prototype, "remove", null);
exports.CulturasController = CulturasController = __decorate([
    (0, swagger_1.ApiTags)('Culturas'),
    (0, common_1.Controller)('api/culturas'),
    __metadata("design:paramtypes", [culturas_service_1.CulturasService])
], CulturasController);
//# sourceMappingURL=culturas.controller.js.map