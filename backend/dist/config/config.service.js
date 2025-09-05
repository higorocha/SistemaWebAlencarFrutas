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
exports.ConfigService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ConfigService = class ConfigService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findDadosEmpresa() {
        console.log('🔍 [CONFIG] Buscando dados da empresa...');
        const dadosEmpresa = await this.prisma.configDadosEmpresa.findFirst({
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (!dadosEmpresa) {
            console.log('❌ [CONFIG] Nenhum dado de empresa encontrado');
            return null;
        }
        console.log('✅ [CONFIG] Dados da empresa encontrados:', dadosEmpresa.nome_fantasia);
        return dadosEmpresa;
    }
    async saveDadosEmpresa(createConfigDadosEmpresaDto) {
        console.log('💾 [CONFIG] Salvando dados da empresa...', createConfigDadosEmpresaDto.nome_fantasia);
        try {
            const existingData = await this.prisma.configDadosEmpresa.findFirst();
            if (existingData) {
                console.log('🔄 [CONFIG] Atualizando dados existentes da empresa');
                const updatedData = await this.prisma.configDadosEmpresa.update({
                    where: { id: existingData.id },
                    data: createConfigDadosEmpresaDto,
                });
                console.log('✅ [CONFIG] Dados da empresa atualizados com sucesso');
                return updatedData;
            }
            else {
                console.log('🆕 [CONFIG] Criando novos dados da empresa');
                const newData = await this.prisma.configDadosEmpresa.create({
                    data: createConfigDadosEmpresaDto,
                });
                console.log('✅ [CONFIG] Dados da empresa criados com sucesso');
                return newData;
            }
        }
        catch (error) {
            console.error('❌ [CONFIG] Erro ao salvar dados da empresa:', error);
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('CNPJ já cadastrado no sistema');
            }
            throw error;
        }
    }
    async updateDadosEmpresa(id, updateConfigDadosEmpresaDto) {
        console.log('🔄 [CONFIG] Atualizando dados da empresa ID:', id);
        try {
            const updatedData = await this.prisma.configDadosEmpresa.update({
                where: { id },
                data: updateConfigDadosEmpresaDto,
            });
            console.log('✅ [CONFIG] Dados da empresa atualizados com sucesso');
            return updatedData;
        }
        catch (error) {
            console.error('❌ [CONFIG] Erro ao atualizar dados da empresa:', error);
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Dados da empresa não encontrados');
            }
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('CNPJ já cadastrado no sistema');
            }
            throw error;
        }
    }
    async deleteDadosEmpresa(id) {
        console.log('🗑️ [CONFIG] Deletando dados da empresa ID:', id);
        try {
            await this.prisma.configDadosEmpresa.delete({
                where: { id },
            });
            console.log('✅ [CONFIG] Dados da empresa deletados com sucesso');
            return { message: 'Dados da empresa deletados com sucesso' };
        }
        catch (error) {
            console.error('❌ [CONFIG] Erro ao deletar dados da empresa:', error);
            if (error.code === 'P2025') {
                throw new common_1.NotFoundException('Dados da empresa não encontrados');
            }
            throw error;
        }
    }
    async findAllDadosEmpresa() {
        console.log('🔍 [CONFIG] Buscando todos os dados da empresa...');
        const allData = await this.prisma.configDadosEmpresa.findMany({
            orderBy: {
                createdAt: 'desc',
            },
        });
        console.log(`✅ [CONFIG] Encontrados ${allData.length} registros de dados da empresa`);
        return allData;
    }
    async findDadosEmpresaById(id) {
        console.log('🔍 [CONFIG] Buscando dados da empresa ID:', id);
        const dadosEmpresa = await this.prisma.configDadosEmpresa.findUnique({
            where: { id },
        });
        if (!dadosEmpresa) {
            console.log('❌ [CONFIG] Dados da empresa não encontrados');
            throw new common_1.NotFoundException('Dados da empresa não encontrados');
        }
        console.log('✅ [CONFIG] Dados da empresa encontrados:', dadosEmpresa.nome_fantasia);
        return dadosEmpresa;
    }
};
exports.ConfigService = ConfigService;
exports.ConfigService = ConfigService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigService);
//# sourceMappingURL=config.service.js.map