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
exports.AreasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let AreasService = class AreasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createAreaDto) {
        const { culturas, ...areaData } = createAreaDto;
        try {
            const area = await this.prisma.areaAgricola.create({
                data: {
                    ...areaData,
                    lotes: {
                        create: culturas.map(cultura => ({
                            culturaId: cultura.culturaId,
                            areaPlantada: cultura.areaPlantada,
                            areaProduzindo: cultura.areaProduzindo,
                        })),
                    },
                },
                include: {
                    lotes: {
                        include: {
                            cultura: true,
                        },
                    },
                },
            });
            return this.mapToResponseDto(area);
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Área com este nome já existe');
            }
            throw error;
        }
    }
    async findAll() {
        const areas = await this.prisma.areaAgricola.findMany({
            include: {
                lotes: {
                    include: {
                        cultura: true,
                    },
                },
            },
            orderBy: {
                nome: 'asc',
            },
        });
        return areas.map(this.mapToResponseDto);
    }
    async findOne(id) {
        const area = await this.prisma.areaAgricola.findUnique({
            where: { id },
            include: {
                lotes: {
                    include: {
                        cultura: true,
                    },
                },
            },
        });
        if (!area) {
            throw new common_1.NotFoundException('Área agrícola não encontrada');
        }
        return this.mapToResponseDto(area);
    }
    async update(id, updateAreaDto) {
        const existingArea = await this.prisma.areaAgricola.findUnique({
            where: { id },
        });
        if (!existingArea) {
            throw new common_1.NotFoundException('Área agrícola não encontrada');
        }
        const { culturas, ...areaData } = updateAreaDto;
        try {
            if (culturas) {
                await this.prisma.lotesCulturas.deleteMany({
                    where: { areaAgricolaId: id },
                });
            }
            const area = await this.prisma.areaAgricola.update({
                where: { id },
                data: {
                    ...areaData,
                    ...(culturas && {
                        lotes: {
                            create: culturas.map(cultura => ({
                                culturaId: cultura.culturaId,
                                areaPlantada: cultura.areaPlantada,
                                areaProduzindo: cultura.areaProduzindo,
                            })),
                        },
                    }),
                },
                include: {
                    lotes: {
                        include: {
                            cultura: true,
                        },
                    },
                },
            });
            return this.mapToResponseDto(area);
        }
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('Área com este nome já existe');
            }
            throw error;
        }
    }
    async remove(id) {
        const area = await this.prisma.areaAgricola.findUnique({
            where: { id },
        });
        if (!area) {
            throw new common_1.NotFoundException('Área agrícola não encontrada');
        }
        await this.prisma.areaAgricola.delete({
            where: { id },
        });
    }
    mapToResponseDto(area) {
        return {
            id: area.id,
            nome: area.nome,
            categoria: area.categoria,
            areaTotal: area.areaTotal,
            coordenadas: area.coordenadas,
            culturas: area.lotes.map(lc => ({
                culturaId: lc.culturaId,
                areaPlantada: lc.areaPlantada,
                areaProduzindo: lc.areaProduzindo,
                descricao: lc.cultura?.descricao || `Cultura ${lc.culturaId}`,
            })),
            createdAt: area.createdAt,
            updatedAt: area.updatedAt,
        };
    }
};
exports.AreasService = AreasService;
exports.AreasService = AreasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AreasService);
//# sourceMappingURL=areas.service.js.map