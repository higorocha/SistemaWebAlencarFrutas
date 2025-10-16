/**
 * Configuração centralizada para todas as APIs do Banco do Brasil
 * 
 * Esta configuração centraliza todas as URLs, certificados e configurações
 * das APIs do BB, facilitando manutenção e troca de certificados.
 * 
 * Para trocar certificados:
 * 1. Substitua os arquivos na pasta certs/
 * 2. Atualize os nomes dos arquivos abaixo se necessário
 * 3. Reinicie a aplicação
 */

export interface BBCertificateConfig {
  clientCertPath: string;
  clientKeyPath: string;
  caCertPaths: string[];
}

export interface BBAPIConfig {
  name: string;
  authUrl: string;
  baseUrl: string;
  certificates: BBCertificateConfig;
  headers: {
    authKey: string;
    apiKey: string;
  };
  timeout?: number;
}

/**
 * Configuração centralizada de certificados
 * TODOS os serviços BB usam os mesmos certificados
 */
const BB_CERTIFICATES: BBCertificateConfig = {
  clientCertPath: 'certs/final.cer',
  clientKeyPath: 'certs/final_key.pem',
  caCertPaths: [
    'certs/GeoTrust_EV_RSA_CA_G2.cer',
    'certs/DigiCert_Global_Root_G2.cer',
    'certs/api-pix.bb.com.br.cer'
  ]
};

/**
 * Configurações de todas as APIs do Banco do Brasil
 * 
 * Para adicionar uma nova API:
 * 1. Adicione uma nova entrada aqui
 * 2. Crie o cliente específico em utils/
 * 3. Use o BBAPIClientFactory para criar instâncias
 */
export const BB_APIS_CONFIG: Record<string, BBAPIConfig> = {
  PIX: {
    name: 'PIX',
    authUrl: 'https://oauth.bb.com.br/oauth/token',
    baseUrl: 'https://api-pix.bb.com.br/pix/v2/pix',
    certificates: BB_CERTIFICATES,
    headers: {
      authKey: 'Content-Type',
      apiKey: 'gw-dev-app-key'
    },
    timeout: 30000
  },
  
  EXTRATOS: {
    name: 'EXTRATOS',
    authUrl: 'https://oauth.bb.com.br/oauth/token',
    baseUrl: 'https://api-extratos.bb.com.br/extratos/v1',
    certificates: BB_CERTIFICATES,
    headers: {
      authKey: 'Content-Type',
      apiKey: 'X-Developer-Application-Key'
    },
    timeout: 30000
  }
  
  // Futuras APIs podem ser adicionadas aqui:
  // COBRANCA: { ... },
  // TRANSFERENCIAS: { ... },
  // etc.
};

/**
 * Configurações de ambiente
 * 
 * Para diferentes ambientes (dev, staging, prod):
 * 1. Crie BB_APIS_CONFIG_DEV, BB_APIS_CONFIG_PROD
 * 2. Use process.env.NODE_ENV para escolher
 * 3. Ou crie um sistema de configuração mais robusto
 */
export const getBBAPIConfig = (apiName: keyof typeof BB_APIS_CONFIG): BBAPIConfig => {
  const config = BB_APIS_CONFIG[apiName];
  if (!config) {
    throw new Error(`Configuração não encontrada para a API: ${apiName}`);
  }
  return config;
};

/**
 * Lista todas as APIs configuradas
 */
export const getAvailableBBAPIs = (): string[] => {
  return Object.keys(BB_APIS_CONFIG);
};

/**
 * Valida se uma API está configurada
 */
export const isBBAPIConfigured = (apiName: string): boolean => {
  return apiName in BB_APIS_CONFIG;
};
