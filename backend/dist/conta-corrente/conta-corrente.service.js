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
exports.ContaCorrenteService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ContaCorrenteService = class ContaCorrenteService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        console.log('🔍 [CONTA-CORRENTE] Buscando todas as contas correntes...');
        const contasCorrentes = await this.prisma.contaCorrente.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log(`✅ [CONTA-CORRENTE] Encontradas ${contasCorrentes.length} contas correntes`);
        return contasCorrentes;
    }
    async findOne(id) {
        console.log('🔍 [CONTA-CORRENTE] Buscando conta corrente ID:', id);
        const contaCorrente = await this.prisma.contaCorrente.findUnique({
            where: { id },
        });
        if (!contaCorrente) {
            console.log('❌ [CONTA-CORRENTE] Conta corrente não encontrada');
            throw new common_1.NotFoundException('Conta corrente não encontrada');
        }
        console.log('✅ [CONTA-CORRENTE] Conta corrente encontrada:', contaCorrente.bancoCodigo);
        return contaCorrente;
    }
    async create(createContaCorrenteDto) {
        console.log('💾 [CONTA-CORRENTE] Criando nova conta corrente...', createContaCorrenteDto);
        try {
            const existingConta = await this.prisma.contaCorrente.findFirst({
                where: {
                    bancoCodigo: createContaCorrenteDto.bancoCodigo,
                    agencia: createContaCorrenteDto.agencia,
                    agenciaDigito: createContaCorrenteDto.agenciaDigito,
                    contaCorrente: createContaCorrenteDto.contaCorrente,
                    contaCorrenteDigito: createContaCorrenteDto.contaCorrenteDigito,
                },
            });
            if (existingConta) {
                throw new common_1.ConflictException('Já existe uma conta corrente com esses dados');
            }
            const novaConta = await this.prisma.contaCorrente.create({
                data: createContaCorrenteDto,
            });
            console.log('✅ [CONTA-CORRENTE] Conta corrente criada com sucesso');
            return novaConta;
        }
        catch (error) {
            console.error('❌ [CONTA-CORRENTE] Erro ao criar conta corrente:', error);
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw error;
        }
    }
    async update(id, updateContaCorrenteDto) {
        console.log('🔄 [CONTA-CORRENTE] Atualizando conta corrente ID:', id);
        try {
            await this.findOne(id);
            if (updateContaCorrenteDto.bancoCodigo ||
                updateContaCorrenteDto.agencia ||
                updateContaCorrenteDto.agenciaDigito ||
                updateContaCorrenteDto.contaCorrente ||
                updateContaCorrenteDto.contaCorrenteDigito) {
                const contaAtual = await this.prisma.contaCorrente.findUnique({
                    where: { id },
                });
                if (!contaAtual) {
                    throw new common_1.NotFoundException('Conta corrente não encontrada');
                }
                const dadosCompletos = {
                    bancoCodigo: updateContaCorrenteDto.bancoCodigo || contaAtual.bancoCodigo,
                    agencia: updateContaCorrenteDto.agencia || contaAtual.agencia,
                    agenciaDigito: updateContaCorrenteDto.agenciaDigito || contaAtual.agenciaDigito,
                    contaCorrente: updateContaCorrenteDto.contaCorrente || contaAtual.contaCorrente,
                    contaCorrenteDigito: updateContaCorrenteDto.contaCorrenteDigito || contaAtual.contaCorrenteDigito,
                };
                const existingConta = await this.prisma.contaCorrente.findFirst({
                    where: {
                        AND: [
                            { id: { not: id } },
                            dadosCompletos,
                        ],
                    },
                });
                if (existingConta) {
                    throw new common_1.ConflictException('Já existe uma conta corrente com esses dados');
                }
            }
            const contaAtualizada = await this.prisma.contaCorrente.update({
                where: { id },
                data: updateContaCorrenteDto,
            });
            console.log('✅ [CONTA-CORRENTE] Conta corrente atualizada com sucesso');
            return contaAtualizada;
        }
        catch (error) {
            console.error('❌ [CONTA-CORRENTE] Erro ao atualizar conta corrente:', error);
            if (error instanceof common_1.NotFoundException || error instanceof common_1.ConflictException) {
                throw error;
            }
            throw error;
        }
    }
    async remove(id) {
        console.log('🗑️ [CONTA-CORRENTE] Removendo conta corrente ID:', id);
        try {
            await this.findOne(id);
            await this.prisma.contaCorrente.delete({
                where: { id },
            });
            console.log('✅ [CONTA-CORRENTE] Conta corrente removida com sucesso');
            return { message: 'Conta corrente removida com sucesso' };
        }
        catch (error) {
            console.error('❌ [CONTA-CORRENTE] Erro ao remover conta corrente:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw error;
        }
    }
};
exports.ContaCorrenteService = ContaCorrenteService;
exports.ContaCorrenteService = ContaCorrenteService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ContaCorrenteService);
//# sourceMappingURL=conta-corrente.service.js.map