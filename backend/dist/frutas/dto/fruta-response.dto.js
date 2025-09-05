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
exports.FrutaResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class FrutaResponseDto {
    id;
    nome;
    codigo;
    categoria;
    descricao;
    status;
    nomeCientifico;
    corPredominante;
    epocaColheita;
    observacoes;
    createdAt;
    updatedAt;
}
exports.FrutaResponseDto = FrutaResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da fruta',
        example: 1,
    }),
    __metadata("design:type", Number)
], FrutaResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome da fruta',
        example: 'Maçã Gala',
    }),
    __metadata("design:type", String)
], FrutaResponseDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Código interno da fruta',
        example: 'MAC001',
    }),
    __metadata("design:type", String)
], FrutaResponseDto.prototype, "codigo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Categoria da fruta',
        example: 'TEMPERADAS',
    }),
    __metadata("design:type", String)
], FrutaResponseDto.prototype, "categoria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Descrição da fruta',
        example: 'Maçã vermelha, doce e crocante',
    }),
    __metadata("design:type", String)
], FrutaResponseDto.prototype, "descricao", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Status da fruta',
        example: 'ATIVA',
    }),
    __metadata("design:type", String)
], FrutaResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Nome científico da fruta',
        example: 'Malus domestica',
    }),
    __metadata("design:type", String)
], FrutaResponseDto.prototype, "nomeCientifico", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Cor predominante da fruta',
        example: 'Vermelha',
    }),
    __metadata("design:type", String)
], FrutaResponseDto.prototype, "corPredominante", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Época de colheita da fruta',
        example: 'Março a Junho',
    }),
    __metadata("design:type", String)
], FrutaResponseDto.prototype, "epocaColheita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações adicionais',
        example: 'Fruta de clima temperado',
    }),
    __metadata("design:type", String)
], FrutaResponseDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], FrutaResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de atualização',
        example: '2024-01-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], FrutaResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=fruta-response.dto.js.map