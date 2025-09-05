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
exports.PedidoResponseDto = exports.FrutaPedidoResponseDto = exports.PagamentoPedidoResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class PagamentoPedidoResponseDto {
    id;
    pedidoId;
    dataPagamento;
    valorRecebido;
    metodoPagamento;
    observacoesPagamento;
    createdAt;
    updatedAt;
}
exports.PagamentoPedidoResponseDto = PagamentoPedidoResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do pagamento' }),
    __metadata("design:type", Number)
], PagamentoPedidoResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do pedido' }),
    __metadata("design:type", Number)
], PagamentoPedidoResponseDto.prototype, "pedidoId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data do pagamento' }),
    __metadata("design:type", Date)
], PagamentoPedidoResponseDto.prototype, "dataPagamento", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valor recebido' }),
    __metadata("design:type", Number)
], PagamentoPedidoResponseDto.prototype, "valorRecebido", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Método de pagamento', enum: ['PIX', 'BOLETO', 'TRANSFERENCIA', 'DINHEIRO'] }),
    __metadata("design:type", String)
], PagamentoPedidoResponseDto.prototype, "metodoPagamento", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Observações do pagamento', required: false }),
    __metadata("design:type", String)
], PagamentoPedidoResponseDto.prototype, "observacoesPagamento", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de criação' }),
    __metadata("design:type", Date)
], PagamentoPedidoResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de atualização' }),
    __metadata("design:type", Date)
], PagamentoPedidoResponseDto.prototype, "updatedAt", void 0);
class FrutaPedidoResponseDto {
    id;
    frutaId;
    fruta;
    areaPropriaId;
    areaPropria;
    areaFornecedorId;
    areaFornecedor;
    quantidadePrevista;
    quantidadeReal;
    quantidadeReal2;
    unidadeMedida1;
    unidadeMedida2;
    valorUnitario;
    valorTotal;
    unidadePrecificada;
    fitaColheita;
}
exports.FrutaPedidoResponseDto = FrutaPedidoResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID da fruta do pedido' }),
    __metadata("design:type", Number)
], FrutaPedidoResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID da fruta' }),
    __metadata("design:type", Number)
], FrutaPedidoResponseDto.prototype, "frutaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome da fruta' }),
    __metadata("design:type", Object)
], FrutaPedidoResponseDto.prototype, "fruta", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID da área própria', required: false }),
    __metadata("design:type", Number)
], FrutaPedidoResponseDto.prototype, "areaPropriaId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome da área própria', required: false }),
    __metadata("design:type", Object)
], FrutaPedidoResponseDto.prototype, "areaPropria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID da área de fornecedor', required: false }),
    __metadata("design:type", Number)
], FrutaPedidoResponseDto.prototype, "areaFornecedorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome da área de fornecedor', required: false }),
    __metadata("design:type", Object)
], FrutaPedidoResponseDto.prototype, "areaFornecedor", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantidade prevista' }),
    __metadata("design:type", Number)
], FrutaPedidoResponseDto.prototype, "quantidadePrevista", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantidade real', required: false }),
    __metadata("design:type", Number)
], FrutaPedidoResponseDto.prototype, "quantidadeReal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Quantidade real 2', required: false }),
    __metadata("design:type", Number)
], FrutaPedidoResponseDto.prototype, "quantidadeReal2", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unidade de medida 1', enum: ['KG', 'TON', 'CX', 'UND'] }),
    __metadata("design:type", String)
], FrutaPedidoResponseDto.prototype, "unidadeMedida1", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unidade de medida 2', enum: ['KG', 'TON', 'CX', 'UND'] }),
    __metadata("design:type", String)
], FrutaPedidoResponseDto.prototype, "unidadeMedida2", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valor unitário', required: false }),
    __metadata("design:type", Number)
], FrutaPedidoResponseDto.prototype, "valorUnitario", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valor total', required: false }),
    __metadata("design:type", Number)
], FrutaPedidoResponseDto.prototype, "valorTotal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unidade precificada', enum: ['KG', 'TON', 'CX', 'UND'], required: false }),
    __metadata("design:type", String)
], FrutaPedidoResponseDto.prototype, "unidadePrecificada", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Cor da fita para identificação', required: false }),
    __metadata("design:type", String)
], FrutaPedidoResponseDto.prototype, "fitaColheita", void 0);
class PedidoResponseDto {
    id;
    numeroPedido;
    clienteId;
    cliente;
    dataPrevistaColheita;
    dataColheita;
    observacoes;
    observacoesColheita;
    status;
    frete;
    icms;
    desconto;
    avaria;
    valorFinal;
    valorRecebido;
    dataPedido;
    createdAt;
    updatedAt;
    frutasPedidos;
    pagamentosPedidos;
    pesagem;
    placaPrimaria;
    placaSecundaria;
    nomeMotorista;
}
exports.PedidoResponseDto = PedidoResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do pedido' }),
    __metadata("design:type", Number)
], PedidoResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Número do pedido' }),
    __metadata("design:type", String)
], PedidoResponseDto.prototype, "numeroPedido", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ID do cliente' }),
    __metadata("design:type", Number)
], PedidoResponseDto.prototype, "clienteId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome do cliente' }),
    __metadata("design:type", Object)
], PedidoResponseDto.prototype, "cliente", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data prevista para colheita' }),
    __metadata("design:type", Date)
], PedidoResponseDto.prototype, "dataPrevistaColheita", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data da colheita', required: false }),
    __metadata("design:type", Date)
], PedidoResponseDto.prototype, "dataColheita", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Observações', required: false }),
    __metadata("design:type", String)
], PedidoResponseDto.prototype, "observacoes", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Observações da colheita', required: false }),
    __metadata("design:type", String)
], PedidoResponseDto.prototype, "observacoesColheita", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Status do pedido', enum: ['PEDIDO_CRIADO', 'AGUARDANDO_COLHEITA', 'COLHEITA_REALIZADA', 'PRECIFICACAO_REALIZADA', 'AGUARDANDO_PAGAMENTO', 'PAGAMENTO_PARCIAL', 'PAGAMENTO_REALIZADO', 'PEDIDO_FINALIZADO', 'CANCELADO'] }),
    __metadata("design:type", String)
], PedidoResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Frete', required: false }),
    __metadata("design:type", Number)
], PedidoResponseDto.prototype, "frete", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'ICMS', required: false }),
    __metadata("design:type", Number)
], PedidoResponseDto.prototype, "icms", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Desconto', required: false }),
    __metadata("design:type", Number)
], PedidoResponseDto.prototype, "desconto", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Avaria', required: false }),
    __metadata("design:type", Number)
], PedidoResponseDto.prototype, "avaria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valor final', required: false }),
    __metadata("design:type", Number)
], PedidoResponseDto.prototype, "valorFinal", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Valor recebido consolidado', required: false }),
    __metadata("design:type", Number)
], PedidoResponseDto.prototype, "valorRecebido", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data do pedido' }),
    __metadata("design:type", Date)
], PedidoResponseDto.prototype, "dataPedido", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de criação' }),
    __metadata("design:type", Date)
], PedidoResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Data de atualização' }),
    __metadata("design:type", Date)
], PedidoResponseDto.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Frutas do pedido', type: [FrutaPedidoResponseDto] }),
    __metadata("design:type", Array)
], PedidoResponseDto.prototype, "frutasPedidos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pagamentos do pedido', type: [PagamentoPedidoResponseDto] }),
    __metadata("design:type", Array)
], PedidoResponseDto.prototype, "pagamentosPedidos", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pesagem para controle', required: false }),
    __metadata("design:type", String)
], PedidoResponseDto.prototype, "pesagem", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Placa do carro principal', required: false }),
    __metadata("design:type", String)
], PedidoResponseDto.prototype, "placaPrimaria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Placa do carro secundário (reboque)', required: false }),
    __metadata("design:type", String)
], PedidoResponseDto.prototype, "placaSecundaria", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Nome do motorista', required: false }),
    __metadata("design:type", String)
], PedidoResponseDto.prototype, "nomeMotorista", void 0);
//# sourceMappingURL=pedido-response.dto.js.map