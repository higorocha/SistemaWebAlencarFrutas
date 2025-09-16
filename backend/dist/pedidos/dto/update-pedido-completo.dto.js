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
exports.UpdatePedidoCompletoDto = exports.UpdateFrutaPedidoDto = exports.UpdateCompletoFitaDto = exports.UpdateCompletoAreaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpdateCompletoAreaDto {
    id;
    areaPropriaId;
    areaFornecedorId;
    observacoes;
}
exports.UpdateCompletoAreaDto = UpdateCompletoAreaDto;
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
], UpdateCompletoAreaDto.prototype, "id", void 0);
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
], UpdateCompletoAreaDto.prototype, "areaPropriaId", void 0);
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
], UpdateCompletoAreaDto.prototype, "areaFornecedorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações sobre esta área',
        example: 'Área atualizada',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompletoAreaDto.prototype, "observacoes", void 0);
class UpdateCompletoFitaDto {
    id;
    fitaBananaId;
    controleBananaId;
    quantidadeFita;
    observacoes;
    detalhesAreas;
}
exports.UpdateCompletoFitaDto = UpdateCompletoFitaDto;
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
], UpdateCompletoFitaDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'ID da fita de banana',
        example: 1,
    }),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.IsPositive)(),
    __metadata("design:type", Number)
], UpdateCompletoFitaDto.prototype, "fitaBananaId", void 0);
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
], UpdateCompletoFitaDto.prototype, "controleBananaId", void 0);
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
], UpdateCompletoFitaDto.prototype, "quantidadeFita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Observações sobre esta fita',
        example: 'Fita atualizada',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateCompletoFitaDto.prototype, "observacoes", void 0);
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
], UpdateCompletoFitaDto.prototype, "detalhesAreas", void 0);
class UpdateFrutaPedidoDto {
    frutaPedidoId;
    frutaId;
    quantidadePrevista;
    quantidadeReal;
    quantidadeReal2;
    unidadeMedida1;
    unidadeMedida2;
    valorUnitario;
    unidadePrecificada;
    valorTotal;
    areas;
    fitas;
}
exports.UpdateFrutaPedidoDto = UpdateFrutaPedidoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID da fruta do pedido' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'ID da fruta do pedido deve ser um número' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "frutaPedidoId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID da fruta' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'ID da fruta deve ser um número' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "frutaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quantidade prevista' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Quantidade prevista deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'Quantidade prevista deve ser positiva' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "quantidadePrevista", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quantidade real' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Quantidade real deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'Quantidade real deve ser positiva' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "quantidadeReal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Quantidade real 2' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Quantidade real 2 deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'Quantidade real 2 deve ser positiva' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "quantidadeReal2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Unidade de medida 1', enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'], { message: 'Unidade de medida 1 deve ser KG, TON, CX, UND, ML ou LT' }),
    __metadata("design:type", String)
], UpdateFrutaPedidoDto.prototype, "unidadeMedida1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Unidade de medida 2', enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'] }),
    (0, class_transformer_1.Transform)(({ value }) => value === undefined || value === '' ? null : value),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'], { message: 'Unidade de medida 2 deve ser KG, TON, CX, UND, ML ou LT' }),
    __metadata("design:type", Object)
], UpdateFrutaPedidoDto.prototype, "unidadeMedida2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Valor unitário' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Valor unitário deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'Valor unitário deve ser positivo' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "valorUnitario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Unidade precificada', enum: ['KG', 'TON', 'CX', 'UND', 'ML', 'LT'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['KG', 'TON', 'CX', 'UND', 'ML', 'LT'], { message: 'Unidade precificada deve ser KG, TON, CX, UND, ML ou LT' }),
    __metadata("design:type", String)
], UpdateFrutaPedidoDto.prototype, "unidadePrecificada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Valor total da fruta (quantidade * valor unitário)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Valor total deve ser um número' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "valorTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array de áreas para esta fruta',
        type: [UpdateCompletoAreaDto],
        example: [
            {
                areaPropriaId: 1,
                observacoes: 'Área atualizada'
            }
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateCompletoAreaDto),
    __metadata("design:type", Array)
], UpdateFrutaPedidoDto.prototype, "areas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Array de fitas para esta fruta (apenas para bananas)',
        type: [UpdateCompletoFitaDto],
        example: [
            {
                fitaBananaId: 1,
                quantidadeFita: 300.0,
                observacoes: 'Fita atualizada'
            }
        ],
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateCompletoFitaDto),
    __metadata("design:type", Array)
], UpdateFrutaPedidoDto.prototype, "fitas", void 0);
class UpdatePedidoCompletoDto {
    clienteId;
    dataPrevistaColheita;
    dataColheita;
    observacoes;
    observacoesColheita;
    frete;
    icms;
    desconto;
    avaria;
    valorRecebido;
    status;
    frutas;
    pesagem;
    placaPrimaria;
    placaSecundaria;
    nomeMotorista;
    indDataEntrada;
    indDataDescarga;
    indPesoMedio;
    indMediaMililitro;
    indNumeroNf;
}
exports.UpdatePedidoCompletoDto = UpdatePedidoCompletoDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID do cliente' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'ID do cliente deve ser um número' }),
    __metadata("design:type", Number)
], UpdatePedidoCompletoDto.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Data prevista para colheita' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Data prevista para colheita deve ser uma data válida' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "dataPrevistaColheita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Data da colheita' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Data da colheita deve ser uma data válida' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "dataColheita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Observações' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Observações deve ser uma string' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Observações da colheita' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Observações da colheita deve ser uma string' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "observacoesColheita", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Frete' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Frete deve ser um número' }),
    __metadata("design:type", Number)
], UpdatePedidoCompletoDto.prototype, "frete", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ICMS' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'ICMS deve ser um número' }),
    __metadata("design:type", Number)
], UpdatePedidoCompletoDto.prototype, "icms", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Desconto' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Desconto deve ser um número' }),
    __metadata("design:type", Number)
], UpdatePedidoCompletoDto.prototype, "desconto", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Avaria' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Avaria deve ser um número' }),
    __metadata("design:type", Number)
], UpdatePedidoCompletoDto.prototype, "avaria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Valor recebido consolidado' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Valor recebido deve ser um número' }),
    __metadata("design:type", Number)
], UpdatePedidoCompletoDto.prototype, "valorRecebido", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Status do pedido', enum: ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO', 'PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL', 'PAGAMENTO_REALIZADO', 'PEDIDO_FINALIZADO', 'CANCELADO'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_REALIZADA', 'AGUARDANDO_PRECIFICACAO', 'PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL', 'PAGAMENTO_REALIZADO', 'PEDIDO_FINALIZADO', 'CANCELADO'], { message: 'Status deve ser válido' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Frutas do pedido', type: [UpdateFrutaPedidoDto] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)({ message: 'Frutas deve ser um array' }),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => UpdateFrutaPedidoDto),
    __metadata("design:type", Array)
], UpdatePedidoCompletoDto.prototype, "frutas", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Pesagem para controle' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Pesagem deve ser uma string' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "pesagem", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Placa do carro principal' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Placa primária deve ser uma string' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "placaPrimaria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Placa do carro secundário (reboque)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Placa secundária deve ser uma string' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "placaSecundaria", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Nome do motorista' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Nome do motorista deve ser uma string' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "nomeMotorista", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Data de entrada (apenas para clientes indústria)',
        example: '2024-03-15',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Data de entrada deve ser uma data válida' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "indDataEntrada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Data de descarga (apenas para clientes indústria)',
        example: '2024-03-16',
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({}, { message: 'Data de descarga deve ser uma data válida' }),
    __metadata("design:type", String)
], UpdatePedidoCompletoDto.prototype, "indDataDescarga", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Peso médio (apenas para clientes indústria)',
        example: 1250.75,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Peso médio deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'Peso médio deve ser positivo' }),
    __metadata("design:type", Number)
], UpdatePedidoCompletoDto.prototype, "indPesoMedio", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Média em mililitros (apenas para clientes indústria)',
        example: 500.25,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Média em mililitros deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'Média em mililitros deve ser positiva' }),
    __metadata("design:type", Number)
], UpdatePedidoCompletoDto.prototype, "indMediaMililitro", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'Número da nota fiscal (apenas para clientes indústria)',
        example: 123456,
    }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Número da nota fiscal deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'Número da nota fiscal deve ser positivo' }),
    __metadata("design:type", Number)
], UpdatePedidoCompletoDto.prototype, "indNumeroNf", void 0);
//# sourceMappingURL=update-pedido-completo.dto.js.map