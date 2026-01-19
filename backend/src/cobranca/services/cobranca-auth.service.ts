import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { createCobrancaAuthClient } from '../utils/bb-cobranca-client';
import { getBBAPIConfigByEnvironment } from '../../config/bb-api.config';

/**
 * Service para autenticação OAuth2 na API de Cobrança do Banco do Brasil
 * 
 * Funcionalidades:
 * - Cache de token em memória por conta corrente
 * - Renovação automática quando expirado
 * - Suporte a múltiplas credenciais (por conta corrente)
 * - Tratamento de erros de autenticação
 */
@Injectable()
export class CobrancaAuthService {
  // Cache de token em memória por conta corrente (chave: contaCorrenteId)
  private cachedTokens: Map<number, { token: string; expiry: Date }> = new Map();

  constructor(private prisma: PrismaService) {}

  /**
   * Obtém token de acesso OAuth2 com cache
   * Cada conta corrente tem seu próprio token cacheado
   * @param contaCorrenteId ID da conta corrente
   * @returns Token de acesso válido
   */
  async obterTokenDeAcesso(contaCorrenteId: number): Promise<string> {
    // Verifica se o token está em cache para esta conta e ainda é válido
    const cached = this.cachedTokens.get(contaCorrenteId);
    if (cached && cached.expiry && new Date() < cached.expiry) {
      console.log(`✅ [COBRANCA-AUTH] Token em cache válido para conta ${contaCorrenteId}`);
      return cached.token;
    }

    try {
      console.log(`🔑 [COBRANCA-AUTH] Obtendo novo token para conta ${contaCorrenteId}`);

      // Buscar credenciais de COBRANÇA para a conta
      const credenciais = await this.prisma.credenciaisAPI.findFirst({
        where: {
          banco: '001', // Código BB
          contaCorrenteId: contaCorrenteId,
          modalidadeApi: '001 - Cobrança'
        },
        include: {
          contaCorrente: true
        }
      });

      if (!credenciais) {
        // Buscar conta corrente para formatar mensagem de erro
        const contaCorrente = await this.prisma.contaCorrente.findUnique({
          where: { id: contaCorrenteId }
        });
        const contaInfo = contaCorrente 
          ? `${contaCorrente.agencia}/${contaCorrente.contaCorrente}`
          : contaCorrenteId.toString();
        throw new NotFoundException(
          `Credenciais de API de Cobrança não encontradas para a conta ${contaInfo}`
        );
      }

      if (!credenciais.developerAppKey || !credenciais.clienteId || !credenciais.clienteSecret) {
        const contaInfo = credenciais.contaCorrente 
          ? `${credenciais.contaCorrente.agencia}/${credenciais.contaCorrente.contaCorrente}`
          : contaCorrenteId.toString();
        throw new NotFoundException(
          `Credenciais de API de Cobrança incompletas para a conta ${contaInfo}`
        );
      }

      // Obter configuração baseada no ambiente
      const config = getBBAPIConfigByEnvironment('COBRANCA');
      
      // Log detalhado das informações de autenticação
      console.log(`📋 [COBRANCA-AUTH] Configurações de autenticação:`);
      console.log(`   - Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`   - Auth URL: ${config.authUrl}`);
      console.log(`   - Base URL: ${config.baseUrl}`);
      console.log(`   - Conta Corrente: ${credenciais.contaCorrente.agencia}/${credenciais.contaCorrente.contaCorrente}`);
      console.log(`   - Developer App Key: ${credenciais.developerAppKey.substring(0, 8)}...${credenciais.developerAppKey.substring(credenciais.developerAppKey.length - 4)} (${credenciais.developerAppKey.length} caracteres)`);
      console.log(`   - Cliente ID: ${credenciais.clienteId.substring(0, 8)}...${credenciais.clienteId.substring(credenciais.clienteId.length - 4)} (${credenciais.clienteId.length} caracteres)`);
      console.log(`   - Cliente Secret: ${credenciais.clienteSecret.substring(0, 4)}...${credenciais.clienteSecret.substring(credenciais.clienteSecret.length - 4)} (${credenciais.clienteSecret.length} caracteres)`);
      console.log(`   - Scope: cobrancas.boletos-requisicao cobrancas.boletos-info`);
      console.log(`   - Grant Type: client_credentials`);

      // Criar cliente HTTP para autenticação
      const authClient = createCobrancaAuthClient();

      // Fazer requisição de autenticação OAuth2
      // O authClient já tem baseURL configurado com a URL completa (https://oauth.bb.com.br/oauth/token ou https://oauth.hm.bb.com.br/oauth/token)
      // Usar path vazio para usar apenas o baseURL
      console.log(`🌐 [COBRANCA-AUTH] Enviando requisição de autenticação para: ${config.authUrl}`);
      
      const response = await authClient.post(
        '',
        new URLSearchParams({
          grant_type: 'client_credentials',
          scope: 'cobrancas.boletos-requisicao cobrancas.boletos-info'
        }).toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          auth: {
            username: credenciais.clienteId,
            password: credenciais.clienteSecret,
          },
        }
      );

      // Cachear o token para esta conta específica
      const accessToken = (response.data as any).access_token;
      const expiresIn = (response.data as any).expires_in || 3600; // segundos
      const expiry = new Date(new Date().getTime() + (expiresIn - 60) * 1000); // 60 segundos antes

      this.cachedTokens.set(contaCorrenteId, { token: accessToken, expiry });

      console.log(`✅ [COBRANCA-AUTH] Token obtido com sucesso para conta ${contaCorrenteId}`);
      return accessToken;

    } catch (error) {
      console.error(`❌ [COBRANCA-AUTH] Erro ao obter token para conta ${contaCorrenteId}:`, error.response?.data || error.message);

      if (error instanceof NotFoundException) {
        throw error;
      }

      if (error.response?.data) {
        throw new InternalServerErrorException(
          `Erro na autenticação BB: ${error.response.data.error_description || error.response.data.error || 'Erro desconhecido'}`
        );
      }

      throw new InternalServerErrorException('Erro ao obter token de acesso da API de Cobrança do Banco do Brasil');
    }
  }

  /**
   * Força a renovação do token (ignora cache)
   * @param contaCorrenteId ID da conta corrente
   * @returns Novo token de acesso
   */
  async forcarRenovacaoToken(contaCorrenteId: number): Promise<string> {
    // Remover token do cache para forçar renovação
    this.cachedTokens.delete(contaCorrenteId);
    return this.obterTokenDeAcesso(contaCorrenteId);
  }

  /**
   * Limpa o cache de tokens (útil para testes ou quando credenciais mudam)
   */
  limparCache(): void {
    this.cachedTokens.clear();
    console.log('🧹 [COBRANCA-AUTH] Cache de tokens limpo');
  }
}
