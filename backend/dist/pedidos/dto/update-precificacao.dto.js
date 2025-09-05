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
exports.UpdatePrecificacaoDto = exports.UpdatePrecificacaoFrutaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class UpdatePrecificacaoFrutaDto {
    frutaPedidoId;
    valorUnitario;
    unidadePrecificada;
}
exports.UpdatePrecificacaoFrutaDto = UpdatePrecificacaoFrutaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da fruta do pedido',
        example: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdatePrecificacaoFrutaDto.prototype, "frutaPedidoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Valor unitário por unidade de medida',
        example: 2.50,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdatePrecificacaoFrutaDto.prototype, "valorUnitario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Unidade de medida que está sendo precificada (quando houver duas no pedido)',
        enum: ['KG', 'TON', 'CX', 'UND'],
        example: 'KG',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['KG', 'TON', 'CX', 'UND']),
    __metadata("design:type", String)
], UpdatePrecificacaoFrutaDto.prototype, "unidadePrecificada", void 0);
class UpdatePrecificacaoDto {
    frutas;
    frete;
    icms;
    desconto;
    avaria;
}
exports.UpdatePrecificacaoDto = UpdatePrecificacaoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array de frutas com suas precificações',
        type: [UpdatePrecificacaoFrutaDto],
        example: [
            {
                frutaPedidoId: 1,
                valorUnitario: 2.50,
                unidadePrecificada: 'KG'
            }
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdatePrecificacaoFrutaDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], UpdatePrecificacaoDto.prototype, "frutas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Valor do frete (opcional)',
        example: 150.00,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePrecificacaoDto.prototype, "frete", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Valor do ICMS (opcional)',
        example: 89.75,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePrecificacaoDto.prototype, "icms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Valor do desconto (opcional)',
        example: 50.00,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePrecificacaoDto.prototype, "desconto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Valor da avaria (opcional)',
        example: 25.00,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdatePrecificacaoDto.prototype, "avaria", void 0);
//# sourceMappingURL=update-precificacao.dto.js.map