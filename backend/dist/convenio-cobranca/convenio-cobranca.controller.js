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
exports.ConvenioCobrancaController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const convenio_cobranca_service_1 = require("./convenio-cobranca.service");
const convenio_cobranca_dto_1 = require("../config/dto/convenio-cobranca.dto");
let ConvenioCobrancaController = class ConvenioCobrancaController {
    convenioCobrancaService;
    constructor(convenioCobrancaService) {
        this.convenioCobrancaService = convenioCobrancaService;
    }
    async findConvenio() {
        return this.convenioCobrancaService.findConvenio();
    }
    async upsertConvenio(convenioDto) {
        return this.convenioCobrancaService.upsertConvenio(convenioDto);
    }
    async deleteConvenio() {
        return this.convenioCobrancaService.deleteConvenio();
    }
    async existeConvenio() {
        const exists = await this.convenioCobrancaService.existeConvenio();
        return { exists };
    }
};
exports.ConvenioCobrancaController = ConvenioCobrancaController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar convênio de cobrança',
        description: 'Retorna o convênio de cobrança único do sistema (se existir)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Convênio encontrado',
        type: convenio_cobranca_dto_1.ConvenioCobrancaResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: 'Nenhum convênio cadastrado',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConvenioCobrancaController.prototype, "findConvenio", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Salvar convênio de cobrança',
        description: 'Cria ou atualiza o convênio de cobrança único do sistema',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Dados do convênio de cobrança',
        type: convenio_cobranca_dto_1.ConvenioCobrancaDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Convênio salvo com sucesso',
        type: convenio_cobranca_dto_1.ConvenioCobrancaResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Dados inválidos ou validação de negócio falhou',
        schema: {
            example: {
                statusCode: 400,
                message: [
                    'Juros deve ser um número válido',
                    'Valor da multa é obrigatório quando multa está ativa'
                ],
                error: 'Bad Request',
            },
        },
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [convenio_cobranca_dto_1.ConvenioCobrancaDto]),
    __metadata("design:returntype", Promise)
], ConvenioCobrancaController.prototype, "upsertConvenio", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Remover convênio de cobrança',
        description: 'Remove o convênio de cobrança do sistema (útil para reset)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Convênio removido com sucesso',
        schema: {
            example: {
                message: 'Convênio de cobrança removido com sucesso',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: 'Nenhum convênio encontrado para remover',
        schema: {
            example: {
                message: 'Nenhum convênio de cobrança encontrado para remover',
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConvenioCobrancaController.prototype, "deleteConvenio", null);
__decorate([
    (0, common_1.Get)('exists'),
    (0, swagger_1.ApiOperation)({
        summary: 'Verificar se existe convênio',
        description: 'Verifica se existe um convênio de cobrança cadastrado',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Status da existência do convênio',
        schema: {
            example: {
                exists: true,
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConvenioCobrancaController.prototype, "existeConvenio", null);
exports.ConvenioCobrancaController = ConvenioCobrancaController = __decorate([
    (0, swagger_1.ApiTags)('Convênio de Cobrança'),
    (0, common_1.Controller)('convenio-cobranca'),
    __metadata("design:paramtypes", [convenio_cobranca_service_1.ConvenioCobrancaService])
], ConvenioCobrancaController);
//# sourceMappingURL=convenio-cobranca.controller.js.map