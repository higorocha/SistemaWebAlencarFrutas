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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HistoricoFitasController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const historico_fitas_service_1 = require("./historico-fitas.service");
let HistoricoFitasController = class HistoricoFitasController {
    historicoFitasService;
    constructor(historicoFitasService) {
        this.historicoFitasService = historicoFitasService;
    }
    findAll(page, limit) {
        const pageNum = page ? parseInt(page, 10) : undefined;
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        return this.historicoFitasService.findAll(pageNum, limitNum);
    }
    getEstatisticas() {
        return this.historicoFitasService.getEstatisticas();
    }
    findByUsuario(req, page, limit) {
        const usuarioId = req.user.id;
        const pageNum = page ? parseInt(page, 10) : undefined;
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        return this.historicoFitasService.findByUsuario(usuarioId, pageNum, limitNum);
    }
    findByControle(controleId) {
        return this.historicoFitasService.findByControle(+controleId);
    }
    findOne(id) {
        return this.historicoFitasService.findOne(+id);
    }
};
exports.HistoricoFitasController = HistoricoFitasController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], HistoricoFitasController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('estatisticas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], HistoricoFitasController.prototype, "getEstatisticas", null);
__decorate([
    (0, common_1.Get)('usuario'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], HistoricoFitasController.prototype, "findByUsuario", null);
__decorate([
    (0, common_1.Get)('controle/:controleId'),
    __param(0, (0, common_1.Param)('controleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HistoricoFitasController.prototype, "findByControle", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], HistoricoFitasController.prototype, "findOne", null);
exports.HistoricoFitasController = HistoricoFitasController = __decorate([
    (0, common_1.Controller)('historico-fitas'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [historico_fitas_service_1.HistoricoFitasService])
], HistoricoFitasController);
//# sourceMappingURL=historico-fitas.controller.js.map