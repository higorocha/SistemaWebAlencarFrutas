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
exports.TurmaColheitaResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class TurmaColheitaResponseDto {
    id;
    nomeColhedor;
    chavePix;
    dataCadastro;
    observacoes;
    createdAt;
    updatedAt;
    custosColheita;
}
exports.TurmaColheitaResponseDto = TurmaColheitaResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da turma de colheita',
        example: 1,
    }),
    __metadata("design:type", Number)
], TurmaColheitaResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Nome da pessoa que colhe',
        example: 'João Silva',
    }),
    __metadata("design:type", String)
], TurmaColheitaResponseDto.prototype, "nomeColhedor", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Chave PIX do colhedor',
        example: 'joao.silva@email.com',
    }),
    __metadata("design:type", Object)
], TurmaColheitaResponseDto.prototype, "chavePix", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de cadastro da turma',
        example: '2024-12-15T10:00:00Z',
    }),
    __metadata("design:type", Date)
], TurmaColheitaResponseDto.prototype, "dataCadastro", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações sobre a turma de colheita',
        example: 'Turma especializada em colheita de frutas tropicais',
    }),
    __metadata("design:type", Object)
], TurmaColheitaResponseDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de criação',
        example: '2024-12-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], TurmaColheitaResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Data de última atualização',
        example: '2024-12-15T10:30:00Z',
    }),
    __metadata("design:type", Date)
], TurmaColheitaResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Lista de custos de colheita específicos por pedido',
        example: [{
                id: 1,
                pedidoId: 1,
                frutaId: 1,
                quantidadeColhida: 500.5,
                unidadeMedida: 'KG',
                valorColheita: 2500.0,
                dataColheita: '2024-12-15T08:00:00Z',
                pagamentoEfetuado: false
            }],
    }),
    __metadata("design:type", Array)
], TurmaColheitaResponseDto.prototype, "custosColheita", void 0);
//# sourceMappingURL=turma-colheita-response.dto.js.map