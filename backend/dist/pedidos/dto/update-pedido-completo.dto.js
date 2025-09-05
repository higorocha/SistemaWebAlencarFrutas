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
exports.UpdatePedidoCompletoDto = exports.UpdateFrutaPedidoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class UpdateFrutaPedidoDto {
    frutaPedidoId;
    frutaId;
    areaPropriaId;
    areaFornecedorId;
    quantidadePrevista;
    quantidadeReal;
    quantidadeReal2;
    unidadeMedida1;
    unidadeMedida2;
    valorUnitario;
    unidadePrecificada;
    valorTotal;
    fitaColheita;
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
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID da área própria (deixe null se for área de terceiro)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'ID da área própria deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'ID da área própria deve ser positivo' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "areaPropriaId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'ID da área de fornecedor (deixe null se for área própria)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'ID da área de fornecedor deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'ID da área de fornecedor deve ser positivo' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "areaFornecedorId", void 0);
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
    (0, swagger_1.ApiPropertyOptional)({ description: 'Unidade de medida 1', enum: ['KG', 'TON', 'CX', 'UND'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['KG', 'TON', 'CX', 'UND'], { message: 'Unidade de medida 1 deve ser KG, TON, CX ou UND' }),
    __metadata("design:type", String)
], UpdateFrutaPedidoDto.prototype, "unidadeMedida1", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Unidade de medida 2', enum: ['KG', 'TON', 'CX', 'UND'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['KG', 'TON', 'CX', 'UND'], { message: 'Unidade de medida 2 deve ser KG, TON, CX ou UND' }),
    __metadata("design:type", String)
], UpdateFrutaPedidoDto.prototype, "unidadeMedida2", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Valor unitário' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Valor unitário deve ser um número' }),
    (0, class_validator_1.IsPositive)({ message: 'Valor unitário deve ser positivo' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "valorUnitario", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Unidade precificada', enum: ['KG', 'TON', 'CX', 'UND'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['KG', 'TON', 'CX', 'UND'], { message: 'Unidade precificada deve ser KG, TON, CX ou UND' }),
    __metadata("design:type", String)
], UpdateFrutaPedidoDto.prototype, "unidadePrecificada", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Valor total da fruta (quantidade * valor unitário)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: 'Valor total deve ser um número' }),
    __metadata("design:type", Number)
], UpdateFrutaPedidoDto.prototype, "valorTotal", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cor da fita para identificação' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Fita de colheita deve ser uma string' }),
    __metadata("design:type", String)
], UpdateFrutaPedidoDto.prototype, "fitaColheita", void 0);
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
//# sourceMappingURL=update-pedido-completo.dto.js.map