"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ControleBananaModule = void 0;
const common_1 = require("@nestjs/common");
const controle_banana_service_1 = require("./controle-banana.service");
const controle_banana_controller_1 = require("./controle-banana.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const historico_fitas_module_1 = require("../historico-fitas/historico-fitas.module");
let ControleBananaModule = class ControleBananaModule {
};
exports.ControleBananaModule = ControleBananaModule;
exports.ControleBananaModule = ControleBananaModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, historico_fitas_module_1.HistoricoFitasModule],
        controllers: [controle_banana_controller_1.ControleBananaController],
        providers: [controle_banana_service_1.ControleBananaService],
        exports: [controle_banana_service_1.ControleBananaService],
    })
], ControleBananaModule);
//# sourceMappingURL=controle-banana.module.js.map