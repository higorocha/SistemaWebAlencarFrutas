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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigWhatsAppResponseDto = exports.UpdateConfigWhatsAppDto = exports.CreateConfigWhatsAppDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateConfigWhatsAppDto {
    phoneNumberId;
    accessToken;
    businessAccountId;
    verifyToken;
    numeroTelefone;
    nomeExibicao;
    ativo;
    webhookUrl;
    configuracoesAdicionais;
}
exports.CreateConfigWhatsAppDto = CreateConfigWhatsAppDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do número de telefone no Facebook Business',
        example: '123456789012345',
    }),
    (0, class_validator_1.IsString)({ message: 'ID do número de telefone deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID do número de telefone é obrigatório' }),
    __metadata("design:type", String)
], CreateConfigWhatsAppDto.prototype, "phoneNumberId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token de acesso da API do WhatsApp Business',
        example: 'EAABsbCS1...token_longo',
    }),
    (0, class_validator_1.IsString)({ message: 'Token de acesso deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Token de acesso é obrigatório' }),
    __metadata("design:type", String)
], CreateConfigWhatsAppDto.prototype, "accessToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da conta comercial do Facebook (opcional)',
        example: '987654321098765',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'ID da conta comercial deve ser um texto válido' }),
    __metadata("design:type", String)
], CreateConfigWhatsAppDto.prototype, "businessAccountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token de verificação do webhook (opcional)',
        example: 'meu_token_verificacao_123',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Token de verificação deve ser um texto válido' }),
    __metadata("design:type", String)
], CreateConfigWhatsAppDto.prototype, "verifyToken", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número de telefone formatado',
        example: '+55 85 99999-9999',
    }),
    (0, class_validator_1.IsString)({ message: 'Número de telefone deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Número de telefone é obrigatório' }),
    __metadata("design:type", String)
], CreateConfigWhatsAppDto.prototype, "numeroTelefone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome que aparece no WhatsApp',
        example: 'Alencar Frutas - Atendimento',
    }),
    (0, class_validator_1.IsString)({ message: 'Nome de exibição deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome de exibição é obrigatório' }),
    __metadata("design:type", String)
], CreateConfigWhatsAppDto.prototype, "nomeExibicao", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Se a configuração está ativa',
        example: true,
        default: true,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'Ativo deve ser verdadeiro ou falso' }),
    __metadata("design:type", Boolean)
], CreateConfigWhatsAppDto.prototype, "ativo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'URL do webhook para receber mensagens (opcional)',
        example: 'https://api.empresa.com/webhook/whatsapp',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'URL do webhook deve ter um formato válido' }),
    __metadata("design:type", String)
], CreateConfigWhatsAppDto.prototype, "webhookUrl", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Configurações adicionais em formato JSON (opcional)',
        example: {
            "timeout": 30,
            "retry_attempts": 3,
            "default_template": "saudacao_inicial"
        },
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Configurações adicionais devem ser um objeto JSON válido' }),
    __metadata("design:type", Object)
], CreateConfigWhatsAppDto.prototype, "configuracoesAdicionais", void 0);
class UpdateConfigWhatsAppDto extends CreateConfigWhatsAppDto {
}
exports.UpdateConfigWhatsAppDto = UpdateConfigWhatsAppDto;
class ConfigWhatsAppResponseDto extends CreateConfigWhatsAppDto {
    id;
    createdAt;
    updatedAt;
}
exports.ConfigWhatsAppResponseDto = ConfigWhatsAppResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID único da configuração',
        example: 1,
    }),
    __metadata("design:type", Number)
], ConfigWhatsAppResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ConfigWhatsAppResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data da última atualização',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ConfigWhatsAppResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=config-whatsapp.dto.js.map