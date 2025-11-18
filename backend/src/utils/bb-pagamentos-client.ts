import axios from 'axios';
import { Agent } from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { getBBAPIConfig } from '../config/bb-api.config';

/**
 * Cliente Pagamentos do Banco do Brasil
 * 
 * Usa a factory centralizada para criar clientes HTTP com mTLS
 * e configuração OAuth2 para a API de Pagamentos do BB.
 * 
 * IMPORTANTE: Para API de Pagamentos, o gw-dev-app-key deve ser
 * passado como query param, não como header.
 */

/**
 * Carrega certificados para mTLS
 */
function loadCertificates() {
  const config = getBBAPIConfig('PAGAMENTOS');
  const clientCertPath = path.resolve(process.cwd(), config.certificates.clientCertPath);
  const clientKeyPath = path.resolve(process.cwd(), config.certificates.clientKeyPath);
  const caCertPaths = config.certificates.caCertPaths.map(cert => 
    path.resolve(process.cwd(), cert)
  );

  const clientCert = fs.readFileSync(clientCertPath);
  const clientKey = fs.readFileSync(clientKeyPath);
  const caCerts = caCertPaths.map(certPath => fs.readFileSync(certPath));

  return { clientCert, clientKey, caCerts };
}

/**
 * Cria uma instância do Axios configurada com TLS mútuo para Pagamentos.
 * O gw-dev-app-key será passado como query param nas requisições.
 */
export function createPagamentosApiClient(developerAppKey: string) {
  const config = getBBAPIConfig('PAGAMENTOS');
  const { clientCert, clientKey, caCerts } = loadCertificates();
  
  // Para homologação, pode ser necessário ajustar a validação de certificados
  // Em produção, sempre usar rejectUnauthorized: true
  const isHomologacao = config.baseUrl.includes('homologa-api-ip.bb.com.br') || 
                        config.baseUrl.includes('oauth.hm.bb.com.br');
  
  const httpsAgent = new Agent({
    cert: clientCert,
    key: clientKey,
    ca: caCerts,
    rejectUnauthorized: !isHomologacao, // Temporariamente false para homologação se necessário
  });
  
  if (isHomologacao) {
    console.log('[BB-PAGAMENTOS-CLIENT] ⚠️ Modo homologação: validação de certificado ajustada');
  }

  const client = axios.create({
    baseURL: config.baseUrl,
    httpsAgent,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
    },
    // Transformador customizado para preservar números grandes como strings
    transformResponse: [
      function (data) {
        // Se não for string, já foi parseado (não deveria acontecer, mas por segurança)
        if (typeof data !== 'string') {
          return data;
        }

        try {
          // ANTES do parse: substituir identificadorPagamento na string JSON
          // para preservar números grandes como strings
          // Regex para encontrar "identificadorPagamento": <número>
          const modifiedData = data.replace(
            /"identificadorPagamento"\s*:\s*(\d{15,})/g,
            (match, numberStr) => {
              const num = Number(numberStr);
              // Se for maior que MAX_SAFE_INTEGER, preservar como string
              if (num > Number.MAX_SAFE_INTEGER) {
                return `"identificadorPagamento":"${numberStr}"`;
              }
              return match; // Manter como número se for seguro
            }
          );

          // Agora fazer o parse do JSON modificado
          return JSON.parse(modifiedData);
        } catch (e) {
          console.error('❌ [BB-PAGAMENTOS-CLIENT] Erro ao processar resposta JSON:', e);
          // Se falhar, tentar parse padrão
          return JSON.parse(data);
        }
      },
    ],
  } as any);

  // Interceptor para adicionar gw-dev-app-key como query param em todas as requisições
  client.interceptors.request.use((config) => {
    if (config.params) {
      config.params['gw-dev-app-key'] = developerAppKey;
    } else {
      config.params = { 'gw-dev-app-key': developerAppKey };
    }
    
    // Log para debug: verificar se gw-dev-app-key está sendo enviado
    console.log('🔑 [BB-PAGAMENTOS-CLIENT] Adicionando gw-dev-app-key como query param:', {
      url: config.url,
      baseURL: config.baseURL,
      params: config.params,
      'gw-dev-app-key': developerAppKey ? `${developerAppKey.substring(0, 8)}...` : 'VAZIO',
    });
    
    return config;
  });

  return client;
}

/**
 * Cria uma instância do Axios para autenticação OAuth2 de Pagamentos.
 * IMPORTANTE: O gw-dev-app-key NÃO deve ser enviado no OAuth (apenas Basic Auth).
 * O gw-dev-app-key é usado apenas nas chamadas da API (como query param).
 */
export function createPagamentosAuthClient(developerAppKey: string) {
  const config = getBBAPIConfig('PAGAMENTOS');
  const { clientCert, clientKey, caCerts } = loadCertificates();
  
  // Para homologação, pode ser necessário ajustar a validação de certificados
  // Em produção, sempre usar rejectUnauthorized: true
  const isHomologacao = config.authUrl.includes('oauth.hm.bb.com.br') ||
                        config.baseUrl?.includes('homologa-api-ip.bb.com.br');

  const httpsAgent = new Agent({
    cert: clientCert,
    key: clientKey,
    ca: caCerts,
    rejectUnauthorized: !isHomologacao, // Temporariamente false para homologação se necessário
  });

  const client = axios.create({
    baseURL: config.authUrl,
    httpsAgent,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      // NÃO enviar gw-dev-app-key no OAuth (apenas Basic Auth)
    },
  } as any);

  // Log para debug
  console.log('🔑 [BB-PAGAMENTOS-CLIENT] Criando cliente OAuth (SEM gw-dev-app-key no header):', {
    baseURL: config.authUrl,
  });

  return client;
}

/**
 * URLs das APIs de Pagamentos do BB
 */
export const BB_PAGAMENTOS_API_URLS = {
  // Caminho do endpoint de token OAuth; o host vem de PAGAMENTOS.authUrl (homolog/produção)
  PAGAMENTOS_AUTH: '/oauth/token',
  PAGAMENTOS_BASE: getBBAPIConfig('PAGAMENTOS').baseUrl
};

