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
exports.TurmaColheitaPedidoCustoResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const client_1 = require("@prisma/client");
class TurmaColheitaPedidoCustoResponseDto {
    id;
    turmaColheitaId;
    pedidoId;
    frutaId;
    quantidadeColhida;
    unidadeMedida;
    valorColheita;
    dataColheita;
    pagamentoEfetuado;
    observacoes;
    createdAt;
    updatedAt;
    turmaColheita;
    pedido;
    fruta;
}
exports.TurmaColheitaPedidoCustoResponseDto = TurmaColheitaPedidoCustoResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do custo de colheita',
        example: 1,
    }),
    __metadata("design:type", Number)
], TurmaColheitaPedidoCustoResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da turma de colheita',
        example: 1,
    }),
    __metadata("design:type", Number)
], TurmaColheitaPedidoCustoResponseDto.prototype, "turmaColheitaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID do pedido',
        example: 1,
    }),
    __metadata("design:type", Number)
], TurmaColheitaPedidoCustoResponseDto.prototype, "pedidoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da fruta',
        example: 1,
    }),
    __metadata("design:type", Number)
], TurmaColheitaPedidoCustoResponseDto.prototype, "frutaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade colhida',
        example: 500.5,
    }),
    __metadata("design:type", Number)
], TurmaColheitaPedidoCustoResponseDto.prototype, "quantidadeColhida", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Unidade de medida da quantidade',
        enum: client_1.UnidadeMedida,
        example: 'KG',
    }),
    __metadata("design:type", String)
], TurmaColheitaPedidoCustoResponseDto.prototype, "unidadeMedida", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Valor pago pela colheita',
        example: 2500.0,
    }),
    __metadata("design:type", Object)
], TurmaColheitaPedidoCustoResponseDto.prototype, "valorColheita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Data da colheita específica',
        example: '2024-12-15T08:00:00Z',
    }),
    __metadata("design:type", Object)
], TurmaColheitaPedidoCustoResponseDto.prototype, "dataColheita", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Se o pagamento foi efetuado',
        example: false,
    }),
    __metadata("design:type", Boolean)
], TurmaColheitaPedidoCustoResponseDto.prototype, "pagamentoEfetuado", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações específicas da colheita',
        example: 'Colheita realizada em boas condições climáticas',
    }),
    __metadata("design:type", Object)
], TurmaColheitaPedidoCustoResponseDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-12-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], TurmaColheitaPedidoCustoResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de última atualização',
        example: '2024-12-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], TurmaColheitaPedidoCustoResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informações da turma de colheita relacionada',
        example: {
            nomeColhedor: 'João Silva',
            chavePix: 'joao.silva@email.com'
        },
    }),
    __metadata("design:type", Object)
], TurmaColheitaPedidoCustoResponseDto.prototype, "turmaColheita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informações do pedido relacionado',
        example: {
            numeroPedido: 'PED-2024-0001',
            status: 'COLHEITA_REALIZADA',
            dataPedido: '2024-12-15T10:00:00Z'
        },
    }),
    __metadata("design:type", Object)
], TurmaColheitaPedidoCustoResponseDto.prototype, "pedido", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Informações da fruta relacionada',
        example: {
            nome: 'Banana Prata',
            categoria: 'TROPICAIS'
        },
    }),
    __metadata("design:type", Object)
], TurmaColheitaPedidoCustoResponseDto.prototype, "fruta", void 0);
//# sourceMappingURL=colheita-pedido-response.dto.js.map