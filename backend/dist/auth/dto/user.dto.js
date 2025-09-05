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
exports.UserResponseDto = exports.UpdateUserDto = exports.CreateUserDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const register_dto_1 = require("./register.dto");
class CreateUserDto {
    nome;
    cpf;
    email;
    senha;
    nivel;
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome completo do usuário',
        example: 'João Silva',
    }),
    (0, class_validator_1.IsString)({ message: 'Nome deve ser uma string' }),
    (0, class_validator_1.MinLength)(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CPF do usuário (apenas números)',
        example: '12345678901',
    }),
    (0, class_validator_1.IsString)({ message: 'CPF deve ser uma string' }),
    (0, class_validator_1.MinLength)(11, { message: 'CPF deve ter 11 dígitos' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "cpf", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email do usuário',
        example: 'joao@alencarfrutas.com.br',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email inválido' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Senha do usuário',
        example: 'minhasenha123',
        minLength: 6,
    }),
    (0, class_validator_1.IsString)({ message: 'Senha deve ser uma string' }),
    (0, class_validator_1.MinLength)(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "senha", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nível de acesso do usuário',
        enum: register_dto_1.NivelUsuario,
        default: register_dto_1.NivelUsuario.USUARIO,
    }),
    (0, class_validator_1.IsEnum)(register_dto_1.NivelUsuario, { message: 'Nível deve ser ADMINISTRADOR, USUARIO ou CONVIDADO' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "nivel", void 0);
class UpdateUserDto {
    nome;
    cpf;
    email;
    nivel;
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome completo do usuário',
        example: 'João Silva',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Nome deve ser uma string' }),
    (0, class_validator_1.MinLength)(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CPF do usuário (apenas números)',
        example: '12345678901',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'CPF deve ser uma string' }),
    (0, class_validator_1.MinLength)(11, { message: 'CPF deve ter 11 dígitos' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "cpf", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email do usuário',
        example: 'joao@alencarfrutas.com.br',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)({}, { message: 'Email inválido' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nível de acesso do usuário',
        enum: register_dto_1.NivelUsuario,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(register_dto_1.NivelUsuario, { message: 'Nível deve ser ADMINISTRADOR, USUARIO ou CONVIDADO' }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "nivel", void 0);
class UserResponseDto {
    id;
    nome;
    cpf;
    email;
    nivel;
    dataCadastro;
    ultimoAcesso;
    createdAt;
    updatedAt;
}
exports.UserResponseDto = UserResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do usuário',
        example: 1,
    }),
    __metadata("design:type", Number)
], UserResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do usuário',
        example: 'João Silva',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CPF do usuário',
        example: '12345678901',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "cpf", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email do usuário',
        example: 'joao@alencarfrutas.com.br',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nível de acesso',
        example: 'USUARIO',
    }),
    __metadata("design:type", String)
], UserResponseDto.prototype, "nivel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de cadastro',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "dataCadastro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Último acesso',
        example: '2024-01-15T10:30:00.000Z',
        required: false,
    }),
    __metadata("design:type", Object)
], UserResponseDto.prototype, "ultimoAcesso", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de atualização',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], UserResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=user.dto.js.map