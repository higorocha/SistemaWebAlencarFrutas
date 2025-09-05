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
exports.CreateFrutaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateFrutaDto {
    nome;
    codigo;
    categoria;
    descricao;
    status;
    nomeCientifico;
    corPredominante;
    epocaColheita;
    observacoes;
}
exports.CreateFrutaDto = CreateFrutaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome da fruta',
        example: 'Maçã Gala',
        maxLength: 100,
    }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFrutaDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Código interno da fruta',
        example: 'MAC001',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFrutaDto.prototype, "codigo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Categoria da fruta',
        enum: ['CITRICOS', 'TROPICAIS', 'TEMPERADAS', 'SECAS', 'EXOTICAS', 'VERMELHAS', 'VERDES'],
        example: 'TEMPERADAS',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['CITRICOS', 'TROPICAIS', 'TEMPERADAS', 'SECAS', 'EXOTICAS', 'VERMELHAS', 'VERDES']),
    __metadata("design:type", String)
], CreateFrutaDto.prototype, "categoria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Descrição da fruta',
        example: 'Maçã vermelha, doce e crocante',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFrutaDto.prototype, "descricao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Status da fruta',
        enum: ['ATIVA', 'INATIVA'],
        example: 'ATIVA',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['ATIVA', 'INATIVA']),
    __metadata("design:type", String)
], CreateFrutaDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nome científico da fruta',
        example: 'Malus domestica',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFrutaDto.prototype, "nomeCientifico", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Cor predominante da fruta',
        example: 'Vermelha',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFrutaDto.prototype, "corPredominante", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Época de colheita da fruta',
        example: 'Março a Junho',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFrutaDto.prototype, "epocaColheita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações adicionais',
        example: 'Fruta de clima temperado',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFrutaDto.prototype, "observacoes", void 0);
//# sourceMappingURL=create-fruta.dto.js.map