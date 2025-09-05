"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateAreaDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_area_dto_1 = require("./create-area.dto");
class UpdateAreaDto extends (0, swagger_1.PartialType)(create_area_dto_1.CreateAreaDto) {
}
exports.UpdateAreaDto = UpdateAreaDto;
//# sourceMappingURL=update-area.dto.js.map