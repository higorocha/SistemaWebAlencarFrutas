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
exports.ConfigEmailService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const nodemailer = require("nodemailer");
const crypto_util_1 = require("../utils/crypto.util");
let ConfigEmailService = class ConfigEmailService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    isEncrypted(text) {
        if (!text)
            return false;
        try {
            (0, crypto_util_1.decrypt)(text);
            return true;
        }
        catch {
            return false;
        }
    }
    ensurePasswordEncrypted(password) {
        if (!password)
            return password;
        if (this.isEncrypted(password)) {
            return password;
        }
        return (0, crypto_util_1.encrypt)(password);
    }
    async findConfigEmail() {
        console.log('📧 [CONFIG-EMAIL] Frontend solicitou busca da configuração de email');
        const config = await this.prisma.configEmail.findFirst({
            orderBy: {
                updatedAt: 'desc',
            },
        });
        if (config) {
            console.log('✅ [CONFIG-EMAIL] Configuração encontrada e retornada para o frontend');
        }
        else {
            console.log('📝 [CONFIG-EMAIL] Nenhuma configuração encontrada - retornando null');
        }
        return config;
    }
    async upsertConfigEmail(configDto) {
        console.log('💾 [CONFIG-EMAIL] Frontend solicitou salvamento de configuração de email');
        try {
            const senhaCriptografada = this.ensurePasswordEncrypted(configDto.senha);
            const configExistente = await this.prisma.configEmail.findFirst();
            let configSalva;
            if (configExistente) {
                console.log('🔄 [CONFIG-EMAIL] Atualizando configuração existente');
                configSalva = await this.prisma.configEmail.update({
                    where: { id: configExistente.id },
                    data: {
                        servidorSMTP: configDto.servidorSMTP,
                        porta: configDto.porta,
                        emailEnvio: configDto.emailEnvio,
                        nomeExibicao: configDto.nomeExibicao,
                        usuario: configDto.usuario,
                        senha: senhaCriptografada,
                        metodoAutenticacao: configDto.metodoAutenticacao,
                        timeoutConexao: configDto.timeoutConexao,
                        usarSSL: configDto.usarSSL,
                    },
                });
            }
            else {
                console.log('➕ [CONFIG-EMAIL] Criando nova configuração');
                configSalva = await this.prisma.configEmail.create({
                    data: {
                        servidorSMTP: configDto.servidorSMTP,
                        porta: configDto.porta,
                        emailEnvio: configDto.emailEnvio,
                        nomeExibicao: configDto.nomeExibicao,
                        usuario: configDto.usuario,
                        senha: senhaCriptografada,
                        metodoAutenticacao: configDto.metodoAutenticacao,
                        timeoutConexao: configDto.timeoutConexao,
                        usarSSL: configDto.usarSSL,
                    },
                });
            }
            console.log('✅ [CONFIG-EMAIL] Configuração salva com sucesso e retornada para o frontend');
            return configSalva;
        }
        catch (error) {
            console.error('❌ [CONFIG-EMAIL] Erro ao salvar configuração:', error);
            if (error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw error;
        }
    }
    async deleteConfigEmail() {
        console.log('🗑️ [CONFIG-EMAIL] Frontend solicitou remoção da configuração de email');
        try {
            const configExistente = await this.prisma.configEmail.findFirst();
            if (!configExistente) {
                console.log('📝 [CONFIG-EMAIL] Nenhuma configuração encontrada para remover');
                return { message: 'Nenhuma configuração de email encontrada para remover' };
            }
            await this.prisma.configEmail.delete({
                where: { id: configExistente.id },
            });
            console.log('✅ [CONFIG-EMAIL] Configuração removida com sucesso');
            return { message: 'Configuração de email removida com sucesso' };
        }
        catch (error) {
            console.error('❌ [CONFIG-EMAIL] Erro ao remover configuração:', error);
            throw error;
        }
    }
    async existeConfig() {
        const count = await this.prisma.configEmail.count();
        return count > 0;
    }
    async testarConexao(configDto) {
        console.log('🧪 [CONFIG-EMAIL] Frontend solicitou teste de conexão SMTP');
        try {
            let config = configDto;
            if (!config) {
                const configExistente = await this.findConfigEmail();
                if (!configExistente) {
                    return {
                        success: false,
                        message: 'Nenhuma configuração de email encontrada para testar'
                    };
                }
                config = configExistente;
            }
            const decryptedSenha = (0, crypto_util_1.decrypt)(config.senha);
            const transporter = nodemailer.createTransport({
                host: config.servidorSMTP,
                port: config.porta,
                secure: config.porta === 465,
                auth: {
                    user: config.usuario,
                    pass: decryptedSenha,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });
            await transporter.verify();
            console.log('✅ [CONFIG-EMAIL] Teste de conexão SMTP realizado com sucesso');
            return {
                success: true,
                message: 'Conexão SMTP testada com sucesso'
            };
        }
        catch (error) {
            console.error('❌ [CONFIG-EMAIL] Erro ao testar conexão:', error);
            return {
                success: false,
                message: `Erro ao testar conexão: ${error.message}`
            };
        }
    }
    async enviarEmailTeste(emailDestino) {
        console.log('📧 [CONFIG-EMAIL] Frontend solicitou envio de email de teste');
        try {
            if (!emailDestino || !/\S+@\S+\.\S+/.test(emailDestino)) {
                return {
                    success: false,
                    message: 'Email de teste inválido.'
                };
            }
            const configExistente = await this.findConfigEmail();
            if (!configExistente) {
                return {
                    success: false,
                    message: 'Nenhuma configuração de email encontrada para envio'
                };
            }
            const decryptedSenha = (0, crypto_util_1.decrypt)(configExistente.senha);
            const transporter = nodemailer.createTransport({
                host: configExistente.servidorSMTP,
                port: configExistente.porta,
                secure: configExistente.porta === 465,
                auth: {
                    user: configExistente.usuario,
                    pass: decryptedSenha,
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });
            await transporter.verify();
            await transporter.sendMail({
                from: `"${configExistente.nomeExibicao}" <${configExistente.emailEnvio}>`,
                to: emailDestino,
                subject: 'Email de Teste - Sistema Alencar Frutas',
                text: 'Este é um email de teste para verificar as configurações do servidor de email.',
                html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2ecc71;">🍎 Sistema Alencar Frutas</h2>
            <p>Este é um email de teste para verificar as configurações do servidor de email.</p>
            <p>Se você recebeu este email, significa que as configurações estão funcionando corretamente!</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              Email enviado automaticamente pelo sistema em ${new Date().toLocaleString('pt-BR')}
            </p>
          </div>
        `,
            });
            console.log('✅ [CONFIG-EMAIL] Email de teste enviado com sucesso');
            return {
                success: true,
                message: `Email de teste enviado com sucesso para ${emailDestino}`
            };
        }
        catch (error) {
            console.error('❌ [CONFIG-EMAIL] Erro ao enviar email de teste:', error);
            return {
                success: false,
                message: `Erro ao enviar email: ${error.message}`
            };
        }
    }
};
exports.ConfigEmailService = ConfigEmailService;
exports.ConfigEmailService = ConfigEmailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigEmailService);
//# sourceMappingURL=config-email.service.js.map