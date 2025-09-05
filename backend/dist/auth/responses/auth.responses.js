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
exports.UpdatePasswordResponseDto = exports.RegisterResponseDto = exports.LoginResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const login_dto_1 = require("../dto/login.dto");
class LoginResponseDto {
    access_token;
    usuario;
    expiracao;
    tipoLogin;
}
exports.LoginResponseDto = LoginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Token de acesso JWT',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "access_token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Dados do usuário logado',
        example: {
            id: 1,
            nome: 'João Silva',
            email: 'joao@alencarfrutas.com.br',
            nivel: 'USUARIO',
        },
    }),
    __metadata("design:type", Object)
], LoginResponseDto.prototype, "usuario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de expiração do token',
        example: '2024-01-15T23:59:59.999Z',
    }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "expiracao", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo de login utilizado',
        enum: login_dto_1.TipoLogin,
        example: login_dto_1.TipoLogin.WEB,
    }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "tipoLogin", void 0);
class RegisterResponseDto {
    id;
    nome;
    email;
    cpf;
    nivel;
    dataCadastro;
    createdAt;
}
exports.RegisterResponseDto = RegisterResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do usuário criado',
        example: 1,
    }),
    __metadata("design:type", Number)
], RegisterResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do usuário',
        example: 'João Silva',
    }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email do usuário',
        example: 'joao@alencarfrutas.com.br',
    }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CPF do usuário',
        example: '12345678901',
    }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "cpf", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nível de acesso',
        example: 'USUARIO',
    }),
    __metadata("design:type", String)
], RegisterResponseDto.prototype, "nivel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de cadastro',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], RegisterResponseDto.prototype, "dataCadastro", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], RegisterResponseDto.prototype, "createdAt", void 0);
class UpdatePasswordResponseDto {
    id;
    nome;
    email;
    nivel;
}
exports.UpdatePasswordResponseDto = UpdatePasswordResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do usuário',
        example: 1,
    }),
    __metadata("design:type", Number)
], UpdatePasswordResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome do usuário',
        example: 'João Silva',
    }),
    __metadata("design:type", String)
], UpdatePasswordResponseDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email do usuário',
        example: 'joao@alencarfrutas.com.br',
    }),
    __metadata("design:type", String)
], UpdatePasswordResponseDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nível de acesso',
        example: 'USUARIO',
    }),
    __metadata("design:type", String)
], UpdatePasswordResponseDto.prototype, "nivel", void 0);
//# sourceMappingURL=auth.responses.js.map