import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateConfigEmailDto, 
  UpdateConfigEmailDto,
  ConfigEmailResponseDto 
} from '../config/dto/config-email.dto';
import * as nodemailer from 'nodemailer';
import { decrypt, encrypt } from '../utils/crypto.util';

@Injectable()
export class ConfigEmailService {
  constructor(private prisma: PrismaService) {}

  /**
   * Verifica se uma string parece estar criptografada (Base64)
   */
  private isEncrypted(text: string): boolean {
    if (!text) return false;
    
    try {
      // Tenta descriptografar para ver se é uma string criptografada válida
      decrypt(text);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Criptografa a senha se ela não estiver já criptografada
   */
  private ensurePasswordEncrypted(password: string): string {
    if (!password) return password;
    
    if (this.isEncrypted(password)) {
      return password; // Já está criptografada
    }
    
    return encrypt(password); // Criptografa
  }

  /**
   * Busca a configuração de email (único registro)
   * Retorna null se não existir
   */
  async findConfigEmail(): Promise<ConfigEmailResponseDto | null> {
    console.log('📧 [CONFIG-EMAIL] Frontend solicitou busca da configuração de email');
    
    const config = await this.prisma.configEmail.findFirst({
      orderBy: {
        updatedAt: 'desc', // Pega o mais recente (caso existam múltiplos por erro)
      },
    });

    if (config) {
      console.log('✅ [CONFIG-EMAIL] Configuração encontrada e retornada para o frontend');
    } else {
      console.log('📝 [CONFIG-EMAIL] Nenhuma configuração encontrada - retornando null');
    }

    return config;
  }

  /**
   * Cria ou atualiza a configuração de email (upsert)
   * Como é um registro único, sempre sobrescreve o existente
   */
  async upsertConfigEmail(configDto: CreateConfigEmailDto | UpdateConfigEmailDto): Promise<ConfigEmailResponseDto> {
    console.log('💾 [CONFIG-EMAIL] Frontend solicitou salvamento de configuração de email');
    
         try {
       // Criptografa a senha se necessário
       const senhaCriptografada = this.ensurePasswordEncrypted(configDto.senha);
       
       // Busca se já existe uma configuração
       const configExistente = await this.prisma.configEmail.findFirst();

       let configSalva: ConfigEmailResponseDto;

       if (configExistente) {
         // Atualiza a configuração existente
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
       } else {
         // Cria nova configuração
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
    } catch (error) {
      console.error('❌ [CONFIG-EMAIL] Erro ao salvar configuração:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Remove a configuração de email
   * Útil para testes ou reset completo
   */
  async deleteConfigEmail(): Promise<{ message: string }> {
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
    } catch (error) {
      console.error('❌ [CONFIG-EMAIL] Erro ao remover configuração:', error);
      throw error;
    }
  }

  /**
   * Verifica se existe uma configuração cadastrada
   * Útil para verificações rápidas
   */
  async existeConfig(): Promise<boolean> {
    const count = await this.prisma.configEmail.count();
    return count > 0;
  }

  /**
   * Testa a conexão com o servidor SMTP
   * Função para testar se as configurações estão corretas
   */
  async testarConexao(configDto?: CreateConfigEmailDto): Promise<{ success: boolean; message: string }> {
    console.log('🧪 [CONFIG-EMAIL] Frontend solicitou teste de conexão SMTP');
    
    try {
      // Se não foi passada configuração, busca a existente
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

      // Descriptografar a senha
      const decryptedSenha = decrypt(config.senha);

      // Configurar o transporte do Nodemailer
      const transporter = nodemailer.createTransport({
        host: config.servidorSMTP,
        port: config.porta,
        secure: config.porta === 465, // true para 465, false para outras portas
        auth: {
          user: config.usuario,
          pass: decryptedSenha,
        },
        tls: {
          rejectUnauthorized: false, // Permitir certificados inválidos (não recomendado em produção)
        },
      });

      // Verificar a conexão com o servidor SMTP
      await transporter.verify();
      
      console.log('✅ [CONFIG-EMAIL] Teste de conexão SMTP realizado com sucesso');
      return { 
        success: true, 
        message: 'Conexão SMTP testada com sucesso' 
      };
    } catch (error) {
      console.error('❌ [CONFIG-EMAIL] Erro ao testar conexão:', error);
      return { 
        success: false, 
        message: `Erro ao testar conexão: ${error.message}` 
      };
    }
  }

  /**
   * Envia um email de teste
   * Função para enviar um email de teste usando a configuração do sistema
   */
  async enviarEmailTeste(emailDestino: string): Promise<{ success: boolean; message: string }> {
    console.log('📧 [CONFIG-EMAIL] Frontend solicitou envio de email de teste');
    
    try {
      // Validar formato do email
      if (!emailDestino || !/\S+@\S+\.\S+/.test(emailDestino)) {
        return {
          success: false,
          message: 'Email de teste inválido.'
        };
      }

      // Busca a configuração existente
      const configExistente = await this.findConfigEmail();
      if (!configExistente) {
        return { 
          success: false, 
          message: 'Nenhuma configuração de email encontrada para envio' 
        };
      }

      // Descriptografar a senha
      const decryptedSenha = decrypt(configExistente.senha);

      // Configurar o transporte do Nodemailer
      const transporter = nodemailer.createTransport({
        host: configExistente.servidorSMTP,
        port: configExistente.porta,
        secure: configExistente.porta === 465, // true para 465, false para outras portas
        auth: {
          user: configExistente.usuario,
          pass: decryptedSenha,
        },
        tls: {
          rejectUnauthorized: false, // Permitir certificados inválidos (não recomendado em produção)
        },
      });

      // Verificar a conexão com o servidor SMTP
      await transporter.verify();

      // Enviar o email de teste
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
    } catch (error) {
      console.error('❌ [CONFIG-EMAIL] Erro ao enviar email de teste:', error);
      return { 
        success: false, 
        message: `Erro ao enviar email: ${error.message}` 
      };
    }
  }
} 