"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FitasBananaModule = void 0;
const common_1 = require("@nestjs/common");
const fitas_banana_service_1 = require("./fitas-banana.service");
const fitas_banana_controller_1 = require("./fitas-banana.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let FitasBananaModule = class FitasBananaModule {
};
exports.FitasBananaModule = FitasBananaModule;
exports.FitasBananaModule = FitasBananaModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [fitas_banana_controller_1.FitasBananaController],
        providers: [fitas_banana_service_1.FitasBananaService],
        exports: [fitas_banana_service_1.FitasBananaService],
    })
], FitasBananaModule);
//# sourceMappingURL=fitas-banana.module.js.map