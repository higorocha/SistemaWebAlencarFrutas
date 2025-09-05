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
exports.AreaResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_area_dto_1 = require("./create-area.dto");
class AreaResponseDto {
    id;
    nome;
    categoria;
    areaTotal;
    coordenadas;
    culturas;
    createdAt;
    updatedAt;
}
exports.AreaResponseDto = AreaResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da área',
        example: 1,
    }),
    __metadata("design:type", Number)
], AreaResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome da área agrícola',
        example: 'Área 01 - Fazenda São João',
    }),
    __metadata("design:type", String)
], AreaResponseDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Categoria da área',
        enum: create_area_dto_1.CategoriaArea,
        example: create_area_dto_1.CategoriaArea.COLONO,
    }),
    __metadata("design:type", String)
], AreaResponseDto.prototype, "categoria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Área total em hectares',
        example: 25.5,
    }),
    __metadata("design:type", Number)
], AreaResponseDto.prototype, "areaTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Coordenadas geográficas no formato GeoJSON',
        required: false,
    }),
    __metadata("design:type", Object)
], AreaResponseDto.prototype, "coordenadas", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Culturas da área',
        type: [create_area_dto_1.CulturaAreaDto],
    }),
    __metadata("design:type", Array)
], AreaResponseDto.prototype, "culturas", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], AreaResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de atualização',
        example: '2024-01-15T10:30:00.000Z',
    }),
    __metadata("design:type", Date)
], AreaResponseDto.prototype, "updatedAt", void 0);
//# sourceMappingURL=area-response.dto.js.map