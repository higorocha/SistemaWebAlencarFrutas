import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Agent } from 'https';

/**
 * Configurações hardcoded baseadas no .env fornecido
 * Copiado EXATAMENTE dos valores do arquivo .env
 */
const BB_CONFIG = {
  // URLs das APIs do BB
  API_AUTH_URL: 'https://oauth.bb.com.br/oauth/token',
  API_BASE_URL: 'https://api-pix.bb.com.br/pix/v2/pix',
  
  // Caminhos para certificados (baseado no .env)
  CLIENT_CERT_PATH: 'certs/final.cer',
  CLIENT_KEY_PATH: 'certs/final_key.pem',
  CA_CERT_PATHS: [
    'certs/GeoTrust_EV_RSA_CA_G2.cer',
    'certs/DigiCert_Global_Root_G2.cer', 
    'certs/api-pix.bb.com.br.cer'
  ]
};

/**
 * Cria uma instância do Axios configurada com TLS mútuo.
 * Baseado EXATAMENTE no apiClient(exemplo).js
 */
export function createApiClient(gwAppKey: string) {
  try {
    // Caminho absoluto para os certificados (EXATAMENTE como no exemplo)
    const clientCertPath = path.resolve(process.cwd(), BB_CONFIG.CLIENT_CERT_PATH);
    const clientKeyPath = path.resolve(process.cwd(), BB_CONFIG.CLIENT_KEY_PATH);
    const caCertPaths = BB_CONFIG.CA_CERT_PATHS.map(cert => path.resolve(process.cwd(), cert));

    // Carregar certificados (EXATAMENTE como no exemplo)
    const clientCert = fs.readFileSync(clientCertPath);
    const clientKey = fs.readFileSync(clientKeyPath);
    const caCerts = caCertPaths.map(certPath => fs.readFileSync(certPath));

    // Configurar o agente HTTPS com TLS mútuo (EXATAMENTE como no exemplo)
    const httpsAgent = new Agent({
      cert: clientCert,
      key: clientKey,
      ca: caCerts,
      rejectUnauthorized: true, // Valida os certificados do servidor
    });

    // Criar instância do Axios (EXATAMENTE como no exemplo)
    const apiClient = axios.create({
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'gw-dev-app-key': gwAppKey,
      },
    } as any); // Type assertion para resolver problema de tipagem do httpsAgent

    return apiClient;
  } catch (error) {
    console.error('Erro ao configurar o cliente API do Banco do Brasil:', error.message);
    throw error;
  }
}

/**
 * URLs das APIs do BB (baseado no .env fornecido)
 */
export const BB_API_URLS = {
  PIX_AUTH: BB_CONFIG.API_AUTH_URL,
  PIX_TRANSACTIONS: BB_CONFIG.API_BASE_URL
};