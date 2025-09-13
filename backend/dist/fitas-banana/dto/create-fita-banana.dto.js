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
exports.CreateFitaBananaDto = void 0;
const class_validator_1 = require("class-validator");
class CreateFitaBananaDto {
    nome;
    corHex;
}
exports.CreateFitaBananaDto = CreateFitaBananaDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Nome é obrigatório' }),
    (0, class_validator_1.Length)(1, 100, { message: 'Nome deve ter entre 1 e 100 caracteres' }),
    __metadata("design:type", String)
], CreateFitaBananaDto.prototype, "nome", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)({ message: 'Cor é obrigatória' }),
    (0, class_validator_1.Matches)(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Cor deve ser um valor hexadecimal válido (ex: #FF0000)' }),
    (0, class_validator_1.Length)(7, 7, { message: 'Cor deve ter exatamente 7 caracteres (ex: #FF0000)' }),
    __metadata("design:type", String)
], CreateFitaBananaDto.prototype, "corHex", void 0);
//# sourceMappingURL=create-fita-banana.dto.js.map