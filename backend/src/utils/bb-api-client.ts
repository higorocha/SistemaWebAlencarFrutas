import { createBBClient } from './bb-api-client-factory';
import { getBBAPIConfig } from '../config/bb-api.config';

/**
 * Cliente PIX do Banco do Brasil - REFATORADO
 * 
 * Agora usa a factory centralizada para eliminar duplicação de código
 * e facilitar manutenção de certificados.
 */

/**
 * Cria uma instância do Axios configurada com TLS mútuo para PIX.
 * REFATORADO: Agora usa a factory centralizada
 */
export function createApiClient(gwAppKey: string) {
  return createBBClient({
    apiName: 'PIX',
    appKey: gwAppKey,
    clientType: 'api'
  });
}

/**
 * URLs das APIs do BB - REFATORADO
 * Agora vem da configuração centralizada
 */
export const BB_API_URLS = {
  PIX_AUTH: getBBAPIConfig('PIX').authUrl,
  PIX_TRANSACTIONS: getBBAPIConfig('PIX').baseUrl
};