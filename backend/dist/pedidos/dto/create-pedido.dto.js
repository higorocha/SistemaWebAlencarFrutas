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
exports.CreatePedidoDto = exports.FrutaPedidoDto = exports.FrutaFitaDto = exports.FrutaAreaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class FrutaAreaDto {
    areaPropriaId;
    areaFornecedorId;
    observacoes;
}
exports.FrutaAreaDto = FrutaAreaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID da área própria (deixe null se for área de terceiro)',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], FrutaAreaDto.prototype, "areaPropriaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID da área de fornecedor (deixe null se for área própria)',
        example: 1,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], FrutaAreaDto.prototype, "areaFornecedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações sobre esta área',
        example: 'Área com boa produtividade',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FrutaAreaDto.prototype, "observacoes", void 0);
class FrutaFitaDto {
    fitaBananaId;
    quantidadeFita;
    observacoes;
}
exports.FrutaFitaDto = FrutaFitaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da fita de banana',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], FrutaFitaDto.prototype, "fitaBananaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Quantidade desta fita (opcional)',
        example: 500.0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], FrutaFitaDto.prototype, "quantidadeFita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações sobre esta fita',
        example: 'Fita para banana premium',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FrutaFitaDto.prototype, "observacoes", void 0);
class FrutaPedidoDto {
    frutaId;
    quantidadePrevista;
    unidadeMedida1;
    unidadeMedida2;
    areas;
    fitas;
}
exports.FrutaPedidoDto = FrutaPedidoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da fruta',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], FrutaPedidoDto.prototype, "frutaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade prevista',
        example: 1000.5,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], FrutaPedidoDto.prototype, "quantidadePrevista", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unidade de medida principal',
        enum: ['KG', 'TON', 'CX', 'UND'],
        example: 'KG',
    }),
    (0, class_validator_1.IsEnum)(['KG', 'TON', 'CX', 'UND']),
    __metadata("design:type", String)
], FrutaPedidoDto.prototype, "unidadeMedida1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Unidade de medida secundária (opcional)',
        enum: ['KG', 'TON', 'CX', 'UND'],
        example: 'CX',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['KG', 'TON', 'CX', 'UND']),
    __metadata("design:type", String)
], FrutaPedidoDto.prototype, "unidadeMedida2", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array de áreas para esta fruta (mínimo 1)',
        type: [FrutaAreaDto],
        example: [
            {
                areaPropriaId: 1,
                observacoes: 'Área principal'
            },
            {
                areaFornecedorId: 2,
                observacoes: 'Área de fornecedor parceiro'
            }
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FrutaAreaDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], FrutaPedidoDto.prototype, "areas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array de fitas para esta fruta (apenas para bananas)',
        type: [FrutaFitaDto],
        example: [
            {
                fitaBananaId: 1,
                quantidadeFita: 500.0,
                observacoes: 'Fita vermelha premium'
            },
            {
                fitaBananaId: 2,
                quantidadeFita: 300.0,
                observacoes: 'Fita azul padrão'
            }
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FrutaFitaDto),
    __metadata("design:type", Array)
], FrutaPedidoDto.prototype, "fitas", void 0);
class CreatePedidoDto {
    clienteId;
    dataPrevistaColheita;
    frutas;
    observacoes;
}
exports.CreatePedidoDto = CreatePedidoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do cliente',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreatePedidoDto.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data prevista para colheita',
        example: '2024-03-15T00:00:00Z',
    }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePedidoDto.prototype, "dataPrevistaColheita", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array de frutas do pedido',
        type: [FrutaPedidoDto],
        example: [
            {
                frutaId: 1,
                quantidadePrevista: 1000.5,
                unidadeMedida1: 'KG',
                unidadeMedida2: 'CX',
                areas: [
                    {
                        areaPropriaId: 1,
                        observacoes: 'Área principal'
                    }
                ],
                fitas: [
                    {
                        fitaBananaId: 1,
                        quantidadeFita: 500.0
                    }
                ]
            }
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => FrutaPedidoDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], CreatePedidoDto.prototype, "frutas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações do pedido',
        example: 'Cliente prefere colheita pela manhã',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePedidoDto.prototype, "observacoes", void 0);
//# sourceMappingURL=create-pedido.dto.js.map