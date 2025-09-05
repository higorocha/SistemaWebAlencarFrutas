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
exports.ConvenioCobrancaService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ConvenioCobrancaService = class ConvenioCobrancaService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findConvenio() {
        console.log('🔍 [CONVENIO-COBRANCA] Buscando convênio de cobrança...');
        const convenio = await this.prisma.convenioCobranca.findFirst({
            include: {
                contaCorrente: true,
            },
            orderBy: {
                updatedAt: 'desc',
            },
        });
        if (convenio) {
            console.log('✅ [CONVENIO-COBRANCA] Convênio encontrado:', convenio.convenio);
        }
        else {
            console.log('📝 [CONVENIO-COBRANCA] Nenhum convênio encontrado');
        }
        return convenio;
    }
    async upsertConvenio(convenioDto) {
        console.log('💾 [CONVENIO-COBRANCA] Salvando convênio de cobrança...', {
            contaCorrenteId: convenioDto.contaCorrenteId,
            convenio: convenioDto.convenio,
            carteira: convenioDto.carteira,
            multaAtiva: convenioDto.multaAtiva,
        });
        try {
            await this.validateContaCorrente(convenioDto.contaCorrenteId);
            this.validateMultaFields(convenioDto);
            const convenioExistente = await this.prisma.convenioCobranca.findFirst();
            let convenioSalvo;
            if (convenioExistente) {
                console.log('🔄 [CONVENIO-COBRANCA] Atualizando convênio existente ID:', convenioExistente.id);
                convenioSalvo = await this.prisma.convenioCobranca.update({
                    where: { id: convenioExistente.id },
                    data: {
                        contaCorrenteId: convenioDto.contaCorrenteId,
                        juros: convenioDto.juros,
                        diasAberto: convenioDto.diasAberto,
                        multaAtiva: convenioDto.multaAtiva,
                        layoutBoletoFundoBranco: convenioDto.layoutBoletoFundoBranco,
                        valorMulta: convenioDto.valorMulta,
                        carenciaMulta: convenioDto.carenciaMulta,
                        convenio: convenioDto.convenio,
                        carteira: convenioDto.carteira,
                        variacao: convenioDto.variacao,
                    },
                    include: {
                        contaCorrente: true,
                    },
                });
            }
            else {
                console.log('➕ [CONVENIO-COBRANCA] Criando novo convênio');
                convenioSalvo = await this.prisma.convenioCobranca.create({
                    data: {
                        contaCorrenteId: convenioDto.contaCorrenteId,
                        juros: convenioDto.juros,
                        diasAberto: convenioDto.diasAberto,
                        multaAtiva: convenioDto.multaAtiva,
                        layoutBoletoFundoBranco: convenioDto.layoutBoletoFundoBranco,
                        valorMulta: convenioDto.valorMulta,
                        carenciaMulta: convenioDto.carenciaMulta,
                        convenio: convenioDto.convenio,
                        carteira: convenioDto.carteira,
                        variacao: convenioDto.variacao,
                    },
                    include: {
                        contaCorrente: true,
                    },
                });
            }
            console.log('✅ [CONVENIO-COBRANCA] Convênio salvo com sucesso');
            return convenioSalvo;
        }
        catch (error) {
            console.error('❌ [CONVENIO-COBRANCA] Erro ao salvar convênio:', error);
            if (error instanceof common_1.BadRequestException || error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw error;
        }
    }
    async deleteConvenio() {
        console.log('🗑️ [CONVENIO-COBRANCA] Removendo convênio de cobrança...');
        try {
            const convenioExistente = await this.prisma.convenioCobranca.findFirst();
            if (!convenioExistente) {
                console.log('📝 [CONVENIO-COBRANCA] Nenhum convênio para remover');
                return { message: 'Nenhum convênio de cobrança encontrado para remover' };
            }
            await this.prisma.convenioCobranca.delete({
                where: { id: convenioExistente.id },
            });
            console.log('✅ [CONVENIO-COBRANCA] Convênio removido com sucesso');
            return { message: 'Convênio de cobrança removido com sucesso' };
        }
        catch (error) {
            console.error('❌ [CONVENIO-COBRANCA] Erro ao remover convênio:', error);
            throw error;
        }
    }
    validateMultaFields(convenioDto) {
        if (convenioDto.multaAtiva) {
            if (convenioDto.valorMulta === undefined || convenioDto.valorMulta === null) {
                throw new common_1.BadRequestException('Valor da multa é obrigatório quando multa está ativa');
            }
            if (convenioDto.carenciaMulta === undefined || convenioDto.carenciaMulta === null) {
                throw new common_1.BadRequestException('Carência da multa é obrigatória quando multa está ativa');
            }
        }
    }
    async validateContaCorrente(contaCorrenteId) {
        const contaCorrente = await this.prisma.contaCorrente.findUnique({
            where: { id: contaCorrenteId },
        });
        if (!contaCorrente) {
            throw new common_1.NotFoundException(`Conta corrente com ID ${contaCorrenteId} não encontrada`);
        }
    }
    async existeConvenio() {
        const count = await this.prisma.convenioCobranca.count();
        return count > 0;
    }
};
exports.ConvenioCobrancaService = ConvenioCobrancaService;
exports.ConvenioCobrancaService = ConvenioCobrancaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConvenioCobrancaService);
//# sourceMappingURL=convenio-cobranca.service.js.map