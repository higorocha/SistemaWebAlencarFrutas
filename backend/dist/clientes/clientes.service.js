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
exports.ClientesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ClientesService = class ClientesService {
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
    async create(createClienteDto) {
        let dataToCreate = { ...createClienteDto };
        delete dataToCreate.documento;
        if (createClienteDto.documento && createClienteDto.documento.trim()) {
            const documentoLimpo = createClienteDto.documento.replace(/\D/g, '');
            if (documentoLimpo.length === 11) {
                dataToCreate.cpf = createClienteDto.documento;
                dataToCreate.cnpj = undefined;
            }
            else if (documentoLimpo.length === 14) {
                dataToCreate.cnpj = createClienteDto.documento;
                dataToCreate.cpf = undefined;
            }
        }
        else {
            dataToCreate.cpf = undefined;
            dataToCreate.cnpj = undefined;
        }
        if (dataToCreate.cnpj) {
            const existingCnpj = await this.prisma.cliente.findFirst({
                where: { cnpj: dataToCreate.cnpj },
            });
            if (existingCnpj) {
                throw new common_1.ConflictException('Já existe um cliente com este CNPJ');
            }
        }
        if (dataToCreate.cpf) {
            const existingCpf = await this.prisma.cliente.findFirst({
                where: { cpf: dataToCreate.cpf },
            });
            if (existingCpf) {
                throw new common_1.ConflictException('Já existe um cliente com este CPF');
            }
        }
        const cliente = await this.prisma.cliente.create({
            data: dataToCreate,
        });
        return this.convertNullToUndefined(cliente);
    }
    async findAll(page, limit, search, status) {
        const skip = page && limit ? (page - 1) * limit : 0;
        const take = limit || 10;
        const where = {};
        if (search) {
            where.OR = [
                { nome: { contains: search, mode: 'insensitive' } },
                { razaoSocial: { contains: search, mode: 'insensitive' } },
                { cnpj: { contains: search } },
                { cpf: { contains: search } },
                { cidade: { contains: search, mode: 'insensitive' } },
            ];
        }
        if (status) {
            where.status = status;
        }
        const [clientes, total] = await Promise.all([
            this.prisma.cliente.findMany({
                where,
                skip,
                take,
                orderBy: { nome: 'asc' },
            }),
            this.prisma.cliente.count({ where }),
        ]);
        return {
            data: clientes.map(cliente => {
                const converted = this.convertNullToUndefined(cliente);
                if (!converted.documento) {
                    converted.documento = converted.cpf || converted.cnpj || '';
                }
                return converted;
            }),
            total,
            page: page || 1,
            limit: take,
        };
    }
    async findActive() {
        const clientes = await this.prisma.cliente.findMany({
            where: { status: 'ATIVO' },
            orderBy: { nome: 'asc' },
        });
        return clientes.map(cliente => {
            const converted = this.convertNullToUndefined(cliente);
            if (!converted.documento) {
                converted.documento = converted.cpf || converted.cnpj || '';
            }
            return converted;
        });
    }
    async findOne(id) {
        const cliente = await this.prisma.cliente.findUnique({
            where: { id },
        });
        if (!cliente) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        const converted = this.convertNullToUndefined(cliente);
        if (!converted.documento) {
            converted.documento = converted.cpf || converted.cnpj || '';
        }
        return converted;
    }
    async update(id, updateClienteDto) {
        const existingCliente = await this.prisma.cliente.findUnique({
            where: { id },
        });
        if (!existingCliente) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        let dataToUpdate = { ...updateClienteDto };
        delete dataToUpdate.documento;
        if (updateClienteDto.documento && updateClienteDto.documento.trim()) {
            const documentoLimpo = updateClienteDto.documento.replace(/\D/g, '');
            if (documentoLimpo.length === 11) {
                dataToUpdate.cpf = updateClienteDto.documento;
                dataToUpdate.cnpj = undefined;
            }
            else if (documentoLimpo.length === 14) {
                dataToUpdate.cnpj = updateClienteDto.documento;
                dataToUpdate.cpf = undefined;
            }
        }
        else if (updateClienteDto.documento !== undefined) {
            dataToUpdate.cpf = undefined;
            dataToUpdate.cnpj = undefined;
        }
        if (dataToUpdate.cnpj) {
            const existingCnpj = await this.prisma.cliente.findFirst({
                where: {
                    cnpj: dataToUpdate.cnpj,
                    id: { not: id },
                },
            });
            if (existingCnpj) {
                throw new common_1.ConflictException('Já existe um cliente com este CNPJ');
            }
        }
        if (dataToUpdate.cpf) {
            const existingCpf = await this.prisma.cliente.findFirst({
                where: {
                    cpf: dataToUpdate.cpf,
                    id: { not: id },
                },
            });
            if (existingCpf) {
                throw new common_1.ConflictException('Já existe um cliente com este CPF');
            }
        }
        const cliente = await this.prisma.cliente.update({
            where: { id },
            data: dataToUpdate,
        });
        return this.convertNullToUndefined(cliente);
    }
    async remove(id) {
        const cliente = await this.prisma.cliente.findUnique({
            where: { id },
        });
        if (!cliente) {
            throw new common_1.NotFoundException('Cliente não encontrado');
        }
        await this.prisma.cliente.delete({
            where: { id },
        });
    }
};
exports.ClientesService = ClientesService;
exports.ClientesService = ClientesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientesService);
//# sourceMappingURL=clientes.service.js.map