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
exports.UpdateColheitaDto = exports.UpdateColheitaFrutaDto = exports.UpdateColheitaFitaDto = exports.UpdateColheitaAreaDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class UpdateColheitaAreaDto {
    id;
    areaPropriaId;
    areaFornecedorId;
    observacoes;
}
exports.UpdateColheitaAreaDto = UpdateColheitaAreaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID da área (para update de área existente)',
        example: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateColheitaAreaDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID da área própria (deixe null se for área de fornecedor)',
        example: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateColheitaAreaDto.prototype, "areaPropriaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID da área de fornecedor (deixe null se for área própria)',
        example: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateColheitaAreaDto.prototype, "areaFornecedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações sobre esta área',
        example: 'Área com boa colheita',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateColheitaAreaDto.prototype, "observacoes", void 0);
class UpdateColheitaFitaDto {
    id;
    fitaBananaId;
    controleBananaId;
    quantidadeFita;
    observacoes;
    detalhesAreas;
}
exports.UpdateColheitaFitaDto = UpdateColheitaFitaDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID da fita (para update de fita existente)',
        example: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateColheitaFitaDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da fita de banana',
        example: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateColheitaFitaDto.prototype, "fitaBananaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'ID do controle de banana (lote específico)',
        example: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateColheitaFitaDto.prototype, "controleBananaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Quantidade desta fita',
        example: 250.0,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateColheitaFitaDto.prototype, "quantidadeFita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações sobre esta fita',
        example: 'Fita para banana premium',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateColheitaFitaDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Detalhes das áreas para subtração específica de estoque',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                fitaBananaId: { type: 'number', description: 'ID da fita' },
                areaId: { type: 'number', description: 'ID da área' },
                quantidade: { type: 'number', description: 'Quantidade desta área' }
            }
        }
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateColheitaFitaDto.prototype, "detalhesAreas", void 0);
class UpdateColheitaFrutaDto {
    frutaPedidoId;
    quantidadeReal;
    quantidadeReal2;
    areas;
    fitas;
}
exports.UpdateColheitaFrutaDto = UpdateColheitaFrutaDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da fruta do pedido',
        example: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateColheitaFrutaDto.prototype, "frutaPedidoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Quantidade real colhida',
        example: 985.5,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateColheitaFrutaDto.prototype, "quantidadeReal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Quantidade real colhida na segunda unidade (quando houver)',
        example: 50.0
    }),
    (0, class_transformer_1.Transform)(({ value }) => (value === '' || value === null ? undefined : value)),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateColheitaFrutaDto.prototype, "quantidadeReal2", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array de áreas para esta fruta (mínimo 1)',
        type: [UpdateColheitaAreaDto],
        example: [
            {
                areaPropriaId: 1,
                observacoes: 'Área principal da colheita'
            },
            {
                areaFornecedorId: 2,
                observacoes: 'Área do fornecedor parceiro'
            }
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateColheitaAreaDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], UpdateColheitaFrutaDto.prototype, "areas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array de fitas para esta fruta (apenas para bananas)',
        type: [UpdateColheitaFitaDto],
        example: [
            {
                fitaBananaId: 1,
                quantidadeFita: 500.0,
                observacoes: 'Fita vermelha premium'
            }
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateColheitaFitaDto),
    __metadata("design:type", Array)
], UpdateColheitaFrutaDto.prototype, "fitas", void 0);
class UpdateColheitaDto {
    dataColheita;
    observacoesColheita;
    frutas;
    pesagem;
    placaPrimaria;
    placaSecundaria;
    nomeMotorista;
}
exports.UpdateColheitaDto = UpdateColheitaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data da colheita (ISO)', example: '2025-08-26T00:00:00.000Z' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Date)
], UpdateColheitaDto.prototype, "dataColheita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Observações da colheita', example: 'Colheita realizada em tempo seco.' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateColheitaDto.prototype, "observacoesColheita", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Array de frutas com quantidades colhidas',
        type: [UpdateColheitaFrutaDto],
        example: [
            {
                frutaPedidoId: 1,
                quantidadeReal: 985.5,
                quantidadeReal2: 50.0,
                areas: [
                    {
                        areaPropriaId: 1,
                        observacoes: 'Área principal da colheita'
                    }
                ],
                fitas: [
                    {
                        fitaBananaId: 1,
                        quantidadeFita: 300.0,
                        observacoes: 'Fita verde premium'
                    }
                ]
            }
        ],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateColheitaFrutaDto),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Array)
], UpdateColheitaDto.prototype, "frutas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Pesagem para controle', example: '2500' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Pesagem deve ser uma string' }),
    __metadata("design:type", String)
], UpdateColheitaDto.prototype, "pesagem", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Placa do carro principal', example: 'ABC-1234' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Placa primária deve ser uma string' }),
    __metadata("design:type", String)
], UpdateColheitaDto.prototype, "placaPrimaria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Placa do carro secundário (reboque)', example: 'XYZ-5678' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Placa secundária deve ser uma string' }),
    __metadata("design:type", String)
], UpdateColheitaDto.prototype, "placaSecundaria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nome do motorista', example: 'João Silva' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Nome do motorista deve ser uma string' }),
    __metadata("design:type", String)
], UpdateColheitaDto.prototype, "nomeMotorista", void 0);
//# sourceMappingURL=update-colheita.dto.js.map