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
exports.ConfigWhatsAppService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const axios_1 = require("axios");
const whatsapp_util_1 = require("../utils/whatsapp.util");
let ConfigWhatsAppService = class ConfigWhatsAppService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    convertToResponseDto(config) {
        return {
            id: config.id,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
            phoneNumberId: config.phoneNumberId,
            accessToken: config.accessToken,
            businessAccountId: config.businessAccountId || undefined,
            verifyToken: config.verifyToken || undefined,
            numeroTelefone: config.numeroTelefone,
            nomeExibicao: config.nomeExibicao,
            ativo: config.ativo,
            webhookUrl: config.webhookUrl || undefined,
            configuracoesAdicionais: config.configuracoesAdicionais ?
                config.configuracoesAdicionais : undefined,
        };
    }
    convertToPrismaInput(configDto) {
        return {
            phoneNumberId: configDto.phoneNumberId,
            accessToken: configDto.accessToken,
            businessAccountId: configDto.businessAccountId || null,
            verifyToken: configDto.verifyToken || null,
            numeroTelefone: configDto.numeroTelefone,
            nomeExibicao: configDto.nomeExibicao,
            ativo: configDto.ativo,
            webhookUrl: configDto.webhookUrl || null,
            configuracoesAdicionais: configDto.configuracoesAdicionais ?
                configDto.configuracoesAdicionais :
                client_1.Prisma.JsonNull,
        };
    }
    async findConfigWhatsApp() {
        console.log('📱 [CONFIG-WHATSAPP] Frontend solicitou busca da configuração de WhatsApp');
        const config = await this.prisma.configWhatsApp.findFirst({
            orderBy: {
                updatedAt: 'desc',
            },
        });
        if (config) {
            console.log('✅ [CONFIG-WHATSAPP] Configuração encontrada e retornada para o frontend');
            return this.convertToResponseDto(config);
        }
        else {
            console.log('📝 [CONFIG-WHATSAPP] Nenhuma configuração encontrada - retornando null');
            return null;
        }
    }
    async upsertConfigWhatsApp(configDto) {
        console.log('💾 [CONFIG-WHATSAPP] Frontend solicitou salvamento de configuração de WhatsApp');
        try {
            const configExistente = await this.prisma.configWhatsApp.findFirst();
            let configSalva;
            const dadosPrisma = this.convertToPrismaInput(configDto);
            if (configExistente) {
                console.log('🔄 [CONFIG-WHATSAPP] Atualizando configuração existente');
                configSalva = await this.prisma.configWhatsApp.update({
                    where: { id: configExistente.id },
                    data: dadosPrisma,
                });
            }
            else {
                console.log('➕ [CONFIG-WHATSAPP] Criando nova configuração');
                configSalva = await this.prisma.configWhatsApp.create({
                    data: dadosPrisma,
                });
            }
            console.log('✅ [CONFIG-WHATSAPP] Configuração salva com sucesso e retornada para o frontend');
            return this.convertToResponseDto(configSalva);
        }
        catch (error) {
            console.error('❌ [CONFIG-WHATSAPP] Erro ao salvar configuração:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw error;
        }
    }
    async deleteConfigWhatsApp() {
        console.log('��️ [CONFIG-WHATSAPP] Frontend solicitou remoção da configuração de WhatsApp');
        try {
            const configExistente = await this.prisma.configWhatsApp.findFirst();
            if (!configExistente) {
                console.log('📝 [CONFIG-WHATSAPP] Nenhuma configuração encontrada para remover');
                return { message: 'Nenhuma configuração de WhatsApp encontrada para remover' };
            }
            await this.prisma.configWhatsApp.delete({
                where: { id: configExistente.id },
            });
            console.log('✅ [CONFIG-WHATSAPP] Configuração removida com sucesso');
            return { message: 'Configuração de WhatsApp removida com sucesso' };
        }
        catch (error) {
            console.error('❌ [CONFIG-WHATSAPP] Erro ao remover configuração:', error);
            throw error;
        }
    }
    async existeConfig() {
        const count = await this.prisma.configWhatsApp.count();
        return count > 0;
    }
    async testarConexao(configDto) {
        console.log('🧪 [CONFIG-WHATSAPP] Frontend solicitou teste de conexão com API WhatsApp');
        try {
            let config = configDto;
            if (!config) {
                const configExistente = await this.findConfigWhatsApp();
                if (!configExistente) {
                    return {
                        success: false,
                        message: 'Nenhuma configuração de WhatsApp encontrada para testar'
                    };
                }
                config = configExistente;
            }
            try {
                const response = await axios_1.default.get(`https://graph.facebook.com/v17.0/${config.phoneNumberId}`, {
                    headers: {
                        'Authorization': `Bearer ${config.accessToken}`,
                    }
                });
                console.log('✅ [CONFIG-WHATSAPP] Teste de conexão realizado com sucesso');
                return {
                    success: true,
                    message: `Conexão com API WhatsApp testada com sucesso (Phone ID: ${config.phoneNumberId})`
                };
            }
            catch (apiError) {
                console.error('❌ [CONFIG-WHATSAPP] Erro na API:', apiError.response?.data || apiError.message);
                const errorData = apiError.response?.data?.error;
                let errorMessage = 'Erro ao conectar com a API do WhatsApp';
                if (errorData) {
                    if (errorData.code === 190) {
                        errorMessage = 'Token de acesso inválido ou expirado';
                    }
                    else if (errorData.code === 100) {
                        errorMessage = 'Phone Number ID inválido ou não encontrado';
                    }
                    else {
                        errorMessage = `Erro da API: ${errorData.message}`;
                    }
                }
                return {
                    success: false,
                    message: errorMessage
                };
            }
        }
        catch (error) {
            console.error('❌ [CONFIG-WHATSAPP] Erro ao testar conexão:', error);
            return {
                success: false,
                message: `Erro ao testar conexão: ${error.message}`
            };
        }
    }
    async enviarMensagemTeste(numeroDestino, mensagem, configDto) {
        console.log('📱 [CONFIG-WHATSAPP] Frontend solicitou envio de mensagem de teste via WhatsApp');
        try {
            if (!numeroDestino) {
                return {
                    success: false,
                    message: 'Telefone para teste é obrigatório'
                };
            }
            let config = configDto;
            if (!config) {
                const configExistente = await this.findConfigWhatsApp();
                if (!configExistente) {
                    return {
                        success: false,
                        message: 'Nenhuma configuração de WhatsApp encontrada para envio'
                    };
                }
                config = configExistente;
            }
            const numeroFormatado = (0, whatsapp_util_1.formatarNumeroTelefone)(numeroDestino);
            try {
                const payload = {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: numeroFormatado,
                    type: "text",
                    text: { body: mensagem }
                };
                const response = await axios_1.default.post(`https://graph.facebook.com/v17.0/${config.phoneNumberId}/messages`, payload, {
                    headers: {
                        'Authorization': `Bearer ${config.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                });
                console.log('✅ [CONFIG-WHATSAPP] Mensagem de teste enviada com sucesso');
                return {
                    success: true,
                    message: `Mensagem de teste enviada com sucesso para ${(0, whatsapp_util_1.exibirNumeroFormatado)(numeroFormatado)}. Verifique se a mensagem chegou no WhatsApp.`,
                };
            }
            catch (apiError) {
                console.error('❌ [CONFIG-WHATSAPP] Erro na API do WhatsApp:', apiError.response?.data || apiError.message);
                const errorData = apiError.response?.data?.error;
                let errorMessage = 'Erro ao enviar mensagem via WhatsApp';
                if (errorData) {
                    if (errorData.code === 100) {
                        errorMessage = 'Número não verificado para testes. Adicione-o na plataforma do Meta Business para testes.';
                    }
                    else if (errorData.code === 131047) {
                        errorMessage = 'Você deve usar um template para iniciar uma conversa. Configure um template na plataforma do Meta.';
                    }
                    else if (errorData.code === 190) {
                        errorMessage = 'Token de acesso expirado ou inválido. Verifique suas credenciais.';
                    }
                    else if (errorData.code === 131008) {
                        errorMessage = 'Número de telefone inválido ou não encontrado.';
                    }
                    else if (errorData.code === 131009) {
                        errorMessage = 'Número não está registrado no WhatsApp.';
                    }
                    else {
                        errorMessage = `Erro da API: ${errorData.message} (Código: ${errorData.code})`;
                    }
                }
                else if (apiError.response?.status === 401) {
                    errorMessage = 'Token de acesso inválido ou expirado. Verifique suas credenciais.';
                }
                else if (apiError.response?.status === 403) {
                    errorMessage = 'Acesso negado. Verifique as permissões da sua aplicação.';
                }
                else if (apiError.response?.status === 404) {
                    errorMessage = 'Phone Number ID não encontrado. Verifique se o ID está correto.';
                }
                return {
                    success: false,
                    message: errorMessage,
                };
            }
        }
        catch (error) {
            console.error('❌ [CONFIG-WHATSAPP] Erro ao enviar mensagem de teste:', error);
            return {
                success: false,
                message: `Erro ao enviar mensagem: ${error.message}`
            };
        }
    }
};
exports.ConfigWhatsAppService = ConfigWhatsAppService;
exports.ConfigWhatsAppService = ConfigWhatsAppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigWhatsAppService);
//# sourceMappingURL=config-whatsapp.service.js.map