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
exports.FornecedoresService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FornecedoresService = class FornecedoresService {
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
    async create(createFornecedorDto) {
        let dataToCreate = { ...createFornecedorDto };
        delete dataToCreate.documento;
        if (createFornecedorDto.documento && createFornecedorDto.documento.trim()) {
            const documento = createFornecedorDto.documento.replace(/\D/g, '');
            if (documento.length === 11) {
                dataToCreate.cpf = createFornecedorDto.documento;
                dataToCreate.cnpj = undefined;
            }
            else if (documento.length === 14) {
                dataToCreate.cnpj = createFornecedorDto.documento;
                dataToCreate.cpf = undefined;
            }
        }
        else {
            dataToCreate.cpf = undefined;
            dataToCreate.cnpj = undefined;
        }
        if (dataToCreate.cnpj) {
            const existingCnpj = await this.prisma.fornecedor.findUnique({
                where: { cnpj: dataToCreate.cnpj },
            });
            if (existingCnpj) {
                throw new common_1.ConflictException('Já existe fornecedor com este CNPJ');
            }
        }
        if (dataToCreate.cpf) {
            const existingCpf = await this.prisma.fornecedor.findUnique({
                where: { cpf: dataToCreate.cpf },
            });
            if (existingCpf) {
                throw new common_1.ConflictException('Já existe fornecedor com este CPF');
            }
        }
        const fornecedor = await this.prisma.fornecedor.create({
            data: dataToCreate,
            include: {
                areas: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return this.convertNullToUndefined(fornecedor);
    }
    async findAll(search) {
        const where = search ? {
            OR: [
                { nome: { contains: search, mode: 'insensitive' } },
                { cnpj: { contains: search, mode: 'insensitive' } },
                { cpf: { contains: search, mode: 'insensitive' } },
                { documento: { contains: search, mode: 'insensitive' } },
            ],
        } : {};
        const fornecedores = await this.prisma.fornecedor.findMany({
            where,
            include: {
                areas: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
            orderBy: { nome: 'asc' },
        });
        return fornecedores.map(fornecedor => {
            const converted = this.convertNullToUndefined(fornecedor);
            if (!converted.documento) {
                converted.documento = converted.cpf || converted.cnpj || undefined;
            }
            return converted;
        });
    }
    async findOne(id) {
        const fornecedor = await this.prisma.fornecedor.findUnique({
            where: { id },
            include: {
                areas: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        if (!fornecedor) {
            throw new common_1.NotFoundException('Fornecedor não encontrado');
        }
        const converted = this.convertNullToUndefined(fornecedor);
        if (!converted.documento) {
            converted.documento = converted.cpf || converted.cnpj || undefined;
        }
        return converted;
    }
    async update(id, updateFornecedorDto) {
        const existingFornecedor = await this.prisma.fornecedor.findUnique({
            where: { id },
        });
        if (!existingFornecedor) {
            throw new common_1.NotFoundException('Fornecedor não encontrado');
        }
        let dataToUpdate = { ...updateFornecedorDto };
        delete dataToUpdate.documento;
        if (updateFornecedorDto.documento && updateFornecedorDto.documento.trim()) {
            const documento = updateFornecedorDto.documento.replace(/\D/g, '');
            if (documento.length === 11) {
                dataToUpdate.cpf = updateFornecedorDto.documento;
                dataToUpdate.cnpj = undefined;
            }
            else if (documento.length === 14) {
                dataToUpdate.cnpj = updateFornecedorDto.documento;
                dataToUpdate.cpf = undefined;
            }
        }
        else {
            dataToUpdate.cpf = undefined;
            dataToUpdate.cnpj = undefined;
        }
        if (dataToUpdate.cnpj) {
            const existingCnpj = await this.prisma.fornecedor.findFirst({
                where: {
                    cnpj: dataToUpdate.cnpj,
                    id: { not: id }
                },
            });
            if (existingCnpj) {
                throw new common_1.ConflictException('Já existe fornecedor com este CNPJ');
            }
        }
        if (dataToUpdate.cpf) {
            const existingCpf = await this.prisma.fornecedor.findFirst({
                where: {
                    cpf: dataToUpdate.cpf,
                    id: { not: id }
                },
            });
            if (existingCpf) {
                throw new common_1.ConflictException('Já existe fornecedor com este CPF');
            }
        }
        const fornecedor = await this.prisma.fornecedor.update({
            where: { id },
            data: dataToUpdate,
            include: {
                areas: {
                    select: {
                        id: true,
                        nome: true,
                    },
                },
            },
        });
        return this.convertNullToUndefined(fornecedor);
    }
    async remove(id) {
        const existingFornecedor = await this.prisma.fornecedor.findUnique({
            where: { id },
        });
        if (!existingFornecedor) {
            throw new common_1.NotFoundException('Fornecedor não encontrado');
        }
        const areasCount = await this.prisma.areaFornecedor.count({
            where: { fornecedorId: id },
        });
        if (areasCount > 0) {
            throw new common_1.ConflictException('Não é possível remover fornecedor com áreas associadas');
        }
        await this.prisma.fornecedor.delete({
            where: { id },
        });
    }
};
exports.FornecedoresService = FornecedoresService;
exports.FornecedoresService = FornecedoresService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FornecedoresService);
//# sourceMappingURL=fornecedores.service.js.map