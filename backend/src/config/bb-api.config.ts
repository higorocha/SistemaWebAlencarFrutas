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
 * PIX e EXTRATOS usam certificados bestnet
 * PAGAMENTOS e COBRANCA usam certificados alencar
 */
const BB_CERTIFICATES_BESTNET: BBCertificateConfig = {
  clientCertPath: 'certs/bestnet_final.cer',
  clientKeyPath: 'certs/bestnet_final_key.pem',
  caCertPaths: [
    'certs/GeoTrust_EV_RSA_CA_G2.cer',
    'certs/DigiCert_Global_Root_G2.cer',
    'certs/api-pix_bb_com_br.crt'
  ]
};

const BB_CERTIFICATES_ALENCAR: BBCertificateConfig = {
  clientCertPath: 'certs/alencar_final.cer',
  clientKeyPath: 'certs/alencar_final_key.pem',
  caCertPaths: [
    'certs/GeoTrust_EV_RSA_CA_G2.cer',
    'certs/DigiCert_Global_Root_G2.cer',
    'certs/api-pix_bb_com_br.crt'
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
    certificates: BB_CERTIFICATES_BESTNET,
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
    certificates: BB_CERTIFICATES_BESTNET,
    headers: {
      authKey: 'Content-Type',
      apiKey: 'X-Developer-Application-Key'
    },
    timeout: 30000
  },
  
  PAGAMENTOS: {
    name: 'PAGAMENTOS',
    // Produção: endpoints de OAuth e API de produção
    authUrl: 'https://oauth.bb.com.br',
    baseUrl: 'https://api-ip.bb.com.br/pagamentos-lote/v1',
    certificates: BB_CERTIFICATES_ALENCAR,
    headers: {
      authKey: 'Content-Type',
      apiKey: 'gw-dev-app-key' // Usado como query param, não header
    },
    timeout: 30000
  },

  COBRANCA: {
    name: 'COBRANCA',
    // Convênio Alencar Frutas: Tipo 3 (Banco numera, cliente emite e expede)
    // Modalidade: Simples
    // Espécie: Boleto de Cobrança
    authUrl: 'https://oauth.bb.com.br/oauth/token',        // Produção
    baseUrl: 'https://api.bb.com.br/cobrancas/v2',        // Produção
    certificates: BB_CERTIFICATES_ALENCAR, // Usará certificados alencar (mesmo que pagamentos)
    headers: {
      authKey: 'Content-Type',
      apiKey: 'gw-dev-app-key'  // Query param (não header)
    },
    timeout: 30000
  }

  // Futuras APIs podem ser adicionadas aqui:
  // TRANSFERENCIAS: { ... },
  // etc.
};

/**
 * Configurações de ambiente
 * 
 * Retorna configuração baseada no NODE_ENV:
 * - production: endpoints de produção
 * - development ou não definido: endpoints de homologação
 */
export const getBBAPIConfigByEnvironment = (
  apiName: keyof typeof BB_APIS_CONFIG
): BBAPIConfig => {
  const config = getBBAPIConfig(apiName);
  const isProduction = process.env.NODE_ENV === 'production';

  // Para homologação/produção, usar URLs diferentes (apenas para APIs que possuem separação)
  if (apiName === 'COBRANCA' && !isProduction) {
    // Homologação COBRANCA
    return {
      ...config,
      authUrl: 'https://oauth.hm.bb.com.br/oauth/token',
      baseUrl: 'https://api.hm.bb.com.br/cobrancas/v2',
    };
  }

  return config;
};

/**
 * Valida se estamos em ambiente de produção
 */
export const isProduction = (): boolean => {
  return process.env.NODE_ENV === 'production';
};
export const getBBAPIConfig = (apiName: keyof typeof BB_APIS_CONFIG): BBAPIConfig => {
  const config = BB_APIS_CONFIG[apiName];
  if (!config) {
    throw new Error(`Configuração não encontrada para a API: ${apiName}`);
  }

  // Retorna configuração baseada no ambiente (NODE_ENV)
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
