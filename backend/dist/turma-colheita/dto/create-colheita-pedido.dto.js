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
exports.CreateTurmaColheitaPedidoCustoDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateTurmaColheitaPedidoCustoDto {
    turmaColheitaId;
    pedidoId;
    frutaId;
    quantidadeColhida;
    unidadeMedida;
    valorColheita;
    dataColheita;
    pagamentoEfetuado;
    observacoes;
}
exports.CreateTurmaColheitaPedidoCustoDto = CreateTurmaColheitaPedidoCustoDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da turma de colheita',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateTurmaColheitaPedidoCustoDto.prototype, "turmaColheitaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do pedido',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateTurmaColheitaPedidoCustoDto.prototype, "pedidoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da fruta',
        example: 1,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateTurmaColheitaPedidoCustoDto.prototype, "frutaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade colhida',
        example: 500.5,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateTurmaColheitaPedidoCustoDto.prototype, "quantidadeColhida", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unidade de medida da quantidade',
        enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'],
        example: 'KG',
    }),
    (0, class_validator_1.IsEnum)(['KG', 'TON', 'CX', 'UND', 'ML', 'LT']),
    __metadata("design:type", String)
], CreateTurmaColheitaPedidoCustoDto.prototype, "unidadeMedida", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Valor pago pela colheita',
        example: 2500.0,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], CreateTurmaColheitaPedidoCustoDto.prototype, "valorColheita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Data da colheita específica',
        example: '2024-12-15T08:00:00Z',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateTurmaColheitaPedidoCustoDto.prototype, "dataColheita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Se o pagamento foi efetuado',
        example: false,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateTurmaColheitaPedidoCustoDto.prototype, "pagamentoEfetuado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações específicas da colheita',
        example: 'Colheita realizada em boas condições climáticas',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTurmaColheitaPedidoCustoDto.prototype, "observacoes", void 0);
//# sourceMappingURL=create-colheita-pedido.dto.js.map