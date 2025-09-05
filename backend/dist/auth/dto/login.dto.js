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
exports.LoginDto = exports.TipoLogin = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var TipoLogin;
(function (TipoLogin) {
    TipoLogin["WEB"] = "web";
    TipoLogin["MOBILE"] = "mobile";
})(TipoLogin || (exports.TipoLogin = TipoLogin = {}));
class LoginDto {
    email;
    senha;
    tipoLogin;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Email do usuário',
        example: 'admin@alencarfrutas.com.br',
    }),
    (0, class_validator_1.IsEmail)({}, { message: 'Email inválido' }),
    __metadata("design:type", String)
], LoginDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Senha do usuário',
        example: 'minhasenha123',
        minLength: 6,
    }),
    (0, class_validator_1.IsString)({ message: 'Senha deve ser uma string' }),
    (0, class_validator_1.MinLength)(6, { message: 'Senha deve ter pelo menos 6 caracteres' }),
    __metadata("design:type", String)
], LoginDto.prototype, "senha", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Tipo de login (web ou mobile)',
        enum: TipoLogin,
        default: TipoLogin.WEB,
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(TipoLogin, { message: 'Tipo de login deve ser web ou mobile' }),
    __metadata("design:type", String)
], LoginDto.prototype, "tipoLogin", void 0);
//# sourceMappingURL=login.dto.js.map