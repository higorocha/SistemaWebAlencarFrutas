/**
 * Script de teste "hardcore" para API de Pagamentos do Banco do Brasil
 * 
 * Este script testa a conexão com a API de Pagamentos usando credenciais de homologação.
 * Testa os três tipos principais de pagamento:
 * 1. Transferências PIX
 * 2. Pagamento de Boletos
 * 3. Pagamento de Guias com Código de Barras
 * 
 * IMPORTANTE: Este é um script de teste com credenciais hardcoded.
 * Posteriormente será organizado para ser escalável por credencial/conta.
 */

import axios from 'axios';
import { createPagamentosApiClient, createPagamentosAuthClient, BB_PAGAMENTOS_API_URLS } from '../utils/bb-pagamentos-client';

/**
 * Interfaces para tipagem das respostas da API
 */
interface RespostaTransferenciaPix {
  numeroRequisicao?: string;
  [key: string]: any;
}

interface RespostaPagamentoBoleto {
  numeroRequisicao?: string;
  [key: string]: any;
}

interface RespostaPagamentoGuia {
  numeroRequisicao?: string;
  [key: string]: any;
}

/**
 * Credenciais de homologação - HARDCODED para testes
 * TODO: Mover para banco de dados quando organizar
 */
const HOMOLOGACAO_CREDENTIALS = {
  clienteId: 'eyJpZCI6ImU3OGRhNjUtOTliNC0iLCJjb2RpZ29QdWJsaWNhZG9yIjowLCJjb2RpZ29Tb2Z0d2FyZSI6MTYwNTA5LCJzZXF1ZW5jaWFsSW5zdGFsYWNhbyI6MX0', // Substituir com credencial real
  clienteSecret: 'eyJpZCI6IjU0NTk5NzQtNzMzNS00ZWViLWEyYzQtYTg5ZmE1OTgzYTBiMTU0MSIsImNvZGlnb1B1YmxpY2Fkb3IiOjAsImNvZGlnb1NvZnR3YXJlIjoxNjA1MDksInNlcXVlbmNpYWxJbnN0YWxhY2FvIjoxLCJzZXF1ZW5jaWFsQ3JlZGVuY2lhbCI6MSwiYW1iaWVudGUiOiJob21vbG9nYWNhbyIsImlhdCI6MTc2MzAzMjM1NDk1MX0', // Substituir com credencial real
  developerAppKey: 'a3de1966a297448d9b7bbfc06a307339' // Substituir com credencial real
};

/**
 * Dados de teste para conta pagadora (homologação BB)
 * Cliente Pagador:
 * - Agência: 1607
 * - Conta Corrente: 99738672-X
 * - Convênio PGT: 731030
 */
const CONTA_TESTE = {
  agencia: '1607', // Agência do cliente pagador
  conta: '99738672', // Conta corrente do cliente pagador
  digito: 'X', // Dígito verificador da conta
  convenio: 731030 // Convênio PGT (opcional)
};

/**
 * Obtém token de acesso OAuth2
 */
async function obterTokenDeAcesso(): Promise<string> {
  console.log('🔐 [TEST-PAGAMENTOS] Obtendo token de acesso OAuth2...');
  
  try {
    const authClient = createPagamentosAuthClient();
    
    const response = await authClient.post(
      BB_PAGAMENTOS_API_URLS.PAGAMENTOS_AUTH,
      new URLSearchParams({
        grant_type: 'client_credentials',
        scope: 'pagamentos-lote.transferencias-pix-requisicao pagamentos-lote.transferencias-pix-info pagamentos-lote.pix-info pagamentos-lote.boletos-requisicao pagamentos-lote.boletos-info pagamentos-lote.guias-codigo-barras-requisicao pagamentos-lote.guias-codigo-barras-info pagamentos-lote.lotes-info pagamentos-lote.pagamentos-info'
      }).toString(),
      {
        auth: {
          username: HOMOLOGACAO_CREDENTIALS.clienteId,
          password: HOMOLOGACAO_CREDENTIALS.clienteSecret,
        },
      }
    );

    const accessToken = (response.data as any).access_token;
    const expiresIn = (response.data as any).expires_in || 3600;
    
    console.log(`✅ [TEST-PAGAMENTOS] Token obtido com sucesso! Expira em ${expiresIn} segundos`);
    return accessToken;
    
  } catch (error) {
    console.error('❌ [TEST-PAGAMENTOS] Erro ao obter token:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Formata data para o formato ddmmaaaa (sem zero à esquerda no dia)
 */
function formatarData(data: Date): string {
  const dia = data.getDate(); // Sem zero à esquerda
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}${mes}${ano}`;
}

/**
 * Testa transferência PIX
 */
async function testarTransferenciaPix(token: string): Promise<RespostaTransferenciaPix> {
  console.log('\n📤 [TEST-PAGAMENTOS] Testando transferência PIX...');
  
  try {
    const apiClient = createPagamentosApiClient(HOMOLOGACAO_CREDENTIALS.developerAppKey);
    
    // Data de pagamento (hoje)
    const dataPagamento = formatarData(new Date());
    
    // Dados de teste para transferência PIX usando dados de homologação do BB
    // Primeira chave PIX: Tipo 1 (Telefone) - (11)985732102 - CNPJ: 95127446000198
    const dadosTransferencia = {
      numeroRequisicao: Math.floor(Math.random() * 9999999) + 1, // Número de 1 a 9999999
      numeroContrato: CONTA_TESTE.convenio, // Convênio PGT: 731030
      agenciaDebito: CONTA_TESTE.agencia,
      contaCorrenteDebito: CONTA_TESTE.conta,
      digitoVerificadorContaCorrente: CONTA_TESTE.digito,
      tipoPagamento: 126, // 126 = Pagamento de fornecedores, 128 = Pagamentos diversos
      listaTransferencias: [
        {
          data: dataPagamento, // Formato ddmmaaaa
          valor: '1.00', // Valor do pagamento em reais
          // documentoDebito: '123', // Opcional
          // documentoCredito: '456', // Opcional
          descricaoPagamento: 'Teste de transferência PIX via API - Homologação BB',
          descricaoPagamentoInstantaneo: 'Teste PIX API Homologação',
          formaIdentificacao: 1, // 1=Telefone, 2=Email, 3=CPF/CNPJ, 4=Chave Aleatória, 5=Dados Bancários
          dddTelefone: '11', // DDD com dois dígitos - obrigatório para formaIdentificacao = 1
          telefone: '985732102', // Telefone do favorecido (nove dígitos) - obrigatório para formaIdentificacao = 1
          cnpj: '95127446000198', // CNPJ do favorecido - opcional para validação quando formaIdentificacao = 1 ou 2
        }
      ]
    };

    console.log('📋 [TEST-PAGAMENTOS] Dados da transferência:', JSON.stringify(dadosTransferencia, null, 2));
    console.log('🔑 [TEST-PAGAMENTOS] Token (primeiros 20 chars):', token.substring(0, 20) + '...');
    console.log('🌐 [TEST-PAGAMENTOS] URL completa:', `${apiClient.defaults.baseURL}/lotes-transferencias-pix`);
    console.log('🔑 [TEST-PAGAMENTOS] Headers da requisição:', {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token.substring(0, 20)}...`,
      'gw-dev-app-key': 'será enviado como query param'
    });

    const response = await apiClient.post(
      `/lotes-transferencias-pix`,
      dadosTransferencia,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ [TEST-PAGAMENTOS] Transferência PIX realizada com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data as RespostaTransferenciaPix;
    
  } catch (error) {
    console.error('❌ [TEST-PAGAMENTOS] Erro ao realizar transferência PIX:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status,
      statusText: error.response?.statusText,
      headers: error.response?.headers
    });
    throw error;
  }
}

/**
 * Testa pagamento de boleto
 */
async function testarPagamentoBoleto(token: string): Promise<RespostaPagamentoBoleto> {
  console.log('\n💳 [TEST-PAGAMENTOS] Testando pagamento de boleto...');
  
  try {
    const apiClient = createPagamentosApiClient(HOMOLOGACAO_CREDENTIALS.developerAppKey);
    
    // Data de pagamento (hoje)
    const dataPagamento = formatarData(new Date());
    
    // Dados de teste para pagamento de boleto conforme documentação
    const dadosPagamento = {
      numeroRequisicao: Math.floor(Math.random() * 9999999) + 1, // Número de 1 a 9999999
      codigoContrato: CONTA_TESTE.convenio, // Convênio PGT: 731030
      numeroAgenciaDebito: CONTA_TESTE.agencia,
      numeroContaCorrenteDebito: CONTA_TESTE.conta,
      digitoVerificadorContaCorrenteDebito: CONTA_TESTE.digito,
      lancamentos: [
        {
          // numeroDocumentoDebito: '123', // Opcional
          numeroCodigoBarras: '83630000000641400052836100812355200812351310', // Código de barras de teste (R$ 64,14) - homologação
          dataPagamento: dataPagamento, // Formato ddmmaaaa
          valorPagamento: '64.14', // Valor do pagamento total do boleto
          descricaoPagamento: 'Teste de pagamento de boleto via API',
          // codigoSeuDocumento: '', // Opcional
          // codigoNossoDocumento: '', // Opcional
          valorNominal: '64.14', // Valor original do boleto (obrigatório)
          // valorDesconto: '0.00', // Opcional
          // valorMoraMulta: '0.00', // Opcional
          // codigoTipoPagador: 1, // Opcional: 1=CPF, 2=CNPJ
          // documentoPagador: '', // Opcional
          codigoTipoBeneficiario: 1, // Obrigatório: 1=CPF, 2=CNPJ
          documentoBeneficiario: '12345678900', // Obrigatório: CPF ou CNPJ do beneficiário
          // codigoTipoAvalista: 1, // Opcional: 1=CPF, 2=CNPJ
          // documentoAvalista: '', // Opcional
        }
      ]
    };

    console.log('📋 [TEST-PAGAMENTOS] Dados do pagamento de boleto:', JSON.stringify(dadosPagamento, null, 2));

    const response = await apiClient.post(
      `/lotes-boletos`,
      dadosPagamento,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ [TEST-PAGAMENTOS] Pagamento de boleto realizado com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data as RespostaPagamentoBoleto;
    
  } catch (error) {
    console.error('❌ [TEST-PAGAMENTOS] Erro ao realizar pagamento de boleto:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Testa pagamento de guia com código de barras
 */
async function testarPagamentoGuia(token: string): Promise<RespostaPagamentoGuia> {
  console.log('\n📋 [TEST-PAGAMENTOS] Testando pagamento de guia com código de barras...');
  
  try {
    const apiClient = createPagamentosApiClient(HOMOLOGACAO_CREDENTIALS.developerAppKey);
    
    // Data de pagamento (hoje)
    const dataPagamento = formatarData(new Date());
    
    // Dados de teste para pagamento de guia conforme documentação
    const dadosPagamento = {
      numeroRequisicao: Math.floor(Math.random() * 9999999) + 1, // Número de 1 a 9999999
      codigoContrato: CONTA_TESTE.convenio, // Convênio PGT: 731030
      numeroAgenciaDebito: CONTA_TESTE.agencia,
      numeroContaCorrenteDebito: CONTA_TESTE.conta,
      digitoVerificadorContaCorrenteDebito: CONTA_TESTE.digito,
      lancamentos: [
        {
          codigoBarras: '83630000000641400052836100812355200812351310', // Código de barras de teste (R$ 64,14) - homologação
          dataPagamento: dataPagamento, // Formato ddmmaaaa
          valorPagamento: '64.14', // Valor do pagamento em reais
          // numeroDocumentoDebito: '123', // Opcional
          descricaoPagamento: 'Teste de pagamento de guia via API',
          // codigoSeuDocumento: '', // Opcional (até 20 caracteres)
        }
      ]
    };

    console.log('📋 [TEST-PAGAMENTOS] Dados do pagamento de guia:', JSON.stringify(dadosPagamento, null, 2));

    const response = await apiClient.post(
      `/lotes-guias-codigo-barras`,
      dadosPagamento,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ [TEST-PAGAMENTOS] Pagamento de guia realizado com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data as RespostaPagamentoGuia;
    
  } catch (error) {
    console.error('❌ [TEST-PAGAMENTOS] Erro ao realizar pagamento de guia:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Consulta status de uma solicitação de transferências PIX
 */
async function consultarStatusSolicitacaoPix(token: string, numeroRequisicao: number) {
  console.log(`\n🔍 [TEST-PAGAMENTOS] Consultando status da solicitação PIX: ${numeroRequisicao}...`);
  
  try {
    const apiClient = createPagamentosApiClient(HOMOLOGACAO_CREDENTIALS.developerAppKey);
    
    const response = await apiClient.get(
      `/lotes-transferencias-pix/${numeroRequisicao}/solicitacao`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ [TEST-PAGAMENTOS] Status da solicitação consultado com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ [TEST-PAGAMENTOS] Erro ao consultar status da solicitação:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Consulta uma transferência específica de um lote
 */
async function consultarTransferenciaEspecifica(token: string, identificadorPagamento: string) {
  console.log(`\n🔍 [TEST-PAGAMENTOS] Consultando transferência específica: ${identificadorPagamento}...`);
  
  try {
    const apiClient = createPagamentosApiClient(HOMOLOGACAO_CREDENTIALS.developerAppKey);
    
    const response = await apiClient.get(
      `/pix/${identificadorPagamento}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ [TEST-PAGAMENTOS] Transferência consultada com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ [TEST-PAGAMENTOS] Erro ao consultar transferência:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Consulta status de uma solicitação de pagamento de boletos
 */
async function consultarStatusSolicitacaoBoleto(token: string, numeroRequisicao: number) {
  console.log(`\n🔍 [TEST-PAGAMENTOS] Consultando status da solicitação de boletos: ${numeroRequisicao}...`);
  
  try {
    const apiClient = createPagamentosApiClient(HOMOLOGACAO_CREDENTIALS.developerAppKey);
    
    const response = await apiClient.get(
      `/lotes-boletos/${numeroRequisicao}/solicitacao`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ [TEST-PAGAMENTOS] Status da solicitação de boletos consultado com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ [TEST-PAGAMENTOS] Erro ao consultar status da solicitação de boletos:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Consulta um pagamento específico de boleto
 */
async function consultarBoletoEspecifico(token: string, identificadorPagamento: string) {
  console.log(`\n🔍 [TEST-PAGAMENTOS] Consultando boleto específico: ${identificadorPagamento}...`);
  
  try {
    const apiClient = createPagamentosApiClient(HOMOLOGACAO_CREDENTIALS.developerAppKey);
    
    const response = await apiClient.get(
      `/boletos/${identificadorPagamento}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ [TEST-PAGAMENTOS] Boleto consultado com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ [TEST-PAGAMENTOS] Erro ao consultar boleto:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Consulta status de uma solicitação de pagamento de guias
 */
async function consultarStatusSolicitacaoGuia(token: string, numeroRequisicao: number) {
  console.log(`\n🔍 [TEST-PAGAMENTOS] Consultando status da solicitação de guias: ${numeroRequisicao}...`);
  
  try {
    const apiClient = createPagamentosApiClient(HOMOLOGACAO_CREDENTIALS.developerAppKey);
    
    const response = await apiClient.get(
      `/lotes-guias-codigo-barras/${numeroRequisicao}/solicitacao`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ [TEST-PAGAMENTOS] Status da solicitação de guias consultado com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ [TEST-PAGAMENTOS] Erro ao consultar status da solicitação de guias:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Consulta um pagamento específico de guia
 */
async function consultarGuiaEspecifica(token: string, identificadorPagamento: string) {
  console.log(`\n🔍 [TEST-PAGAMENTOS] Consultando guia específica: ${identificadorPagamento}...`);
  
  try {
    const apiClient = createPagamentosApiClient(HOMOLOGACAO_CREDENTIALS.developerAppKey);
    
    const response = await apiClient.get(
      `/guias-codigo-barras/${identificadorPagamento}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log('✅ [TEST-PAGAMENTOS] Guia consultada com sucesso!');
    console.log('📄 [TEST-PAGAMENTOS] Resposta:', JSON.stringify(response.data, null, 2));
    
    return response.data;
    
  } catch (error) {
    console.error('❌ [TEST-PAGAMENTOS] Erro ao consultar guia:', {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    });
    throw error;
  }
}

/**
 * Função principal de teste
 */
async function executarTestes() {
  console.log('🚀 [TEST-PAGAMENTOS] Iniciando testes da API de Pagamentos do Banco do Brasil');
  console.log('═══════════════════════════════════════════════════════════════\n');

  try {
    // 1. Obter token de acesso
    const token = await obterTokenDeAcesso();
    
    // 2. Testar transferência PIX
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📤 TESTE 1: Transferência PIX');
    console.log('═══════════════════════════════════════════════════════════════');
    const resultadoPix = await testarTransferenciaPix(token);
    
    // 3. Aguardar um pouco antes do próximo teste
    console.log('\n⏳ [TEST-PAGAMENTOS] Aguardando 2 segundos antes do próximo teste...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 4. Testar pagamento de boleto
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('💳 TESTE 2: Pagamento de Boleto');
    console.log('═══════════════════════════════════════════════════════════════');
    const resultadoBoleto = await testarPagamentoBoleto(token);
    
    // 5. Aguardar um pouco antes do próximo teste
    console.log('\n⏳ [TEST-PAGAMENTOS] Aguardando 2 segundos antes do próximo teste...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 6. Testar pagamento de guia com código de barras
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('📋 TESTE 3: Pagamento de Guia com Código de Barras');
    console.log('═══════════════════════════════════════════════════════════════');
    const resultadoGuia = await testarPagamentoGuia(token);
    
    // 7. Consultar status da solicitação PIX (se houver numeroRequisicao)
    if (resultadoPix?.numeroRequisicao) {
      console.log('\n⏳ [TEST-PAGAMENTOS] Aguardando 2 segundos antes de consultar status PIX...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await consultarStatusSolicitacaoPix(token, parseInt(resultadoPix.numeroRequisicao.toString()));
    }
    
    // 8. Consultar status da solicitação de boletos (se houver numeroRequisicao)
    if (resultadoBoleto?.numeroRequisicao) {
      console.log('\n⏳ [TEST-PAGAMENTOS] Aguardando 2 segundos antes de consultar status de boletos...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await consultarStatusSolicitacaoBoleto(token, parseInt(resultadoBoleto.numeroRequisicao.toString()));
    }
    
    // 9. Consultar status da solicitação de guias (se houver numeroRequisicao)
    if (resultadoGuia?.numeroRequisicao) {
      console.log('\n⏳ [TEST-PAGAMENTOS] Aguardando 2 segundos antes de consultar status de guias...');
      await new Promise(resolve => setTimeout(resolve, 2000));
      await consultarStatusSolicitacaoGuia(token, parseInt(resultadoGuia.numeroRequisicao.toString()));
    }
    
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ [TEST-PAGAMENTOS] Todos os testes concluídos com sucesso!');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
  } catch (error) {
    console.error('\n═══════════════════════════════════════════════════════════════');
    console.error('❌ [TEST-PAGAMENTOS] Erro durante os testes:', error.message);
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

export { 
  executarTestes, 
  obterTokenDeAcesso, 
  testarTransferenciaPix, 
  testarPagamentoBoleto, 
  testarPagamentoGuia,
  consultarStatusSolicitacaoPix, 
  consultarTransferenciaEspecifica,
  consultarStatusSolicitacaoBoleto,
  consultarBoletoEspecifico,
  consultarStatusSolicitacaoGuia,
  consultarGuiaEspecifica
};

