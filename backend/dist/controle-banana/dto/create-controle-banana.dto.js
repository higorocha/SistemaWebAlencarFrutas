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
exports.CreateControleBananaDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class CreateControleBananaDto {
    fitaBananaId;
    areaAgricolaId;
    quantidadeFitas;
    dataRegistro;
    observacoes;
}
exports.CreateControleBananaDto = CreateControleBananaDto;
__decorate([
    (0, class_validator_1.IsInt)({ message: 'ID da fita deve ser um número inteiro' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID da fita é obrigatório' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateControleBananaDto.prototype, "fitaBananaId", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'ID da área agrícola deve ser um número inteiro' }),
    (0, class_validator_1.IsNotEmpty)({ message: 'ID da área agrícola é obrigatório' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateControleBananaDto.prototype, "areaAgricolaId", void 0);
__decorate([
    (0, class_validator_1.IsInt)({ message: 'Quantidade de fitas deve ser um número inteiro' }),
    (0, class_validator_1.IsPositive)({ message: 'Quantidade de fitas deve ser maior que zero' }),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateControleBananaDto.prototype, "quantidadeFitas", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Data de registro deve ser uma data válida' }),
    __metadata("design:type", String)
], CreateControleBananaDto.prototype, "dataRegistro", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", Object)
], CreateControleBananaDto.prototype, "observacoes", void 0);
//# sourceMappingURL=create-controle-banana.dto.js.map