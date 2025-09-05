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
exports.ConfigEmailController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_email_service_1 = require("./config-email.service");
const config_email_dto_1 = require("../config/dto/config-email.dto");
let ConfigEmailController = class ConfigEmailController {
    configEmailService;
    constructor(configEmailService) {
        this.configEmailService = configEmailService;
    }
    async findConfigEmail() {
        return this.configEmailService.findConfigEmail();
    }
    async upsertConfigEmail(configDto) {
        return this.configEmailService.upsertConfigEmail(configDto);
    }
    async updateConfigEmail(configDto) {
        return this.configEmailService.upsertConfigEmail(configDto);
    }
    async deleteConfigEmail() {
        return this.configEmailService.deleteConfigEmail();
    }
    async existeConfig() {
        const exists = await this.configEmailService.existeConfig();
        return { exists };
    }
    async testarConexao(configDto) {
        return this.configEmailService.testarConexao(configDto);
    }
    async testarEmail(body) {
        return this.configEmailService.enviarEmailTeste(body.emailTeste);
    }
};
exports.ConfigEmailController = ConfigEmailController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar configuração de email',
        description: 'Retorna a configuração de email única do sistema (se existir)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Configuração encontrada',
        type: config_email_dto_1.ConfigEmailResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: 'Nenhuma configuração cadastrada',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigEmailController.prototype, "findConfigEmail", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Salvar configuração de email',
        description: 'Cria ou atualiza a configuração de email única do sistema',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Dados da configuração de email',
        type: config_email_dto_1.CreateConfigEmailDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Configuração salva com sucesso',
        type: config_email_dto_1.ConfigEmailResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Dados inválidos',
        schema: {
            example: {
                statusCode: 400,
                message: [
                    'Servidor SMTP é obrigatório',
                    'Email de envio deve ter um formato válido'
                ],
                error: 'Bad Request',
            },
        },
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [config_email_dto_1.CreateConfigEmailDto]),
    __metadata("design:returntype", Promise)
], ConfigEmailController.prototype, "upsertConfigEmail", null);
__decorate([
    (0, common_1.Put)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualizar configuração de email',
        description: 'Atualiza a configuração de email única do sistema (mesmo comportamento do POST)',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Dados da configuração de email',
        type: config_email_dto_1.CreateConfigEmailDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Configuração atualizada com sucesso',
        type: config_email_dto_1.ConfigEmailResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Dados inválidos',
        schema: {
            example: {
                statusCode: 400,
                message: [
                    'Servidor SMTP é obrigatório',
                    'Email de envio deve ter um formato válido'
                ],
                error: 'Bad Request',
            },
        },
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [config_email_dto_1.UpdateConfigEmailDto]),
    __metadata("design:returntype", Promise)
], ConfigEmailController.prototype, "updateConfigEmail", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Remover configuração de email',
        description: 'Remove a configuração de email do sistema (útil para reset)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Configuração removida com sucesso',
        schema: {
            example: {
                message: 'Configuração de email removida com sucesso',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: 'Nenhuma configuração encontrada para remover',
        schema: {
            example: {
                message: 'Nenhuma configuração de email encontrada para remover',
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigEmailController.prototype, "deleteConfigEmail", null);
__decorate([
    (0, common_1.Get)('exists'),
    (0, swagger_1.ApiOperation)({
        summary: 'Verificar se existe configuração',
        description: 'Verifica se existe uma configuração de email cadastrada',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Status da existência da configuração',
        schema: {
            example: {
                exists: true,
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigEmailController.prototype, "existeConfig", null);
__decorate([
    (0, common_1.Post)('testar-conexao'),
    (0, swagger_1.ApiOperation)({
        summary: 'Testar conexão SMTP',
        description: 'Testa a conexão com o servidor SMTP usando a configuração salva ou fornecida',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Configuração para teste (opcional - usa a salva se não fornecida)',
        type: config_email_dto_1.CreateConfigEmailDto,
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Resultado do teste de conexão',
        schema: {
            example: {
                success: true,
                message: 'Conexão SMTP testada com sucesso',
            },
        },
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [config_email_dto_1.CreateConfigEmailDto]),
    __metadata("design:returntype", Promise)
], ConfigEmailController.prototype, "testarConexao", null);
__decorate([
    (0, common_1.Post)('testar-email'),
    (0, swagger_1.ApiOperation)({
        summary: 'Enviar email de teste',
        description: 'Envia um email de teste usando a configuração do sistema',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Email de destino para o teste',
        schema: {
            type: 'object',
            properties: {
                emailTeste: {
                    type: 'string',
                    format: 'email',
                    description: 'Email de destino para o teste',
                    example: 'teste@exemplo.com',
                },
            },
            required: ['emailTeste'],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Resultado do envio do email de teste',
        schema: {
            example: {
                success: true,
                message: 'Email de teste enviado com sucesso para teste@exemplo.com',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConfigEmailController.prototype, "testarEmail", null);
exports.ConfigEmailController = ConfigEmailController = __decorate([
    (0, swagger_1.ApiTags)('Configuração de Email'),
    (0, common_1.Controller)('config-email'),
    __metadata("design:paramtypes", [config_email_service_1.ConfigEmailService])
], ConfigEmailController);
//# sourceMappingURL=config-email.controller.js.map