"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CredenciaisAPIModule = void 0;
const common_1 = require("@nestjs/common");
const credenciais_api_service_1 = require("./credenciais-api.service");
const credenciais_api_controller_1 = require("./credenciais-api.controller");
const prisma_module_1 = require("../prisma/prisma.module");
let CredenciaisAPIModule = class CredenciaisAPIModule {
};
exports.CredenciaisAPIModule = CredenciaisAPIModule;
exports.CredenciaisAPIModule = CredenciaisAPIModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule],
        controllers: [credenciais_api_controller_1.CredenciaisAPIController],
        providers: [credenciais_api_service_1.CredenciaisAPIService],
        exports: [credenciais_api_service_1.CredenciaisAPIService],
    })
], CredenciaisAPIModule);
//# sourceMappingURL=credenciais-api.module.js.map