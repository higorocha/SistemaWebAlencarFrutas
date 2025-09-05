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
exports.CreatePagamentoDto = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class CreatePagamentoDto {
    pedidoId;
    dataPagamento;
    valorRecebido;
    metodoPagamento;
    contaDestino;
    observacoesPagamento;
    chequeCompensado;
    referenciaExterna;
}
exports.CreatePagamentoDto = CreatePagamentoDto;
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'ID do pedido é obrigatório' }),
    (0, class_validator_1.IsNumber)({}, { message: 'ID do pedido deve ser um número' }),
    __metadata("design:type", Number)
], CreatePagamentoDto.prototype, "pedidoId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Data do pagamento é obrigatória' }),
    (0, class_validator_1.IsDateString)({}, { message: 'Data do pagamento deve ser uma data válida' }),
    __metadata("design:type", String)
], CreatePagamentoDto.prototype, "dataPagamento", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Valor recebido é obrigatório' }),
    (0, class_validator_1.IsNumber)({}, { message: 'Valor recebido deve ser um número' }),
    (0, class_validator_1.Min)(0.01, { message: 'Valor recebido deve ser maior que zero' }),
    __metadata("design:type", Number)
], CreatePagamentoDto.prototype, "valorRecebido", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Método de pagamento é obrigatório' }),
    (0, class_validator_1.IsEnum)(client_1.MetodoPagamento, { message: 'Método de pagamento deve ser válido' }),
    __metadata("design:type", String)
], CreatePagamentoDto.prototype, "metodoPagamento", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: 'Conta destino é obrigatória' }),
    (0, class_validator_1.IsEnum)(client_1.ContaDestino, { message: 'Conta destino deve ser válida' }),
    __metadata("design:type", String)
], CreatePagamentoDto.prototype, "contaDestino", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Observações deve ser uma string' }),
    __metadata("design:type", String)
], CreatePagamentoDto.prototype, "observacoesPagamento", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: 'Cheque compensado deve ser um boolean' }),
    __metadata("design:type", Boolean)
], CreatePagamentoDto.prototype, "chequeCompensado", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: 'Referência externa deve ser uma string' }),
    __metadata("design:type", String)
], CreatePagamentoDto.prototype, "referenciaExterna", void 0);
//# sourceMappingURL=create-pagamento.dto.js.map