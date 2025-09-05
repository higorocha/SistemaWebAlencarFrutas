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
exports.ContaCorrenteResponseDto = exports.UpdateContaCorrenteDto = exports.CreateContaCorrenteDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateContaCorrenteDto {
    bancoCodigo;
    agencia;
    agenciaDigito;
    contaCorrente;
    contaCorrenteDigito;
}
exports.CreateContaCorrenteDto = CreateContaCorrenteDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código do banco',
        example: '001',
    }),
    (0, class_validator_1.IsString)({ message: 'Código do banco deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Código do banco é obrigatório' }),
    (0, class_validator_1.MinLength)(3, { message: 'Código do banco deve ter pelo menos 3 caracteres' }),
    (0, class_validator_1.MaxLength)(3, { message: 'Código do banco deve ter no máximo 3 caracteres' }),
    __metadata("design:type", String)
], CreateContaCorrenteDto.prototype, "bancoCodigo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número da agência',
        example: '1234',
    }),
    (0, class_validator_1.IsString)({ message: 'Agência deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Agência é obrigatória' }),
    (0, class_validator_1.MinLength)(1, { message: 'Agência deve ter pelo menos 1 caractere' }),
    (0, class_validator_1.MaxLength)(10, { message: 'Agência deve ter no máximo 10 caracteres' }),
    __metadata("design:type", String)
], CreateContaCorrenteDto.prototype, "agencia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dígito verificador da agência',
        example: '0',
    }),
    (0, class_validator_1.IsString)({ message: 'Dígito da agência deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Dígito da agência é obrigatório' }),
    (0, class_validator_1.MinLength)(1, { message: 'Dígito da agência deve ter pelo menos 1 caractere' }),
    (0, class_validator_1.MaxLength)(2, { message: 'Dígito da agência deve ter no máximo 2 caracteres' }),
    __metadata("design:type", String)
], CreateContaCorrenteDto.prototype, "agenciaDigito", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número da conta corrente',
        example: '987654',
    }),
    (0, class_validator_1.IsString)({ message: 'Conta corrente deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Conta corrente é obrigatória' }),
    (0, class_validator_1.MinLength)(1, { message: 'Conta corrente deve ter pelo menos 1 caractere' }),
    (0, class_validator_1.MaxLength)(20, { message: 'Conta corrente deve ter no máximo 20 caracteres' }),
    __metadata("design:type", String)
], CreateContaCorrenteDto.prototype, "contaCorrente", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dígito verificador da conta corrente',
        example: '1',
    }),
    (0, class_validator_1.IsString)({ message: 'Dígito da conta corrente deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Dígito da conta corrente é obrigatório' }),
    (0, class_validator_1.MinLength)(1, { message: 'Dígito da conta corrente deve ter pelo menos 1 caractere' }),
    (0, class_validator_1.MaxLength)(2, { message: 'Dígito da conta corrente deve ter no máximo 2 caracteres' }),
    __metadata("design:type", String)
], CreateContaCorrenteDto.prototype, "contaCorrenteDigito", void 0);
class UpdateContaCorrenteDto {
    bancoCodigo;
    agencia;
    agenciaDigito;
    contaCorrente;
    contaCorrenteDigito;
}
exports.UpdateContaCorrenteDto = UpdateContaCorrenteDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código do banco',
        example: '001',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Código do banco deve ser uma string' }),
    (0, class_validator_1.MinLength)(3, { message: 'Código do banco deve ter pelo menos 3 caracteres' }),
    (0, class_validator_1.MaxLength)(3, { message: 'Código do banco deve ter no máximo 3 caracteres' }),
    __metadata("design:type", String)
], UpdateContaCorrenteDto.prototype, "bancoCodigo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número da agência',
        example: '1234',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Agência deve ser uma string' }),
    (0, class_validator_1.MinLength)(1, { message: 'Agência deve ter pelo menos 1 caractere' }),
    (0, class_validator_1.MaxLength)(10, { message: 'Agência deve ter no máximo 10 caracteres' }),
    __metadata("design:type", String)
], UpdateContaCorrenteDto.prototype, "agencia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dígito verificador da agência',
        example: '0',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Dígito da agência deve ser uma string' }),
    (0, class_validator_1.MinLength)(1, { message: 'Dígito da agência deve ter pelo menos 1 caractere' }),
    (0, class_validator_1.MaxLength)(2, { message: 'Dígito da agência deve ter no máximo 2 caracteres' }),
    __metadata("design:type", String)
], UpdateContaCorrenteDto.prototype, "agenciaDigito", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número da conta corrente',
        example: '987654',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Conta corrente deve ser uma string' }),
    (0, class_validator_1.MinLength)(1, { message: 'Conta corrente deve ter pelo menos 1 caractere' }),
    (0, class_validator_1.MaxLength)(20, { message: 'Conta corrente deve ter no máximo 20 caracteres' }),
    __metadata("design:type", String)
], UpdateContaCorrenteDto.prototype, "contaCorrente", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dígito verificador da conta corrente',
        example: '1',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Dígito da conta corrente deve ser uma string' }),
    (0, class_validator_1.MinLength)(1, { message: 'Dígito da conta corrente deve ter pelo menos 1 caractere' }),
    (0, class_validator_1.MaxLength)(2, { message: 'Dígito da conta corrente deve ter no máximo 2 caracteres' }),
    __metadata("design:type", String)
], UpdateContaCorrenteDto.prototype, "contaCorrenteDigito", void 0);
class ContaCorrenteResponseDto {
    id;
    bancoCodigo;
    agencia;
    agenciaDigito;
    contaCorrente;
    contaCorrenteDigito;
    createdAt;
    updatedAt;
}
exports.ContaCorrenteResponseDto = ContaCorrenteResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da conta corrente',
        example: 1,
    }),
    __metadata("design:type", Number)
], ContaCorrenteResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Código do banco',
        example: '001',
    }),
    __metadata("design:type", String)
], ContaCorrenteResponseDto.prototype, "bancoCodigo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número da agência',
        example: '1234',
    }),
    __metadata("design:type", String)
], ContaCorrenteResponseDto.prototype, "agencia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dígito verificador da agência',
        example: '0',
    }),
    __metadata("design:type", String)
], ContaCorrenteResponseDto.prototype, "agenciaDigito", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Número da conta corrente',
        example: '987654',
    }),
    __metadata("design:type", String)
], ContaCorrenteResponseDto.prototype, "contaCorrente", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dígito verificador da conta corrente',
        example: '1',
    }),
    __metadata("design:type", String)
], ContaCorrenteResponseDto.prototype, "contaCorrenteDigito", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ContaCorrenteResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de atualização',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ContaCorrenteResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=conta-corrente.dto.js.map