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
exports.CredenciaisAPIService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CredenciaisAPIService = class CredenciaisAPIService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        console.log('🔍 [CREDENCIAIS-API] Buscando todas as credenciais API...');
        const credenciais = await this.prisma.credenciaisAPI.findMany({
            include: {
                contaCorrente: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log(`✅ [CREDENCIAIS-API] Encontradas ${credenciais.length} credenciais`);
        return credenciais;
    }
    async findOne(id) {
        console.log('🔍 [CREDENCIAIS-API] Buscando credenciais ID:', id);
        const credenciais = await this.prisma.credenciaisAPI.findUnique({
            where: { id },
            include: {
                contaCorrente: true,
            },
        });
        if (!credenciais) {
            console.log('❌ [CREDENCIAIS-API] Credenciais não encontradas');
            throw new common_1.NotFoundException('Credenciais API não encontradas');
        }
        console.log('✅ [CREDENCIAIS-API] Credenciais encontradas:', credenciais.modalidadeApi);
        return credenciais;
    }
    async findByContaCorrente(contaCorrenteId) {
        console.log('🔍 [CREDENCIAIS-API] Buscando credenciais da conta:', contaCorrenteId);
        const credenciais = await this.prisma.credenciaisAPI.findMany({
            where: { contaCorrenteId },
            include: {
                contaCorrente: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log(`✅ [CREDENCIAIS-API] Encontradas ${credenciais.length} credenciais para a conta`);
        return credenciais;
    }
    async create(createCredenciaisAPIDto) {
        console.log('💾 [CREDENCIAIS-API] Criando novas credenciais...', {
            banco: createCredenciaisAPIDto.banco,
            contaCorrenteId: createCredenciaisAPIDto.contaCorrenteId,
            modalidadeApi: createCredenciaisAPIDto.modalidadeApi,
        });
        try {
            const contaCorrente = await this.prisma.contaCorrente.findUnique({
                where: { id: createCredenciaisAPIDto.contaCorrenteId },
            });
            if (!contaCorrente) {
                throw new common_1.BadRequestException('Conta corrente não encontrada');
            }
            const existingCredenciais = await this.prisma.credenciaisAPI.findFirst({
                where: {
                    banco: createCredenciaisAPIDto.banco,
                    contaCorrenteId: createCredenciaisAPIDto.contaCorrenteId,
                    modalidadeApi: createCredenciaisAPIDto.modalidadeApi,
                },
            });
            if (existingCredenciais) {
                throw new common_1.ConflictException(`Já existem credenciais para ${createCredenciaisAPIDto.banco} - ${createCredenciaisAPIDto.modalidadeApi} nesta conta corrente`);
            }
            const novasCredenciais = await this.prisma.credenciaisAPI.create({
                data: createCredenciaisAPIDto,
                include: {
                    contaCorrente: true,
                },
            });
            console.log('✅ [CREDENCIAIS-API] Credenciais criadas com sucesso');
            return novasCredenciais;
        }
        catch (error) {
            console.error('❌ [CREDENCIAIS-API] Erro ao criar credenciais:', error);
            if (error instanceof common_1.ConflictException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw error;
        }
    }
    async update(id, updateCredenciaisAPIDto) {
        console.log('🔄 [CREDENCIAIS-API] Atualizando credenciais ID:', id);
        try {
            await this.findOne(id);
            if (updateCredenciaisAPIDto.contaCorrenteId) {
                const contaCorrente = await this.prisma.contaCorrente.findUnique({
                    where: { id: updateCredenciaisAPIDto.contaCorrenteId },
                });
                if (!contaCorrente) {
                    throw new common_1.BadRequestException('Conta corrente não encontrada');
                }
            }
            if (updateCredenciaisAPIDto.banco ||
                updateCredenciaisAPIDto.contaCorrenteId ||
                updateCredenciaisAPIDto.modalidadeApi) {
                const credenciaisAtuais = await this.prisma.credenciaisAPI.findUnique({
                    where: { id },
                });
                if (!credenciaisAtuais) {
                    throw new common_1.NotFoundException('Credenciais API não encontradas');
                }
                const dadosCompletos = {
                    banco: updateCredenciaisAPIDto.banco || credenciaisAtuais.banco,
                    contaCorrenteId: updateCredenciaisAPIDto.contaCorrenteId || credenciaisAtuais.contaCorrenteId,
                    modalidadeApi: updateCredenciaisAPIDto.modalidadeApi || credenciaisAtuais.modalidadeApi,
                };
                const existingCredenciais = await this.prisma.credenciaisAPI.findFirst({
                    where: {
                        AND: [
                            { id: { not: id } },
                            dadosCompletos,
                        ],
                    },
                });
                if (existingCredenciais) {
                    throw new common_1.ConflictException(`Já existem credenciais para ${dadosCompletos.banco} - ${dadosCompletos.modalidadeApi} nesta conta corrente`);
                }
            }
            const credenciaisAtualizadas = await this.prisma.credenciaisAPI.update({
                where: { id },
                data: updateCredenciaisAPIDto,
                include: {
                    contaCorrente: true,
                },
            });
            console.log('✅ [CREDENCIAIS-API] Credenciais atualizadas com sucesso');
            return credenciaisAtualizadas;
        }
        catch (error) {
            console.error('❌ [CREDENCIAIS-API] Erro ao atualizar credenciais:', error);
            if (error instanceof common_1.NotFoundException ||
                error instanceof common_1.ConflictException ||
                error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw error;
        }
    }
    async remove(id) {
        console.log('🗑️ [CREDENCIAIS-API] Removendo credenciais ID:', id);
        try {
            await this.findOne(id);
            await this.prisma.credenciaisAPI.delete({
                where: { id },
            });
            console.log('✅ [CREDENCIAIS-API] Credenciais removidas com sucesso');
            return { message: 'Credenciais API removidas com sucesso' };
        }
        catch (error) {
            console.error('❌ [CREDENCIAIS-API] Erro ao remover credenciais:', error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw error;
        }
    }
    async findByBancoAndModalidade(banco, modalidadeApi) {
        console.log('🔍 [CREDENCIAIS-API] Buscando credenciais por banco e modalidade:', banco, modalidadeApi);
        const credenciais = await this.prisma.credenciaisAPI.findMany({
            where: {
                banco,
                modalidadeApi,
            },
            include: {
                contaCorrente: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log(`✅ [CREDENCIAIS-API] Encontradas ${credenciais.length} credenciais`);
        return credenciais;
    }
};
exports.CredenciaisAPIService = CredenciaisAPIService;
exports.CredenciaisAPIService = CredenciaisAPIService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CredenciaisAPIService);
//# sourceMappingURL=credenciais-api.service.js.map