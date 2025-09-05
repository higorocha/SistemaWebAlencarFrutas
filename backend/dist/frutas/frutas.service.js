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
exports.FrutasService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FrutasService = class FrutasService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(createFrutaDto) {
        try {
            if (createFrutaDto.codigo) {
                const existingFruta = await this.prisma.fruta.findUnique({
                    where: { codigo: createFrutaDto.codigo },
                });
                if (existingFruta) {
                    throw new common_1.ConflictException('Já existe uma fruta com este código');
                }
            }
            const fruta = await this.prisma.fruta.create({
                data: {
                    nome: createFrutaDto.nome,
                    codigo: createFrutaDto.codigo,
                    categoria: createFrutaDto.categoria,
                    descricao: createFrutaDto.descricao,
                    status: createFrutaDto.status,
                    nomeCientifico: createFrutaDto.nomeCientifico,
                    corPredominante: createFrutaDto.corPredominante,
                    epocaColheita: createFrutaDto.epocaColheita,
                    observacoes: createFrutaDto.observacoes,
                },
            });
            return this.mapToResponseDto(fruta);
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new Error('Erro ao criar fruta');
        }
    }
    async findAll(page = 1, limit = 10, search, categoria, status) {
        const skip = (page - 1) * limit;
        const where = {};
        if (search) {
            where.OR = [
                { nome: { contains: search, mode: 'insensitive' } },
                { codigo: { contains: search, mode: 'insensitive' } },
                { descricao: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (categoria) {
            where.categoria = categoria;
        }
        if (status) {
            where.status = status;
        }
        const [frutas, total] = await Promise.all([
            this.prisma.fruta.findMany({
                where,
                skip,
                take: limit,
                orderBy: { nome: 'asc' },
            }),
            this.prisma.fruta.count({ where }),
        ]);
        return {
            data: frutas.map(fruta => this.mapToResponseDto(fruta)),
            total,
            page,
            limit,
        };
    }
    async findOne(id) {
        const fruta = await this.prisma.fruta.findUnique({
            where: { id },
        });
        if (!fruta) {
            throw new common_1.NotFoundException('Fruta não encontrada');
        }
        return this.mapToResponseDto(fruta);
    }
    async update(id, updateFrutaDto) {
        const existingFruta = await this.prisma.fruta.findUnique({
            where: { id },
        });
        if (!existingFruta) {
            throw new common_1.NotFoundException('Fruta não encontrada');
        }
        if (updateFrutaDto.codigo && updateFrutaDto.codigo !== existingFruta.codigo) {
            const frutaWithCode = await this.prisma.fruta.findUnique({
                where: { codigo: updateFrutaDto.codigo },
            });
            if (frutaWithCode) {
                throw new common_1.ConflictException('Já existe uma fruta com este código');
            }
        }
        const fruta = await this.prisma.fruta.update({
            where: { id },
            data: {
                nome: updateFrutaDto.nome,
                codigo: updateFrutaDto.codigo,
                categoria: updateFrutaDto.categoria,
                descricao: updateFrutaDto.descricao,
                status: updateFrutaDto.status,
                nomeCientifico: updateFrutaDto.nomeCientifico,
                corPredominante: updateFrutaDto.corPredominante,
                epocaColheita: updateFrutaDto.epocaColheita,
                observacoes: updateFrutaDto.observacoes,
            },
        });
        return this.mapToResponseDto(fruta);
    }
    async remove(id) {
        const fruta = await this.prisma.fruta.findUnique({
            where: { id },
        });
        if (!fruta) {
            throw new common_1.NotFoundException('Fruta não encontrada');
        }
        await this.prisma.fruta.delete({
            where: { id },
        });
    }
    async findActive() {
        const frutas = await this.prisma.fruta.findMany({
            where: { status: 'ATIVA' },
            orderBy: { nome: 'asc' },
        });
        return frutas.map(fruta => this.mapToResponseDto(fruta));
    }
    mapToResponseDto(fruta) {
        return {
            id: fruta.id,
            nome: fruta.nome,
            codigo: fruta.codigo,
            categoria: fruta.categoria,
            descricao: fruta.descricao,
            status: fruta.status,
            nomeCientifico: fruta.nomeCientifico,
            corPredominante: fruta.corPredominante,
            epocaColheita: fruta.epocaColheita,
            observacoes: fruta.observacoes,
            createdAt: fruta.createdAt,
            updatedAt: fruta.updatedAt,
        };
    }
};
exports.FrutasService = FrutasService;
exports.FrutasService = FrutasService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FrutasService);
//# sourceMappingURL=frutas.service.js.map