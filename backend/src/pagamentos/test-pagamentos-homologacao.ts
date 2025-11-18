/**
 * Script de teste HARDCODED para API de Pagamentos do Banco do Brasil - HOMOLOGAÇÃO
 * 
 * ⚠️ ATENÇÃO: Este script é APENAS para testes de homologação.
 * As credenciais estão hardcoded no código e devem ser usadas APENAS para testes.
 * 
 * Este script testa a conexão com a API de Pagamentos usando endpoints de HOMOLOGAÇÃO.
 * Testa os três tipos principais de pagamento:
 * 1. Transferências PIX
 * 2. Pagamento de Boletos
 * 3. Pagamento de Guias com Código de Barras
 * 
 * Para executar: npx ts-node src/pagamentos/test-pagamentos-homologacao.ts
 * 
 * IMPORTANTE: 
 * - Este script usa endpoints de HOMOLOGAÇÃO (oauth.hm.bb.com.br e homologa-api-ip.bb.com.br)
 * - As credenciais devem ser substituídas pelas credenciais reais de homologação
 * - Este script NÃO afeta o sistema principal (usa configuração isolada)
 */

import axios from 'axios';
import { Agent } from 'https';
import * as fs from 'fs';
import * as path from 'path';

/**
 * ⚠️ CREDENCIAIS DE HOMOLOGAÇÃO - SUBSTITUIR COM AS CREDENCIAIS REAIS
 * 
 * Estas credenciais devem ser obtidas no portal de desenvolvedores do BB para homologação.
 */
const CREDENCIAIS_HOMOLOGACAO = {
  clienteId: 'SEU_CLIENT_ID_HOMOLOGACAO',
  clienteSecret: 'SEU_CLIENT_SECRET_HOMOLOGACAO',
  developerAppKey: 'SUA_APP_KEY_HOMOLOGACAO',
};

/**
 * Dados de teste para conta pagadora (homologação BB)
 * Cliente Pagador:
 * - Agência: 1607
 * - Conta Corrente: 99738672-X
 * - Convênio PGT: 731030
 */
const CONTA_TESTE = {
  agencia: '1607',
  conta: '99738672',
  digito: 'X',
  convenio: 731030
};

/**
 * URLs de HOMOLOGAÇÃO
 */
const HOMOLOGACAO_URLS = {
  authUrl: 'https://oauth.hm.bb.com.br/oauth/token',
  baseUrl: 'https://homologa-api-ip.bb.com.br:7144/pagamentos-lote/v1',
};

/**
 * Carrega certificados para mTLS (usando os mesmos certificados do sistema)
 */
function loadCertificates() {
  const clientCertPath = path.resolve(process.cwd(), 'certs/alencar_final.cer');
  const clientKeyPath = path.resolve(process.cwd(), 'certs/alencar_final_key.pem');
  const caCertPaths = [
    path.resolve(process.cwd(), 'certs/GeoTrust_EV_RSA_CA_G2.cer'),
    path.resolve(process.cwd(), 'certs/DigiCert_Global_Root_G2.cer'),
    path.resolve(process.cwd(), 'certs/api-pix_bb_com_br.crt'),
  ];

  const clientCert = fs.readFileSync(clientCertPath);
  const clientKey = fs.readFileSync(clientKeyPath);
  const caCerts = caCertPaths.map(certPath => fs.readFileSync(certPath));

  return { clientCert, clientKey, caCerts };
}

/**
 * Cria cliente HTTP para autenticação OAuth2 (homologação)
 */
function createAuthClient() {
  const { clientCert, clientKey, caCerts } = loadCertificates();

  const httpsAgent = new Agent({
    cert: clientCert,
    key: clientKey,
    ca: caCerts,
    rejectUnauthorized: false, // Homologação pode ter certificados diferentes
  });

  return axios.create({
    baseURL: HOMOLOGACAO_URLS.authUrl.split('/oauth/token')[0],
    httpsAgent,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  } as any);
}

/**
 * Cria cliente HTTP para API de pagamentos (homologação)
 */
function createApiClient() {
  const { clientCert, clientKey, caCerts } = loadCertificates();

  const httpsAgent = new Agent({
    cert: clientCert,
    key: clientKey,
    ca: caCerts,
    rejectUnauthorized: false, // Homologação pode ter certificados diferentes
  });

  const client = axios.create({
    baseURL: HOMOLOGACAO_URLS.baseUrl,
    httpsAgent,
    timeout: 30000,
    headers: {
      'Content-Type': 'application/json',
    },
  } as any);

  // Interceptor para adicionar gw-dev-app-key como query param
  client.interceptors.request.use((config) => {
    if (config.params) {
      config.params['gw-dev-app-key'] = CREDENCIAIS_HOMOLOGACAO.developerAppKey;
    } else {
      config.params = { 'gw-dev-app-key': CREDENCIAIS_HOMOLOGACAO.developerAppKey };
    }
    return config;
  });

  return client;
}

/**
 * Obtém token de acesso OAuth2
 */
async function obterToken(scopes: string): Promise<string> {
  const authClient = createAuthClient();

  const bodyParams = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: scopes,
  });

  console.log('🔑 [HOMOLOGACAO] Obtendo token OAuth2...');
  console.log(`   Escopos: ${scopes}`);

  const response = await authClient.post('/oauth/token', bodyParams.toString(), {
    auth: {
      username: CREDENCIAIS_HOMOLOGACAO.clienteId,
      password: CREDENCIAIS_HOMOLOGACAO.clienteSecret,
    },
  });

  const accessToken = (response.data as any).access_token;
  console.log('✅ [HOMOLOGACAO] Token obtido com sucesso!');
  return accessToken;
}

/**
 * Formata data para o formato ddmmaaaa (sem zero à esquerda no dia)
 */
function formatarData(data: Date): string {
  const dia = data.getDate();
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}${mes}${ano}`;
}

/**
 * Função principal de teste
 */
async function executarTestes() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🧪 TESTE DE HOMOLOGAÇÃO - API de Pagamentos do Banco do Brasil');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('⚠️  ATENÇÃO: Este script usa credenciais hardcoded para testes');
  console.log('⚠️  Endpoints: HOMOLOGAÇÃO (oauth.hm.bb.com.br)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Validar credenciais
  if (
    CREDENCIAIS_HOMOLOGACAO.clienteId === 'SEU_CLIENT_ID_HOMOLOGACAO' ||
    CREDENCIAIS_HOMOLOGACAO.clienteSecret === 'SEU_CLIENT_SECRET_HOMOLOGACAO' ||
    CREDENCIAIS_HOMOLOGACAO.developerAppKey === 'SUA_APP_KEY_HOMOLOGACAO'
  ) {
    console.error('❌ [HOMOLOGACAO] ERRO: Credenciais não configuradas!');
    console.error('   Por favor, edite o arquivo e substitua as credenciais em CREDENCIAIS_HOMOLOGACAO');
    process.exit(1);
  }

  try {
    const apiClient = createApiClient();
    const dataPagamento = formatarData(new Date());

    // 1. Testar transferência PIX
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📤 TESTE 1: Transferência PIX (Homologação)');
    console.log('═══════════════════════════════════════════════════════════════');

    const tokenPix = await obterToken('pagamentos-lote.transferencias-pix-requisicao');

    // Em homologação, o BB exige numeroRequisicao = 123456
    const payloadPix = {
      numeroRequisicao: 123456,
      agenciaDebito: CONTA_TESTE.agencia,
      contaCorrenteDebito: CONTA_TESTE.conta,
      digitoVerificadorContaCorrente: CONTA_TESTE.digito,
      tipoPagamento: 126, // Pagamento de fornecedores
      listaTransferencias: [
        {
          data: dataPagamento,
          valor: '1.00',
          descricaoPagamento: 'Teste de transferência PIX via API - Homologação BB',
          descricaoPagamentoInstantaneo: 'Teste PIX API Homologação',
          formaIdentificacao: 1, // 1=Telefone
          dddTelefone: '11',
          telefone: '985732102',
        }
      ]
    };

    console.log('📤 [HOMOLOGACAO] Enviando requisição PIX...');
    const responsePix = await apiClient.post('/lotes-transferencias-pix', payloadPix, {
      headers: {
        Authorization: `Bearer ${tokenPix}`,
      },
    });

    console.log('✅ [HOMOLOGACAO] Transferência PIX enviada com sucesso!');
    console.log('📄 [HOMOLOGACAO] Resposta:', JSON.stringify(responsePix.data, null, 2));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 2. Testar pagamento de boleto
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('💳 TESTE 2: Pagamento de Boleto (Homologação)');
    console.log('═══════════════════════════════════════════════════════════════');

    const tokenBoleto = await obterToken('pagamentos-lote.boletos-requisicao pagamentos-lote.boletos-info pagamentos-lote.lotes-info');

    // Em homologação, o BB exige numeroRequisicao = 123456
    const payloadBoleto = {
      numeroRequisicao: 123456,
      codigoContrato: CONTA_TESTE.convenio,
      numeroAgenciaDebito: CONTA_TESTE.agencia,
      numeroContaCorrenteDebito: CONTA_TESTE.conta,
      digitoVerificadorContaCorrenteDebito: CONTA_TESTE.digito,
      lancamentos: [
        {
          numeroCodigoBarras: '83630000000641400052836100812355200812351310',
          dataPagamento: dataPagamento,
          valorPagamento: '64.14',
          descricaoPagamento: 'Teste de pagamento de boleto via API - Homologação',
          valorNominal: '64.14',
          codigoTipoBeneficiario: 1,
          documentoBeneficiario: '12345678900',
        }
      ]
    };

    console.log('📤 [HOMOLOGACAO] Enviando requisição de boleto...');
    const responseBoleto = await apiClient.post('/lotes-boletos', payloadBoleto, {
      headers: {
        Authorization: `Bearer ${tokenBoleto}`,
      },
    });

    console.log('✅ [HOMOLOGACAO] Pagamento de boleto enviado com sucesso!');
    console.log('📄 [HOMOLOGACAO] Resposta:', JSON.stringify(responseBoleto.data, null, 2));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 3. Testar liberação de pagamento
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🔓 TESTE 3: Liberação de Pagamento (Homologação)');
    console.log('═══════════════════════════════════════════════════════════════');

    const tokenLiberar = await obterToken('pagamentos-lote.lotes-requisicao pagamentos-lote.lotes-info');

    // Em homologação, o BB exige numeroRequisicao = 123456 e indicadorFloat = 'N'
    const payloadLiberar = {
      numeroRequisicao: 123456,
      indicadorFloat: 'N',
    };

    console.log('📤 [HOMOLOGACAO] Enviando requisição de liberação...');
    const responseLiberar = await apiClient.post('/liberar-pagamentos', payloadLiberar, {
      headers: {
        Authorization: `Bearer ${tokenLiberar}`,
      },
    });

    console.log('✅ [HOMOLOGACAO] Liberação enviada com sucesso!');
    console.log('📄 [HOMOLOGACAO] Resposta:', JSON.stringify(responseLiberar.data, null, 2));

    await new Promise(resolve => setTimeout(resolve, 2000));

    // 4. Testar cancelamento de pagamento (se houver código de pagamento retornado)
    // NOTA: Este teste só funciona se você tiver um codigoPagamento válido de uma requisição anterior
    // Para testar cancelamento, você precisa primeiro criar um pagamento e obter o codigoPagamento
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('🚫 TESTE 4: Cancelamento de Pagamento (Homologação)');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('⚠️  NOTA: Este teste requer um codigoPagamento válido de uma requisição anterior.');
    console.log('⚠️  Para testar, descomente e ajuste o código abaixo com um codigoPagamento real.\n');

    // Descomente e ajuste com um codigoPagamento real para testar:
    /*
    const tokenCancelar = await obterToken('pagamentos-lote.cancelar-requisicao pagamentos-lote.lotes-info');

    const payloadCancelar = {
      numeroContratoPagamento: CONTA_TESTE.convenio,
      agenciaDebito: CONTA_TESTE.agencia,
      contaCorrenteDebito: CONTA_TESTE.conta,
      digitoVerificadorContaCorrente: CONTA_TESTE.digito,
      listaPagamentos: [
        {
          codigoPagamento: 'CODIGO_PAGAMENTO_AQUI' // Substitua com um código real
        }
      ]
    };

    console.log('📤 [HOMOLOGACAO] Enviando requisição de cancelamento...');
    const responseCancelar = await apiClient.post('/cancelar-pagamentos', payloadCancelar, {
      headers: {
        Authorization: `Bearer ${tokenCancelar}`,
      },
    });

    console.log('✅ [HOMOLOGACAO] Cancelamento enviado com sucesso!');
    console.log('📄 [HOMOLOGACAO] Resposta:', JSON.stringify(responseCancelar.data, null, 2));
    */

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ [HOMOLOGACAO] Todos os testes concluídos com sucesso!');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════════');
    console.error('❌ [HOMOLOGACAO] Erro durante os testes:', error.message);
    if (error.response?.data) {
      console.error('📄 [HOMOLOGACAO] Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
    if (error.response?.status) {
      console.error('📊 [HOMOLOGACAO] Status HTTP:', error.response.status);
    }
    console.error('═══════════════════════════════════════════════════════════════\n');
    process.exit(1);
  }
}

// Executar testes se o script for chamado diretamente
if (require.main === module) {
  executarTestes().catch(error => {
    console.error('Erro fatal:', error);
    process.exit(1);
  });
}

export { executarTestes };

