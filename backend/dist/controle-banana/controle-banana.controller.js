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
exports.ControleBananaController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const controle_banana_service_1 = require("./controle-banana.service");
const dto_1 = require("./dto");
let ControleBananaController = class ControleBananaController {
    controleBananaService;
    constructor(controleBananaService) {
        this.controleBananaService = controleBananaService;
    }
    create(createControleBananaDto, req) {
        const usuarioId = req.user.id;
        return this.controleBananaService.create(createControleBananaDto, usuarioId);
    }
    findAll(page, limit) {
        const pageNum = page ? parseInt(page, 10) : undefined;
        const limitNum = limit ? parseInt(limit, 10) : undefined;
        return this.controleBananaService.findAll(pageNum, limitNum);
    }
    getDashboardData() {
        return this.controleBananaService.getDashboardData();
    }
    getAreasComFitas() {
        return this.controleBananaService.getAreasComFitas();
    }
    getFitasComAreas() {
        return this.controleBananaService.getFitasComAreas();
    }
    async subtrairEstoque(data, req) {
        const usuarioId = req.user.id;
        return this.controleBananaService.processarSubtracaoFitas(data.detalhesAreas, usuarioId);
    }
    getDetalhesArea(areaId) {
        return this.controleBananaService.getDetalhesArea(+areaId);
    }
    getDetalhesFita(fitaId) {
        return this.controleBananaService.getDetalhesFita(+fitaId);
    }
    findByArea(areaId) {
        return this.controleBananaService.findByArea(+areaId);
    }
    findOne(id) {
        return this.controleBananaService.findOne(+id);
    }
    update(id, updateControleBananaDto, req) {
        const usuarioId = req.user.id;
        return this.controleBananaService.update(+id, updateControleBananaDto, usuarioId);
    }
    remove(id, req) {
        const usuarioId = req.user.id;
        return this.controleBananaService.remove(+id, usuarioId);
    }
};
exports.ControleBananaController = ControleBananaController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateControleBananaDto, Object]),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "getDashboardData", null);
__decorate([
    (0, common_1.Get)('areas-com-fitas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "getAreasComFitas", null);
__decorate([
    (0, common_1.Get)('fitas-com-areas'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "getFitasComAreas", null);
__decorate([
    (0, common_1.Post)('subtrair-estoque'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], ControleBananaController.prototype, "subtrairEstoque", null);
__decorate([
    (0, common_1.Get)('detalhes-area/:areaId'),
    __param(0, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "getDetalhesArea", null);
__decorate([
    (0, common_1.Get)('detalhes-fita/:fitaId'),
    __param(0, (0, common_1.Param)('fitaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "getDetalhesFita", null);
__decorate([
    (0, common_1.Get)('area/:areaId'),
    __param(0, (0, common_1.Param)('areaId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "findByArea", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateControleBananaDto, Object]),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ControleBananaController.prototype, "remove", null);
exports.ControleBananaController = ControleBananaController = __decorate([
    (0, common_1.Controller)('controle-banana'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [controle_banana_service_1.ControleBananaService])
], ControleBananaController);
//# sourceMappingURL=controle-banana.controller.js.map