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
exports.CredenciaisAPIController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const credenciais_api_service_1 = require("./credenciais-api.service");
const credenciais_api_dto_1 = require("../config/dto/credenciais-api.dto");
let CredenciaisAPIController = class CredenciaisAPIController {
    credenciaisAPIService;
    constructor(credenciaisAPIService) {
        this.credenciaisAPIService = credenciaisAPIService;
    }
    async create(createCredenciaisAPIDto) {
        return this.credenciaisAPIService.create(createCredenciaisAPIDto);
    }
    async findAll(contaCorrenteId, banco, modalidadeApi) {
        if (contaCorrenteId) {
            const id = parseInt(contaCorrenteId, 10);
            if (isNaN(id)) {
                throw new Error('ID da conta corrente deve ser um número válido');
            }
            return this.credenciaisAPIService.findByContaCorrente(id);
        }
        if (banco && modalidadeApi) {
            return this.credenciaisAPIService.findByBancoAndModalidade(banco, modalidadeApi);
        }
        return this.credenciaisAPIService.findAll();
    }
    async findOne(id) {
        return this.credenciaisAPIService.findOne(id);
    }
    async update(id, updateCredenciaisAPIDto) {
        return this.credenciaisAPIService.update(id, updateCredenciaisAPIDto);
    }
    async remove(id) {
        return this.credenciaisAPIService.remove(id);
    }
    async findByContaCorrente(contaCorrenteId) {
        return this.credenciaisAPIService.findByContaCorrente(contaCorrenteId);
    }
    async findByBancoAndModalidade(banco, modalidadeApi) {
        return this.credenciaisAPIService.findByBancoAndModalidade(banco, modalidadeApi);
    }
};
exports.CredenciaisAPIController = CredenciaisAPIController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Criar novas credenciais API',
        description: 'Cria novas credenciais para acesso às APIs bancárias',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Dados das credenciais API',
        type: credenciais_api_dto_1.CreateCredenciaisAPIDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Credenciais criadas com sucesso',
        type: credenciais_api_dto_1.CredenciaisAPIResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Dados inválidos ou conta corrente não encontrada',
        schema: {
            example: {
                statusCode: 400,
                message: ['Banco é obrigatório', 'Cliente ID é obrigatório'],
                error: 'Bad Request',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: 'Já existem credenciais para esta combinação banco/conta/modalidade',
        schema: {
            example: {
                statusCode: 409,
                message: 'Já existem credenciais para 001 - 001 - Cobrança nesta conta corrente',
                error: 'Conflict',
            },
        },
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [credenciais_api_dto_1.CreateCredenciaisAPIDto]),
    __metadata("design:returntype", Promise)
], CredenciaisAPIController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar todas as credenciais API',
        description: 'Retorna todas as credenciais API cadastradas com informações da conta corrente',
    }),
    (0, swagger_1.ApiQuery)({
        name: 'contaCorrenteId',
        required: false,
        description: 'Filtrar por ID da conta corrente',
        type: Number,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'banco',
        required: false,
        description: 'Filtrar por banco',
        type: String,
    }),
    (0, swagger_1.ApiQuery)({
        name: 'modalidadeApi',
        required: false,
        description: 'Filtrar por modalidade API',
        type: String,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de credenciais retornada com sucesso',
        type: [credenciais_api_dto_1.CredenciaisAPIResponseDto],
    }),
    __param(0, (0, common_1.Query)('contaCorrenteId')),
    __param(1, (0, common_1.Query)('banco')),
    __param(2, (0, common_1.Query)('modalidadeApi')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], CredenciaisAPIController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar credenciais API por ID',
        description: 'Retorna as credenciais API específicas pelo ID',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID das credenciais API',
        type: Number,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Credenciais encontradas',
        type: credenciais_api_dto_1.CredenciaisAPIResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Credenciais não encontradas',
        schema: {
            example: {
                statusCode: 404,
                message: 'Credenciais API não encontradas',
                error: 'Not Found',
            },
        },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CredenciaisAPIController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualizar credenciais API',
        description: 'Atualiza dados das credenciais API existentes',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID das credenciais API',
        type: Number,
    }),
    (0, swagger_1.ApiBody)({
        description: 'Dados para atualização (todos os campos são opcionais)',
        type: credenciais_api_dto_1.UpdateCredenciaisAPIDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Credenciais atualizadas com sucesso',
        type: credenciais_api_dto_1.CredenciaisAPIResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Credenciais não encontradas',
        schema: {
            example: {
                statusCode: 404,
                message: 'Credenciais API não encontradas',
                error: 'Not Found',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CONFLICT,
        description: 'Conflito - combinação banco/conta/modalidade já existe',
        schema: {
            example: {
                statusCode: 409,
                message: 'Já existem credenciais para 001 - 001 - Cobrança nesta conta corrente',
                error: 'Conflict',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Dados inválidos',
        schema: {
            example: {
                statusCode: 400,
                message: ['Banco não pode estar vazio'],
                error: 'Bad Request',
            },
        },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, credenciais_api_dto_1.UpdateCredenciaisAPIDto]),
    __metadata("design:returntype", Promise)
], CredenciaisAPIController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Remover credenciais API',
        description: 'Remove as credenciais API do sistema',
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'ID das credenciais API',
        type: Number,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Credenciais removidas com sucesso',
        schema: {
            example: {
                message: 'Credenciais API removidas com sucesso',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Credenciais não encontradas',
        schema: {
            example: {
                statusCode: 404,
                message: 'Credenciais API não encontradas',
                error: 'Not Found',
            },
        },
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CredenciaisAPIController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('conta/:contaCorrenteId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar credenciais por conta corrente',
        description: 'Retorna todas as credenciais API de uma conta corrente específica',
    }),
    (0, swagger_1.ApiParam)({
        name: 'contaCorrenteId',
        description: 'ID da conta corrente',
        type: Number,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de credenciais da conta corrente',
        type: [credenciais_api_dto_1.CredenciaisAPIResponseDto],
    }),
    __param(0, (0, common_1.Param)('contaCorrenteId', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CredenciaisAPIController.prototype, "findByContaCorrente", null);
__decorate([
    (0, common_1.Get)('banco/:banco/modalidade/:modalidadeApi'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar credenciais por banco e modalidade',
        description: 'Retorna credenciais específicas por banco e modalidade API',
    }),
    (0, swagger_1.ApiParam)({
        name: 'banco',
        description: 'Código do banco (ex: 001)',
        type: String,
    }),
    (0, swagger_1.ApiParam)({
        name: 'modalidadeApi',
        description: 'Modalidade da API (ex: 001 - Cobrança)',
        type: String,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Lista de credenciais encontradas',
        type: [credenciais_api_dto_1.CredenciaisAPIResponseDto],
    }),
    __param(0, (0, common_1.Param)('banco')),
    __param(1, (0, common_1.Param)('modalidadeApi')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], CredenciaisAPIController.prototype, "findByBancoAndModalidade", null);
exports.CredenciaisAPIController = CredenciaisAPIController = __decorate([
    (0, swagger_1.ApiTags)('Credenciais API'),
    (0, common_1.Controller)('credenciais-api'),
    __metadata("design:paramtypes", [credenciais_api_service_1.CredenciaisAPIService])
], CredenciaisAPIController);
//# sourceMappingURL=credenciais-api.controller.js.map