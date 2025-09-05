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
exports.RegisterDto = exports.NivelUsuario = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
var NivelUsuario;
(function (NivelUsuario) {
    NivelUsuario["ADMINISTRADOR"] = "ADMINISTRADOR";
    NivelUsuario["USUARIO"] = "USUARIO";
    NivelUsuario["CONVIDADO"] = "CONVIDADO";
})(NivelUsuario || (exports.NivelUsuario = NivelUsuario = {}));
class RegisterDto {
    nome;
    cpf;
    email;
    senha;
    nivel;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome completo do usuário',
        example: 'João Silva',
    }),
    (0, class_validator_1.IsString)({ message: 'Nome deve ser uma string' }),
    (0, class_validator_1.MinLength)(2, { message: 'Nome deve ter pelo menos 2 caracteres' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'CPF do usuário (apenas números)',
        example: '12345678901',
    }),
    (0, class_validator_1.IsString)({ message: 'CPF deve ser uma string' }),
    (0, class_validator_1.MinLength)(11, { message: 'CPF deve ter 11 dígitos' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "cpf", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email do usuário',
        example: 'joao@alencarfrutas.com.br',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email inválido' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Senha do usuário',
        example: 'minhasenha123',
        minLength: 6,
    }),
    (0, class_validator_1.IsString)({ message: 'Senha deve ser uma string' }),
    (0, class_validator_1.MinLength)(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "senha", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nível de acesso do usuário',
        enum: NivelUsuario,
        default: NivelUsuario.USUARIO,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NivelUsuario, { message: 'Nível deve ser ADMINISTRADOR, USUARIO ou CONVIDADO' }),
    __metadata("design:type", String)
], RegisterDto.prototype, "nivel", void 0);
//# sourceMappingURL=register.dto.js.map