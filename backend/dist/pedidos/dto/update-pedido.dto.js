"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdatePedidoDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_pedido_dto_1 = require("./create-pedido.dto");
class UpdatePedidoDto extends (0, swagger_1.PartialType)(create_pedido_dto_1.CreatePedidoDto) {
}
exports.UpdatePedidoDto = UpdatePedidoDto;
//# sourceMappingURL=update-pedido.dto.js.map