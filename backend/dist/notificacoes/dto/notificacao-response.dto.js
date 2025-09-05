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
exports.NotificacaoResponseDto = exports.StatusNotificacao = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_notificacao_dto_1 = require("./create-notificacao.dto");
var StatusNotificacao;
(function (StatusNotificacao) {
    StatusNotificacao["NAO_LIDA"] = "NAO_LIDA";
    StatusNotificacao["LIDA"] = "LIDA";
    StatusNotificacao["DESCARTADA"] = "DESCARTADA";
})(StatusNotificacao || (exports.StatusNotificacao = StatusNotificacao = {}));
class NotificacaoResponseDto {
    id;
    titulo;
    conteudo;
    tipo;
    status;
    prioridade;
    usuarioId;
    dadosAdicionais;
    link;
    expirarEm;
    createdAt;
    updatedAt;
}
exports.NotificacaoResponseDto = NotificacaoResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da notificação',
        example: 1,
    }),
    __metadata("design:type", Number)
], NotificacaoResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Título da notificação',
        example: 'Novo pagamento recebido',
    }),
    __metadata("design:type", String)
], NotificacaoResponseDto.prototype, "titulo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Conteúdo da notificação',
        example: 'O cliente João Silva realizou um pagamento de R$ 150,00',
    }),
    __metadata("design:type", String)
], NotificacaoResponseDto.prototype, "conteudo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo da notificação',
        enum: create_notificacao_dto_1.TipoNotificacao,
        example: create_notificacao_dto_1.TipoNotificacao.BOLETO,
    }),
    __metadata("design:type", String)
], NotificacaoResponseDto.prototype, "tipo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status da notificação',
        enum: StatusNotificacao,
        example: StatusNotificacao.NAO_LIDA,
    }),
    __metadata("design:type", String)
], NotificacaoResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Prioridade da notificação',
        enum: create_notificacao_dto_1.PrioridadeNotificacao,
        example: create_notificacao_dto_1.PrioridadeNotificacao.MEDIA,
    }),
    __metadata("design:type", String)
], NotificacaoResponseDto.prototype, "prioridade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do usuário destinatário',
        example: 1,
        required: false,
    }),
    __metadata("design:type", Number)
], NotificacaoResponseDto.prototype, "usuarioId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dados adicionais em formato JSON',
        example: { valor: 150.00, cliente: 'João Silva' },
        required: false,
    }),
    __metadata("design:type", Object)
], NotificacaoResponseDto.prototype, "dadosAdicionais", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Link relacionado à notificação',
        example: 'https://exemplo.com/detalhes',
        required: false,
    }),
    __metadata("design:type", String)
], NotificacaoResponseDto.prototype, "link", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de expiração da notificação',
        example: '2024-12-31T23:59:59.000Z',
        required: false,
    }),
    __metadata("design:type", Date)
], NotificacaoResponseDto.prototype, "expirarEm", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação da notificação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], NotificacaoResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data da última atualização da notificação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], NotificacaoResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=notificacao-response.dto.js.map