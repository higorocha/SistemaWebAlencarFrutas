// utils/apiClient.js

const axios = require('axios');
const fs = require('fs');
const https = require('https');
const path = require('path');
require('dotenv').config();

/**
 * Cria uma instância do Axios configurada com TLS mútuo.
 */
const createApiClient = (gwAppKey = process.env.BB_GW_APP_KEY) => {
  try {
    // Caminho absoluto para os certificados
    const clientCertPath = path.resolve(__dirname, '..', process.env.BB_CLIENT_CERT_PATH);
    const clientKeyPath = path.resolve(__dirname, '..', process.env.BB_CLIENT_KEY_PATH);
    const caCertPaths = process.env.BB_CA_CERT_PATHS.split(',').map(cert => path.resolve(__dirname, '..', cert.trim()));

    // Carregar certificados
    const clientCert = fs.readFileSync(clientCertPath);
    const clientKey = fs.readFileSync(clientKeyPath);
    const caCerts = caCertPaths.map(certPath => fs.readFileSync(certPath));

    // Configurar o agente HTTPS com TLS mútuo
    const httpsAgent = new https.Agent({
      cert: clientCert,
      key: clientKey,
      ca: caCerts,
      rejectUnauthorized: true, // Valida os certificados do servidor
    });

    // Criar instância do Axios
    const apiClient = axios.create({
      httpsAgent,
      headers: {
        'Content-Type': 'application/json',
        'gw-dev-app-key': gwAppKey,
      },
    });

    return apiClient;
  } catch (error) {
    console.error('Erro ao configurar o cliente API do Banco do Brasil:', error.message);
    throw error;
  }
};

module.exports = createApiClient;
