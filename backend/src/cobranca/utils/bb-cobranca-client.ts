import { createBBClient } from '../../utils/bb-api-client-factory';

/**
 * Cliente HTTP específico para API de Cobrança do Banco do Brasil
 * 
 * Usa a factory centralizada para criar clientes com TLS mútuo e configurações corretas
 */

/**
 * Cria um cliente Axios para autenticação OAuth2 da API de Cobrança
 * @returns Cliente HTTP configurado para autenticação
 */
export function createCobrancaAuthClient() {
  return createBBClient({
    apiName: 'COBRANCA',
    appKey: '', // Não usado para auth
    clientType: 'auth'
  });
}

/**
 * Cria um cliente Axios para chamadas da API de Cobrança
 * @param gwAppKey Chave de aplicação (gw-dev-app-key) do Banco do Brasil
 * @returns Cliente HTTP configurado para API
 */
export function createCobrancaApiClient(gwAppKey: string) {
  return createBBClient({
    apiName: 'COBRANCA',
    appKey: gwAppKey,
    clientType: 'api'
  });
}
