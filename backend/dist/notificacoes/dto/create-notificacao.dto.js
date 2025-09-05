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
exports.CreateNotificacaoDto = exports.PrioridadeNotificacao = exports.TipoNotificacao = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var TipoNotificacao;
(function (TipoNotificacao) {
    TipoNotificacao["SISTEMA"] = "SISTEMA";
    TipoNotificacao["PIX"] = "PIX";
    TipoNotificacao["COBRANCA"] = "COBRANCA";
    TipoNotificacao["FATURA"] = "FATURA";
    TipoNotificacao["BOLETO"] = "BOLETO";
    TipoNotificacao["ALERTA"] = "ALERTA";
})(TipoNotificacao || (exports.TipoNotificacao = TipoNotificacao = {}));
var PrioridadeNotificacao;
(function (PrioridadeNotificacao) {
    PrioridadeNotificacao["BAIXA"] = "BAIXA";
    PrioridadeNotificacao["MEDIA"] = "MEDIA";
    PrioridadeNotificacao["ALTA"] = "ALTA";
})(PrioridadeNotificacao || (exports.PrioridadeNotificacao = PrioridadeNotificacao = {}));
class CreateNotificacaoDto {
    titulo;
    conteudo;
    tipo;
    prioridade;
    usuarioId;
    dadosAdicionais;
    link;
    expirarEm;
}
exports.CreateNotificacaoDto = CreateNotificacaoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Título da notificação',
        example: 'Novo pagamento recebido',
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)({ message: 'Título deve ser uma string' }),
    __metadata("design:type", String)
], CreateNotificacaoDto.prototype, "titulo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Conteúdo da notificação',
        example: 'O cliente João Silva realizou um pagamento de R$ 150,00',
    }),
    (0, class_validator_1.IsString)({ message: 'Conteúdo deve ser uma string' }),
    __metadata("design:type", String)
], CreateNotificacaoDto.prototype, "conteudo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo da notificação',
        enum: TipoNotificacao,
        default: TipoNotificacao.SISTEMA,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TipoNotificacao, { message: 'Tipo deve ser um valor válido' }),
    __metadata("design:type", String)
], CreateNotificacaoDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prioridade da notificação',
        enum: PrioridadeNotificacao,
        default: PrioridadeNotificacao.MEDIA,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(PrioridadeNotificacao, { message: 'Prioridade deve ser um valor válido' }),
    __metadata("design:type", String)
], CreateNotificacaoDto.prototype, "prioridade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do usuário destinatário (opcional para notificações globais)',
        example: 1,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'ID do usuário deve ser um número' }),
    __metadata("design:type", Number)
], CreateNotificacaoDto.prototype, "usuarioId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dados adicionais em formato JSON',
        example: { valor: 150.00, cliente: 'João Silva' },
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)({ message: 'Dados adicionais devem ser um objeto' }),
    __metadata("design:type", Object)
], CreateNotificacaoDto.prototype, "dadosAdicionais", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Link relacionado à notificação',
        example: 'https://exemplo.com/detalhes',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUrl)({}, { message: 'Link deve ser uma URL válida' }),
    __metadata("design:type", String)
], CreateNotificacaoDto.prototype, "link", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de expiração da notificação',
        example: '2024-12-31T23:59:59.000Z',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Data de expiração deve ser uma data válida' }),
    __metadata("design:type", String)
], CreateNotificacaoDto.prototype, "expirarEm", void 0);
//# sourceMappingURL=create-notificacao.dto.js.map