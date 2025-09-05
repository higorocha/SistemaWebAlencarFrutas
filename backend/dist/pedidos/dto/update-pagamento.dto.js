"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePagamentoDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_pagamento_dto_1 = require("./create-pagamento.dto");
class UpdatePagamentoDto extends (0, mapped_types_1.PartialType)(create_pagamento_dto_1.CreatePagamentoDto) {
    dataPagamento;
    valorRecebido;
    metodoPagamento;
    contaDestino;
    observacoesPagamento;
    chequeCompensado;
    referenciaExterna;
}
exports.UpdatePagamentoDto = UpdatePagamentoDto;
//# sourceMappingURL=update-pagamento.dto.js.map