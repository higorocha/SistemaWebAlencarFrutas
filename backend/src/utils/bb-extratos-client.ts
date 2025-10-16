import { createBBClient } from './bb-api-client-factory';
import { getBBAPIConfig } from '../config/bb-api.config';

/**
 * Cliente Extratos do Banco do Brasil - REFATORADO
 * 
 * Agora usa a factory centralizada para eliminar duplicação de código
 * e facilitar manutenção de certificados.
 */

/**
 * Cria uma instância do Axios configurada com TLS mútuo para extratos.
 * REFATORADO: Agora usa a factory centralizada
 */
export function createExtratosApiClient(developerAppKey: string) {
  return createBBClient({
    apiName: 'EXTRATOS',
    appKey: developerAppKey,
    clientType: 'api'
  });
}

/**
 * Cria uma instância do Axios para autenticação OAuth2 de extratos.
 * REFATORADO: Agora usa a factory centralizada
 */
export function createExtratosAuthClient() {
  return createBBClient({
    apiName: 'EXTRATOS',
    appKey: '', // Não precisa para auth
    clientType: 'auth'
  });
}

/**
 * URLs das APIs de extratos do BB - REFATORADO
 * Agora vem da configuração centralizada
 */
export const BB_EXTRATOS_API_URLS = {
  EXTRATOS_AUTH: getBBAPIConfig('EXTRATOS').authUrl,
  EXTRATOS_BASE: getBBAPIConfig('EXTRATOS').baseUrl
};
