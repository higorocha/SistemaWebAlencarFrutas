import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import * as path from 'path';
import { NotificacoesService } from '../notificacoes/notificacoes.service';
import { checkCertificateExpiry, validateAllCertificates } from '../utils/certificate-manager';
import { CreateNotificacaoCompletaDto } from '../notificacoes/dto/create-notificacao-completa.dto';
import { TipoNotificacao, PrioridadeNotificacao } from '../notificacoes/dto';
import { getBBAPIConfig } from '../config/bb-api.config';

/**
 * Serviço de Monitoramento Automático de Certificados
 * 
 * Este serviço executa verificações automáticas de vencimento de certificados
 * e envia notificações quando necessário.
 */
@Injectable()
export class CertificateMonitorService {
  private readonly logger = new Logger(CertificateMonitorService.name);

  constructor(private readonly notificacoesService: NotificacoesService) {}

  /**
   * Cron job que executa todos os dias às 6:00 da manhã
   * Verifica vencimentos de certificados e envia notificações
   */
  @Cron('0 6 * * *', {
    name: 'certificate-expiry-check',
    timeZone: 'America/Sao_Paulo',
  })
  async checkCertificateExpiryDaily() {
    this.logger.log('🔍 Iniciando verificação diária de vencimentos de certificados...');
    
    try {
      const expiryCheck = checkCertificateExpiry();
      
      // Verificar certificados vencidos
      if (expiryCheck.hasExpired) {
        await this.notifyExpiredCertificates(expiryCheck.expiredCerts);
      }
      
      // Verificar certificados vencendo em breve
      if (expiryCheck.hasExpiringSoon) {
        await this.notifyExpiringSoonCertificates(expiryCheck.expiringSoonCerts);
      }
      
      // Log de sucesso se não há problemas
      if (!expiryCheck.hasExpired && !expiryCheck.hasExpiringSoon) {
        this.logger.log('✅ Todos os certificados estão válidos e dentro do prazo');
      }
      
    } catch (error) {
      this.logger.error('❌ Erro durante verificação de certificados:', error);
      
      // Notificar erro do sistema
      await this.notificacoesService.criarNotificacaoCompleta({
        titulo: 'Erro no Monitoramento de Certificados',
        conteudo: `Ocorreu um erro durante a verificação automática de certificados: ${error.message}`,
        tipo: TipoNotificacao.SISTEMA,
        
        toast: {
          titulo: '❌ Erro no Monitor',
          conteudo: 'Erro durante verificação automática de certificados',
          tipo: 'error'
        },
        
        menu: {
          titulo: 'Erro no Monitor',
          resumo: 'Erro na verificação automática de certificados',
          icone: 'error'
        },
        
        dadosAdicionais: {
          tipo_erro: 'certificate_monitor_error',
          timestamp: new Date().toISOString(),
          error_message: error.message
        }
      });
    }
  }

  /**
   * Notifica sobre certificados vencidos
   */
  private async notifyExpiredCertificates(expiredCerts: string[]): Promise<void> {
    this.logger.warn(`🚨 ${expiredCerts.length} certificado(s) vencido(s) encontrado(s)`);
    
    const dto: CreateNotificacaoCompletaDto = {
      titulo: 'Certificados BB',
      conteudo: `URGENTE! ${expiredCerts.length} certificado(s) do Banco do Brasil estão VENCIDOS. As APIs PIX, Extratos e Pagamentos podem parar de funcionar a qualquer momento.`,
      tipo: TipoNotificacao.SISTEMA,
      prioridade: PrioridadeNotificacao.ALTA,
      
      toast: {
        titulo: '🚨 Certificados Vencidos',
        conteudo: `${expiredCerts.length} certificado(s) BB estão VENCIDOS. Substitua IMEDIATAMENTE!`,
        tipo: 'error'
      },
      
      menu: {
        titulo: 'Certificados Vencidos',
        resumo: `${expiredCerts.length} certificado(s) BB vencidos - Ação urgente`,
        icone: 'error'
      },
      
      modal: {
        titulo: 'Certificados BB',
        conteudo: `🚨 SITUAÇÃO CRÍTICA! ${expiredCerts.length} certificado(s) do Banco do Brasil estão VENCIDOS.\n\n📋 DETALHES DOS CERTIFICADOS VENCIDOS:\n${expiredCerts.map(cert => `• ${cert}`).join('\n')}\n\n⚠️ IMPACTO NO SISTEMA:\n• APIs PIX podem parar de funcionar a qualquer momento\n• APIs de Extratos podem parar de funcionar a qualquer momento\n• APIs de Pagamentos podem parar de funcionar a qualquer momento\n• Transações financeiras podem ser interrompidas\n• Clientes podem não conseguir realizar pagamentos\n\n🔧 AÇÃO NECESSÁRIA:\n• Substitua os certificados IMEDIATAMENTE\n• Entre em contato com o suporte técnico se necessário\n• Verifique se há certificados de backup disponíveis\n\n📅 Data da verificação: ${new Date().toLocaleString('pt-BR')}`,
        acoes: [
          {
            texto: 'Verificar Certificados',
            tipo: 'primary',
            onClick: 'navigate_to_certificates'
          }
        ]
      },
      
      dadosAdicionais: {
        tipo_alerta: 'certificados_vencidos',
        certificados_vencidos: expiredCerts,
        prioridade: 'ALTA',
        acao_necessaria: 'Substituir certificados imediatamente',
        timestamp: new Date().toISOString()
      }
    };
    
    await this.notificacoesService.criarNotificacaoCompleta(dto);
  }

  /**
   * Notifica sobre certificados vencendo em breve
   */
  private async notifyExpiringSoonCertificates(expiringSoonCerts: string[]): Promise<void> {
    this.logger.warn(`⚠️ ${expiringSoonCerts.length} certificado(s) vencendo em breve`);
    
    const dto: CreateNotificacaoCompletaDto = {
      titulo: 'Certificados BB',
      conteudo: `Atenção! ${expiringSoonCerts.length} certificado(s) do Banco do Brasil vencem em breve. Recomendação: Substitua os certificados nos próximos dias para evitar interrupções nas APIs PIX, Extratos e Pagamentos.`,
      tipo: TipoNotificacao.SISTEMA,
      prioridade: PrioridadeNotificacao.ALTA,
      
      toast: {
        titulo: '⚠️ Certificados Vencendo',
        conteudo: `${expiringSoonCerts.length} certificado(s) BB vencem em breve. Substitua nos próximos dias.`,
        tipo: 'warning'
      },
      
      menu: {
        titulo: 'Certificados Vencendo',
        resumo: `${expiringSoonCerts.length} certificado(s) BB vencem em breve`,
        icone: 'warning'
      },
      
      modal: {
        titulo: 'Certificados BB',
        conteudo: `⚠️ ATENÇÃO! ${expiringSoonCerts.length} certificado(s) do Banco do Brasil vencem em breve (≤30 dias).\n\n📋 DETALHES DOS CERTIFICADOS VENCENDO:\n${expiringSoonCerts.map(cert => `• ${cert}`).join('\n')}\n\n⏰ PRAZO CRÍTICO:\n• Certificados vencem em 30 dias ou menos\n• Após o vencimento, as APIs pararão de funcionar\n• Interrupção pode afetar transações financeiras\n• Clientes podem não conseguir realizar pagamentos\n\n💡 RECOMENDAÇÕES:\n• Substitua os certificados nos próximos dias\n• Agende a substituição com antecedência\n• Verifique se há certificados de backup disponíveis\n• Entre em contato com o suporte técnico se necessário\n\n📅 Data da verificação: ${new Date().toLocaleString('pt-BR')}`,
        acoes: [
          {
            texto: 'Verificar Certificados',
            tipo: 'primary',
            onClick: 'navigate_to_certificates'
          }
        ]
      },
      
      dadosAdicionais: {
        tipo_alerta: 'certificados_vencendo_breve',
        certificados_vencendo_breve: expiringSoonCerts,
        prioridade: 'ALTA',
        acao_necessaria: 'Preparar substituição dos certificados',
        timestamp: new Date().toISOString()
      }
    };
    
    await this.notificacoesService.criarNotificacaoCompleta(dto);
  }

  /**
   * Método para verificação manual (pode ser chamado via API)
   */
  async checkCertificatesManually(): Promise<{
    hasExpired: boolean;
    hasExpiringSoon: boolean;
    expiredCerts: string[];
    expiringSoonCerts: string[];
    certificates?: any;
  }> {
    this.logger.log('🔍 Executando verificação manual de certificados...');
    
    const expiryCheck = checkCertificateExpiry();
    
    if (expiryCheck.hasExpired) {
      this.logger.warn(`🚨 ${expiryCheck.expiredCerts.length} certificado(s) vencido(s)`);
    }
    
    if (expiryCheck.hasExpiringSoon) {
      this.logger.warn(`⚠️ ${expiryCheck.expiringSoonCerts.length} certificado(s) vencendo em breve`);
    }
    
    if (!expiryCheck.hasExpired && !expiryCheck.hasExpiringSoon) {
      this.logger.log('✅ Todos os certificados estão válidos');
    }
    
    // Adicionar informações detalhadas dos certificados
    const detailedCertificates = this.getDetailedCertificateInfo();
    
    return {
      ...expiryCheck,
      certificates: detailedCertificates
    };
  }

  /**
   * Método para simular o cron job (executa exatamente o que o cron faz)
   */
  async simulateCronJob(): Promise<{
    hasExpired: boolean;
    hasExpiringSoon: boolean;
    expiredCerts: string[];
    expiringSoonCerts: string[];
    notificationsSent: number;
  }> {
    this.logger.log('🧪 Simulando execução do cron job de certificados...');
    
    try {
      const expiryCheck = checkCertificateExpiry();
      let notificationsSent = 0;
      
      // Verificar certificados vencidos
      if (expiryCheck.hasExpired) {
        await this.notifyExpiredCertificates(expiryCheck.expiredCerts);
        notificationsSent++;
      }
      
      // Verificar certificados vencendo em breve
      if (expiryCheck.hasExpiringSoon) {
        await this.notifyExpiringSoonCertificates(expiryCheck.expiringSoonCerts);
        notificationsSent++;
      }
      
      // Log de sucesso se não há problemas
      if (!expiryCheck.hasExpired && !expiryCheck.hasExpiringSoon) {
        this.logger.log('✅ Todos os certificados estão válidos e dentro do prazo');
      }
      
      return {
        ...expiryCheck,
        notificationsSent
      };
      
    } catch (error) {
      this.logger.error('❌ Erro durante simulação do cron job:', error);
      
      // Notificar erro do sistema
      await this.notificacoesService.criarNotificacaoCompleta({
        titulo: 'Erro na Simulação do Monitoramento de Certificados',
        conteudo: `Ocorreu um erro durante a simulação do cron job: ${error.message}`,
        tipo: TipoNotificacao.SISTEMA,
        
        toast: {
          titulo: '❌ Erro na Simulação',
          conteudo: 'Erro durante simulação do cron job de certificados',
          tipo: 'error'
        },
        
        menu: {
          titulo: 'Erro na Simulação',
          resumo: 'Erro na simulação do cron job',
          icone: 'error'
        },
        
        dadosAdicionais: {
          tipo_erro: 'certificate_monitor_simulation_error',
          timestamp: new Date().toISOString(),
          error_message: error.message
        }
      });
      
      throw error;
    }
  }

  /**
   * Método para obter status do monitoramento
   */
  getMonitoringStatus(): {
    isActive: boolean;
    nextCheck: string;
    timeZone: string;
  } {
    return {
      isActive: true,
      nextCheck: 'Todos os dias às 06:00 (horário de Brasília)',
      timeZone: 'America/Sao_Paulo'
    };
  }

  /**
   * Obtém informações detalhadas de todos os certificados
   * Agrupa dinamicamente APIs que usam os mesmos certificados baseado na configuração
   * - APIs que usam certificados bestnet (detectado pelo caminho contendo 'bestnet')
   * - APIs que usam certificados alencar (detectado pelo caminho contendo 'alencar')
   * - Certificados CA são compartilhados por todas as APIs
   */
  private getDetailedCertificateInfo(): any {
    const statuses = validateAllCertificates();
    const certificates: any = {};
    
    // Separa status por tipo de certificado de forma dinâmica
    // Agrupa APIs que usam os mesmos certificados baseado na configuração
    const statusBestnet: any[] = [];
    const statusAlencar: any[] = [];
    
    // Agrupa APIs dinamicamente baseado no certificado que cada uma usa
    statuses.forEach(status => {
      try {
        const config = getBBAPIConfig(status.apiName as any);
        // Verifica qual conjunto de certificados a API usa comparando o caminho do certificado
        // Isso permite adicionar novas APIs sem alterar código hardcoded
        if (config.certificates.clientCertPath.includes('bestnet')) {
          statusBestnet.push(status);
        } else if (config.certificates.clientCertPath.includes('alencar')) {
          statusAlencar.push(status);
        }
      } catch (error) {
        // Se não conseguir obter config, ignora (não deve acontecer)
        console.warn(`[Certificate-Monitor] Não foi possível determinar certificado para API ${status.apiName}`);
      }
    });
    
    // ===== CERTIFICADOS BESTNET (PIX e EXTRATOS) =====
    if (statusBestnet.length > 0) {
      const primeiroStatusBestnet = statusBestnet[0];
      const empresaCert = primeiroStatusBestnet?.certificates?.clientCert;
      const empresaKey = primeiroStatusBestnet?.certificates?.clientKey;
      
      // Extrai o nome da empresa
      let empresaNome = 'Empresa';
      if (empresaCert?.subject) {
        empresaNome = empresaCert.subject.commonName || 
                      empresaCert.subject.organization || 
                      'Empresa';
      }
      
      certificates['EMPRESA_BESTNET'] = {
        tipo: 'empresa',
        nome: empresaNome,
        status: empresaCert?.exists && empresaCert?.isValid ? 'valid' : 'invalid',
        certificado: {
          path: empresaCert?.path || '',
          exists: empresaCert?.exists || false,
          size: empresaCert?.size || 0,
          lastModified: empresaCert?.lastModified?.toISOString(),
          subject: empresaCert?.subject,
          expiryInfo: {
            isExpired: empresaCert?.isExpired || false,
            isExpiringSoon: empresaCert?.isExpiringSoon || false,
            expiryDate: empresaCert?.expiryDate?.toISOString(),
            daysUntilExpiry: empresaCert?.daysUntilExpiry
          }
        },
        chavePrivada: {
          path: empresaKey?.path || '',
          exists: empresaKey?.exists || false,
          size: empresaKey?.size || 0,
          lastModified: empresaKey?.lastModified?.toISOString()
        },
        usadoPor: statusBestnet.map(s => s.apiName), // ['PIX', 'EXTRATOS']
        issues: statusBestnet.flatMap(s => s.issues.filter(i => i.includes('Certificado cliente') || i.includes('Chave privada')))
      };
      
      // Certificados CA do BB (compartilhados entre TODAS as APIs: PIX, EXTRATOS, PAGAMENTOS e COBRANCA)
      if (primeiroStatusBestnet && primeiroStatusBestnet.certificates.caCerts.length > 0) {
        // Todos os statuses usam os mesmos CAs, então incluir todas as APIs
        const todasAPIs = statuses.map(s => s.apiName);
        
        certificates['CA_BB'] = {
          tipo: 'ca_bb',
          nome: 'Certificados CA do BB',
          status: primeiroStatusBestnet.overallStatus,
          certificadosCA: primeiroStatusBestnet.certificates.caCerts.map((caCert) => ({
            nome: path.basename(caCert.path),
            path: caCert.path,
            exists: caCert.exists,
            size: caCert.size,
            lastModified: caCert.lastModified?.toISOString(),
            expiryInfo: {
              isExpired: caCert.isExpired || false,
              isExpiringSoon: caCert.isExpiringSoon || false,
              expiryDate: caCert.expiryDate?.toISOString(),
              daysUntilExpiry: caCert.daysUntilExpiry
            }
          })),
          usadoPor: todasAPIs, // ['PIX', 'EXTRATOS', 'PAGAMENTOS', 'COBRANCA']
          issues: primeiroStatusBestnet.issues.filter(i => i.includes('CA'))
        };
      }
    }
    
    // ===== CERTIFICADOS ALENCAR (PAGAMENTOS e COBRANCA) =====
    if (statusAlencar.length > 0) {
      const primeiroStatusAlencar = statusAlencar[0];
      const pagamentosCert = primeiroStatusAlencar?.certificates?.clientCert;
      const pagamentosKey = primeiroStatusAlencar?.certificates?.clientKey;
      
      // Extrai o nome da empresa
      let empresaNome = 'Empresa';
      if (pagamentosCert?.subject) {
        empresaNome = pagamentosCert.subject.commonName || 
                      pagamentosCert.subject.organization || 
                      'Empresa';
      }
      
      // Mapeia as APIs que usam certificados Alencar baseado nos statuses validados
      const apisUsandoCertificadosAlencar = statusAlencar.map(s => s.apiName);
      
      certificates['EMPRESA_ALENCAR'] = {
        tipo: 'empresa',
        nome: empresaNome,
        status: pagamentosCert?.exists && pagamentosCert?.isValid ? 'valid' : 'invalid',
        certificado: {
          path: pagamentosCert?.path || '',
          exists: pagamentosCert?.exists || false,
          size: pagamentosCert?.size || 0,
          lastModified: pagamentosCert?.lastModified?.toISOString(),
          subject: pagamentosCert?.subject,
          expiryInfo: {
            isExpired: pagamentosCert?.isExpired || false,
            isExpiringSoon: pagamentosCert?.isExpiringSoon || false,
            expiryDate: pagamentosCert?.expiryDate?.toISOString(),
            daysUntilExpiry: pagamentosCert?.daysUntilExpiry
          }
        },
        chavePrivada: {
          path: pagamentosKey?.path || '',
          exists: pagamentosKey?.exists || false,
          size: pagamentosKey?.size || 0,
          lastModified: pagamentosKey?.lastModified?.toISOString()
        },
        usadoPor: apisUsandoCertificadosAlencar, // ['PAGAMENTOS', 'COBRANCA']
        issues: statusAlencar.flatMap(s => s.issues.filter(i => i.includes('Certificado cliente') || i.includes('Chave privada')))
      };
    }
    
    return certificates;
  }
}
