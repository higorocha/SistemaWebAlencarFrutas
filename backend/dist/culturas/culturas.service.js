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
exports.CulturasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CulturasService = class CulturasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createCulturaDto) {
        try {
            const cultura = await this.prisma.cultura.create({
                data: createCulturaDto,
            });
            return this.mapToResponseDto(cultura);
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Cultura com esta descrição já existe');
            }
            throw error;
        }
    }
    async findAll() {
        const culturas = await this.prisma.cultura.findMany({
            orderBy: {
                descricao: 'asc',
            },
        });
        return culturas.map(this.mapToResponseDto);
    }
    async findOne(id) {
        const cultura = await this.prisma.cultura.findUnique({
            where: { id },
        });
        if (!cultura) {
            throw new common_1.NotFoundException('Cultura não encontrada');
        }
        return this.mapToResponseDto(cultura);
    }
    async update(id, updateCulturaDto) {
        const existingCultura = await this.prisma.cultura.findUnique({
            where: { id },
        });
        if (!existingCultura) {
            throw new common_1.NotFoundException('Cultura não encontrada');
        }
        try {
            const cultura = await this.prisma.cultura.update({
                where: { id },
                data: updateCulturaDto,
            });
            return this.mapToResponseDto(cultura);
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Cultura com esta descrição já existe');
            }
            throw error;
        }
    }
    async remove(id) {
        const cultura = await this.prisma.cultura.findUnique({
            where: { id },
            include: {
                lotesCulturas: true,
            },
        });
        if (!cultura) {
            throw new common_1.NotFoundException('Cultura não encontrada');
        }
        if (cultura.lotesCulturas.length > 0) {
            throw new common_1.ConflictException('Não é possível excluir uma cultura que está sendo usada em lotes agrícolas');
        }
        await this.prisma.cultura.delete({
            where: { id },
        });
    }
    mapToResponseDto(cultura) {
        return {
            id: cultura.id,
            descricao: cultura.descricao,
            periodicidade: cultura.periodicidade,
            permitirConsorcio: cultura.permitirConsorcio,
            createdAt: cultura.createdAt,
            updatedAt: cultura.updatedAt,
        };
    }
};
exports.CulturasService = CulturasService;
exports.CulturasService = CulturasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CulturasService);
//# sourceMappingURL=culturas.service.js.map