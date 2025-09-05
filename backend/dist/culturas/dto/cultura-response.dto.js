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
exports.CulturaResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_cultura_dto_1 = require("./create-cultura.dto");
class CulturaResponseDto {
    id;
    descricao;
    periodicidade;
    permitirConsorcio;
    createdAt;
    updatedAt;
}
exports.CulturaResponseDto = CulturaResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da cultura',
        example: 1,
    }),
    __metadata("design:type", Number)
], CulturaResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Descrição da cultura',
        example: 'Milho',
    }),
    __metadata("design:type", String)
], CulturaResponseDto.prototype, "descricao", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Periodicidade da cultura',
        enum: create_cultura_dto_1.PeriodicidadeCultura,
        example: create_cultura_dto_1.PeriodicidadeCultura.PERENE,
    }),
    __metadata("design:type", String)
], CulturaResponseDto.prototype, "periodicidade", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Se a cultura permite consórcio',
        example: false,
    }),
    __metadata("design:type", Boolean)
], CulturaResponseDto.prototype, "permitirConsorcio", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], CulturaResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de atualização',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], CulturaResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=cultura-response.dto.js.map