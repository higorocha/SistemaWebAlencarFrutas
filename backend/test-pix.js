#!/usr/bin/env node

/**
 * Script temporário para testar o serviço PIX
 * Executa testes dos endpoints PIX diretamente
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

// Função principal de teste
async function testarPixService() {
  console.log('🧪 ===== TESTE DO SERVIÇO PIX =====');
  console.log(`🌐 URL Base: ${BASE_URL}`);
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  
  // Teste 1: Health Check
  console.log('\n📋 TESTE 1: Health Check');
  console.log('─'.repeat(50));
  const healthResult = await makeRequest('GET', '/pix/health');
  
  if (healthResult?.status === 'healthy') {
    console.log('✅ Serviço PIX está operacional!');
  } else {
    console.log('❌ Serviço PIX não está operacional');
    console.log('💡 Verifique se as credenciais PIX estão cadastradas');
    return;
  }
  
  // Teste 2: Consulta de Transações (apenas hoje)
  console.log('\n📋 TESTE 2: Consulta de Transações PIX (Hoje)');
  console.log('─'.repeat(50));
  
  const hoje = new Date();
  const dataHoje = hoje.toISOString().split('T')[0]; // YYYY-MM-DD
  
  console.log(`📅 Período: ${dataHoje} até ${dataHoje} (apenas hoje)`);
  
  const transacoesResult = await makeRequest('GET', '/pix/transacoes', {
    inicio: dataHoje,
    fim: dataHoje
  });
  
  if (transacoesResult) {
    console.log(`\n📊 Resumo da consulta:`);
    console.log(`   • Total de transações: ${transacoesResult.total || 0}`);
    console.log(`   • Período consultado: ${transacoesResult.periodoInicio} até ${transacoesResult.periodoFim}`);
    console.log(`   • Transações encontradas: ${transacoesResult.transacoes?.length || 0}`);
    
    if (transacoesResult.transacoes?.length > 0) {
      console.log(`\n💰 Primeira transação encontrada:`);
      const primeiraTransacao = transacoesResult.transacoes[0];
      console.log(`   • Valor: R$ ${primeiraTransacao.valor}`);
      console.log(`   • Pagador: ${primeiraTransacao.nomePagador}`);
      console.log(`   • Data/Hora: ${primeiraTransacao.dataHora}`);
    }
  }
  
  // Teste 3: Consulta com período de 3 dias (dentro do limite de 5 dias)
  console.log('\n📋 TESTE 3: Consulta com Período de 3 dias');
  console.log('─'.repeat(50));
  
  const tresDiasAtras = new Date(hoje.getTime() - (3 * 24 * 60 * 60 * 1000));
  const dataInicio3 = tresDiasAtras.toISOString().split('T')[0];
  
  console.log(`📅 Período: ${dataInicio3} até ${dataHoje}`);
  
  const transacoes3Result = await makeRequest('GET', '/pix/transacoes', {
    inicio: dataInicio3,
    fim: dataHoje
  });
  
  if (transacoes3Result) {
    console.log(`📊 Total de transações (3 dias): ${transacoes3Result.total || 0}`);
  }
  
  console.log('\n🏁 ===== TESTE CONCLUÍDO =====');
}

// Executar testes
testarPixService()
  .then(() => {
    console.log('\n✅ Todos os testes foram executados!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erro durante a execução dos testes:', error);
    process.exit(1);
  });
