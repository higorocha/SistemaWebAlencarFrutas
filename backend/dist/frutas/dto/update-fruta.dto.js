"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateFrutaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_fruta_dto_1 = require("./create-fruta.dto");
class UpdateFrutaDto extends (0, swagger_1.PartialType)(create_fruta_dto_1.CreateFrutaDto) {
}
exports.UpdateFrutaDto = UpdateFrutaDto;
//# sourceMappingURL=update-fruta.dto.js.map