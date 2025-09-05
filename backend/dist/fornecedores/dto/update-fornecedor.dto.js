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
exports.UpdateFornecedorDto = void 0;
const class_validator_1 = require("class-validator");
class UpdateFornecedorDto {
    nome;
    documento;
    telefone;
    email;
    endereco;
    observacoes;
}
exports.UpdateFornecedorDto = UpdateFornecedorDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Nome deve ser uma string' }),
    __metadata("design:type", String)
], UpdateFornecedorDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Documento deve ser uma string' }),
    __metadata("design:type", String)
], UpdateFornecedorDto.prototype, "documento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Telefone deve ser uma string' }),
    __metadata("design:type", String)
], UpdateFornecedorDto.prototype, "telefone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Email deve ser uma string' }),
    __metadata("design:type", String)
], UpdateFornecedorDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Endereço deve ser uma string' }),
    __metadata("design:type", String)
], UpdateFornecedorDto.prototype, "endereco", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Observações deve ser uma string' }),
    __metadata("design:type", String)
], UpdateFornecedorDto.prototype, "observacoes", void 0);
//# sourceMappingURL=update-fornecedor.dto.js.map