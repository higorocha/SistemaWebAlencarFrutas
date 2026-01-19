import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Agent } from 'https';
import { BBAPIConfig, getBBAPIConfig, getBBAPIConfigByEnvironment } from '../config/bb-api.config';

/**
 * Factory para criar clientes HTTP para APIs do Banco do Brasil
 * 
 * Esta factory centraliza a criação de clientes HTTPS com TLS mútuo,
 * eliminando duplicação de código e facilitando manutenção.
 * 
 * Funcionalidades:
 * - Carregamento automático de certificados
 * - Configuração de TLS mútuo
 * - Criação de clientes para autenticação e API
 * - Tratamento de erros centralizado
 * - Suporte a múltiplas APIs BB
 */

export interface BBAPIClientOptions {
  apiName: keyof typeof import('../config/bb-api.config').BB_APIS_CONFIG;
  appKey: string;
  clientType: 'auth' | 'api';
}

/**
 * Carrega certificados do sistema de arquivos
 */
function loadCertificates(config: BBAPIConfig): {
  clientCert: Buffer;
  clientKey: Buffer;
  caCerts: Buffer[];
} {
  try {
    const clientCertPath = path.resolve(process.cwd(), config.certificates.clientCertPath);
    const clientKeyPath = path.resolve(process.cwd(), config.certificates.clientKeyPath);
    const caCertPaths = config.certificates.caCertPaths.map(cert => 
      path.resolve(process.cwd(), cert)
    );

    console.log(`[BB-API-Factory] Carregando certificados para ${config.name}:`);
    console.log(`[BB-API-Factory] - Client Cert: ${clientCertPath}`);
    console.log(`[BB-API-Factory] - Client Key: ${clientKeyPath}`);
    console.log(`[BB-API-Factory] - CA Certs: ${caCertPaths.length} certificados`);

    const clientCert = fs.readFileSync(clientCertPath);
    const clientKey = fs.readFileSync(clientKeyPath);
    const caCerts = caCertPaths.map(certPath => fs.readFileSync(certPath));

    return { clientCert, clientKey, caCerts };
  } catch (error) {
    console.error(`[BB-API-Factory] Erro ao carregar certificados para ${config.name}:`, error.message);
    throw new Error(`Falha ao carregar certificados para ${config.name}: ${error.message}`);
  }
}

/**
 * Cria um agente HTTPS com TLS mútuo
 */
function createHTTPSAgent(config: BBAPIConfig): Agent {
  const { clientCert, clientKey, caCerts } = loadCertificates(config);

  return new Agent({
    cert: clientCert,
    key: clientKey,
    ca: caCerts,
    rejectUnauthorized: true, // Valida os certificados do servidor
  });
}

/**
 * Cria um cliente Axios para autenticação OAuth2
 */
export function createBBAuthClient(options: BBAPIClientOptions) {
  const config = getBBAPIConfigByEnvironment(options.apiName);
  const httpsAgent = createHTTPSAgent(config);

  console.log(`[BB-API-Factory] Criando cliente de autenticação para ${config.name}`);

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
 * Cria um cliente Axios para chamadas da API
 */
export function createBBAPIClient(options: BBAPIClientOptions) {
  const config = getBBAPIConfigByEnvironment(options.apiName);
  const httpsAgent = createHTTPSAgent(config);

  console.log(`[BB-API-Factory] Criando cliente API para ${config.name}`);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Adiciona o header específico da API
  headers[config.headers.apiKey] = options.appKey;

  return axios.create({
    baseURL: config.baseUrl,
    httpsAgent,
    timeout: config.timeout || 30000,
    headers,
  } as any);
}

/**
 * Factory principal - cria o cliente apropriado baseado no tipo
 */
export function createBBClient(options: BBAPIClientOptions) {
  switch (options.clientType) {
    case 'auth':
      return createBBAuthClient(options);
    case 'api':
      return createBBAPIClient(options);
    default:
      throw new Error(`Tipo de cliente inválido: ${options.clientType}`);
  }
}

/**
 * Utilitário para validar se os certificados existem
 */
export function validateCertificates(apiName: keyof typeof import('../config/bb-api.config').BB_APIS_CONFIG): boolean {
  try {
    const config = getBBAPIConfig(apiName);
    const { certificates } = config;

    // Verifica se todos os arquivos de certificado existem
    const clientCertPath = path.resolve(process.cwd(), certificates.clientCertPath);
    const clientKeyPath = path.resolve(process.cwd(), certificates.clientKeyPath);
    const caCertPaths = certificates.caCertPaths.map(cert => path.resolve(process.cwd(), cert));

    const allPaths = [clientCertPath, clientKeyPath, ...caCertPaths];
    
    for (const certPath of allPaths) {
      if (!fs.existsSync(certPath)) {
        console.error(`[BB-API-Factory] Certificado não encontrado: ${certPath}`);
        return false;
      }
    }

    console.log(`[BB-API-Factory] ✅ Todos os certificados para ${config.name} estão válidos`);
    return true;
  } catch (error) {
    console.error(`[BB-API-Factory] Erro ao validar certificados:`, error.message);
    return false;
  }
}

/**
 * Utilitário para listar informações dos certificados
 */
export function getCertificateInfo(apiName: keyof typeof import('../config/bb-api.config').BB_APIS_CONFIG): {
  apiName: string;
  certificates: {
    clientCert: string;
    clientKey: string;
    caCerts: string[];
  };
  status: 'valid' | 'invalid' | 'error';
} {
  try {
    const config = getBBAPIConfig(apiName);
    const isValid = validateCertificates(apiName);

    return {
      apiName: config.name,
      certificates: {
        clientCert: config.certificates.clientCertPath,
        clientKey: config.certificates.clientKeyPath,
        caCerts: config.certificates.caCertPaths,
      },
      status: isValid ? 'valid' : 'invalid'
    };
  } catch (error) {
    return {
      apiName: apiName as string,
      certificates: {
        clientCert: 'N/A',
        clientKey: 'N/A',
        caCerts: [],
      },
      status: 'error'
    };
  }
}
