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
exports.CredenciaisAPIResponseDto = exports.UpdateCredenciaisAPIDto = exports.CreateCredenciaisAPIDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateCredenciaisAPIDto {
    banco;
    contaCorrenteId;
    modalidadeApi;
    developerAppKey;
    clienteId;
    clienteSecret;
}
exports.CreateCredenciaisAPIDto = CreateCredenciaisAPIDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código do banco (ex: 001)',
        example: '001',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Banco é obrigatório' }),
    __metadata("design:type", String)
], CreateCredenciaisAPIDto.prototype, "banco", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da conta corrente associada',
        example: 1,
    }),
    (0, class_validator_1.IsInt)({ message: 'ID da conta corrente deve ser um número inteiro' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateCredenciaisAPIDto.prototype, "contaCorrenteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Modalidade da API (ex: 001 - Cobrança, 002 - PIX)',
        example: '001 - Cobrança',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Modalidade API é obrigatória' }),
    __metadata("design:type", String)
], CreateCredenciaisAPIDto.prototype, "modalidadeApi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Developer Application Key fornecida pelo banco',
        example: 'your-developer-app-key-here',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Developer Application Key é obrigatória' }),
    __metadata("design:type", String)
], CreateCredenciaisAPIDto.prototype, "developerAppKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cliente ID fornecido pelo banco',
        example: 'your-client-id-here',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Cliente ID é obrigatório' }),
    __metadata("design:type", String)
], CreateCredenciaisAPIDto.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cliente Secret fornecido pelo banco',
        example: 'your-client-secret-here',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Cliente Secret é obrigatório' }),
    __metadata("design:type", String)
], CreateCredenciaisAPIDto.prototype, "clienteSecret", void 0);
class UpdateCredenciaisAPIDto extends (0, swagger_1.PartialType)(CreateCredenciaisAPIDto) {
    banco;
    contaCorrenteId;
    modalidadeApi;
    developerAppKey;
    clienteId;
    clienteSecret;
}
exports.UpdateCredenciaisAPIDto = UpdateCredenciaisAPIDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código do banco (ex: 001)',
        example: '001',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Banco não pode estar vazio' }),
    __metadata("design:type", String)
], UpdateCredenciaisAPIDto.prototype, "banco", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da conta corrente associada',
        example: 1,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)({ message: 'ID da conta corrente deve ser um número inteiro' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateCredenciaisAPIDto.prototype, "contaCorrenteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Modalidade da API (ex: 001 - Cobrança, 002 - PIX)',
        example: '001 - Cobrança',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Modalidade API não pode estar vazia' }),
    __metadata("design:type", String)
], UpdateCredenciaisAPIDto.prototype, "modalidadeApi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Developer Application Key fornecida pelo banco',
        example: 'your-developer-app-key-here',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Developer Application Key não pode estar vazia' }),
    __metadata("design:type", String)
], UpdateCredenciaisAPIDto.prototype, "developerAppKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cliente ID fornecido pelo banco',
        example: 'your-client-id-here',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Cliente ID não pode estar vazio' }),
    __metadata("design:type", String)
], UpdateCredenciaisAPIDto.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cliente Secret fornecido pelo banco',
        example: 'your-client-secret-here',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Cliente Secret não pode estar vazio' }),
    __metadata("design:type", String)
], UpdateCredenciaisAPIDto.prototype, "clienteSecret", void 0);
class CredenciaisAPIResponseDto {
    id;
    banco;
    contaCorrenteId;
    modalidadeApi;
    developerAppKey;
    clienteId;
    clienteSecret;
    createdAt;
    updatedAt;
}
exports.CredenciaisAPIResponseDto = CredenciaisAPIResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID único das credenciais',
        example: 1,
    }),
    __metadata("design:type", Number)
], CredenciaisAPIResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código do banco',
        example: '001',
    }),
    __metadata("design:type", String)
], CredenciaisAPIResponseDto.prototype, "banco", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da conta corrente associada',
        example: 1,
    }),
    __metadata("design:type", Number)
], CredenciaisAPIResponseDto.prototype, "contaCorrenteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Modalidade da API',
        example: '001 - Cobrança',
    }),
    __metadata("design:type", String)
], CredenciaisAPIResponseDto.prototype, "modalidadeApi", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Developer Application Key',
        example: 'your-developer-app-key-here',
    }),
    __metadata("design:type", String)
], CredenciaisAPIResponseDto.prototype, "developerAppKey", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cliente ID',
        example: 'your-client-id-here',
    }),
    __metadata("design:type", String)
], CredenciaisAPIResponseDto.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cliente Secret',
        example: 'your-client-secret-here',
    }),
    __metadata("design:type", String)
], CredenciaisAPIResponseDto.prototype, "clienteSecret", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], CredenciaisAPIResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data da última atualização',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], CredenciaisAPIResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=credenciais-api.dto.js.map