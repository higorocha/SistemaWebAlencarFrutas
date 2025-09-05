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
exports.ClienteResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class ClienteResponseDto {
    id;
    nome;
    razaoSocial;
    documento;
    inscricaoEstadual;
    inscricaoMunicipal;
    cep;
    logradouro;
    numero;
    complemento;
    bairro;
    cidade;
    estado;
    telefone1;
    telefone2;
    email1;
    email2;
    observacoes;
    status;
    createdAt;
    updatedAt;
}
exports.ClienteResponseDto = ClienteResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do cliente',
        example: 1,
    }),
    __metadata("design:type", Number)
], ClienteResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do cliente',
        example: 'Distribuidora ABC Ltda',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Razão social',
        example: 'DISTRIBUIDORA ABC LTDA',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "razaoSocial", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'CPF ou CNPJ do cliente',
        example: '123.456.789-00 ou 12.345.678/0001-90',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "documento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inscrição estadual',
        example: '123456789',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "inscricaoEstadual", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inscrição municipal',
        example: '987654321',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "inscricaoMunicipal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'CEP',
        example: '12345-678',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "cep", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Logradouro',
        example: 'Rua das Flores',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "logradouro", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Número',
        example: '123',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Complemento',
        example: 'Sala 101',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "complemento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Bairro',
        example: 'Centro',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "bairro", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Cidade',
        example: 'Fortaleza',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "cidade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Estado',
        example: 'CE',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Telefone principal',
        example: '(88) 99966-1299',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "telefone1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Telefone secundário',
        example: '(88) 99966-1300',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "telefone2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email principal',
        example: 'contato@cliente.com',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "email1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email secundário',
        example: 'financeiro@cliente.com',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "email2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações',
        example: 'Cliente de frutas e verduras',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Status do cliente',
        enum: ['ATIVO', 'INATIVO'],
        example: 'ATIVO',
    }),
    __metadata("design:type", String)
], ClienteResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ClienteResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de atualização',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ClienteResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=cliente-response.dto.js.map