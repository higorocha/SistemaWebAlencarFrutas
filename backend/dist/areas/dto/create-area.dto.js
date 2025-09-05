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
exports.CreateAreaDto = exports.CulturaAreaDto = exports.CategoriaArea = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var CategoriaArea;
(function (CategoriaArea) {
    CategoriaArea["COLONO"] = "COLONO";
    CategoriaArea["TECNICO"] = "TECNICO";
    CategoriaArea["EMPRESARIAL"] = "EMPRESARIAL";
    CategoriaArea["ADJACENTE"] = "ADJACENTE";
})(CategoriaArea || (exports.CategoriaArea = CategoriaArea = {}));
class CulturaAreaDto {
    culturaId;
    areaPlantada;
    areaProduzindo;
    descricao;
}
exports.CulturaAreaDto = CulturaAreaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da cultura',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CulturaAreaDto.prototype, "culturaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Área plantada em hectares',
        example: 10.5,
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CulturaAreaDto.prototype, "areaPlantada", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Área produzindo em hectares',
        example: 8.0,
        default: 0,
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CulturaAreaDto.prototype, "areaProduzindo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Descrição da cultura',
        example: 'Milho Verde',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", String)
], CulturaAreaDto.prototype, "descricao", void 0);
class CreateAreaDto {
    nome;
    categoria;
    areaTotal;
    coordenadas;
    culturas;
}
exports.CreateAreaDto = CreateAreaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome da área agrícola',
        example: 'Área 01 - Fazenda São João',
    }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateAreaDto.prototype, "nome", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Categoria da área',
        enum: CategoriaArea,
        example: CategoriaArea.COLONO,
    }),
    (0, class_validator_1.IsEnum)(CategoriaArea),
    __metadata("design:type", String)
], CreateAreaDto.prototype, "categoria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Área total em hectares',
        example: 25.5,
    }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAreaDto.prototype, "areaTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Coordenadas geográficas no formato GeoJSON',
        required: false,
    }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], CreateAreaDto.prototype, "coordenadas", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Culturas da área',
        type: [CulturaAreaDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => CulturaAreaDto),
    __metadata("design:type", Array)
], CreateAreaDto.prototype, "culturas", void 0);
//# sourceMappingURL=create-area.dto.js.map