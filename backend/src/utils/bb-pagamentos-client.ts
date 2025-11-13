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
  const isHomologacao = config.baseUrl.includes('homologa-api-ip.bb.com.br');
  
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
  } as any);

  // Interceptor para adicionar gw-dev-app-key como query param em todas as requisições
  client.interceptors.request.use((config) => {
    if (config.params) {
      config.params['gw-dev-app-key'] = developerAppKey;
    } else {
      config.params = { 'gw-dev-app-key': developerAppKey };
    }
    return config;
  });

  return client;
}

/**
 * Cria uma instância do Axios para autenticação OAuth2 de Pagamentos.
 */
export function createPagamentosAuthClient() {
  const config = getBBAPIConfig('PAGAMENTOS');
  const { clientCert, clientKey, caCerts } = loadCertificates();
  
  // Para homologação, pode ser necessário ajustar a validação de certificados
  const isHomologacao = config.authUrl.includes('oauth.hm.bb.com.br');
  
  const httpsAgent = new Agent({
    cert: clientCert,
    key: clientKey,
    ca: caCerts,
    rejectUnauthorized: !isHomologacao, // Temporariamente false para homologação se necessário
  });

  return axios.create({
    baseURL: config.authUrl,
    httpsAgent,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  } as any);
}

/**
 * URLs das APIs de Pagamentos do BB
 */
export const BB_PAGAMENTOS_API_URLS = {
  PAGAMENTOS_AUTH: getBBAPIConfig('PAGAMENTOS').authUrl,
  PAGAMENTOS_BASE: getBBAPIConfig('PAGAMENTOS').baseUrl
};

