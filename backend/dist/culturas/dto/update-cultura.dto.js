"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateCulturaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_cultura_dto_1 = require("./create-cultura.dto");
class UpdateCulturaDto extends (0, swagger_1.PartialType)(create_cultura_dto_1.CreateCulturaDto) {
}
exports.UpdateCulturaDto = UpdateCulturaDto;
//# sourceMappingURL=update-cultura.dto.js.map