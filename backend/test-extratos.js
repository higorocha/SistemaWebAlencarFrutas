#!/usr/bin/env node

/**
 * Script temporário para testar o serviço de extratos
 * Executa testes dos endpoints de extratos diretamente
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5002';

// Configurar axios com timeout
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Função para fazer requisições com tratamento de erro
async function makeRequest(method, endpoint, params = {}) {
  try {
    console.log(`\n🚀 ${method.toUpperCase()} ${endpoint}`);
    if (Object.keys(params).length > 0) {
      console.log('📋 Parâmetros:', params);
    }
    
    let response;
    if (method.toLowerCase() === 'get') {
      response = await api.get(endpoint, { params });
    }
    
    console.log('✅ Status:', response.status);
    console.log('📄 Resposta:', JSON.stringify(response.data, null, 2));
    return response.data;
    
  } catch (error) {
    console.log('❌ Erro:', error.response?.status || error.message);
    if (error.response?.data) {
      console.log('📄 Detalhes do erro:', JSON.stringify(error.response.data, null, 2));
    }
    return null;
  }
}

// Função para formatar data no formato DDMMYYYY
function formatarDataDDMMYYYY(data) {
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}${mes}${ano}`;
}

// Função para formatar data no formato DD-MM-YYYY
function formatarDataDDMMYYYYComHifen(data) {
  const dia = data.getDate().toString().padStart(2, '0');
  const mes = (data.getMonth() + 1).toString().padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}-${mes}-${ano}`;
}

// Função principal de teste
async function testarExtratosService() {
  console.log('🧪 ===== TESTE DO SERVIÇO DE EXTRATOS =====');
  console.log(`🌐 URL Base: ${BASE_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  // Teste 1: Health Check
  console.log('\n📋 TESTE 1: Health Check');
  console.log('─'.repeat(50));
  const healthResult = await makeRequest('GET', '/api/extratos/health');
  
  if (healthResult?.status === 'healthy') {
    console.log('✅ Serviço de extratos está operacional!');
    if (healthResult.contaInfo) {
      console.log(`🏦 Conta configurada: Agência ${healthResult.contaInfo.agencia}, Conta ${healthResult.contaInfo.conta}`);
    }
  } else {
    console.log('❌ Serviço de extratos não está operacional');
    console.log('💡 Verifique se as credenciais de extratos e conta corrente estão cadastradas');
    return;
  }
  
  // Teste 2: Consulta de Extratos (apenas hoje)
  console.log('\n📋 TESTE 2: Consulta de Extratos (Hoje)');
  console.log('─'.repeat(50));
  
  const hoje = new Date();
  const dataHoje = formatarDataDDMMYYYY(hoje);
  
  console.log(`📅 Período: ${dataHoje} até ${dataHoje} (apenas hoje)`);
  
  const extratosResult = await makeRequest('GET', '/api/extratos', {
    dataInicio: dataHoje,
    dataFim: dataHoje
  });
  
  if (extratosResult) {
    console.log(`\n📊 Resumo da consulta:`);
    console.log(`   • Total de lançamentos: ${extratosResult.total || 0}`);
    console.log(`   • Período consultado: ${extratosResult.periodoInicio} até ${extratosResult.periodoFim}`);
    console.log(`   • Lançamentos encontrados: ${extratosResult.lancamentos?.length || 0}`);
    
    if (extratosResult.lancamentos?.length > 0) {
      console.log(`\n💰 Primeiro lançamento encontrado:`);
      const primeiroLancamento = extratosResult.lancamentos[0];
      console.log(`   • Valor: R$ ${primeiroLancamento.valorLancamento}`);
      console.log(`   • Descrição: ${primeiroLancamento.descricao}`);
      console.log(`   • Data: ${primeiroLancamento.dataLancamento}`);
      console.log(`   • Situação: ${primeiroLancamento.situacao}`);
      if (primeiroLancamento.nomeFavorecido) {
        console.log(`   • Favorecido: ${primeiroLancamento.nomeFavorecido}`);
      }
    } else {
      console.log('ℹ️ Nenhum lançamento encontrado para hoje');
    }
  }
  
  console.log('\n🏁 ===== TESTE CONCLUÍDO =====');
}

// Executar testes
testarExtratosService()
  .then(() => {
    console.log('\n✅ Teste executado com sucesso!');
    console.log('\n📋 Resumo do teste:');
    console.log('   1. Health Check - Verificação do status do serviço');
    console.log('   2. Consulta de Extratos (Hoje) - Formato DDMMYYYY');
    console.log('\n💡 Para usar os endpoints:');
    console.log('   • GET /api/extratos/health - Verificar status');
    console.log('   • GET /api/extratos?dataInicio=DDMMYYYY&dataFim=DDMMYYYY - Consulta básica');
    console.log('   • GET /api/extratos/mensal - Extratos mensais com cache');
    console.log('   • GET /api/extratos/periodo?inicio=DD-MM-YYYY&fim=DD-MM-YYYY - Consulta por período');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro durante a execução do teste:', error);
    process.exit(1);
  });
