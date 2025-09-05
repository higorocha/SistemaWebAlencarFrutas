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
exports.ConfigWhatsAppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const config_whatsapp_service_1 = require("./config-whatsapp.service");
const config_whatsapp_dto_1 = require("../config/dto/config-whatsapp.dto");
class EnviarMensagemTesteDto {
    numeroDestino;
    mensagem;
}
let ConfigWhatsAppController = class ConfigWhatsAppController {
    configWhatsAppService;
    constructor(configWhatsAppService) {
        this.configWhatsAppService = configWhatsAppService;
    }
    async findConfigWhatsApp() {
        return this.configWhatsAppService.findConfigWhatsApp();
    }
    async upsertConfigWhatsApp(body) {
        const configDto = {
            phoneNumberId: body.phone_number_id,
            accessToken: body.access_token,
            businessAccountId: body.business_account_id,
            verifyToken: body.verify_token,
            numeroTelefone: body.numero_telefone,
            nomeExibicao: body.nome_exibicao,
            ativo: body.ativo ?? true,
            webhookUrl: body.webhook_url,
            configuracoesAdicionais: body.configuracoesAdicionais,
        };
        const result = await this.configWhatsAppService.upsertConfigWhatsApp(configDto);
        return {
            ...result,
            message: 'Configuração de WhatsApp salva com sucesso! As configurações foram aplicadas e estão prontas para uso.'
        };
    }
    async updateConfigWhatsApp(body) {
        const configDto = {
            phoneNumberId: body.phone_number_id,
            accessToken: body.access_token,
            businessAccountId: body.business_account_id,
            verifyToken: body.verify_token,
            numeroTelefone: body.numero_telefone,
            nomeExibicao: body.nome_exibicao,
            ativo: body.ativo ?? true,
            webhookUrl: body.webhook_url,
            configuracoesAdicionais: body.configuracoesAdicionais,
        };
        return this.configWhatsAppService.upsertConfigWhatsApp(configDto);
    }
    async deleteConfigWhatsApp() {
        return this.configWhatsAppService.deleteConfigWhatsApp();
    }
    async existeConfig() {
        const exists = await this.configWhatsAppService.existeConfig();
        return { exists };
    }
    async testarConexao(configDto) {
        return this.configWhatsAppService.testarConexao(configDto);
    }
    async testarWhatsApp(body) {
        const mensagemTeste = 'Esta é uma mensagem de teste do Sistema Alencar Frutas. Se você recebeu esta mensagem, a integração está funcionando corretamente! 🍎';
        return this.configWhatsAppService.enviarMensagemTeste(body.telefone_teste, mensagemTeste);
    }
    async enviarMensagemTeste(body) {
        return this.configWhatsAppService.enviarMensagemTeste(body.numeroDestino, body.mensagem);
    }
};
exports.ConfigWhatsAppController = ConfigWhatsAppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Buscar configuração de WhatsApp',
        description: 'Retorna a configuração de WhatsApp única do sistema (se existir)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Configuração encontrada',
        type: config_whatsapp_dto_1.ConfigWhatsAppResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: 'Nenhuma configuração cadastrada',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigWhatsAppController.prototype, "findConfigWhatsApp", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Salvar configuração de WhatsApp',
        description: 'Cria ou atualiza a configuração de WhatsApp única do sistema',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Dados da configuração de WhatsApp (aceita snake_case do frontend)',
        schema: {
            type: 'object',
            properties: {
                phone_number_id: { type: 'string', description: 'ID do número de telefone' },
                access_token: { type: 'string', description: 'Token de acesso' },
                business_account_id: { type: 'string', description: 'ID da conta comercial (opcional)' },
                verify_token: { type: 'string', description: 'Token de verificação (opcional)' },
                numero_telefone: { type: 'string', description: 'Número de telefone' },
                nome_exibicao: { type: 'string', description: 'Nome de exibição' },
                ativo: { type: 'boolean', description: 'Se está ativo' },
                webhook_url: { type: 'string', description: 'URL do webhook (opcional)' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Configuração salva com sucesso',
        type: config_whatsapp_dto_1.ConfigWhatsAppResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Dados inválidos',
        schema: {
            example: {
                statusCode: 400,
                message: [
                    'ID do número de telefone é obrigatório',
                    'Token de acesso é obrigatório'
                ],
                error: 'Bad Request',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConfigWhatsAppController.prototype, "upsertConfigWhatsApp", null);
__decorate([
    (0, common_1.Put)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Atualizar configuração de WhatsApp',
        description: 'Atualiza a configuração de WhatsApp única do sistema (mesmo comportamento do POST)',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Dados da configuração de WhatsApp (aceita snake_case do frontend)',
        schema: {
            type: 'object',
            properties: {
                phone_number_id: { type: 'string', description: 'ID do número de telefone' },
                access_token: { type: 'string', description: 'Token de acesso' },
                business_account_id: { type: 'string', description: 'ID da conta comercial (opcional)' },
                verify_token: { type: 'string', description: 'Token de verificação (opcional)' },
                numero_telefone: { type: 'string', description: 'Número de telefone' },
                nome_exibicao: { type: 'string', description: 'Nome de exibição' },
                ativo: { type: 'boolean', description: 'Se está ativo' },
                webhook_url: { type: 'string', description: 'URL do webhook (opcional)' },
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Configuração atualizada com sucesso',
        type: config_whatsapp_dto_1.ConfigWhatsAppResponseDto,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Dados inválidos',
        schema: {
            example: {
                statusCode: 400,
                message: [
                    'ID do número de telefone é obrigatório',
                    'Token de acesso é obrigatório'
                ],
                error: 'Bad Request',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConfigWhatsAppController.prototype, "updateConfigWhatsApp", null);
__decorate([
    (0, common_1.Delete)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Remover configuração de WhatsApp',
        description: 'Remove a configuração de WhatsApp do sistema (útil para reset)',
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Configuração removida com sucesso',
        schema: {
            example: {
                message: 'Configuração de WhatsApp removida com sucesso',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NO_CONTENT,
        description: 'Nenhuma configuração encontrada para remover',
        schema: {
            example: {
                message: 'Nenhuma configuração de WhatsApp encontrada para remover',
            },
        },
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfigWhatsAppController.prototype, "deleteConfigWhatsApp", null);
__decorate([
    (0, common_1.Get)('exists'),
    (0, swagger_1.ApiOperation)({
        summary: 'Verificar se existe configuração',
        description: 'Verifica se existe uma configuração de WhatsApp cadastrada',
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
], ConfigWhatsAppController.prototype, "existeConfig", null);
__decorate([
    (0, common_1.Post)('testar-conexao'),
    (0, swagger_1.ApiOperation)({
        summary: 'Testar conexão com API WhatsApp',
        description: 'Testa a conexão com a API do WhatsApp usando a configuração salva ou fornecida',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Configuração para teste (opcional - usa a salva se não fornecida)',
        type: config_whatsapp_dto_1.CreateConfigWhatsAppDto,
        required: false,
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Resultado do teste de conexão',
        schema: {
            example: {
                success: true,
                message: 'Conexão com API WhatsApp testada com sucesso',
            },
        },
    }),
    __param(0, (0, common_1.Body)(common_1.ValidationPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [config_whatsapp_dto_1.CreateConfigWhatsAppDto]),
    __metadata("design:returntype", Promise)
], ConfigWhatsAppController.prototype, "testarConexao", null);
__decorate([
    (0, common_1.Post)('testar'),
    (0, swagger_1.ApiOperation)({
        summary: 'Enviar mensagem de teste WhatsApp',
        description: 'Envia uma mensagem de teste via WhatsApp usando a configuração do sistema',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Número de telefone para teste',
        schema: {
            type: 'object',
            properties: {
                telefone_teste: {
                    type: 'string',
                    description: 'Número de telefone para teste (apenas DDD + número)',
                    example: '85999999999',
                },
            },
            required: ['telefone_teste'],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Resultado do envio da mensagem de teste',
        schema: {
            example: {
                success: true,
                message: 'Mensagem de teste enviada com sucesso para 85999999999',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ConfigWhatsAppController.prototype, "testarWhatsApp", null);
__decorate([
    (0, common_1.Post)('enviar-mensagem-teste'),
    (0, swagger_1.ApiOperation)({
        summary: 'Enviar mensagem de teste',
        description: 'Envia uma mensagem de teste via WhatsApp usando a configuração do sistema',
    }),
    (0, swagger_1.ApiBody)({
        description: 'Dados para envio da mensagem de teste',
        schema: {
            type: 'object',
            properties: {
                numeroDestino: {
                    type: 'string',
                    description: 'Número de telefone de destino (formato internacional)',
                    example: '+5585999999999',
                },
                mensagem: {
                    type: 'string',
                    description: 'Mensagem a ser enviada',
                    example: 'Esta é uma mensagem de teste do sistema Alencar Frutas.',
                },
            },
            required: ['numeroDestino', 'mensagem'],
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Resultado do envio da mensagem',
        schema: {
            example: {
                success: true,
                message: 'Mensagem de teste enviada com sucesso para +5585999999999',
            },
        },
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Dados inválidos ou configuração não encontrada',
        schema: {
            example: {
                success: false,
                message: 'Nenhuma configuração de WhatsApp encontrada para envio',
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [EnviarMensagemTesteDto]),
    __metadata("design:returntype", Promise)
], ConfigWhatsAppController.prototype, "enviarMensagemTeste", null);
exports.ConfigWhatsAppController = ConfigWhatsAppController = __decorate([
    (0, swagger_1.ApiTags)('Configuração de WhatsApp'),
    (0, common_1.Controller)('config-whatsapp'),
    __metadata("design:paramtypes", [config_whatsapp_service_1.ConfigWhatsAppService])
], ConfigWhatsAppController);
//# sourceMappingURL=config-whatsapp.controller.js.map