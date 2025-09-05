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
exports.ConfigDadosEmpresaResponseDto = exports.UpdateConfigDadosEmpresaDto = exports.CreateConfigDadosEmpresaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateConfigDadosEmpresaDto {
    razao_social;
    nome_fantasia;
    cnpj;
    proprietario;
    telefone;
    logradouro;
    cep;
    bairro;
    cidade;
    estado;
}
exports.CreateConfigDadosEmpresaDto = CreateConfigDadosEmpresaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Razão social da empresa',
        example: 'Empresa XYZ LTDA',
    }),
    (0, class_validator_1.IsString)({ message: 'Razão social deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Razão social é obrigatória' }),
    (0, class_validator_1.MinLength)(2, { message: 'Razão social deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], CreateConfigDadosEmpresaDto.prototype, "razao_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome fantasia da empresa',
        example: 'XYZ Comércio',
    }),
    (0, class_validator_1.IsString)({ message: 'Nome fantasia deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome fantasia é obrigatório' }),
    (0, class_validator_1.MinLength)(2, { message: 'Nome fantasia deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], CreateConfigDadosEmpresaDto.prototype, "nome_fantasia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CNPJ da empresa (formato: XX.XXX.XXX/XXXX-XX)',
        example: '12.345.678/0001-90',
    }),
    (0, class_validator_1.IsString)({ message: 'CNPJ deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'CNPJ é obrigatório' }),
    (0, class_validator_1.Matches)(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
        message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
    }),
    __metadata("design:type", String)
], CreateConfigDadosEmpresaDto.prototype, "cnpj", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do proprietário',
        example: 'João Silva',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Proprietário deve ser uma string' }),
    __metadata("design:type", String)
], CreateConfigDadosEmpresaDto.prototype, "proprietario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Telefone da empresa (formato: (XX) XXXXX-XXXX)',
        example: '(11) 99999-9999',
    }),
    (0, class_validator_1.IsString)({ message: 'Telefone deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Telefone é obrigatório' }),
    (0, class_validator_1.Matches)(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
        message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
    }),
    __metadata("design:type", String)
], CreateConfigDadosEmpresaDto.prototype, "telefone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Logradouro do endereço',
        example: 'Rua Exemplo, 123',
    }),
    (0, class_validator_1.IsString)({ message: 'Logradouro deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Logradouro é obrigatório' }),
    (0, class_validator_1.MinLength)(5, { message: 'Logradouro deve ter pelo menos 5 caracteres' }),
    __metadata("design:type", String)
], CreateConfigDadosEmpresaDto.prototype, "logradouro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CEP (formato: XXXXX-XXX)',
        example: '12345-678',
    }),
    (0, class_validator_1.IsString)({ message: 'CEP deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'CEP é obrigatório' }),
    (0, class_validator_1.Matches)(/^\d{5}-\d{3}$/, {
        message: 'CEP deve estar no formato XXXXX-XXX',
    }),
    __metadata("design:type", String)
], CreateConfigDadosEmpresaDto.prototype, "cep", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bairro',
        example: 'Centro',
    }),
    (0, class_validator_1.IsString)({ message: 'Bairro deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Bairro é obrigatório' }),
    (0, class_validator_1.MinLength)(2, { message: 'Bairro deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], CreateConfigDadosEmpresaDto.prototype, "bairro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cidade',
        example: 'Marco',
    }),
    (0, class_validator_1.IsString)({ message: 'Cidade deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Cidade é obrigatória' }),
    (0, class_validator_1.MinLength)(2, { message: 'Cidade deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], CreateConfigDadosEmpresaDto.prototype, "cidade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Estado (UF)',
        example: 'CE',
    }),
    (0, class_validator_1.IsString)({ message: 'Estado deve ser uma string' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'Estado é obrigatório' }),
    (0, class_validator_1.MinLength)(2, { message: 'Estado deve ter 2 caracteres' }),
    (0, class_validator_1.Matches)(/^[A-Z]{2}$/, {
        message: 'Estado deve ser uma UF válida (2 letras maiúsculas)',
    }),
    __metadata("design:type", String)
], CreateConfigDadosEmpresaDto.prototype, "estado", void 0);
class UpdateConfigDadosEmpresaDto {
    razao_social;
    nome_fantasia;
    cnpj;
    proprietario;
    telefone;
    logradouro;
    cep;
    bairro;
    cidade;
    estado;
}
exports.UpdateConfigDadosEmpresaDto = UpdateConfigDadosEmpresaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Razão social da empresa',
        example: 'Empresa XYZ LTDA',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Razão social deve ser uma string' }),
    (0, class_validator_1.MinLength)(2, { message: 'Razão social deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], UpdateConfigDadosEmpresaDto.prototype, "razao_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome fantasia da empresa',
        example: 'XYZ Comércio',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Nome fantasia deve ser uma string' }),
    (0, class_validator_1.MinLength)(2, { message: 'Nome fantasia deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], UpdateConfigDadosEmpresaDto.prototype, "nome_fantasia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CNPJ da empresa (formato: XX.XXX.XXX/XXXX-XX)',
        example: '12.345.678/0001-90',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'CNPJ deve ser uma string' }),
    (0, class_validator_1.Matches)(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/, {
        message: 'CNPJ deve estar no formato XX.XXX.XXX/XXXX-XX',
    }),
    __metadata("design:type", String)
], UpdateConfigDadosEmpresaDto.prototype, "cnpj", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do proprietário',
        example: 'João Silva',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Proprietário deve ser uma string' }),
    __metadata("design:type", String)
], UpdateConfigDadosEmpresaDto.prototype, "proprietario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Telefone da empresa (formato: (XX) XXXXX-XXXX)',
        example: '(11) 99999-9999',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Telefone deve ser uma string' }),
    (0, class_validator_1.Matches)(/^\(\d{2}\)\s\d{4,5}-\d{4}$/, {
        message: 'Telefone deve estar no formato (XX) XXXXX-XXXX',
    }),
    __metadata("design:type", String)
], UpdateConfigDadosEmpresaDto.prototype, "telefone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Logradouro do endereço',
        example: 'Rua Exemplo, 123',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Logradouro deve ser uma string' }),
    (0, class_validator_1.MinLength)(5, { message: 'Logradouro deve ter pelo menos 5 caracteres' }),
    __metadata("design:type", String)
], UpdateConfigDadosEmpresaDto.prototype, "logradouro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CEP (formato: XXXXX-XXX)',
        example: '12345-678',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'CEP deve ser uma string' }),
    (0, class_validator_1.Matches)(/^\d{5}-\d{3}$/, {
        message: 'CEP deve estar no formato XXXXX-XXX',
    }),
    __metadata("design:type", String)
], UpdateConfigDadosEmpresaDto.prototype, "cep", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bairro',
        example: 'Centro',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Bairro deve ser uma string' }),
    (0, class_validator_1.MinLength)(2, { message: 'Bairro deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], UpdateConfigDadosEmpresaDto.prototype, "bairro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cidade',
        example: 'Marco',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Cidade deve ser uma string' }),
    (0, class_validator_1.MinLength)(2, { message: 'Cidade deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], UpdateConfigDadosEmpresaDto.prototype, "cidade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Estado (UF)',
        example: 'CE',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Estado deve ser uma string' }),
    (0, class_validator_1.MinLength)(2, { message: 'Estado deve ter 2 caracteres' }),
    (0, class_validator_1.Matches)(/^[A-Z]{2}$/, {
        message: 'Estado deve ser uma UF válida (2 letras maiúsculas)',
    }),
    __metadata("design:type", String)
], UpdateConfigDadosEmpresaDto.prototype, "estado", void 0);
class ConfigDadosEmpresaResponseDto {
    id;
    razao_social;
    nome_fantasia;
    cnpj;
    proprietario;
    telefone;
    logradouro;
    cep;
    bairro;
    cidade;
    estado;
    createdAt;
    updatedAt;
}
exports.ConfigDadosEmpresaResponseDto = ConfigDadosEmpresaResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da configuração',
        example: 1,
    }),
    __metadata("design:type", Number)
], ConfigDadosEmpresaResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Razão social da empresa',
        example: 'Empresa XYZ LTDA',
    }),
    __metadata("design:type", String)
], ConfigDadosEmpresaResponseDto.prototype, "razao_social", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome fantasia da empresa',
        example: 'XYZ Comércio',
    }),
    __metadata("design:type", String)
], ConfigDadosEmpresaResponseDto.prototype, "nome_fantasia", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CNPJ da empresa',
        example: '12.345.678/0001-90',
    }),
    __metadata("design:type", String)
], ConfigDadosEmpresaResponseDto.prototype, "cnpj", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do proprietário',
        example: 'João Silva',
        required: false,
    }),
    __metadata("design:type", Object)
], ConfigDadosEmpresaResponseDto.prototype, "proprietario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Telefone da empresa',
        example: '(11) 99999-9999',
    }),
    __metadata("design:type", String)
], ConfigDadosEmpresaResponseDto.prototype, "telefone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Logradouro do endereço',
        example: 'Rua Exemplo, 123',
    }),
    __metadata("design:type", String)
], ConfigDadosEmpresaResponseDto.prototype, "logradouro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CEP',
        example: '12345-678',
    }),
    __metadata("design:type", String)
], ConfigDadosEmpresaResponseDto.prototype, "cep", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Bairro',
        example: 'Centro',
    }),
    __metadata("design:type", String)
], ConfigDadosEmpresaResponseDto.prototype, "bairro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Cidade',
        example: 'Marco',
    }),
    __metadata("design:type", String)
], ConfigDadosEmpresaResponseDto.prototype, "cidade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Estado (UF)',
        example: 'CE',
    }),
    __metadata("design:type", String)
], ConfigDadosEmpresaResponseDto.prototype, "estado", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ConfigDadosEmpresaResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de atualização',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], ConfigDadosEmpresaResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=config-dados-empresa.dto.js.map