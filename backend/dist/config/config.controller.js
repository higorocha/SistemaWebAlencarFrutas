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
exports.ConfigController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_service_1 = require("./config.service");
const config_dados_empresa_dto_1 = require("./dto/config-dados-empresa.dto");
let ConfigController = class ConfigController {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    async findDadosEmpresa() {
        return await this.configService.findDadosEmpresa();
    }
    async saveDadosEmpresa(createConfigDadosEmpresaDto) {
        return await this.configService.saveDadosEmpresa(createConfigDadosEmpresaDto);
    }
    async updateDadosEmpresa(id, updateConfigDadosEmpresaDto) {
        return await this.configService.updateDadosEmpresa(id, updateConfigDadosEmpresaDto);
    }
    async deleteDadosEmpresa(id) {
        return await this.configService.deleteDadosEmpresa(id);
    }
    async findAllDadosEmpresa() {
        return await this.configService.findAllDadosEmpresa();
    }
    async findDadosEmpresaById(id) {
        return await this.configService.findDadosEmpresaById(id);
    }
};
exports.ConfigController = ConfigController;
__decorate([
    (0, common_1.Get)('dados-empresa'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar dados da empresa',
        description: 'Retorna os dados gerais da empresa configurados no sistema'
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Dados da empresa encontrados',
        type: config_dados_empresa_dto_1.ConfigDadosEmpresaResponseDto
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Dados da empresa não encontrados'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "findDadosEmpresa", null);
__decorate([
    (0, common_1.Post)('dados-empresa'),
    (0, swagger_1.ApiOperation)({
        summary: 'Salvar dados da empresa',
        description: 'Cria ou atualiza os dados gerais da empresa'
    }),
    (0, swagger_1.ApiBody)({ type: config_dados_empresa_dto_1.CreateConfigDadosEmpresaDto }),
    (0, swagger_1.ApiCreatedResponse)({
        description: 'Dados da empresa salvos com sucesso',
        type: config_dados_empresa_dto_1.ConfigDadosEmpresaResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Dados de entrada inválidos'
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'CNPJ já cadastrado'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [config_dados_empresa_dto_1.CreateConfigDadosEmpresaDto]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "saveDadosEmpresa", null);
__decorate([
    (0, common_1.Put)('dados-empresa/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualizar dados da empresa',
        description: 'Atualiza os dados da empresa pelo ID'
    }),
    (0, swagger_1.ApiBody)({ type: config_dados_empresa_dto_1.UpdateConfigDadosEmpresaDto }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Dados da empresa atualizados com sucesso',
        type: config_dados_empresa_dto_1.ConfigDadosEmpresaResponseDto
    }),
    (0, swagger_1.ApiBadRequestResponse)({
        description: 'Dados de entrada inválidos'
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Dados da empresa não encontrados'
    }),
    (0, swagger_1.ApiConflictResponse)({
        description: 'CNPJ já cadastrado'
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, config_dados_empresa_dto_1.UpdateConfigDadosEmpresaDto]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "updateDadosEmpresa", null);
__decorate([
    (0, common_1.Delete)('dados-empresa/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Deletar dados da empresa',
        description: 'Remove os dados da empresa pelo ID'
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Dados da empresa deletados com sucesso',
        schema: {
            type: 'object',
            properties: {
                message: {
                    type: 'string',
                    example: 'Dados da empresa deletados com sucesso'
                }
            }
        }
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Dados da empresa não encontrados'
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "deleteDadosEmpresa", null);
__decorate([
    (0, common_1.Get)('dados-empresa/all'),
    (0, swagger_1.ApiOperation)({
        summary: 'Listar todos os dados da empresa',
        description: 'Retorna todos os registros de dados da empresa (para administração)'
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Lista de dados da empresa',
        type: [config_dados_empresa_dto_1.ConfigDadosEmpresaResponseDto]
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "findAllDadosEmpresa", null);
__decorate([
    (0, common_1.Get)('dados-empresa/:id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar dados da empresa por ID',
        description: 'Retorna os dados da empresa pelo ID específico'
    }),
    (0, swagger_1.ApiOkResponse)({
        description: 'Dados da empresa encontrados',
        type: config_dados_empresa_dto_1.ConfigDadosEmpresaResponseDto
    }),
    (0, swagger_1.ApiNotFoundResponse)({
        description: 'Dados da empresa não encontrados'
    }),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ConfigController.prototype, "findDadosEmpresaById", null);
exports.ConfigController = ConfigController = __decorate([
    (0, swagger_1.ApiTags)('Configurações'),
    (0, common_1.Controller)('config'),
    __metadata("design:paramtypes", [config_service_1.ConfigService])
], ConfigController);
//# sourceMappingURL=config.controller.js.map