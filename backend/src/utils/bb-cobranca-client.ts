/**
 * Cliente Cobrança do Banco do Brasil
 * 
 * Este arquivo será implementado após a análise da documentação oficial do BB.
 * 
 * Planejado:
 * - Integração com bb-api-client-factory.ts
 * - Cliente HTTP com mTLS
 * - Cliente OAuth2
 * - URLs dos endpoints da API de cobrança
 * - Tratamento de erros específicos
 */

/**
 * Cria uma instância do Axios configurada com TLS mútuo para cobrança.
 * REFATORADO: Agora usa a factory centralizada
 */
export function createCobrancaApiClient(developerAppKey: string) {
  // TODO: Implementar após análise da documentação
  throw new Error('Não implementado ainda - aguardando documentação oficial do BB');
}

/**
 * Cria uma instância do Axios para autenticação OAuth2 de cobrança.
 * REFATORADO: Agora usa a factory centralizada
 */
export function createCobrancaAuthClient() {
  // TODO: Implementar após análise da documentação
  throw new Error('Não implementado ainda - aguardando documentação oficial do BB');
}

/**
 * URLs das APIs de cobrança do BB - REFATORADO
 * Agora vem da configuração centralizada
 */
export const BB_COBRANCA_API_URLS = {
  // TODO: Definir após análise da documentação
};
