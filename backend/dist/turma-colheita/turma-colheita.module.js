"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TurmaColheitaModule = void 0;
const common_1 = require("@nestjs/common");
const turma_colheita_service_1 = require("./turma-colheita.service");
const turma_colheita_controller_1 = require("./turma-colheita.controller");
const prisma_service_1 = require("../prisma/prisma.service");
let TurmaColheitaModule = class TurmaColheitaModule {
};
exports.TurmaColheitaModule = TurmaColheitaModule;
exports.TurmaColheitaModule = TurmaColheitaModule = __decorate([
    (0, common_1.Module)({
        controllers: [turma_colheita_controller_1.TurmaColheitaController],
        providers: [turma_colheita_service_1.TurmaColheitaService, prisma_service_1.PrismaService],
        exports: [turma_colheita_service_1.TurmaColheitaService],
    })
], TurmaColheitaModule);
//# sourceMappingURL=turma-colheita.module.js.map