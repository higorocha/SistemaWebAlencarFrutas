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
exports.ContaCorrenteController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const conta_corrente_service_1 = require("./conta-corrente.service");
const conta_corrente_dto_1 = require("../config/dto/conta-corrente.dto");
let ContaCorrenteController = class ContaCorrenteController {
    contaCorrenteService;
    constructor(contaCorrenteService) {
        this.contaCorrenteService = contaCorrenteService;
    }
    async findAll() {
        return await this.contaCorrenteService.findAll();
    }
    async findOne(id) {
        return await this.contaCorrenteService.findOne(id);
    }
    async create(createContaCorrenteDto) {
        return await this.contaCorrenteService.create(createContaCorrenteDto);
    }
    async update(id, updateContaCorrenteDto) {
        return await this.contaCorrenteService.update(id, updateContaCorrenteDto);
    }
    async remove(id) {
        return await this.contaCorrenteService.remove(id);
    }
};
exports.ContaCorrenteController = ContaCorrenteController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar todas as contas correntes',
        description: 'Retorna uma lista com todas as contas correntes cadastradas'
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Lista de contas correntes',
        type: [conta_corrente_dto_1.ContaCorrenteResponseDto]
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ContaCorrenteController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar conta corrente por ID',
        description: 'Retorna os dados de uma conta corrente específica'
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Conta corrente encontrada',
        type: conta_corrente_dto_1.ContaCorrenteResponseDto
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Conta corrente não encontrada'
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContaCorrenteController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Criar nova conta corrente',
        description: 'Cadastra uma nova conta corrente no sistema'
    }),
    (0, swagger_1.ApiBody)({ type: conta_corrente_dto_1.CreateContaCorrenteDto }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Conta corrente criada com sucesso',
        type: conta_corrente_dto_1.ContaCorrenteResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Dados de entrada inválidos'
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'Já existe uma conta corrente com esses dados'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [conta_corrente_dto_1.CreateContaCorrenteDto]),
    __metadata("design:returntype", Promise)
], ContaCorrenteController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualizar conta corrente',
        description: 'Atualiza os dados de uma conta corrente existente'
    }),
    (0, swagger_1.ApiBody)({ type: conta_corrente_dto_1.UpdateContaCorrenteDto }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Conta corrente atualizada com sucesso',
        type: conta_corrente_dto_1.ContaCorrenteResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Dados de entrada inválidos'
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Conta corrente não encontrada'
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'Já existe uma conta corrente com esses dados'
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, conta_corrente_dto_1.UpdateContaCorrenteDto]),
    __metadata("design:returntype", Promise)
], ContaCorrenteController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Excluir conta corrente',
        description: 'Remove uma conta corrente do sistema'
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Conta corrente excluída com sucesso',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Conta corrente removida com sucesso'
                }
            }
        }
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Conta corrente não encontrada'
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ContaCorrenteController.prototype, "remove", null);
exports.ContaCorrenteController = ContaCorrenteController = __decorate([
    (0, swagger_1.ApiTags)('Conta Corrente'),
    (0, common_1.Controller)('contacorrente'),
    __metadata("design:paramtypes", [conta_corrente_service_1.ContaCorrenteService])
], ContaCorrenteController);
//# sourceMappingURL=conta-corrente.controller.js.map