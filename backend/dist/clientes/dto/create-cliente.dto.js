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
exports.CreateClienteDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateClienteDto {
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
    industria;
}
exports.CreateClienteDto = CreateClienteDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do cliente',
        example: 'Distribuidora ABC Ltda',
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Razão social',
        example: 'DISTRIBUIDORA ABC LTDA',
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "razaoSocial", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'CPF ou CNPJ do cliente',
        example: '123.456.789-00 ou 12.345.678/0001-90',
        maxLength: 18,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Documento deve ser uma string' }),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "documento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inscrição estadual',
        example: '123456789',
        maxLength: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "inscricaoEstadual", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Inscrição municipal',
        example: '987654321',
        maxLength: 20,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "inscricaoMunicipal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'CEP',
        example: '12345-678',
        maxLength: 9,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "cep", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Logradouro',
        example: 'Rua das Flores',
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "logradouro", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Número',
        example: '123',
        maxLength: 10,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "numero", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Complemento',
        example: 'Sala 101',
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "complemento", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Bairro',
        example: 'Centro',
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "bairro", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Cidade',
        example: 'Fortaleza',
        maxLength: 50,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "cidade", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Estado',
        example: 'CE',
        maxLength: 2,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Telefone principal',
        example: '(88) 99966-1299',
        maxLength: 15,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "telefone1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Telefone secundário',
        example: '(88) 99966-1300',
        maxLength: 15,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "telefone2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email principal',
        example: 'contato@cliente.com',
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "email1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Email secundário',
        example: 'financeiro@cliente.com',
        maxLength: 100,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "email2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações',
        example: 'Cliente de frutas e verduras',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Status do cliente',
        enum: ['ATIVO', 'INATIVO'],
        example: 'ATIVO',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ATIVO', 'INATIVO']),
    __metadata("design:type", String)
], CreateClienteDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Se o cliente é uma indústria',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateClienteDto.prototype, "industria", void 0);
//# sourceMappingURL=create-cliente.dto.js.map