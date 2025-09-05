import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { 
  CreateConfigWhatsAppDto, 
  UpdateConfigWhatsAppDto,
  ConfigWhatsAppResponseDto 
} from '../config/dto/config-whatsapp.dto';
import { ConfigWhatsApp, Prisma } from '@prisma/client';
import axios from 'axios';
import { formatarNumeroTelefone, exibirNumeroFormatado } from '../utils/whatsapp.util';

@Injectable()
export class ConfigWhatsAppService {
  constructor(private prisma: PrismaService) {}

  /**
   * Converte dados do Prisma para DTO de resposta
   */
  private convertToResponseDto(config: ConfigWhatsApp): ConfigWhatsAppResponseDto {
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
        config.configuracoesAdicionais as Record<string, any> : undefined,
    };
  }

  /**
   * Converte dados do DTO para entrada do Prisma
   */
  private convertToPrismaInput(configDto: CreateConfigWhatsAppDto | UpdateConfigWhatsAppDto): Prisma.ConfigWhatsAppCreateInput {
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
        configDto.configuracoesAdicionais as Prisma.InputJsonValue : 
        Prisma.JsonNull,
    };
  }

  /**
   * Busca a configuração de WhatsApp (único registro)
   * Retorna null se não existir
   */
  async findConfigWhatsApp(): Promise<ConfigWhatsAppResponseDto | null> {
    console.log('📱 [CONFIG-WHATSAPP] Frontend solicitou busca da configuração de WhatsApp');
    
    const config = await this.prisma.configWhatsApp.findFirst({
      orderBy: {
        updatedAt: 'desc', // Pega o mais recente (caso existam múltiplos por erro)
      },
    });

    if (config) {
      console.log('✅ [CONFIG-WHATSAPP] Configuração encontrada e retornada para o frontend');
      return this.convertToResponseDto(config);
    } else {
      console.log('📝 [CONFIG-WHATSAPP] Nenhuma configuração encontrada - retornando null');
      return null;
    }
  }

  /**
   * Cria ou atualiza a configuração de WhatsApp (upsert)
   * Como é um registro único, sempre sobrescreve o existente
   */
  async upsertConfigWhatsApp(configDto: CreateConfigWhatsAppDto | UpdateConfigWhatsAppDto): Promise<ConfigWhatsAppResponseDto> {
    console.log('💾 [CONFIG-WHATSAPP] Frontend solicitou salvamento de configuração de WhatsApp');
    
    try {
      // Busca se já existe uma configuração
      const configExistente = await this.prisma.configWhatsApp.findFirst();

      let configSalva: ConfigWhatsApp;
      const dadosPrisma = this.convertToPrismaInput(configDto);

      if (configExistente) {
        // Atualiza a configuração existente
        console.log('🔄 [CONFIG-WHATSAPP] Atualizando configuração existente');
        
        configSalva = await this.prisma.configWhatsApp.update({
          where: { id: configExistente.id },
          data: dadosPrisma,
        });
      } else {
        // Cria nova configuração
        console.log('➕ [CONFIG-WHATSAPP] Criando nova configuração');
        
        configSalva = await this.prisma.configWhatsApp.create({
          data: dadosPrisma,
        });
      }
      
      console.log('✅ [CONFIG-WHATSAPP] Configuração salva com sucesso e retornada para o frontend');
      return this.convertToResponseDto(configSalva);
    } catch (error) {
      console.error('❌ [CONFIG-WHATSAPP] Erro ao salvar configuração:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw error;
    }
  }

  /**
   * Remove a configuração de WhatsApp
   * Útil para testes ou reset completo
   */
  async deleteConfigWhatsApp(): Promise<{ message: string }> {
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
    } catch (error) {
      console.error('❌ [CONFIG-WHATSAPP] Erro ao remover configuração:', error);
      throw error;
    }
  }

  /**
   * Verifica se existe uma configuração cadastrada
   * Útil para verificações rápidas
   */
  async existeConfig(): Promise<boolean> {
    const count = await this.prisma.configWhatsApp.count();
    return count > 0;
  }

  /**
   * Testa a conexão com a API do WhatsApp
   * Função para testar se as configurações estão corretas
   */
  async testarConexao(configDto?: CreateConfigWhatsAppDto): Promise<{ success: boolean; message: string }> {
    console.log('🧪 [CONFIG-WHATSAPP] Frontend solicitou teste de conexão com API WhatsApp');
    
    try {
      // Se não foi passada configuração, busca a existente
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

      // Testa a conexão fazendo uma requisição simples à API
      try {
        const response = await axios.get(
          `https://graph.facebook.com/v17.0/${config.phoneNumberId}`,
          {
            headers: {
              'Authorization': `Bearer ${config.accessToken}`,
            }
          }
        );
        
        console.log('✅ [CONFIG-WHATSAPP] Teste de conexão realizado com sucesso');
        return { 
          success: true, 
          message: `Conexão com API WhatsApp testada com sucesso (Phone ID: ${config.phoneNumberId})` 
        };
      } catch (apiError: any) {
        console.error('❌ [CONFIG-WHATSAPP] Erro na API:', apiError.response?.data || apiError.message);
        
        const errorData = apiError.response?.data?.error;
        let errorMessage = 'Erro ao conectar com a API do WhatsApp';
        
        if (errorData) {
          if (errorData.code === 190) {
            errorMessage = 'Token de acesso inválido ou expirado';
          } else if (errorData.code === 100) {
            errorMessage = 'Phone Number ID inválido ou não encontrado';
          } else {
            errorMessage = `Erro da API: ${errorData.message}`;
          }
        }
        
        return {
          success: false,
          message: errorMessage
        };
      }
    } catch (error) {
      console.error('❌ [CONFIG-WHATSAPP] Erro ao testar conexão:', error);
      return { 
        success: false, 
        message: `Erro ao testar conexão: ${error.message}` 
      };
    }
  }

  /**
   * Envia uma mensagem de teste
   * Função para enviar uma mensagem de teste usando a configuração
   */
  async enviarMensagemTeste(
    numeroDestino: string, 
    mensagem: string,
    configDto?: CreateConfigWhatsAppDto
  ): Promise<{ success: boolean; message: string }> {
    console.log('📱 [CONFIG-WHATSAPP] Frontend solicitou envio de mensagem de teste via WhatsApp');
    
    try {
      // Validar o número de telefone
      if (!numeroDestino) {
        return {
          success: false,
          message: 'Telefone para teste é obrigatório'
        };
      }

      // Se não foi passada configuração, busca a existente
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

      // Formatação do número de telefone
      const numeroFormatado = formatarNumeroTelefone(numeroDestino);
      
      try {
        // Preparar payload da mensagem
        const payload = {
          messaging_product: "whatsapp",
          recipient_type: "individual",
          to: numeroFormatado,
          type: "text",
          text: { body: mensagem }
        };
        
        // Envio de mensagem via API do WhatsApp
        const response = await axios.post(
          `https://graph.facebook.com/v17.0/${config.phoneNumberId}/messages`, 
          payload,
          {
            headers: {
              'Authorization': `Bearer ${config.accessToken}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        // Se a requisição foi bem-sucedida, retornamos sucesso com os detalhes
        console.log('✅ [CONFIG-WHATSAPP] Mensagem de teste enviada com sucesso');
        return { 
          success: true, 
          message: `Mensagem de teste enviada com sucesso para ${exibirNumeroFormatado(numeroFormatado)}. Verifique se a mensagem chegou no WhatsApp.`,
        };
      } catch (apiError: any) {
        // Tratamento específico de erros da API do WhatsApp
        console.error('❌ [CONFIG-WHATSAPP] Erro na API do WhatsApp:', apiError.response?.data || apiError.message);
        
        // Identifica o tipo de erro
        const errorData = apiError.response?.data?.error;
        let errorMessage = 'Erro ao enviar mensagem via WhatsApp';
        
        if (errorData) {
          if (errorData.code === 100) {
            errorMessage = 'Número não verificado para testes. Adicione-o na plataforma do Meta Business para testes.';
          } else if (errorData.code === 131047) {
            errorMessage = 'Você deve usar um template para iniciar uma conversa. Configure um template na plataforma do Meta.';
          } else if (errorData.code === 190) {
            errorMessage = 'Token de acesso expirado ou inválido. Verifique suas credenciais.';
          } else if (errorData.code === 131008) {
            errorMessage = 'Número de telefone inválido ou não encontrado.';
          } else if (errorData.code === 131009) {
            errorMessage = 'Número não está registrado no WhatsApp.';
          } else {
            errorMessage = `Erro da API: ${errorData.message} (Código: ${errorData.code})`;
          }
        } else if (apiError.response?.status === 401) {
          errorMessage = 'Token de acesso inválido ou expirado. Verifique suas credenciais.';
        } else if (apiError.response?.status === 403) {
          errorMessage = 'Acesso negado. Verifique as permissões da sua aplicação.';
        } else if (apiError.response?.status === 404) {
          errorMessage = 'Phone Number ID não encontrado. Verifique se o ID está correto.';
        }
        
        return {
          success: false,
          message: errorMessage,
        };
      }
    } catch (error) {
      console.error('❌ [CONFIG-WHATSAPP] Erro ao enviar mensagem de teste:', error);
      return { 
        success: false, 
        message: `Erro ao enviar mensagem: ${error.message}` 
      };
    }
  }
} 