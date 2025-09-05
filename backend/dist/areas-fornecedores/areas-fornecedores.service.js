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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AreasFornecedoresService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AreasFornecedoresService = class AreasFornecedoresService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    convertNullToUndefined(obj) {
        if (obj === null)
            return undefined;
        if (typeof obj === 'object') {
            const converted = { ...obj };
            for (const key in converted) {
                if (converted[key] === null) {
                    converted[key] = undefined;
                }
            }
            return converted;
        }
        return obj;
    }
    async create(createAreaFornecedorDto) {
        const fornecedor = await this.prisma.fornecedor.findUnique({
            where: { id: createAreaFornecedorDto.fornecedorId },
        });
        if (!fornecedor) {
            throw new common_1.NotFoundException('Fornecedor não encontrado');
        }
        const existingArea = await this.prisma.areaFornecedor.findFirst({
            where: {
                fornecedorId: createAreaFornecedorDto.fornecedorId,
                nome: createAreaFornecedorDto.nome,
            },
        });
        if (existingArea) {
            throw new common_1.ConflictException('Já existe área com este nome para este fornecedor');
        }
        const area = await this.prisma.areaFornecedor.create({
            data: createAreaFornecedorDto,
            include: {
                fornecedor: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return this.convertNullToUndefined(area);
    }
    async findAll() {
        const areas = await this.prisma.areaFornecedor.findMany({
            include: {
                fornecedor: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
            orderBy: [
                { fornecedor: { nome: 'asc' } },
                { nome: 'asc' },
            ],
        });
        return areas.map(area => this.convertNullToUndefined(area));
    }
    async findByFornecedor(fornecedorId) {
        const fornecedor = await this.prisma.fornecedor.findUnique({
            where: { id: fornecedorId },
        });
        if (!fornecedor) {
            throw new common_1.NotFoundException('Fornecedor não encontrado');
        }
        const areas = await this.prisma.areaFornecedor.findMany({
            where: { fornecedorId },
            include: {
                fornecedor: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
            orderBy: { nome: 'asc' },
        });
        return areas.map(area => this.convertNullToUndefined(area));
    }
    async findOne(id) {
        const area = await this.prisma.areaFornecedor.findUnique({
            where: { id },
            include: {
                fornecedor: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        if (!area) {
            throw new common_1.NotFoundException('Área não encontrada');
        }
        return this.convertNullToUndefined(area);
    }
    async update(id, updateAreaFornecedorDto) {
        const existingArea = await this.prisma.areaFornecedor.findUnique({
            where: { id },
        });
        if (!existingArea) {
            throw new common_1.NotFoundException('Área não encontrada');
        }
        if (updateAreaFornecedorDto.fornecedorId) {
            const fornecedor = await this.prisma.fornecedor.findUnique({
                where: { id: updateAreaFornecedorDto.fornecedorId },
            });
            if (!fornecedor) {
                throw new common_1.NotFoundException('Fornecedor não encontrado');
            }
        }
        if (updateAreaFornecedorDto.nome) {
            const fornecedorId = updateAreaFornecedorDto.fornecedorId || existingArea.fornecedorId;
            const existingAreaName = await this.prisma.areaFornecedor.findFirst({
                where: {
                    fornecedorId,
                    nome: updateAreaFornecedorDto.nome,
                    id: { not: id },
                },
            });
            if (existingAreaName) {
                throw new common_1.ConflictException('Já existe área com este nome para este fornecedor');
            }
        }
        const area = await this.prisma.areaFornecedor.update({
            where: { id },
            data: updateAreaFornecedorDto,
            include: {
                fornecedor: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return this.convertNullToUndefined(area);
    }
    async remove(id) {
        const existingArea = await this.prisma.areaFornecedor.findUnique({
            where: { id },
        });
        if (!existingArea) {
            throw new common_1.NotFoundException('Área não encontrada');
        }
        await this.prisma.areaFornecedor.delete({
            where: { id },
        });
    }
};
exports.AreasFornecedoresService = AreasFornecedoresService;
exports.AreasFornecedoresService = AreasFornecedoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AreasFornecedoresService);
//# sourceMappingURL=areas-fornecedores.service.js.map