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
exports.ConfigEmailResponseDto = exports.UpdateConfigEmailDto = exports.CreateConfigEmailDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateConfigEmailDto {
    servidorSMTP;
    porta;
    emailEnvio;
    nomeExibicao;
    usuario;
    senha;
    metodoAutenticacao;
    timeoutConexao;
    usarSSL;
}
exports.CreateConfigEmailDto = CreateConfigEmailDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Servidor SMTP',
        example: 'smtp.gmail.com',
    }),
    (0, class_validator_1.IsString)({ message: 'Servidor SMTP deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Servidor SMTP é obrigatório' }),
    __metadata("design:type", String)
], CreateConfigEmailDto.prototype, "servidorSMTP", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Porta do servidor SMTP',
        example: 587,
        minimum: 1,
        maximum: 65535,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Porta deve ser um número válido' }),
    (0, class_validator_1.Min)(1, { message: 'Porta deve ser maior que 0' }),
    (0, class_validator_1.Max)(65535, { message: 'Porta deve ser menor que 65536' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateConfigEmailDto.prototype, "porta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email que será usado para envio',
        example: 'noreply@empresa.com',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email de envio deve ter um formato válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Email de envio é obrigatório' }),
    __metadata("design:type", String)
], CreateConfigEmailDto.prototype, "emailEnvio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome que aparecerá como remetente',
        example: 'Sistema Alencar Frutas',
    }),
    (0, class_validator_1.IsString)({ message: 'Nome de exibição deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome de exibição é obrigatório' }),
    __metadata("design:type", String)
], CreateConfigEmailDto.prototype, "nomeExibicao", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Usuário para autenticação no servidor SMTP',
        example: 'usuario@empresa.com',
    }),
    (0, class_validator_1.IsString)({ message: 'Usuário deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Usuário é obrigatório' }),
    __metadata("design:type", String)
], CreateConfigEmailDto.prototype, "usuario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Senha para autenticação no servidor SMTP',
        example: 'senhaSegura123',
    }),
    (0, class_validator_1.IsString)({ message: 'Senha deve ser um texto válido' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Senha é obrigatória' }),
    __metadata("design:type", String)
], CreateConfigEmailDto.prototype, "senha", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Método de autenticação',
        example: 'LOGIN',
        enum: ['LOGIN', 'PLAIN', 'CRAM-MD5'],
    }),
    (0, class_validator_1.IsString)({ message: 'Método de autenticação deve ser um texto válido' }),
    (0, class_validator_1.IsIn)(['LOGIN', 'PLAIN', 'CRAM-MD5'], {
        message: 'Método de autenticação deve ser LOGIN, PLAIN ou CRAM-MD5'
    }),
    __metadata("design:type", String)
], CreateConfigEmailDto.prototype, "metodoAutenticacao", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Timeout da conexão em segundos',
        example: 30,
        minimum: 5,
        maximum: 300,
    }),
    (0, class_validator_1.IsNumber)({}, { message: 'Timeout deve ser um número válido' }),
    (0, class_validator_1.Min)(5, { message: 'Timeout deve ser pelo menos 5 segundos' }),
    (0, class_validator_1.Max)(300, { message: 'Timeout não pode ser superior a 300 segundos' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateConfigEmailDto.prototype, "timeoutConexao", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Se deve usar SSL/TLS',
        example: true,
    }),
    (0, class_validator_1.IsBoolean)({ message: 'Usar SSL deve ser verdadeiro ou falso' }),
    __metadata("design:type", Boolean)
], CreateConfigEmailDto.prototype, "usarSSL", void 0);
class UpdateConfigEmailDto extends CreateConfigEmailDto {
}
exports.UpdateConfigEmailDto = UpdateConfigEmailDto;
class ConfigEmailResponseDto extends CreateConfigEmailDto {
    id;
    createdAt;
    updatedAt;
}
exports.ConfigEmailResponseDto = ConfigEmailResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID único da configuração',
        example: 1,
    }),
    __metadata("design:type", Number)
], ConfigEmailResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ConfigEmailResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data da última atualização',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ConfigEmailResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=config-email.dto.js.map